(async () => {
  const YEAR = 2025;
  const PER_PAGE = 50;
  const MAX_PAGES = 200;
  const DETAIL_CONCURRENCY = 4;

  if (!/(\.|^)zonasul\.com\.br$/i.test(location.hostname)) {
    alert("Abra a pagina de pedidos do Zona Sul antes de rodar este extrator.");
    return;
  }

  if (window.__autoComprasZonaSulExtractorRunning) {
    alert("O extrator de pedidos ja esta rodando nesta pagina.");
    return;
  }

  window.__autoComprasZonaSulExtractorRunning = true;

  const panel = createStatusPanel();

  try {
    updateStatus("Lendo paginas de pedidos...");
    const summaries = await fetchOrderSummaries();
    const targetSummaries = summaries.filter((order) => dateYear(order.creationDate) === YEAR);

    if (!targetSummaries.length) {
      throw new Error(`Nao encontrei pedidos de ${YEAR} nesta conta.`);
    }

    updateStatus(`Achei ${targetSummaries.length} pedidos de ${YEAR}. Abrindo detalhes...`);

    let completed = 0;
    const details = await mapWithConcurrency(
      targetSummaries,
      DETAIL_CONCURRENCY,
      async (summary) => {
        const detail = await fetchOrderDetail(summary);
        completed += 1;
        updateStatus(`Detalhes: ${completed}/${targetSummaries.length} pedidos`);
        return normalizeOrder(detail, summary);
      },
    );

    const orders = details
      .filter(Boolean)
      .sort((a, b) => new Date(b.creationDate) - new Date(a.creationDate));
    const aggregate = aggregateItems(orders);
    const itemCount = orders.reduce((sum, order) => sum + order.items.length, 0);
    const exportData = {
      source: "zonasul.com.br",
      exportedAt: new Date().toISOString(),
      year: YEAR,
      orderCount: orders.length,
      itemCount,
      aggregateCount: aggregate.length,
      orders,
      aggregate,
    };

    downloadJson(`zonasul-pedidos-${YEAR}.json`, exportData);

    console.table(
      aggregate.slice(0, 25).map((item) => ({
        produto: item.label,
        pedidos: item.orderCount,
        qtd: item.totalQuantity,
        preco: item.referencePrice,
        ultimo: item.lastPurchasedAt,
      })),
    );

    updateStatus(
      `Pronto: ${orders.length} pedidos, ${itemCount} itens, ${aggregate.length} produtos. O JSON foi baixado.`,
    );
  } catch (error) {
    console.error("[Auto Compras] Falha ao exportar pedidos:", error);
    updateStatus(`Falha: ${error.message}`, true);
  } finally {
    window.__autoComprasZonaSulExtractorRunning = false;
  }

  async function fetchOrderSummaries() {
    const orders = [];
    const seen = new Set();
    let sawTargetYear = false;

    for (let page = 1; page <= MAX_PAGES; page += 1) {
      const url = new URL("/api/oms/user/orders", location.origin);
      url.searchParams.set("page", String(page));
      url.searchParams.set("per_page", String(PER_PAGE));
      url.searchParams.set("orderBy", "creationDate,desc");

      const data = await fetchJson(url);
      const pageOrders = Array.isArray(data.list) ? data.list : [];
      const pageCount = Number(data.paging?.pages || 0);

      if (!pageOrders.length) break;

      for (const order of pageOrders) {
        const orderId = String(order.orderId || order.id || "").trim();
        if (!orderId || seen.has(orderId)) continue;

        const creationDate = order.creationDate || order.creationDateUtc || order.createdIn;
        const normalized = {
          orderId,
          sequence: order.sequence || null,
          creationDate,
          status: order.status || null,
          statusDescription: order.statusDescription || null,
          totalValue: moneyFromVtex(order.totalValue),
        };

        seen.add(orderId);
        orders.push(normalized);

        if (dateYear(creationDate) === YEAR) sawTargetYear = true;
      }

      updateStatus(`Paginas de pedidos: ${page}${pageCount ? `/${pageCount}` : ""}`);

      const allOlderThanTarget = pageOrders.every((order) => {
        const year = dateYear(order.creationDate || order.creationDateUtc || order.createdIn);
        return year != null && year < YEAR;
      });

      if (sawTargetYear && allOlderThanTarget) break;
      if (pageCount && page >= pageCount) break;
    }

    return orders;
  }

  async function fetchOrderDetail(summary) {
    return fetchJson(`/api/oms/user/orders/${encodeURIComponent(summary.orderId)}`);
  }

  async function fetchJson(input) {
    const response = await fetch(input, {
      credentials: "include",
      headers: {
        accept: "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`Zona Sul respondeu HTTP ${response.status}`);
    }

    return response.json();
  }

  function normalizeOrder(detail, summary) {
    const creationDate =
      detail.creationDate ||
      detail.creationDateUtc ||
      detail.createdIn ||
      summary.creationDate ||
      null;

    return {
      orderId: detail.orderId || summary.orderId,
      sequence: detail.sequence || summary.sequence || null,
      creationDate,
      status: detail.status || summary.status || null,
      statusDescription: detail.statusDescription || summary.statusDescription || null,
      totalValue: moneyFromVtex(detail.value ?? detail.totalValue ?? summary.totalValue),
      items: (detail.items || [])
        .filter((item) => item && !item.isGift)
        .map((item) => normalizeItem(item, creationDate))
        .filter((item) => item.label),
    };
  }

  function normalizeItem(item, purchasedAt) {
    const quantity = numeric(item.quantity) || 1;
    const unitPrice = moneyFromVtex(firstFinite(item.sellingPrice, item.price, item.listPrice));
    const subtotal = moneyFromVtex(
      firstFinite(item.priceDefinition?.total, numeric(item.sellingPrice) * quantity),
    );
    const label = cleanText(item.name || item.skuName || item.productName);

    return {
      label,
      sku: item.id || item.itemId || null,
      productId: item.productId || null,
      refId: item.refId || null,
      ean: item.ean || null,
      quantity,
      unitPrice,
      listPrice: moneyFromVtex(item.listPrice),
      subtotal,
      measurementUnit: item.measurementUnit || null,
      unitMultiplier: numeric(item.unitMultiplier) || null,
      imageUrl: item.imageUrl || null,
      detailUrl: item.detailUrl || null,
      purchasedAt,
    };
  }

  function aggregateItems(orders) {
    const byProduct = new Map();

    for (const order of orders) {
      const perOrderQuantity = new Map();

      for (const item of order.items) {
        const key = normalized(item.label);
        if (!key) continue;

        if (!byProduct.has(key)) {
          byProduct.set(key, {
            label: item.label,
            query: item.label,
            orderIds: new Set(),
            totalQuantity: 0,
            quantities: [],
            prices: [],
            firstPurchasedAt: item.purchasedAt,
            lastPurchasedAt: item.purchasedAt,
            sku: item.sku || null,
            productId: item.productId || null,
          });
        }

        const entry = byProduct.get(key);
        entry.orderIds.add(order.orderId);
        entry.totalQuantity += item.quantity || 0;

        if (Number.isFinite(item.unitPrice)) {
          entry.prices.push({
            purchasedAt: item.purchasedAt,
            value: item.unitPrice,
          });
        }

        if (dateValue(item.purchasedAt) < dateValue(entry.firstPurchasedAt)) {
          entry.firstPurchasedAt = item.purchasedAt;
        }

        if (dateValue(item.purchasedAt) > dateValue(entry.lastPurchasedAt)) {
          entry.lastPurchasedAt = item.purchasedAt;
        }

        perOrderQuantity.set(key, (perOrderQuantity.get(key) || 0) + (item.quantity || 0));
      }

      for (const [key, quantity] of perOrderQuantity) {
        const entry = byProduct.get(key);
        entry.quantities.push(quantity);
      }
    }

    return [...byProduct.values()]
      .map((entry) => {
        const prices = entry.prices
          .filter((price) => Number.isFinite(price.value))
          .sort((a, b) => dateValue(a.purchasedAt) - dateValue(b.purchasedAt));
        const values = prices.map((price) => price.value);
        const lastPrice = prices.at(-1)?.value ?? null;
        const referencePrice = lastPrice == null ? null : roundMoney(lastPrice);

        return {
          label: entry.label,
          query: entry.query,
          referencePrice,
          typicalQuantity: typicalQuantity(entry.quantities),
          orderCount: entry.orderIds.size,
          totalQuantity: roundQuantity(entry.totalQuantity),
          averageUnitPrice: values.length ? roundMoney(average(values)) : null,
          minUnitPrice: values.length ? roundMoney(Math.min(...values)) : null,
          maxUnitPrice: values.length ? roundMoney(Math.max(...values)) : null,
          firstPurchasedAt: entry.firstPurchasedAt,
          lastPurchasedAt: entry.lastPurchasedAt,
          sku: entry.sku,
          productId: entry.productId,
        };
      })
      .sort(
        (a, b) =>
          b.orderCount - a.orderCount ||
          b.totalQuantity - a.totalQuantity ||
          String(a.label).localeCompare(String(b.label), "pt-BR"),
      );
  }

  async function mapWithConcurrency(items, limit, worker) {
    const results = new Array(items.length);
    let index = 0;

    await Promise.all(
      Array.from({ length: Math.min(limit, items.length) }, async () => {
        while (index < items.length) {
          const current = index;
          index += 1;
          results[current] = await worker(items[current], current);
        }
      }),
    );

    return results;
  }

  function createStatusPanel() {
    const element = document.createElement("div");
    element.style.cssText = [
      "position:fixed",
      "right:16px",
      "bottom:16px",
      "z-index:2147483647",
      "max-width:360px",
      "padding:14px 16px",
      "border-radius:8px",
      "background:#111827",
      "color:#fff",
      "font:14px/1.35 Arial,sans-serif",
      "box-shadow:0 12px 30px rgba(0,0,0,.25)",
    ].join(";");
    element.textContent = "Auto Compras: iniciando...";
    document.body.append(element);
    return element;
  }

  function updateStatus(message, isError = false) {
    panel.textContent = `Auto Compras: ${message}`;
    panel.style.background = isError ? "#7f1d1d" : "#111827";
    console.log(`[Auto Compras] ${message}`);
  }

  function downloadJson(filename, data) {
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.append(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 5000);
  }

  function moneyFromVtex(value) {
    const number = numeric(value);
    if (!Number.isFinite(number)) return null;
    return roundMoney(Number.isInteger(number) ? number / 100 : number);
  }

  function firstFinite(...values) {
    return values.find((value) => Number.isFinite(numeric(value)));
  }

  function numeric(value) {
    if (value == null || value === "") return NaN;
    const number = Number(value);
    return Number.isFinite(number) ? number : NaN;
  }

  function dateYear(value) {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date.getFullYear();
  }

  function dateValue(value) {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? 0 : date.getTime();
  }

  function typicalQuantity(values) {
    const counts = new Map();

    for (const value of values) {
      const rounded = Math.max(1, Math.round(Number(value) || 1));
      counts.set(rounded, (counts.get(rounded) || 0) + 1);
    }

    return [...counts.entries()]
      .sort((a, b) => b[1] - a[1] || a[0] - b[0])
      .at(0)?.[0] || 1;
  }

  function average(values) {
    return values.reduce((sum, value) => sum + value, 0) / values.length;
  }

  function roundMoney(value) {
    return Math.round(Number(value) * 100) / 100;
  }

  function roundQuantity(value) {
    return Math.round(Number(value) * 1000) / 1000;
  }

  function cleanText(value) {
    return String(value || "")
      .replace(/\s+/g, " ")
      .trim();
  }

  function normalized(value) {
    return cleanText(value)
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase();
  }
})();
