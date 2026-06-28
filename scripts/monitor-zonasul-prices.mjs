import { appendFile, mkdir, readFile, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { defaultItems, resolveProductFromUrl } from "../src/zonasulCatalog.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = join(__dirname, "..");
const dataDir = join(rootDir, "data");
const outputDir = join(dataDir, "price-monitor");
const observationsPath = join(outputDir, "observations.jsonl");
const summaryPath = join(outputDir, "summary.json");
const itemCachePath = join(dataDir, "item-previews-cache.json");
const extraItemsPath = join(dataDir, "extra-historical-items.json");
const removedItemsPath = join(dataDir, "removed-historical-items.json");
const timeZone = "America/Sao_Paulo";

const runStartedAt = new Date();
const runId = runStartedAt.toISOString();

await mkdir(outputDir, { recursive: true });

const items = await loadMonitorItems();
const observations = [];

for (const item of items) {
  observations.push(await observeItem(item));
  await sleep(150);
}

await appendFile(
  observationsPath,
  observations.map((observation) => JSON.stringify(observation)).join("\n") + "\n",
  "utf8",
);

const summary = await buildSummary(observations);
await writeFile(summaryPath, `${JSON.stringify(summary, null, 2)}\n`, "utf8");

console.log(
  JSON.stringify(
    {
      runId,
      observed: observations.length,
      available: observations.filter((item) => item.available).length,
      errors: observations.filter((item) => item.error).length,
      basketTotal: summary.latestRun?.basketTotal ?? null,
      summaryPath,
    },
    null,
    2,
  ),
);

async function loadMonitorItems() {
  const cache = await readJsonFile(itemCachePath, {});
  const extraItems = (await readJsonFile(extraItemsPath, { items: [] })).items || [];
  const removedKeys = new Set(
    (await readJsonFile(removedItemsPath, { removedKeys: [] })).removedKeys || [],
  );
  const rows = [];

  for (const item of defaultItems()) {
    if (removedKeys.has(item.key)) continue;

    const preview = cache[item.key] || {};
    rows.push({
      key: item.key,
      segment: classifySegment(item.label, item.query || item.label),
      label: repairEncoding(item.label),
      historicalQty: item.qty ?? 1,
      link: preview.link || "",
    });
  }

  for (const item of extraItems) {
    if (removedKeys.has(item.key)) continue;

    rows.push({
      key: item.key,
      segment: "Adicionados recentemente",
      label: repairEncoding(item.label),
      historicalQty: item.qty ?? 1,
      link: item.productLink || item.addedFromUrl || "",
    });
  }

  return rows;
}

async function observeItem(item) {
  const local = localDateParts(runStartedAt);
  const base = {
    runId,
    observedAt: runStartedAt.toISOString(),
    timeZone,
    localDate: local.date,
    localTime: local.time,
    dayOfWeek: local.dayOfWeek,
    hour: local.hour,
    key: item.key,
    segment: item.segment,
    label: item.label,
    historicalQty: item.historicalQty,
    link: item.link,
  };

  if (!item.link) {
    return {
      ...base,
      available: false,
      error: "Produto sem link cadastrado.",
    };
  }

  try {
    const product = await resolveProductFromUrl(item.link);
    const price = Number(product.referencePrice || 0);
    const listPrice = Number(product.listPrice || price || 0);
    const discountPercent =
      listPrice > price && listPrice > 0 ? ((listPrice - price) / listPrice) * 100 : 0;

    return {
      ...base,
      returnedName: repairEncoding(product.productName || product.label),
      sku: product.sku || null,
      sellerId: product.sellerId || null,
      price,
      listPrice,
      discountPercent: round(discountPercent),
      available: Number(product.available || 0) > 0,
      availableQuantity: Number(product.available || 0),
      error: null,
    };
  } catch (error) {
    return {
      ...base,
      available: false,
      error: error.message || "Falha consultando produto.",
    };
  }
}

async function buildSummary(latestObservations) {
  const allObservations = await readJsonLines(observationsPath);
  const runs = summarizeRuns(allObservations);
  const validRuns = runs.filter((run) => run.errorRate <= 0.2);
  const latestRun = summarizeRuns(latestObservations)[0] || null;
  const byDayOfWeek = aggregateRuns(validRuns, (run) => run.dayOfWeek);
  const byHour = aggregateRuns(validRuns, (run) => `${String(run.hour).padStart(2, "0")}:00`);
  const byDayAndHour = aggregateRuns(
    validRuns,
    (run) => `${run.dayOfWeek} ${String(run.hour).padStart(2, "0")}:00`,
  );
  const recommendation = buildRecommendation(validRuns, byDayOfWeek, byHour, byDayAndHour);

  return {
    generatedAt: new Date().toISOString(),
    timeZone,
    totalObservations: allObservations.length,
    totalRuns: runs.length,
    validRuns: validRuns.length,
    latestRun,
    byDayOfWeek,
    byHour,
    byDayAndHour,
    recommendation,
  };
}

function summarizeRuns(observations) {
  const byRun = new Map();

  for (const observation of observations) {
    if (!byRun.has(observation.runId)) byRun.set(observation.runId, []);
    byRun.get(observation.runId).push(observation);
  }

  return [...byRun.entries()]
    .map(([id, rows]) => {
      const availableRows = rows.filter((row) => row.available && Number(row.price) > 0);
      const errorRows = rows.filter((row) => row.error);
      const basketTotal = availableRows.reduce(
        (sum, row) => sum + Number(row.price || 0) * Number(row.historicalQty || 1),
        0,
      );
      const averageDiscount =
        availableRows.reduce((sum, row) => sum + Number(row.discountPercent || 0), 0) /
        Math.max(availableRows.length, 1);
      const first = rows[0] || {};

      return {
        runId: id,
        observedAt: first.observedAt,
        localDate: first.localDate,
        localTime: first.localTime,
        dayOfWeek: first.dayOfWeek,
        hour: Number(first.hour),
        itemCount: rows.length,
        availableCount: availableRows.length,
        unavailableCount: rows.length - availableRows.length,
        errorCount: errorRows.length,
        errorRate: round(errorRows.length / Math.max(rows.length, 1)),
        basketTotal: round(basketTotal),
        averageDiscount: round(averageDiscount),
      };
    })
    .sort((a, b) => String(a.observedAt).localeCompare(String(b.observedAt)));
}

function aggregateRuns(runs, keyFn) {
  const groups = new Map();

  for (const run of runs) {
    const key = keyFn(run);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(run);
  }

  return [...groups.entries()]
    .map(([key, rows]) => {
      const totals = rows.map((row) => row.basketTotal);
      const avg = average(totals);

      return {
        key,
        observations: rows.length,
        averageBasketTotal: round(avg),
        minBasketTotal: round(Math.min(...totals)),
        maxBasketTotal: round(Math.max(...totals)),
        standardDeviation: round(standardDeviation(totals, avg)),
        averageUnavailableCount: round(average(rows.map((row) => row.unavailableCount))),
        averageDiscount: round(average(rows.map((row) => row.averageDiscount))),
      };
    })
    .sort((a, b) => a.averageBasketTotal - b.averageBasketTotal);
}

function buildRecommendation(validRuns, byDayOfWeek, byHour, byDayAndHour) {
  const observedDates = new Set(validRuns.map((run) => run.localDate));
  const enoughData =
    observedDates.size >= 14 &&
    byDayOfWeek.every((row) => row.observations >= 5) &&
    byHour.every((row) => row.observations >= 10);

  return {
    enoughData,
    minimumRule:
      "Exigir pelo menos 14 dias, 5 observacoes por dia da semana e 10 observacoes por horario.",
    bestDayOfWeek: byDayOfWeek[0] || null,
    bestHour: byHour[0] || null,
    bestDayAndHour: byDayAndHour[0] || null,
    estimatedSavingsVsAverage:
      validRuns.length && byDayAndHour[0]
        ? round(average(validRuns.map((run) => run.basketTotal)) - byDayAndHour[0].averageBasketTotal)
        : null,
  };
}

async function readJsonFile(path, fallback) {
  if (!existsSync(path)) return fallback;

  try {
    return JSON.parse(await readFile(path, "utf8"));
  } catch {
    return fallback;
  }
}

async function readJsonLines(path) {
  if (!existsSync(path)) return [];
  const text = await readFile(path, "utf8");
  return text
    .split(/\r?\n/)
    .filter(Boolean)
    .map((line) => JSON.parse(line));
}

function localDateParts(date) {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-CA", {
      timeZone,
      weekday: "long",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hourCycle: "h23",
    })
      .formatToParts(date)
      .map((part) => [part.type, part.value]),
  );

  return {
    date: `${parts.year}-${parts.month}-${parts.day}`,
    time: `${parts.hour}:${parts.minute}:${parts.second}`,
    dayOfWeek: parts.weekday,
    hour: Number(parts.hour),
  };
}

function classifySegment(label, name) {
  const text = normalized(`${label} ${name || ""}`);
  const cleaningWords = [
    "alcool",
    "amaciante",
    "aromatizador",
    "detergente",
    "esponja",
    "lava loucas",
    "lixo",
    "papel higienico",
    "papel toalha",
    "sabao",
    "sanitaria",
    "tira manchas",
    "vanish",
  ];
  const heavyWords = [
    "agua",
    "arroz",
    "azeite",
    "coca",
    "guarana",
    "h2oh",
    "matte",
    "nectar",
    "refrigerante",
    "suco",
  ];
  const perishableWords = [
    "acai",
    "asa",
    "coxinha",
    "file",
    "frango",
    "iogurte",
    "manteiga",
    "peito de peru",
    "queijo",
    "sobrecoxa",
    "sorvete",
    "uva",
  ];

  if (cleaningWords.some((word) => text.includes(word))) return "Limpeza";
  if (perishableWords.some((word) => text.includes(word))) return "Pereciveis";
  if (heavyWords.some((word) => text.includes(word))) return "Pesados e bebidas";
  return "Despensa e geral";
}

function normalized(value) {
  return repairEncoding(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function repairEncoding(value) {
  const text = String(value || "");
  return /[\u00c3\u00c2\ufffd]/u.test(text)
    ? Buffer.from(text, "latin1").toString("utf8")
    : text;
}

function average(values) {
  return values.reduce((sum, value) => sum + Number(value || 0), 0) / Math.max(values.length, 1);
}

function standardDeviation(values, avg = average(values)) {
  const variance =
    values.reduce((sum, value) => sum + (Number(value || 0) - avg) ** 2, 0) /
    Math.max(values.length, 1);
  return Math.sqrt(variance);
}

function round(value) {
  return Math.round(Number(value || 0) * 100) / 100;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
