const currency = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

const CART_BASE = "https://www.zonasul.com.br/checkout/cart/add";
const phases = ["list", "review", "buy"];

const state = {
  items: [],
  busy: false,
  phase: "list",
  plan: null,
  quoteDirty: false,
  buyCartOverrides: new Map(),
  collapsedSections: new Set([
    "listSegment:recent",
    "listSegment:perishable",
    "listSegment:cleaning",
    "listSegment:heavy",
    "listSegment:balanced",
    "listSegment:removed",
    "outsideDeals",
    "quotedItems",
  ]),
};

const elements = {
  status: document.querySelector("#statusText"),
  loginLink: document.querySelector("#loginLink"),
  spreadsheetLink: document.querySelector("#spreadsheetLink"),
  list: document.querySelector("#itemList"),
  listSummary: document.querySelector("#listSummary"),
  cartSummary: document.querySelector("#cartSummary"),
  buySummary: document.querySelector("#buySummary"),
  purchaseSummary: document.querySelector("#purchaseSummary"),
  personalOffers: document.querySelector("#personalOffers"),
  comparisonInsights: document.querySelector("#comparisonInsights"),
  results: document.querySelector("#results"),
  buyAccounts: document.querySelector("#buyAccounts"),
  checkPricesButton: document.querySelector("#checkPricesButton"),
  backToListButton: document.querySelector("#backToListButton"),
  goToBuyButton: document.querySelector("#goToBuyButton"),
  backToReviewButton: document.querySelector("#backToReviewButton"),
  addProductForm: document.querySelector("#addProductForm"),
  productLinkInput: document.querySelector("#productLinkInput"),
  addProductButton: document.querySelector("#addProductButton"),
  addProductStatus: document.querySelector("#addProductStatus"),
};

elements.checkPricesButton.addEventListener("click", () => quotePrices());
elements.backToListButton.addEventListener("click", () => setPhase("list"));
elements.goToBuyButton.addEventListener("click", () => {
  if (!state.plan) return;
  renderBuyPhase(state.plan);
  setPhase("buy");
});
elements.backToReviewButton.addEventListener("click", () => setPhase("review"));
elements.addProductForm.addEventListener("submit", (event) => {
  event.preventDefault();
  addProductByLink();
});

document.addEventListener("click", (event) => {
  const sectionButton = event.target.closest("[data-toggle-section]");
  if (sectionButton) {
    toggleSection(sectionButton.dataset.toggleSection);
    return;
  }

  const removeButton = event.target.closest("[data-remove-historical-item]");
  if (removeButton) {
    removeHistoricalItem(removeButton.dataset.removeHistoricalItem);
    return;
  }

  const swapButton = event.target.closest("[data-swap-cart-item]");
  if (swapButton) {
    swapCartItem(swapButton.dataset.swapCartItem, swapButton.dataset.targetAccount);
    return;
  }

  const activateCloudButton = event.target.closest("[data-activate-cloud]");
  if (activateCloudButton) {
    triggerCloudActivation(activateCloudButton.dataset.activateCloud);
    return;
  }

  const phaseButton = event.target.closest("[data-go-phase]");
  if (phaseButton) {
    const nextPhase = phaseButton.dataset.goPhase;
    if (nextPhase === "review" && !state.plan) return;
    if (nextPhase === "buy" && !state.plan) return;
    if (nextPhase === "buy") renderBuyPhase(state.plan);
    setPhase(nextPhase);
  }
});

await loadIntents();
renderList();
setPhase("list");
loadItemPreviews();

async function loadIntents() {
  setStatus("Carregando", "busy");
  try {
    const response = await fetch("/api/intents");
    const data = await response.json();

    elements.loginLink.href = data.loginUrl || "https://www.zonasul.com.br/login";
    if (data.spreadsheetUrl) {
      elements.spreadsheetLink.href = data.spreadsheetUrl;
      elements.spreadsheetLink.style.display = "inline-block";
    }
    state.items = data.defaults.map((item) => ({
      id: item.key,
      key: item.key,
      label: item.label,
      query: item.query || item.label,
      qty: 0,
      suggestedQty: item.qty,
      referencePrice: item.referencePrice ?? null,
      image: item.image || null,
      productName: item.productName || null,
      productLink: item.productLink || null,
      removed: Boolean(item.removed),
      segment: listSegmentFor(
        item.label,
        item.query || item.label,
        item.key,
        item.removed,
      ),
      compareLabel:
        item.removed
          ? "retirado da lista padrao"
          : item.referencePrice == null
          ? findCompareLabel(data.items, item.key)
          : `ref. ${currency.format(item.referencePrice)}`,
      preset: data.items.some((preset) => preset.key === item.key),
    }));
    setStatus("Aguardando", "");
  } catch (error) {
    setStatus("Erro", "error");
    elements.list.innerHTML = `
      <div class="empty-state">
        <strong>Erro ao carregar lista</strong>
        <span style="color: var(--danger-color, #ef4444); font-size: 14px; margin-top: 8px; text-align: center; max-width: 80%; word-break: break-word;">
          ${escapeHtml(error.message || error)}
        </span>
        <button class="primary-button" onclick="window.location.reload()" style="margin-top: 16px;">Tentar Novamente</button>
      </div>
    `;
  }
}

async function loadItemPreviews() {
  if (!state.items.length) return;

  const batchSize = 8;
  for (let index = 0; index < state.items.length; index += batchSize) {
    const batch = state.items.slice(index, index + batchSize);

    try {
    const response = await fetch("/api/item-previews", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        items: batch.map((item) => ({
          key: item.key,
          label: item.label,
          query: item.query,
          referencePrice: item.referencePrice,
        })),
      }),
    });

      if (!response.ok) continue;

    const data = await response.json();
    const previewsByKey = new Map(
      (data.previews || []).map((preview) => [preview.key, preview]),
    );

    for (const item of state.items) {
      const preview = previewsByKey.get(item.key);
      if (!preview) continue;

      item.image = preview.image || item.image;
      item.productName = preview.name || item.productName;
      item.productLink = preview.link || item.productLink;
    }

    renderList();
    } catch {
      // Fotos sao um extra visual; a lista continua funcionando sem elas.
    }
  }
}

async function removeHistoricalItem(key) {
  const item = state.items.find((candidate) => candidate.key === key);
  if (!item) return;

  const confirmed = window.confirm(
    `Retirar "${item.label}" da base historica?\n\nSe voce retirar este produto, ele nao aparecera mais automaticamente na lista historica.`,
  );

  if (!confirmed) return;

  try {
    setStatus("Atualizando", "busy");
    const response = await fetch("/api/historical-items/remove", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ key }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error || "Falha removendo item.");
    }

    item.qty = 0;
    item.removed = true;
    item.segment = "removed";
    item.compareLabel = "retirado da lista padrao";
    markQuoteDirty();
    renderList();
    setStatus("Atualizado", "ready");
  } catch (error) {
    setStatus("Erro", "error");
    window.alert(error.message || "Falha removendo item.");
  }
}

async function addProductByLink() {
  const url = elements.productLinkInput.value.trim();

  if (!url) {
    setAddProductStatus("Cole um link de produto do Zona Sul.", "error");
    return;
  }

  try {
    setStatus("Adicionando", "busy");
    setAddProductStatus("Buscando produto no Zona Sul...", "busy");
    elements.addProductButton.disabled = true;

    const response = await fetch("/api/historical-items/add-link", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ url }),
    });
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Nao consegui adicionar este produto.");
    }

    const item = data.item;
    const listItem = {
      id: item.key,
      key: item.key,
      label: item.label,
      query: item.query || item.label,
      qty: 0,
      suggestedQty: item.qty || 1,
      referencePrice: item.referencePrice ?? null,
      image: item.image || null,
      productName: item.productName || null,
      productLink: item.productLink || null,
      segment: listSegmentFor(item.label, item.query || item.label, item.key),
      compareLabel:
        item.referencePrice == null
          ? "busca livre"
          : `ref. ${currency.format(item.referencePrice)}`,
      preset: false,
    };
    const existingIndex = state.items.findIndex((candidate) => candidate.key === item.key);

    if (existingIndex >= 0) {
      state.items[existingIndex] = { ...state.items[existingIndex], ...listItem };
    } else {
      state.items.push(listItem);
    }

    elements.productLinkInput.value = "";
    markQuoteDirty();
    renderList();
    setAddProductStatus(`Adicionado: ${item.label}`, "ready");
    setStatus("Atualizado", "ready");
  } catch (error) {
    setStatus("Erro", "error");
    setAddProductStatus(error.message || "Falha adicionando produto.", "error");
  } finally {
    elements.addProductButton.disabled = false;
  }
}

function setPhase(phase) {
  if (!phases.includes(phase)) return;

  state.phase = phase;
  document.querySelector("#phaseList").hidden = phase !== "list";
  document.querySelector("#phaseReview").hidden = phase !== "review";
  document.querySelector("#phaseBuy").hidden = phase !== "buy";

  for (const button of document.querySelectorAll("[data-go-phase]")) {
    button.classList.toggle("active", button.dataset.goPhase === phase);
  }
}

function renderList() {
  elements.list.innerHTML = "";
  const selectedItems = state.items.filter((item) => item.qty > 0);
  const totalUnits = state.items.reduce((sum, item) => sum + item.qty, 0);
  elements.listSummary.textContent = `${selectedItems.length}/${state.items.length} produtos | ${totalUnits} unidades`;

  if (!state.items.length) {
    elements.list.innerHTML = `
      <div class="empty-state">
        <strong>Lista vazia</strong>
        <span>R$ 0,00</span>
      </div>
    `;
    return;
  }

  for (const segment of listSegments()) {
    const segmentItems = state.items.filter((item) => item.segment === segment.key);
    if (!segmentItems.length) continue;

    const section = document.createElement("section");
    const sectionId = `listSegment:${segment.key}`;
    const collapsed = isSectionCollapsed(sectionId);
    section.className = `list-segment collapsible-section ${collapsed ? "is-collapsed" : ""}`.trim();
    section.dataset.section = sectionId;
    section.innerHTML = `
      <button class="section-toggle list-segment-header" type="button" data-toggle-section="${escapeAttribute(sectionId)}" aria-expanded="${String(!collapsed)}" title="${collapsed ? "Abrir" : "Fechar"}">
        <span>
          <strong>${escapeHtml(segment.label)}</strong>
          <small>${segmentItems.length} produtos</small>
        </span>
        <i class="section-icon" aria-hidden="true"></i>
      </button>
    `;
    const content = document.createElement("div");
    content.className = "section-content list-segment-content";
    content.hidden = collapsed;

    for (const item of segmentItems) {
      content.append(renderShoppingItem(item));
    }

    section.append(content);
    elements.list.append(section);
  }
}

function renderShoppingItem(item) {
  const row = document.createElement("article");
  row.className = `shopping-item ${item.qty === 0 ? "is-zero" : ""} ${
    item.removed ? "is-removed" : ""
  }`.trim();
  row.innerHTML = `
      <div class="item-name">
        <div class="list-image-frame">
          ${
            item.image
              ? `<img src="${escapeAttribute(formatProductImage(item.image))}" alt="" loading="lazy" />`
              : `<span aria-hidden="true"></span>`
          }
        </div>
        <div>
          <strong>${escapeHtml(item.label)}</strong>
          <span>${escapeHtml(item.compareLabel || "busca livre")} | hist. qtd. ${item.suggestedQty}</span>
          ${
            item.productLink
              ? `<a class="item-product-link" href="${escapeAttribute(item.productLink)}" target="_blank" rel="noreferrer">Abrir produto</a>`
              : ""
          }
        </div>
      </div>
      ${
        item.removed
          ? `<span class="removed-item-pill">Retirado</span>`
          : `
            <div class="qty-control" aria-label="Quantidade de ${escapeHtml(item.label)}">
              <button class="icon-button" type="button" title="Diminuir" aria-label="Diminuir">-</button>
              <input class="qty-input" type="number" min="0" max="24" value="${item.qty}" aria-label="Quantidade" />
              <button class="icon-button" type="button" title="Aumentar" aria-label="Aumentar">+</button>
            </div>
            <button class="remove-historical-button" type="button" data-remove-historical-item="${escapeAttribute(item.key)}" title="Retirar da base historica" aria-label="Retirar da base historica">x</button>
          `
      }
    `;

  if (item.removed) return row;

  const [minusButton, plusButton] = row.querySelectorAll(".icon-button");
  const input = row.querySelector("input");

  minusButton.addEventListener("click", () => updateQty(item.id, item.qty - 1));
  plusButton.addEventListener("click", () => updateQty(item.id, item.qty + 1));
  input.addEventListener("change", () => updateQty(item.id, input.value));

  return row;
}

async function quotePrices() {
  const activeItems = state.items.filter((item) => item.qty > 0 && !item.removed);

  if (!activeItems.length) {
    setStatus("Escolha itens", "error");
    return;
  }

  state.busy = true;
  elements.checkPricesButton.disabled = true;
  elements.goToBuyButton.disabled = true;
  setStatus("Cotando", "busy");
  renderLoading(activeItems.length);
  setPhase("review");

  try {
    const response = await fetch("/api/plan", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        items: activeItems.map((item) => ({
          key: item.preset ? item.key : undefined,
          label: item.label,
          query: item.query,
          qty: item.qty,
          referencePrice: item.referencePrice,
        })),
      }),
    });

    const plan = await response.json();

    if (!response.ok) {
      throw new Error(plan.error || "Falha ao montar carrinho.");
    }

    state.plan = plan;
    state.quoteDirty = false;
    state.buyCartOverrides.clear();
    setStatus("Pronto", "ready");
    renderPurchaseSummary(plan);
    renderPersonalOffers(plan.personalOffers);
    renderComparisonInsights(plan);
    renderPlan(plan);
    renderBuyPhase(plan);
    elements.goToBuyButton.disabled = false;
  } catch (error) {
    setStatus("Erro", "error");
    renderError(error.message);
  } finally {
    state.busy = false;
    elements.checkPricesButton.disabled = false;
  }
}

function renderLoading(itemCount) {
  elements.cartSummary.textContent = `${itemCount} itens em checagem`;
  clearPurchaseSummary();
  clearPersonalOffers();
  clearComparisonInsights();
  elements.results.innerHTML = `
    <div class="empty-state">
      <strong>Cotando</strong>
      <span>Consultando Zona Sul</span>
    </div>
  `;
}

function renderPlan(plan) {
  const selectedItems = plan.items.filter((item) => item.selected);

  elements.cartSummary.textContent = `${selectedItems.length} itens, ${currency.format(plan.subtotal)}`;
  elements.results.innerHTML = "";

  const resultsContent = document.createElement("div");
  resultsContent.className = "quote-items";

  for (const item of plan.items) {
    if (!item.selected) {
      const warning = document.createElement("div");
      warning.className = "warning-row";
      warning.textContent = `${item.label}: ${item.error}`;
      resultsContent.append(warning);
      continue;
    }

    resultsContent.append(renderResultItem(item));
  }

  elements.results.append(
    createCollapsibleSection({
      id: "quotedItems",
      title: "Produtos cotados",
      meta: `${selectedItems.length}/${plan.items.length} encontrados | ${currency.format(plan.subtotal)}`,
      content: resultsContent,
    }),
  );
}

function renderPurchaseSummary(plan) {
  const insights = buildPurchaseInsights(plan);

  elements.purchaseSummary.hidden = false;
  elements.purchaseSummary.innerHTML = [
    renderCollapsibleSection({
      id: "purchaseOverview",
      title: "Resumo visual",
      meta: `${insights.foundCount}/${insights.requestedCount} encontrados | total estimado ${currency.format(insights.netTotal)}`,
      body: renderOverview(insights),
    }),
    renderCollapsibleSection({
      id: "historyAlerts",
      title: "Top 5 acima do historico",
      meta: insights.highHistorical.length
        ? `${currency.format(insights.highHistoricalTotal)} acima do historico`
        : "sem alerta forte",
      body: renderHistoryAlerts(insights.highHistorical),
    }),
    renderCollapsibleSection({
      id: "outsideDeals",
      title: "Promocoes fora dos slots",
      meta: `${insights.outsideDeals.length} bons descontos no site`,
      body: renderOutsideDeals(insights.outsideDeals),
    }),
  ].join("");
}

function clearPurchaseSummary() {
  elements.purchaseSummary.hidden = true;
  elements.purchaseSummary.innerHTML = "";
}

function buildPurchaseInsights(plan) {
  const personalOffers = plan.personalOffers || {};
  const accounts = personalOffers.accounts || [];
  const selectedOffers = personalOffers.selected || [];
  const offerByKey = new Map(
    selectedOffers.map((offer) => [offerKey(offer.sku, offer.label), offer]),
  );
  const selectedItems = plan.items.filter((item) => item.selected);
  const offerSubtotal = accounts.reduce(
    (sum, account) => sum + Number(account.subtotal || 0),
    0,
  );
  const offerSavings = Number(personalOffers.estimatedSavings || 0);
  const netTotal = Math.max(0, Number(plan.subtotal || 0) - offerSavings);
  const outsideSubtotal = Math.max(0, Number(plan.subtotal || 0) - offerSubtotal);
  const maxCartSubtotal = Math.max(
    outsideSubtotal,
    ...accounts.map((account) => Number(account.subtotal || 0)),
    1,
  );

  const accountRows = accounts.map((account) => {
    const subtotal = Number(account.subtotal || 0);
    const savings = Number(account.estimatedSavings || 0);

    return {
      label: account.label,
      selectedCount: account.selectedCount || 0,
      limit: account.limit || 0,
      subtotal,
      savings,
      finalTotal: Math.max(0, subtotal - savings),
      barPercent: (subtotal / maxCartSubtotal) * 100,
    };
  });

  const outsideRow = {
    label: "Fora das Minhas Ofertas",
    selectedCount: selectedItems.length - selectedOffers.length,
    subtotal: outsideSubtotal,
    savings: 0,
    finalTotal: outsideSubtotal,
    barPercent: (outsideSubtotal / maxCartSubtotal) * 100,
  };

  const itemRows = selectedItems.map((item) => {
    const selected = item.selected;
    const offer = offerByKey.get(offerKey(selected.sku, item.label));
    const offerSavingsForItem = Number(offer?.estimatedSavings || 0);
    const currentTotal = Number(selected.total || 0);
    const effectiveTotal = Math.max(0, currentTotal - offerSavingsForItem);
    const referencePrice = Number(selected.referencePrice ?? item.referencePrice);
    const hasReference = Number.isFinite(referencePrice) && referencePrice > 0;
    const referenceTotal = hasReference ? referencePrice * Number(item.qty || 1) : null;
    const deltaVsReference =
      referenceTotal == null ? null : effectiveTotal - referenceTotal;
    const deltaPercent =
      referenceTotal && referenceTotal > 0
        ? (deltaVsReference / referenceTotal) * 100
        : null;
    const listTotal = Number(selected.listPrice || selected.price || 0) * Number(item.qty || 1);
    const siteSavings = Math.max(0, listTotal - currentTotal);

    return {
      label: item.label,
      name: selected.name,
      qty: item.qty,
      currentTotal,
      effectiveTotal,
      referenceTotal,
      deltaVsReference,
      deltaPercent,
      offerSavings: offerSavingsForItem,
      inPersonalOffers: Boolean(offer),
      currentDiscountPercent: Number(selected.currentDiscountPercent || 0),
      siteSavings,
    };
  });

  const highHistorical = itemRows
    .filter((item) => item.deltaVsReference != null && item.deltaVsReference > 0.5)
    .sort(
      (a, b) =>
        b.deltaVsReference - a.deltaVsReference ||
        b.deltaPercent - a.deltaPercent,
    )
    .slice(0, 5);
  const highHistoricalTotal = itemRows
    .filter((item) => item.deltaVsReference != null && item.deltaVsReference > 0)
    .reduce((sum, item) => sum + item.deltaVsReference, 0);
  const cutoffPercent = Number(personalOffers.cutoffPercent || 15);
  const outsideDeals = itemRows
    .filter(
      (item) =>
        !item.inPersonalOffers &&
        item.currentDiscountPercent >= cutoffPercent &&
        item.siteSavings > 0,
    )
    .sort(
      (a, b) =>
        b.siteSavings - a.siteSavings ||
        b.currentDiscountPercent - a.currentDiscountPercent,
    )
    .slice(0, 5);

  return {
    requestedCount: plan.items.length,
    foundCount: selectedItems.length,
    failedCount: plan.items.length - selectedItems.length,
    subtotal: Number(plan.subtotal || 0),
    netTotal,
    offerSubtotal,
    offerSavings,
    outsideSubtotal,
    selectedOfferCount: selectedOffers.length,
    offerLimit: Number(personalOffers.limit || 0),
    eligibleCount: Number(personalOffers.eligibleCount || 0),
    cutoffPercent,
    accountRows,
    outsideRow,
    highHistorical,
    highHistoricalTotal,
    outsideDeals,
  };
}

function renderOverview(insights) {
  const carts = [...insights.accountRows, insights.outsideRow];

  return `
    <div class="summary-metrics">
      ${renderMetric("Total cotado", currency.format(insights.subtotal), `${insights.foundCount} itens`)}
      ${renderMetric("Desconto Minhas Ofertas", currency.format(insights.offerSavings), `${insights.selectedOfferCount}/${insights.offerLimit} slots`)}
      ${renderMetric("Estimado final", currency.format(insights.netTotal), "apos descontos")}
      ${renderMetric("Elegiveis", String(insights.eligibleCount), `corte ${formatPercent(insights.cutoffPercent)}%`)}
    </div>
    <div class="cart-chart" aria-label="Preco dos carrinhos">
      ${carts.map((cart) => renderCartBar(cart)).join("")}
    </div>
  `;
}

function renderMetric(label, value, detail) {
  return `
    <div class="summary-metric">
      <span>${escapeHtml(label)}</span>
      <strong>${escapeHtml(value)}</strong>
      <small>${escapeHtml(detail)}</small>
    </div>
  `;
}

function renderCartBar(cart) {
  return `
    <div class="cart-bar-row">
      <div class="cart-bar-copy">
        <strong>${escapeHtml(cart.label)}</strong>
        <span>${cart.selectedCount}${cart.limit ? `/${cart.limit}` : ""} itens | ${currency.format(cart.subtotal)} | desc. ${currency.format(cart.savings)}</span>
      </div>
      <div class="cart-bar-track" aria-hidden="true">
        <span style="width: ${clampPercent(cart.barPercent)}%"></span>
      </div>
      <strong>${currency.format(cart.finalTotal)}</strong>
    </div>
  `;
}

function renderHistoryAlerts(items) {
  if (!items.length) {
    return `
      <div class="section-empty">
        Nenhum item ficou claramente acima do historico depois das ofertas.
      </div>
    `;
  }

  return `
    <div class="insight-list">
      ${items
        .map(
          (item) => `
            <div class="insight-row danger">
              <div>
                <strong>${escapeHtml(item.label)}</strong>
                <span>${currency.format(item.effectiveTotal)} vs hist. ${currency.format(item.referenceTotal)}${item.offerSavings ? ` | oferta -${currency.format(item.offerSavings)}` : ""}</span>
              </div>
              <strong>+${currency.format(item.deltaVsReference)}<small>+${formatPercent(item.deltaPercent)}%</small></strong>
            </div>
          `,
        )
        .join("")}
    </div>
  `;
}

function renderOutsideDeals(items) {
  if (!items.length) {
    return `
      <div class="section-empty">
        Nenhum desconto forte do site ficou fora dos slots nesta cotacao.
      </div>
    `;
  }

  return `
    <div class="insight-list">
      ${items
        .map(
          (item) => `
            <div class="insight-row good">
              <div>
                <strong>${escapeHtml(item.label)}</strong>
                <span>${currency.format(item.currentTotal)} | site ${formatPercent(item.currentDiscountPercent)}%</span>
              </div>
              <strong>${currency.format(item.siteSavings)}<small>ja no site</small></strong>
            </div>
          `,
        )
        .join("")}
    </div>
  `;
}

function renderComparisonInsights(plan) {
  const insights = buildComparisonInsights(plan);
  elements.comparisonInsights.hidden = false;
  elements.comparisonInsights.innerHTML = renderCollapsibleSection({
    id: "comparisonInsights",
    title: "Insights de troca",
    meta: insights.length
      ? `${insights.length} comparacoes entre itens`
      : "sem troca relevante",
    body: renderComparisonRows(insights),
  });
}

function clearComparisonInsights() {
  elements.comparisonInsights.hidden = true;
  elements.comparisonInsights.innerHTML = "";
}

function buildComparisonInsights(plan) {
  const rows = [];

  for (const item of plan.items) {
    if (!item.selected || !item.alternatives?.length) continue;

    const selected = item.selected;
    const cheaper = item.alternatives
      .filter((alternative) => alternative.total < selected.total - 0.5)
      .sort((a, b) => a.total - b.total)[0];
    const pricier = item.alternatives
      .filter((alternative) => alternative.total > selected.total + 0.5)
      .sort((a, b) => b.total - a.total)[0];

    if (cheaper) {
      rows.push({
        type: "good",
        title: `${selected.name} esta ${currency.format(selected.total - cheaper.total)} mais caro que ${cheaper.name}`,
        detail: `${currency.format(selected.total)} vs ${currency.format(cheaper.total)} para qtd. ${item.qty}`,
        amount: selected.total - cheaper.total,
      });
    }

    if (pricier) {
      rows.push({
        type: "neutral",
        title: `${selected.name} esta ${currency.format(pricier.total - selected.total)} mais barato que ${pricier.name}`,
        detail: `${currency.format(selected.total)} vs ${currency.format(pricier.total)} para qtd. ${item.qty}`,
        amount: pricier.total - selected.total,
      });
    }
  }

  return rows.sort((a, b) => b.amount - a.amount).slice(0, 8);
}

function renderComparisonRows(rows) {
  if (!rows.length) {
    return `
      <div class="section-empty">
        Nao encontrei alternativa com diferenca relevante para os itens escolhidos.
      </div>
    `;
  }

  return `
    <div class="insight-list">
      ${rows
        .map(
          (row) => `
            <div class="insight-row ${row.type === "good" ? "good" : "neutral"}">
              <div>
                <strong>${escapeHtml(row.title)}</strong>
                <span>${escapeHtml(row.detail)}</span>
              </div>
              <strong>${currency.format(row.amount)}<small>comparacao</small></strong>
            </div>
          `,
        )
        .join("")}
    </div>
  `;
}

function renderPersonalOffers(offers) {
  if (!offers?.selected?.length) {
    clearPersonalOffers();
    return;
  }

  const slotLabel =
    offers.accountCount === 2
      ? `${offers.perAccountLimit}+${offers.perAccountLimit}`
      : `${offers.limit}`;

  elements.personalOffers.hidden = false;
  elements.personalOffers.innerHTML = `
    ${renderCollapsibleSection({
      id: "personalOffers",
      title: "Minhas Ofertas",
      meta: `${offers.selectedCount}/${offers.limit} slots (${slotLabel}) | corte ${formatPercent(offers.cutoffPercent || 15)}% | ${offers.eligibleCount} elegiveis | pot. ${currency.format(offers.estimatedSavings || 0)}`,
      body: `
        <div class="offer-accounts">
          ${(offers.accounts || []).map((account) => renderOfferAccount(account)).join("")}
        </div>
      `,
    })}
  `;
}

function renderOfferAccount(account) {
  const disabled = account.selectedCount ? "" : "disabled";

  return `
    <section class="offer-account">
      <div class="offer-account-header">
        <div>
          <strong style="display: flex; align-items: center; flex-wrap: wrap; gap: 4px;">
            ${escapeHtml(account.label)}
            ${renderActivationStatus(account.key)}
          </strong>
          <span>${account.selectedCount}/${account.limit} itens | ${currency.format(account.subtotal || 0)} | pot. ${currency.format(account.estimatedSavings || 0)}</span>
        </div>
        <div class="offer-actions-group" style="display: flex; gap: 8px; align-items: center;">
          <button class="offer-cart-link ${disabled}" data-activate-cloud="${account.key}" style="border-color: #047857; color: #047857; cursor: pointer;" type="button" ${disabled}>
            Ativar na Nuvem
          </button>
          <a class="offer-cart-link ${disabled}" href="${escapeAttribute(account.cartUrl || "#")}" target="_blank" rel="noreferrer">
            Carrinho
          </a>
        </div>
      </div>
      <ol class="offers-list">
        ${(account.selected || []).map((item) => renderOfferItem(item)).join("")}
      </ol>
    </section>
  `;
}

function renderActivationStatus(accountKey) {
  const activation = state.plan?.activations?.[accountKey];
  if (!activation) return "";
  
  if (activation.success) {
    const errorTooltip = activation.errors && activation.errors.length > 0
      ? `\\nFalhas:\\n${activation.errors.join('\\n')}`
      : "";
    return `
      <span class="activation-status success" title="Ativação na nuvem concluída com sucesso!${errorTooltip}" style="font-size: 11px; background: #e6f4ea; color: #137333; padding: 2px 6px; border-radius: 4px; font-weight: bold; border: 1px solid #137333; margin-left: 8px; display: inline-flex; align-items: center; gap: 4px;">
        Nuvem: Ativo ✔
      </span>
    `;
  } else {
    const isNotConfigured = activation.message && (activation.message.includes("não configurados") || activation.message.includes("Pendente"));
    const style = isNotConfigured 
      ? "background: #f1f3f4; color: #3c4043; border: 1px solid #9aa0a6;"
      : "background: #fce8e6; color: #c5221f; border: 1px solid #d93025;";
    return `
      <span class="activation-status warning" title="${escapeAttribute(activation.message)}" style="font-size: 11px; ${style} padding: 2px 6px; border-radius: 4px; font-weight: bold; margin-left: 8px; display: inline-flex; align-items: center; gap: 4px;">
        Nuvem: ${isNotConfigured ? "Pendente ⚠" : "Falhou ❌"}
      </span>
    `;
  }
}

function renderOfferItem(item) {
  return `
    <li>
      <div class="offer-thumb">
        ${
          item.image
            ? `<img src="${escapeAttribute(formatProductImage(item.image))}" alt="" loading="lazy" />`
            : ""
        }
      </div>
      <span>${item.slot}. ${escapeHtml(item.label)} <small>qtd. ${item.qty} | site ${formatPercent(item.currentDiscountPercent)}%</small></span>
      <strong>${currency.format(item.total)}<small>pot. ${currency.format(item.estimatedSavings || 0)}</small></strong>
    </li>
  `;
}

function renderResultItem(item) {
  const selected = item.selected;
  const article = document.createElement("article");
  article.className = "result-item";
  article.innerHTML = `
    <div class="product-image-frame">
      ${
        selected.image
          ? `<img class="product-image" src="${escapeAttribute(formatProductImage(selected.image))}" alt="" loading="lazy" />`
          : `<div class="product-image missing" aria-hidden="true"></div>`
      }
    </div>
    <div class="product-copy">
      <h3>${escapeHtml(selected.name)}</h3>
      <div class="product-meta">
        <span class="meta-chip">${escapeHtml(selected.brand || "Marca")}</span>
        <span class="meta-chip">${escapeHtml(selected.metricLabel)}</span>
        <span class="meta-chip">qtd. ${item.qty}</span>
        ${renderReferenceChip(selected)}
        ${renderSiteDiscountChip(selected)}
        ${renderSelectionChip(selected)}
      </div>
    </div>
    <div class="product-actions">
      <div>
        <div class="price">${currency.format(selected.total)}</div>
        <div class="unit-price">${escapeHtml(selected.unitPriceLabel)}</div>
        ${renderPriceDelta(selected)}
      </div>
      <a class="external-link" href="${escapeAttribute(selected.link)}" target="_blank" rel="noreferrer" title="Abrir produto" aria-label="Abrir produto">&#8599;</a>
    </div>
  `;

  if (item.alternatives?.length) {
    const alternatives = document.createElement("details");
    alternatives.className = "alternatives";
    alternatives.innerHTML = `
      <summary>Outras opcoes</summary>
      ${item.alternatives
        .map(
          (alternative) => `
            <div class="alternative-row">
              <span>${escapeHtml(alternative.name)}</span>
              <strong>${currency.format(alternative.total)}</strong>
            </div>
          `,
        )
        .join("")}
    `;
    article.append(alternatives);
  }

  return article;
}

function renderBuyPhase(plan) {
  const carts = buildTwoPurchaseCarts(plan);
  const selectedCount = plan.items.filter((item) => item.selected).length;
  const totalAfterOffers = carts.reduce((sum, cart) => sum + cart.totalAfterOffers, 0);

  elements.buySummary.textContent = `${selectedCount} itens cotados | total geral ${currency.format(totalAfterOffers)} apos Minhas Ofertas`;
  elements.buyAccounts.innerHTML = carts.map((cart) => renderBuyCard(cart)).join("");
}

function buildTwoPurchaseCarts(plan) {
  const accounts = plan.personalOffers?.accounts || [];
  const offerSkus = new Set((plan.personalOffers?.selected || []).map((item) => item.sku));
  const outsideItems = plan.items
    .filter((item) => item.selected && !offerSkus.has(item.selected.sku))
    .map((item) => ({
      label: item.label,
      sku: item.selected.sku,
      sellerId: item.selected.sellerId,
      qty: item.qty,
      total: Number(item.selected.total || 0),
      key: cartItemKey(item.selected.sku, item.label),
      logistics: classifyLogistics(item.label, item.selected.name),
      movable: true,
    }));
  const assignments = assignOutsideItems(outsideItems);

  return accounts.map((account) => {
    const accountOffers = (account.selected || []).map((item) => ({
      label: item.label,
      sku: item.sku,
      sellerId: item.sellerId,
      qty: item.qty,
      total: Number(item.total || 0),
      key: cartItemKey(item.sku, item.label),
      logistics: "offer",
      movable: false,
    }));
    const assignedOutside = assignments[account.key] || [];
    const allItems = [...accountOffers, ...assignedOutside];
    const subtotal = allItems.reduce((sum, item) => sum + item.total, 0);
    const savings = Number(account.estimatedSavings || 0);
    const logisticsSummary = summarizeLogistics(assignedOutside);

    return {
      title: `Conta ${account.label}`,
      detail: `${accountOffers.length} Minhas Ofertas + ${assignedOutside.length} restante | ${logisticsSummary}`,
      total: subtotal,
      totalAfterOffers: Math.max(0, subtotal - savings),
      savings,
      url: buildCartUrl(allItems),
      disabled: !allItems.length,
      accountKey: account.key,
      items: allItems,
    };
  });
}

function assignOutsideItems(items) {
  const assignments = { erico: [], dani: [] };
  const totals = { erico: 0, dani: 0 };
  const sorted = [...items].sort((a, b) => b.total - a.total);

  for (const item of sorted) {
    let accountKey = totals.erico <= totals.dani ? "erico" : "dani";

    if (state.buyCartOverrides.has(item.key)) {
      accountKey = state.buyCartOverrides.get(item.key);
    } else if (item.logistics === "heavy" || item.logistics === "cleaning") {
      accountKey = "erico";
    } else if (item.logistics === "perishable") {
      accountKey = "dani";
    }

    assignments[accountKey].push(item);
    totals[accountKey] += item.total;
  }

  return assignments;
}

function classifyLogistics(label, name) {
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

  if (cleaningWords.some((word) => text.includes(word))) return "cleaning";
  if (perishableWords.some((word) => text.includes(word))) return "perishable";
  if (heavyWords.some((word) => text.includes(word))) return "heavy";
  return "balanced";
}

function listSegments() {
  return [
    { key: "recent", label: "Adicionados recentemente" },
    { key: "perishable", label: "Pereciveis" },
    { key: "cleaning", label: "Limpeza" },
    { key: "heavy", label: "Pesados e bebidas" },
    { key: "balanced", label: "Despensa e geral" },
    { key: "removed", label: "Itens retirados" },
  ];
}

function listSegmentFor(label, name, key = "", removed = false) {
  if (removed) return "removed";
  if (String(key).startsWith("extra:")) return "recent";

  const logistics = classifyLogistics(label, name);
  if (logistics === "cleaning") return "cleaning";
  if (logistics === "heavy") return "heavy";
  if (logistics === "perishable") return "perishable";
  return "balanced";
}

function logisticsLabel(logistics) {
  if (logistics === "cleaning") return "limpeza";
  if (logistics === "heavy") return "pesado";
  if (logistics === "perishable") return "perecivel";
  return "geral";
}

function swapCartItem(itemKey, targetAccount) {
  if (!itemKey || !targetAccount || !state.plan) return;

  state.buyCartOverrides.set(itemKey, targetAccount);
  renderBuyPhase(state.plan);
}

function summarizeLogistics(items) {
  const counts = items.reduce((summary, item) => {
    summary[item.logistics] = (summary[item.logistics] || 0) + 1;
    return summary;
  }, {});
  const parts = [
    counts.cleaning ? `${counts.cleaning} limpeza` : "",
    counts.heavy ? `${counts.heavy} pesado` : "",
    counts.perishable ? `${counts.perishable} perecivel` : "",
    counts.balanced ? `${counts.balanced} geral` : "",
  ].filter(Boolean);

  return parts.length ? parts.join(", ") : "sem restante";
}

function renderBuyCard({
  title,
  detail,
  total,
  totalAfterOffers,
  savings,
  url,
  disabled,
  accountKey,
  items = [],
}) {
  const targetAccount = accountKey === "erico" ? "dani" : "erico";
  const targetLabel = accountKey === "erico" ? "Dani" : "Erico";

  return `
    <article class="buy-card">
      <div>
        <strong>${escapeHtml(title)}</strong>
        <span>${escapeHtml(detail)}</span>
      </div>
      <strong>${currency.format(Math.max(0, Number(totalAfterOffers ?? total ?? 0)))}</strong>
      <span class="buy-card-meta">${currency.format(Math.max(0, Number(total || 0)))} antes das ofertas | desc. ${currency.format(Number(savings || 0))}</span>
      <div class="buy-item-list">
        ${items.map((item) => renderBuyItem(item, targetAccount, targetLabel)).join("")}
      </div>
      <span class="buy-card-flow">Este botao presume que o Zona Sul ja esta na conta certa para ${escapeHtml(title.replace("Conta ", ""))}.</span>
      <a class="cart-link ${disabled ? "disabled" : ""}" href="${escapeAttribute(url || "#")}" target="_blank" rel="noreferrer">
        Montar carrinho - deslogue se precisar
      </a>
    </article>
  `;
}

function renderBuyItem(item, targetAccount, targetLabel) {
  return `
    <div class="buy-item-row">
      <span>${escapeHtml(item.label)} <small>qtd. ${item.qty}${item.movable ? ` | ${logisticsLabel(item.logistics)}` : " | Minhas Ofertas fixa"}</small></span>
      ${
        item.movable
          ? `<button class="mini-button" type="button" data-swap-cart-item="${escapeAttribute(item.key)}" data-target-account="${escapeAttribute(targetAccount)}">Mover para ${escapeHtml(targetLabel)}</button>`
          : ""
      }
    </div>
  `;
}

function renderError(message) {
  elements.cartSummary.textContent = "Falha na consulta";
  clearPurchaseSummary();
  clearPersonalOffers();
  clearComparisonInsights();
  elements.results.innerHTML = `
    <div class="warning-row">${escapeHtml(message)}</div>
  `;
}

function clearPersonalOffers() {
  elements.personalOffers.hidden = true;
  elements.personalOffers.innerHTML = "";
}

function renderReferenceChip(selected) {
  if (selected.referencePrice == null) return "";
  return `<span class="meta-chip">ref. ${currency.format(selected.referencePrice)}</span>`;
}

function renderSiteDiscountChip(selected) {
  if (selected.currentDiscountPercent == null) return "";
  const discount = Number(selected.currentDiscountPercent);
  const cutoff = Number(state.plan?.personalOffers?.cutoffPercent ?? 15);
  const className = discount >= cutoff ? "meta-chip warn" : "meta-chip";
  return `<span class="${className}">site ${formatPercent(discount)}%</span>`;
}

function renderSelectionChip(selected) {
  if (!selected.selectionLabel) return "";
  const className =
    selected.selectionSeverity === "warn" ? "meta-chip warn" : "meta-chip";
  return `<span class="${className}">${escapeHtml(selected.selectionLabel)}</span>`;
}

function renderPriceDelta(selected) {
  if (selected.priceDelta == null) return "";
  const className = selected.priceDelta <= 0 ? "price-delta good" : "price-delta bad";
  const label = selected.priceDeltaLabel || currency.format(selected.priceDelta);
  return `<div class="${className}">${escapeHtml(label)}</div>`;
}

function renderCollapsibleSection({ id, title, meta = "", body = "" }) {
  const collapsed = isSectionCollapsed(id);

  return `
    <section class="collapsible-section ${collapsed ? "is-collapsed" : ""}" data-section="${escapeAttribute(id)}">
      <button class="section-toggle" type="button" data-toggle-section="${escapeAttribute(id)}" aria-expanded="${String(!collapsed)}" title="${collapsed ? "Abrir" : "Fechar"}">
        <span>
          <strong>${escapeHtml(title)}</strong>
          ${meta ? `<small>${escapeHtml(meta)}</small>` : ""}
        </span>
        <i class="section-icon" aria-hidden="true"></i>
      </button>
      <div class="section-content" ${collapsed ? "hidden" : ""}>
        ${body}
      </div>
    </section>
  `;
}

function createCollapsibleSection({ id, title, meta = "", content }) {
  const collapsed = isSectionCollapsed(id);
  const section = document.createElement("section");
  section.className = `collapsible-section ${collapsed ? "is-collapsed" : ""}`.trim();
  section.dataset.section = id;
  section.innerHTML = `
    <button class="section-toggle" type="button" data-toggle-section="${escapeAttribute(id)}" aria-expanded="${String(!collapsed)}" title="${collapsed ? "Abrir" : "Fechar"}">
      <span>
        <strong>${escapeHtml(title)}</strong>
        ${meta ? `<small>${escapeHtml(meta)}</small>` : ""}
      </span>
      <i class="section-icon" aria-hidden="true"></i>
    </button>
  `;

  const body = document.createElement("div");
  body.className = "section-content";
  body.hidden = collapsed;
  body.append(content);
  section.append(body);

  return section;
}

function toggleSection(sectionId) {
  if (!sectionId) return;

  if (state.collapsedSections.has(sectionId)) {
    state.collapsedSections.delete(sectionId);
  } else {
    state.collapsedSections.add(sectionId);
  }

  for (const section of document.querySelectorAll("[data-section]")) {
    if (section.dataset.section === sectionId) {
      updateSectionState(section);
    }
  }
}

function updateSectionState(section) {
  const sectionId = section.dataset.section;
  const collapsed = isSectionCollapsed(sectionId);
  const button = section.querySelector("[data-toggle-section]");
  const content = Array.from(section.children).find((child) =>
    child.classList?.contains("section-content"),
  );

  section.classList.toggle("is-collapsed", collapsed);
  if (button) {
    button.setAttribute("aria-expanded", String(!collapsed));
    button.title = collapsed ? "Abrir" : "Fechar";
  }
  if (content) {
    content.hidden = collapsed;
  }
}

function isSectionCollapsed(sectionId) {
  return state.collapsedSections.has(sectionId);
}

function updateQty(id, value) {
  const item = state.items.find((candidate) => candidate.id === id);
  if (!item) return;
  item.qty = clampQty(value);
  markQuoteDirty();
  renderList();
}

function markQuoteDirty() {
  if (!state.plan) return;
  state.quoteDirty = true;
  state.plan = null;
  elements.cartSummary.textContent = "Checagem desatualizada";
  clearPurchaseSummary();
  clearPersonalOffers();
  clearComparisonInsights();
  elements.results.innerHTML = `
    <div class="empty-state">
      <strong>Checagem desatualizada</strong>
      <span>Avance de novo para a fase 02</span>
    </div>
  `;
  elements.buyAccounts.innerHTML = "";
  elements.goToBuyButton.disabled = true;
}

function buildCartUrl(items) {
  const pairs = [];

  for (const item of items) {
    pairs.push(["sku", item.sku]);
    pairs.push(["qty", String(item.qty)]);
    pairs.push(["seller", item.sellerId || "1"]);
  }

  pairs.push(["sc", "1"]);

  return `${CART_BASE}?${pairs
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
    .join("&")}`;
}

function cartItemKey(sku, label) {
  return `${sku || ""}:${normalized(label)}`;
}

function offerKey(sku, label) {
  return `${sku || ""}:${normalized(label)}`;
}

function clampPercent(value) {
  const number = Number(value);
  if (!Number.isFinite(number)) return 0;
  return Math.max(0, Math.min(100, number));
}

function clampQty(value) {
  const qty = Number.parseInt(value, 10);
  if (!Number.isFinite(qty)) return 0;
  return Math.max(0, Math.min(qty, 24));
}

function findCompareLabel(items, key) {
  return items.find((item) => item.key === key)?.compareLabel || "busca livre";
}

function formatPercent(value) {
  return Number(value).toFixed(1).replace(".", ",");
}

function formatProductImage(url) {
  return String(url || "").replace(/\/ids\/(\d+)\//, "/ids/$1-320-320/");
}

function normalized(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function setStatus(text, type) {
  elements.status.textContent = text;
  elements.status.className = `status-pill ${type || ""}`.trim();
}

function setAddProductStatus(text, type = "") {
  elements.addProductStatus.textContent = text;
  elements.addProductStatus.className = type;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function escapeAttribute(value) {
  return escapeHtml(value).replaceAll("`", "&#096;");
}

async function triggerCloudActivation(accountKey) {
  if (!state.plan || !state.plan.personalOffers) return;
  const accounts = state.plan.personalOffers.accounts || [];
  const account = accounts.find((acc) => acc.key === accountKey);
  if (!account || !account.selected || !account.selected.length) return;
  
  const skus = account.selected.map((item) => String(item.sku)).filter(Boolean);
  
  setStatus(`Ativando ${account.label}`, "busy");
  const button = document.querySelector(`[data-activate-cloud="${accountKey}"]`);
  if (button) {
    button.disabled = true;
    button.textContent = "Ativando...";
  }
  
  try {
    const response = await fetch("/api/activations/run", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ accountKey, skus })
    });
    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.error || "Erro na ativação");
    }
    
    if (!state.plan.activations) {
      state.plan.activations = {};
    }
    state.plan.activations[accountKey] = result;
    
    if (result.success) {
      setStatus("Ativado", "ready");
      alert(`${account.label}: ${result.message}`);
    } else {
      setStatus("Erro", "error");
      alert(`Falha ao ativar: ${result.message}`);
    }
    
    renderPersonalOffers(state.plan.personalOffers);
  } catch (error) {
    setStatus("Erro", "error");
    alert(`Erro na ativação: ${error.message}`);
  } finally {
    if (button) {
      button.disabled = false;
      button.textContent = "Ativar na Nuvem";
    }
  }
}

function extractSlug(urlStr) {
  try {
    const parsed = new URL(urlStr);
    const parts = parsed.pathname.split("/").filter(Boolean);
    const pIndex = parts.lastIndexOf("p");
    if (pIndex > 0) return parts[pIndex - 1];
    return parts[parts.length - 1] || "";
  } catch (e) {
    return "";
  }
}
