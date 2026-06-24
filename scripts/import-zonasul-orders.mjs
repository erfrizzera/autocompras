import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = fileURLToPath(new URL("..", import.meta.url));
const catalogPath = resolve(rootDir, "src", "zonasulCatalog.mjs");
const args = parseArgs(process.argv.slice(2));

if (!args.input) {
  console.error("Uso: node scripts/import-zonasul-orders.mjs zonasul-pedidos-2025.json");
  process.exit(1);
}

const inputPath = resolve(args.input);
const inputText = (await readFile(inputPath, "utf8")).replace(/^\uFEFF/, "");
const input = JSON.parse(inputText);
const aggregate = readAggregate(input);
const minOrders = args.minOrders ?? 1;
const limit = args.limit ?? 0;
const dryRun = Boolean(args.dryRun);

let items = aggregate
  .filter((item) => cleanLabel(item.label || item.query))
  .filter((item) => Number(item.orderCount || 1) >= minOrders)
  .map(toShoppingItem)
  .sort(
    (a, b) =>
      b.orderCount - a.orderCount ||
      b.totalQuantity - a.totalQuantity ||
      a.label.localeCompare(b.label, "pt-BR"),
  );

if (limit > 0) {
  items = items.slice(0, limit);
}

if (!items.length) {
  throw new Error("Nenhum produto valido encontrado no arquivo exportado.");
}

const catalog = await readFile(catalogPath, "utf8");
const nextCatalog = replaceSavedShoppingItems(catalog, items);

if (!dryRun) {
  await writeFile(catalogPath, nextCatalog, "utf8");
}

console.log(
  `${dryRun ? "Simulacao" : "Lista atualizada"}: ${items.length} produtos importados de ${input.year || "historico"}.`,
);
console.log(`Pedidos no arquivo: ${input.orderCount ?? "n/d"}`);
console.log(`Filtro minimo: ${minOrders} pedido(s) por produto`);
console.log("Top 10:");

for (const item of items.slice(0, 10)) {
  const price = item.referencePrice == null ? "sem preco" : `R$ ${formatMoney(item.referencePrice)}`;
  console.log(`- ${item.label} (${item.orderCount} pedidos, ${price})`);
}

function readAggregate(input) {
  if (Array.isArray(input.aggregate) && input.aggregate.length) {
    return input.aggregate;
  }

  if (!Array.isArray(input.orders)) {
    throw new Error("Arquivo sem aggregate ou orders.");
  }

  const byProduct = new Map();

  for (const order of input.orders) {
    for (const item of order.items || []) {
      const label = cleanLabel(item.label || item.name || item.query);
      if (!label) continue;

      const key = normalized(label);

      if (!byProduct.has(key)) {
        byProduct.set(key, {
          label,
          query: label,
          prices: [],
          quantities: [],
          orderIds: new Set(),
          totalQuantity: 0,
          firstPurchasedAt: item.purchasedAt || order.creationDate || null,
          lastPurchasedAt: item.purchasedAt || order.creationDate || null,
        });
      }

      const entry = byProduct.get(key);
      const quantity = Number(item.quantity || 1);
      const unitPrice = parsePrice(item.unitPrice ?? item.price ?? item.sellingPrice);
      const purchasedAt = item.purchasedAt || order.creationDate || null;

      entry.orderIds.add(order.orderId || `${purchasedAt}:${key}`);
      entry.quantities.push(quantity);
      entry.totalQuantity += quantity;

      if (unitPrice != null) {
        entry.prices.push({ value: unitPrice, purchasedAt });
      }

      if (dateValue(purchasedAt) < dateValue(entry.firstPurchasedAt)) {
        entry.firstPurchasedAt = purchasedAt;
      }

      if (dateValue(purchasedAt) > dateValue(entry.lastPurchasedAt)) {
        entry.lastPurchasedAt = purchasedAt;
      }
    }
  }

  return [...byProduct.values()].map((entry) => {
    const prices = entry.prices.sort((a, b) => dateValue(a.purchasedAt) - dateValue(b.purchasedAt));
    const priceValues = prices.map((price) => price.value);

    return {
      label: entry.label,
      query: entry.query,
      referencePrice: prices.at(-1)?.value ?? null,
      typicalQuantity: typicalQuantity(entry.quantities),
      orderCount: entry.orderIds.size,
      totalQuantity: roundQuantity(entry.totalQuantity),
      averageUnitPrice: priceValues.length ? average(priceValues) : null,
      minUnitPrice: priceValues.length ? Math.min(...priceValues) : null,
      maxUnitPrice: priceValues.length ? Math.max(...priceValues) : null,
      firstPurchasedAt: entry.firstPurchasedAt,
      lastPurchasedAt: entry.lastPurchasedAt,
    };
  });
}

function toShoppingItem(item) {
  const referencePrice = parsePrice(item.referencePrice ?? item.lastPrice ?? item.averageUnitPrice);
  const qty = clampQty(item.typicalQuantity ?? item.qty ?? 1);

  return {
    label: cleanLabel(item.label || item.query),
    query: cleanLabel(item.query || item.label),
    referencePrice,
    qty,
    orderCount: Number(item.orderCount || 1),
    totalQuantity: Number(item.totalQuantity || qty),
    lastPurchasedAt: item.lastPurchasedAt || null,
  };
}

function replaceSavedShoppingItems(source, items) {
  const marker = "export const savedShoppingItems = [";
  const start = source.indexOf(marker);

  if (start === -1) {
    throw new Error("Nao encontrei savedShoppingItems em src/zonasulCatalog.mjs.");
  }

  const end = source.indexOf("\n];", start);

  if (end === -1) {
    throw new Error("Nao encontrei o fim de savedShoppingItems.");
  }

  const block = [
    marker,
    ...items.map((item) => `  ${formatShoppingItem(item)},`),
    "];",
  ].join("\n");

  return `${source.slice(0, start)}${block}${source.slice(end + 3)}`;
}

function formatShoppingItem(item) {
  const parts = [
    `label: ${JSON.stringify(item.label)}`,
    `query: ${JSON.stringify(item.query)}`,
  ];

  if (item.referencePrice != null) {
    parts.push(`referencePrice: ${formatNumber(item.referencePrice)}`);
  }

  if (item.qty !== 1) {
    parts.push(`qty: ${item.qty}`);
  }

  parts.push(`orderCount: ${item.orderCount}`);

  if (item.lastPurchasedAt) {
    parts.push(`lastPurchasedAt: ${JSON.stringify(item.lastPurchasedAt)}`);
  }

  return `{ ${parts.join(", ")} }`;
}

function parseArgs(values) {
  const parsed = {
    input: null,
    minOrders: 1,
    limit: 0,
    dryRun: false,
  };

  for (const value of values) {
    if (value.startsWith("--min-orders=")) {
      parsed.minOrders = Number(value.slice("--min-orders=".length));
    } else if (value.startsWith("--limit=")) {
      parsed.limit = Number(value.slice("--limit=".length));
    } else if (value === "--dry-run") {
      parsed.dryRun = true;
    } else if (!parsed.input) {
      parsed.input = value;
    }
  }

  return parsed;
}

function parsePrice(value) {
  if (value == null || value === "") return null;
  const number = Number(String(value).replace(",", "."));
  return Number.isFinite(number) ? roundMoney(number) : null;
}

function typicalQuantity(values) {
  const counts = new Map();

  for (const value of values) {
    const qty = clampQty(value);
    counts.set(qty, (counts.get(qty) || 0) + 1);
  }

  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0] - b[0])
    .at(0)?.[0] || 1;
}

function clampQty(value) {
  const qty = Number.parseInt(value, 10);
  if (!Number.isFinite(qty)) return 1;
  return Math.max(1, Math.min(qty, 24));
}

function average(values) {
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function cleanLabel(value) {
  return String(value || "")
    .replace(/\s+/g, " ")
    .trim();
}

function normalized(value) {
  return cleanLabel(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function dateValue(value) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 0 : date.getTime();
}

function roundMoney(value) {
  return Math.round(Number(value) * 100) / 100;
}

function roundQuantity(value) {
  return Math.round(Number(value) * 1000) / 1000;
}

function formatMoney(value) {
  return Number(value).toFixed(2).replace(".", ",");
}

function formatNumber(value) {
  return String(roundMoney(value));
}
