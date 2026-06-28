const DATA_ROOT = "./data/price-monitor";
const REFRESH_MS = 60_000;

const state = {
  summary: null,
  observations: [],
  runs: [],
  latestRows: [],
  previousRows: [],
  search: "",
};

const nodes = {
  refreshButton: document.querySelector("#refreshButton"),
  lastRefresh: document.querySelector("#lastRefresh"),
  basketTotal: document.querySelector("#basketTotal"),
  basketDelta: document.querySelector("#basketDelta"),
  latestRun: document.querySelector("#latestRun"),
  latestStatus: document.querySelector("#latestStatus"),
  availability: document.querySelector("#availability"),
  errors: document.querySelector("#errors"),
  averageDiscount: document.querySelector("#averageDiscount"),
  sampleSize: document.querySelector("#sampleSize"),
  rangeLabel: document.querySelector("#rangeLabel"),
  basketChart: document.querySelector("#basketChart"),
  movementList: document.querySelector("#movementList"),
  highPriceList: document.querySelector("#highPriceList"),
  bestWindows: document.querySelector("#bestWindows"),
  issuesList: document.querySelector("#issuesList"),
  itemsTable: document.querySelector("#itemsTable"),
  itemSearch: document.querySelector("#itemSearch"),
};

nodes.refreshButton.addEventListener("click", () => loadDashboard());
nodes.itemSearch.addEventListener("input", (event) => {
  state.search = event.target.value.trim().toLowerCase();
  renderItemsTable();
});

await loadDashboard();
window.setInterval(loadDashboard, REFRESH_MS);

async function loadDashboard() {
  setRefreshState("Atualizando...");

  try {
    const cacheBust = `v=${Date.now()}`;
    const [summaryResponse, observationsResponse] = await Promise.all([
      fetch(`${DATA_ROOT}/summary.json?${cacheBust}`, { cache: "no-store" }),
      fetch(`${DATA_ROOT}/observations.jsonl?${cacheBust}`, { cache: "no-store" }),
    ]);

    if (!summaryResponse.ok) throw new Error(`summary.json HTTP ${summaryResponse.status}`);
    if (!observationsResponse.ok) {
      throw new Error(`observations.jsonl HTTP ${observationsResponse.status}`);
    }

    state.summary = await summaryResponse.json();
    state.observations = parseJsonl(await observationsResponse.text());
    state.runs = groupRuns(state.observations);
    state.latestRows = rowsForRun(state.runs.at(-1));
    state.previousRows = rowsForRun(state.runs.at(-2));

    render();
    setRefreshState(`Atualizado ${formatClock(new Date())}`);
  } catch (error) {
    setRefreshState("Falha ao atualizar");
    showGlobalError(error);
  }
}

function render() {
  renderSummary();
  renderBasketChart();
  renderMovements();
  renderHighPrices();
  renderBestWindows();
  renderIssues();
  renderItemsTable();
}

function renderSummary() {
  const latest = state.summary.latestRun || state.runs.at(-1) || {};
  const previous = state.runs.at(-2);
  const delta = previous ? latest.basketTotal - previous.basketTotal : null;

  nodes.basketTotal.textContent = formatMoney(latest.basketTotal);
  nodes.basketDelta.textContent =
    delta === null ? "Sem coleta anterior" : `${formatDeltaMoney(delta)} vs coleta anterior`;
  nodes.basketDelta.className = trendClass(delta);

  nodes.latestRun.textContent =
    latest.localDate && latest.localTime ? `${formatDate(latest.localDate)} ${latest.localTime}` : "--";
  nodes.latestStatus.textContent =
    state.summary.recommendation?.enoughData
      ? "Amostra minima atingida"
      : "Ainda acumulando amostra";

  nodes.availability.textContent = `${latest.availableCount ?? "--"}/${latest.itemCount ?? "--"}`;
  nodes.errors.textContent = `${latest.errorCount ?? 0} erros na ultima coleta`;
  nodes.averageDiscount.textContent = formatPercent(latest.averageDiscount);
  nodes.sampleSize.textContent = `${state.summary.validRuns ?? 0} coletas validas, ${
    state.summary.totalObservations ?? 0
  } observacoes`;
}

function renderBasketChart() {
  const runs = state.runs.filter((run) => Number.isFinite(run.basketTotal));
  nodes.rangeLabel.textContent = `${runs.length} coletas`;

  if (!runs.length) {
    nodes.basketChart.innerHTML = empty("Sem dados de cesta ainda.");
    return;
  }

  const width = 980;
  const height = 320;
  const pad = { top: 20, right: 24, bottom: 38, left: 70 };
  const values = runs.map((run) => run.basketTotal);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = Math.max(max - min, 1);
  const x = (index) =>
    pad.left + (index / Math.max(runs.length - 1, 1)) * (width - pad.left - pad.right);
  const y = (value) =>
    pad.top + ((max - value) / span) * (height - pad.top - pad.bottom);
  const points = runs.map((run, index) => `${x(index)},${y(run.basketTotal)}`).join(" ");
  const linePath = runs
    .map((run, index) => `${index === 0 ? "M" : "L"} ${x(index)} ${y(run.basketTotal)}`)
    .join(" ");
  const areaPath = `${linePath} L ${x(runs.length - 1)} ${height - pad.bottom} L ${x(0)} ${
    height - pad.bottom
  } Z`;
  const first = runs.at(0);
  const last = runs.at(-1);

  nodes.basketChart.innerHTML = `
    <svg viewBox="0 0 ${width} ${height}" preserveAspectRatio="none">
      <line x1="${pad.left}" y1="${height - pad.bottom}" x2="${width - pad.right}" y2="${
        height - pad.bottom
      }" stroke="#dce4e1" />
      <line x1="${pad.left}" y1="${pad.top}" x2="${pad.left}" y2="${
        height - pad.bottom
      }" stroke="#dce4e1" />
      <text x="${pad.left}" y="${pad.top + 4}" class="axis-label">${formatMoney(max)}</text>
      <text x="${pad.left}" y="${height - pad.bottom - 4}" class="axis-label">${formatMoney(
        min,
      )}</text>
      <path d="${areaPath}" fill="#dff3ed" opacity="0.8"></path>
      <polyline points="${points}" fill="none" stroke="#0d6b57" stroke-width="4" stroke-linejoin="round" stroke-linecap="round"></polyline>
      ${runs
        .map(
          (run, index) =>
            `<circle cx="${x(index)}" cy="${y(run.basketTotal)}" r="5" fill="#0d6b57"><title>${formatDate(
              run.localDate,
            )} ${run.localTime} - ${formatMoney(run.basketTotal)}</title></circle>`,
        )
        .join("")}
      <text x="${pad.left}" y="${height - 12}" class="axis-label">${formatDate(
        first.localDate,
      )} ${first.localTime || ""}</text>
      <text x="${width - pad.right}" y="${height - 12}" text-anchor="end" class="axis-label">${formatDate(
        last.localDate,
      )} ${last.localTime || ""}</text>
    </svg>
  `;
}

function renderMovements() {
  const previousByKey = mapByKey(state.previousRows);
  const rows = state.latestRows
    .map((row) => {
      const previous = previousByKey.get(row.key);
      if (!previous || !isPriced(row) || !isPriced(previous)) return null;
      const delta = Number(row.price) - Number(previous.price);
      const deltaPercent = Number(previous.price) ? (delta / Number(previous.price)) * 100 : 0;
      return { row, previous, delta, deltaPercent };
    })
    .filter(Boolean)
    .filter((item) => Math.abs(item.delta) >= 0.01)
    .sort((a, b) => Math.abs(b.deltaPercent) - Math.abs(a.deltaPercent))
    .slice(0, 8);

  if (!rows.length) {
    nodes.movementList.innerHTML = empty("Nenhuma mudanca de preco detectada desde a coleta anterior.");
    return;
  }

  nodes.movementList.innerHTML = rows
    .map(({ row, delta, deltaPercent }) => {
      const up = delta > 0;
      return listRow({
        title: productLink(row),
        meta: `${formatMoney(row.price)} agora, ${formatPercent(Math.abs(deltaPercent))} ${
          up ? "mais caro" : "mais barato"
        }`,
        value: formatDeltaMoney(delta),
        valueClass: up ? "trend-up" : "trend-down",
      });
    })
    .join("");
}

function renderHighPrices() {
  const historyByKey = groupBy(state.observations.filter(isPriced), (row) => row.key);
  const rows = state.latestRows
    .filter(isPriced)
    .map((row) => {
      const history = historyByKey.get(row.key) || [];
      const prices = history.map((item) => Number(item.price));
      const avg = average(prices);
      const min = Math.min(...prices);
      const deltaAvg = Number(row.price) - avg;
      return {
        row,
        observations: history.length,
        avg,
        min,
        deltaAvg,
        impact: deltaAvg * Number(row.historicalQty || 1),
      };
    })
    .filter((item) => item.observations >= 2 && item.deltaAvg > 0.01)
    .sort((a, b) => b.impact - a.impact)
    .slice(0, 5);

  if (!rows.length) {
    nodes.highPriceList.innerHTML = empty("Ainda nao ha variacao suficiente para apontar altos historicos.");
    return;
  }

  nodes.highPriceList.innerHTML = rows
    .map(({ row, avg, min, impact }) =>
      listRow({
        title: productLink(row),
        meta: `Media ${formatMoney(avg)}, menor ${formatMoney(min)}, qtd historica ${
          row.historicalQty || 1
        }`,
        value: `+${formatMoney(impact)}`,
        valueClass: "trend-up",
      }),
    )
    .join("");
}

function renderBestWindows() {
  const rows = [...(state.summary.byDayAndHour || [])]
    .sort((a, b) => Number(a.averageBasketTotal) - Number(b.averageBasketTotal))
    .slice(0, 8);

  if (!rows.length) {
    nodes.bestWindows.innerHTML = empty("Sem janelas comparaveis ainda.");
    return;
  }

  nodes.bestWindows.innerHTML = `
    <table>
      <thead>
        <tr>
          <th>Janela</th>
          <th class="num">Coletas</th>
          <th class="num">Media</th>
          <th class="num">Min</th>
          <th class="num">Indisp.</th>
        </tr>
      </thead>
      <tbody>
        ${rows
          .map(
            (row) => `
              <tr>
                <td>${escapeHtml(row.key)}</td>
                <td class="num">${row.observations}</td>
                <td class="num">${formatMoney(row.averageBasketTotal)}</td>
                <td class="num">${formatMoney(row.minBasketTotal)}</td>
                <td class="num">${row.averageUnavailableCount}</td>
              </tr>
            `,
          )
          .join("")}
      </tbody>
    </table>
  `;
}

function renderIssues() {
  const rows = state.latestRows.filter((row) => row.error || !row.available);

  if (!rows.length) {
    nodes.issuesList.innerHTML = empty("Nenhum item indisponivel ou com erro na ultima coleta.");
    return;
  }

  nodes.issuesList.innerHTML = rows
    .slice(0, 8)
    .map((row) =>
      listRow({
        title: productLink(row),
        meta: row.error || "Produto indisponivel no Zona Sul",
        value: row.error ? "Erro" : "Indisp.",
        valueClass: row.error ? "trend-up" : "trend-flat",
      }),
    )
    .join("");
}

function renderItemsTable() {
  const previousByKey = mapByKey(state.previousRows);
  let rows = state.latestRows.filter((row) => isPriced(row) || row.error || !row.available);

  if (state.search) {
    rows = rows.filter((row) =>
      `${row.label || ""} ${row.returnedName || ""} ${row.segment || ""}`
        .toLowerCase()
        .includes(state.search),
    );
  }

  rows = rows.sort(
    (a, b) =>
      Number(b.historicalQty || 1) * Number(b.price || 0) -
      Number(a.historicalQty || 1) * Number(a.price || 0),
  );

  if (!rows.length) {
    nodes.itemsTable.innerHTML = empty("Nenhum item encontrado.");
    return;
  }

  nodes.itemsTable.innerHTML = `
    <table>
      <thead>
        <tr>
          <th>Produto</th>
          <th>Segmento</th>
          <th class="num">Preco</th>
          <th class="num">Qtd hist.</th>
          <th class="num">Subtotal</th>
          <th class="num">Desconto</th>
          <th class="num">Mudanca</th>
        </tr>
      </thead>
      <tbody>
        ${rows
          .map((row) => {
            const previous = previousByKey.get(row.key);
            const delta = previous && isPriced(previous) && isPriced(row) ? row.price - previous.price : null;
            return `
              <tr>
                <td>${productLink(row)}</td>
                <td>${escapeHtml(repairText(row.segment || "--"))}</td>
                <td class="num">${isPriced(row) ? formatMoney(row.price) : "--"}</td>
                <td class="num">${row.historicalQty || 1}</td>
                <td class="num">${isPriced(row) ? formatMoney(row.price * (row.historicalQty || 1)) : "--"}</td>
                <td class="num">${isPriced(row) ? formatPercent(row.discountPercent) : "--"}</td>
                <td class="num ${trendClass(delta)}">${delta === null ? "--" : formatDeltaMoney(delta)}</td>
              </tr>
            `;
          })
          .join("")}
      </tbody>
    </table>
  `;
}

function showGlobalError(error) {
  const message = escapeHtml(error.message || String(error));
  nodes.basketChart.innerHTML = `<div class="error-box">Nao foi possivel carregar os dados: ${message}</div>`;
}

function groupRuns(observations) {
  const grouped = groupBy(observations, (row) => row.runId);

  return [...grouped.entries()]
    .map(([runId, rows]) => {
      const priced = rows.filter(isPriced);
      const first = rows[0] || {};
      return {
        runId,
        rows,
        observedAt: first.observedAt,
        localDate: first.localDate,
        localTime: first.localTime,
        dayOfWeek: first.dayOfWeek,
        hour: Number(first.hour),
        itemCount: rows.length,
        availableCount: priced.length,
        errorCount: rows.filter((row) => row.error).length,
        basketTotal: round(
          priced.reduce(
            (sum, row) => sum + Number(row.price || 0) * Number(row.historicalQty || 1),
            0,
          ),
        ),
      };
    })
    .sort((a, b) => String(a.observedAt).localeCompare(String(b.observedAt)));
}

function rowsForRun(run) {
  return run?.rows || [];
}

function mapByKey(rows) {
  return new Map(rows.map((row) => [row.key, row]));
}

function groupBy(rows, keyFn) {
  const grouped = new Map();
  for (const row of rows) {
    const key = keyFn(row);
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key).push(row);
  }
  return grouped;
}

function parseJsonl(text) {
  return text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => JSON.parse(line));
}

function isPriced(row) {
  return row?.available && Number(row.price) > 0;
}

function productLink(row) {
  const label = escapeHtml(repairText(row.returnedName || row.label || "Produto"));
  return row.link
    ? `<a href="${escapeHtml(row.link)}" target="_blank" rel="noreferrer">${label}</a>`
    : label;
}

function listRow({ title, meta, value, valueClass }) {
  return `
    <div class="list-row">
      <div>
        <strong>${title}</strong>
        <small>${escapeHtml(meta)}</small>
      </div>
      <div class="value ${valueClass || ""}">${escapeHtml(value)}</div>
    </div>
  `;
}

function empty(message) {
  return `<div class="empty">${escapeHtml(message)}</div>`;
}

function setRefreshState(message) {
  nodes.lastRefresh.textContent = message;
}

function repairText(value) {
  const text = String(value || "");
  if (!/[ÃÂ�]/u.test(text)) return text;

  try {
    const bytes = Uint8Array.from([...text].map((char) => char.charCodeAt(0) & 0xff));
    return new TextDecoder("utf-8", { fatal: false }).decode(bytes);
  } catch {
    return text;
  }
}

function formatMoney(value) {
  if (!Number.isFinite(Number(value))) return "--";
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
  }).format(Number(value));
}

function formatDeltaMoney(value) {
  if (!Number.isFinite(Number(value))) return "--";
  const prefix = Number(value) > 0 ? "+" : "";
  return `${prefix}${formatMoney(value)}`;
}

function formatPercent(value) {
  if (!Number.isFinite(Number(value))) return "--";
  return `${Number(value).toLocaleString("pt-BR", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  })}%`;
}

function formatDate(value) {
  if (!value) return "--";
  const [year, month, day] = String(value).split("-");
  if (!year || !month || !day) return value;
  return `${day}/${month}/${year}`;
}

function formatClock(date) {
  return new Intl.DateTimeFormat("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).format(date);
}

function trendClass(value) {
  if (!Number.isFinite(Number(value)) || Math.abs(Number(value)) < 0.01) return "trend-flat";
  return Number(value) > 0 ? "trend-up" : "trend-down";
}

function average(values) {
  return values.reduce((sum, value) => sum + Number(value || 0), 0) / Math.max(values.length, 1);
}

function round(value) {
  return Math.round(Number(value || 0) * 100) / 100;
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
