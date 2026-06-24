export const CATALOG_BASE =
  "https://www.zonasul.com.br/api/catalog_system/pub/products/search/";
export const CART_BASE = "https://www.zonasul.com.br/checkout/cart/add";
export const LOGIN_URL = "https://www.zonasul.com.br/login";
export const ACCOUNT_URL = "https://www.zonasul.com.br/account";
export const PERSONAL_OFFERS_PER_ACCOUNT_LIMIT = 10;
export const PERSONAL_OFFERS_ACCOUNTS = [
  { key: "erico", label: "Erico" },
  { key: "dani", label: "Dani" },
];
export const PERSONAL_OFFERS_LIMIT =
  PERSONAL_OFFERS_PER_ACCOUNT_LIMIT * PERSONAL_OFFERS_ACCOUNTS.length;
export const PERSONAL_OFFERS_DISCOUNT_CUTOFF_PERCENT = 15;

export const targets = [
  {
    key: "rice",
    label: "Arroz branco",
    shortLabel: "Arroz",
    defaultQty: 1,
    unitKind: "kg",
    compareLabel: "por kg",
    queries: ["arroz branco", "arroz tipo 1"],
    match: (product) => {
      const name = normalized(product.productName);
      return (
        hasCategory(product, "/arroz/") &&
        name.includes("arroz branco") &&
        !name.includes("tempero") &&
        !name.includes("farinha")
      );
    },
    metric: (product) => {
      const kg = parseKg(product.productName);
      return kg ? { value: kg, label: `${formatNumber(kg)} kg`, type: "kg" } : null;
    },
  },
  {
    key: "nespresso",
    label: "Cafe compativel Nespresso",
    shortLabel: "Nespresso",
    defaultQty: 1,
    unitKind: "capsule",
    compareLabel: "por capsula",
    queries: ["nespresso", "capsulas cafe nespresso"],
    match: (product) => {
      const name = normalized(product.productName);
      const specs = normalized(JSON.stringify(product));
      return (
        hasCategory(product, "/cafe/") &&
        (name.includes("nespresso") || specs.includes("nespresso"))
      );
    },
    metric: (product) => {
      const count = parseCount(product.productName);
      return count
        ? { value: count, label: `${count} capsulas`, type: "count" }
        : null;
    },
  },
  {
    key: "orangeJuice",
    label: "Suco de laranja",
    shortLabel: "Suco",
    defaultQty: 1,
    unitKind: "liter",
    compareLabel: "por litro",
    queries: ["suco laranja integral", "suco laranja"],
    match: (product) => {
      const name = normalized(product.productName);
      return (
        name.includes("suco") &&
        name.includes("laranja") &&
        name.includes("integral") &&
        !["cenoura", "maca", "mamao", "acerola", "gengibre", "beterraba"].some((word) =>
          name.includes(word),
        )
      );
    },
    metric: (product) => {
      const liters = parseLiters(product.productName);
      return liters ? { value: liters, label: `${formatNumber(liters)} L`, type: "liter" } : null;
    },
  },
];

export const savedShoppingItems = [
  { label: "Peito de Peru Defumado Sadia 100g", query: "Peito de Peru Defumado Sadia 100g", referencePrice: 6.79, qty: 6, orderCount: 9, lastPurchasedAt: "2025-12-28" },
  { label: "Néctar Del Valle Uva 1L", query: "Néctar Misto Sem Adição de Açúcar Del Valle Uva Tetra Pak 1 L", referencePrice: 7.9, qty: 4, orderCount: 8, lastPurchasedAt: "2025-12-28" },
  { label: "Iogurte Morango Garrafa 1,25kg", query: "Iogurte morango garrafa 1,25kg", referencePrice: 17.42, qty: 2, orderCount: 8, lastPurchasedAt: "2025-11-24" },
  { label: "Coxinha da Asa Korin 600g", query: "Coxinha da Asa Korin 600g", referencePrice: 20.39, qty: 4, orderCount: 7, lastPurchasedAt: "2025-08-12" },
  { label: "Café Pilão Descafeinado 250g", query: "Café Torrado e Moído Pilão Descafeinado 250g", referencePrice: 33, qty: 2, orderCount: 7, lastPurchasedAt: "2025-11-28" },
  { label: "Salgadinho Fandangos Queijo 35g", query: "Salgadinho de Milho Fandangos Queijo 35g", referencePrice: 4.59, qty: 5, orderCount: 7, lastPurchasedAt: "2025-09-30" },
  { label: "Pão Francês Panetto 60g", query: "Pão Francês Panetto 60g", referencePrice: 5.75, qty: 2, orderCount: 7, lastPurchasedAt: "2025-12-28" },
  { label: "Papel Higiênico Neve Folha Dupla c/12un", query: "Papel Higiênico Neve Folha Dupla Toque de Seda com 12 Unidades", referencePrice: 16.91, qty: 4, orderCount: 6, lastPurchasedAt: "2025-12-28" },
  { label: "Néctar Del Valle Pêssego 1L", query: "Néctar Sem Adição de Açúcar Del Valle Pêssego Tetra Pak 1 L", referencePrice: 7.9, qty: 3, orderCount: 6, lastPurchasedAt: "2025-12-28" },
  { label: "Iogurte Integral Nestlé Natural 170g", query: "Iogurte Integral Nestlé Natural Copo 170g", referencePrice: 3.79, qty: 6, orderCount: 6, lastPurchasedAt: "2025-12-28" },
  { label: "Queijo Minas Padrão 500g", query: "Queijo Minas Padrão 500g", referencePrice: 39.95, qty: 2, orderCount: 6, lastPurchasedAt: "2025-12-28" },
  { label: "Cápsulas de Café Me Bebe 50g", query: "Cápsulas de Café Me Bebe 50g", referencePrice: 26.98, qty: 2, orderCount: 6, lastPurchasedAt: "2025-11-28" },
  { label: "Esponja Multiuso Leve 4 Pague 3", query: "Esponja Multiuso Leve 4 Pague 3", referencePrice: 5.49, qty: 4, orderCount: 5, lastPurchasedAt: "2025-11-28" },
  { label: "Bananinha Tachão de Ubatuba 200g", query: "Bananinha Coberta com Chocolate Tachão de Ubatuba 200g", referencePrice: 24.63, qty: 4, orderCount: 5, lastPurchasedAt: "2025-12-28" },
  { label: "Coca-Cola Garrafa 200ml", query: "Refrigerante Coca Cola Garrafa 200ml", referencePrice: 1.69, qty: 12, orderCount: 5, lastPurchasedAt: "2025-12-28" },
  { label: "Feijão Vermelho 500g", query: "Feijão Vermelho 500g", referencePrice: 8.49, qty: 3, orderCount: 5, lastPurchasedAt: "2025-09-01" },
  { label: "Biscoito Piraquê Roladinho Goiabinha 75g", query: "Biscoito Piraquê Roladinho Recheado de Goiabinha 75g", referencePrice: 2.99, qty: 4, orderCount: 5, lastPurchasedAt: "2025-08-25" },
  { label: "Grana Padano Gran Mestri 140g", query: "Queijo Tipo Grana Padano Triângulo Gran Mestri 140g", referencePrice: 30.79, qty: 2, orderCount: 5, lastPurchasedAt: "2025-09-30" },
  { label: "Sorvete Gelad Coco 1,5L", query: "Sorvete Gelad Coco 1,5L", referencePrice: 25.9, qty: 1, orderCount: 5, lastPurchasedAt: "2025-06-08" },
  { label: "Pão de Queijo Forno de Minas Tradicional 400g", query: "Pão De Queijo Forno De Minas Tradicional 400g", referencePrice: 17.84, qty: 3, orderCount: 4, lastPurchasedAt: "2025-12-28" },
  { label: "Pão de Queijo Forno de Minas Coquetel 400g", query: "Pão De Queijo Forno De Minas Coquetel 400g", referencePrice: 17.84, qty: 3, orderCount: 4, lastPurchasedAt: "2025-04-11" },
  { label: "Cereal Froot Loops Kellogg's 230g", query: "Cereal Matinal Kellogg's Froot Loops 230g", referencePrice: 20.82, qty: 3, orderCount: 4, lastPurchasedAt: "2025-09-01" },
  { label: "Biscoito Polvilho Globo 30g", query: "Biscoito Polvilho Salgado Globo 30g", referencePrice: 5.09, qty: 5, orderCount: 4, lastPurchasedAt: "2025-08-02" },
  { label: "Arroz Branco Tio João 1kg", query: "Arroz Branco Tio João 1kg", referencePrice: 5.75, qty: 5, orderCount: 4, lastPurchasedAt: "2025-11-28" },
  { label: "Cebolitos Elma Chips 91g", query: "Salgadinho Cebolitos Elma Chips 91g", referencePrice: 10.19, qty: 3, orderCount: 4, lastPurchasedAt: "2025-06-27" },
  { label: "Guaraná Antarctica Zero 200ml", query: "Refrigerante Guaraná Antarctica Zero 200ml", referencePrice: 1.44, qty: 12, orderCount: 4, lastPurchasedAt: "2025-08-12" },
  { label: "Sabão em Pó Surf 1,6kg", query: "Sabão em Pó Surf Rosas e Flor de Lis 1,6kg", referencePrice: 12.74, qty: 6, orderCount: 4, lastPurchasedAt: "2025-11-28" },
  { label: "Amaciante Amacitel 2L", query: "Amaciante Para Roupas Amacitel 2L", referencePrice: 9.49, qty: 6, orderCount: 4, lastPurchasedAt: "2025-11-28" },
  { label: "Manteiga com Sal 200g", query: "Manteiga com Sal Tablete 200g", referencePrice: 14.99, qty: 4, orderCount: 4, lastPurchasedAt: "2025-12-28" },
  { label: "Biscoito Mentirinha Refil 130g", query: "Biscoito Mentirinha Refil 130g", referencePrice: 14.9, qty: 2, orderCount: 4, lastPurchasedAt: "2025-08-25" },
  { label: "Saco de Lixo Bye Bye 50L", query: "Saco de Lixo Bye Bye 50L", referencePrice: 11.99, qty: 3, orderCount: 4, lastPurchasedAt: "2025-11-28" },
  { label: "Açaí com Guaraná Juçaí 2L", query: "Açaí Com Guaraná Orgânico Juçaí Pote 2 L", referencePrice: 54.39, qty: 1, orderCount: 3, lastPurchasedAt: "2025-12-09" },
  { label: "Café Pilão Tradicional 500g", query: "Café Torrado e Moído Pilão Tradicional 500g", referencePrice: 32.98, qty: 2, orderCount: 3, lastPurchasedAt: "2025-11-28" },
  { label: "Filtro Melitta 102 c/30un", query: "Filtro De Papel Melitta Original 102 Com 30 Unidades", referencePrice: 4.99, qty: 2, orderCount: 3, lastPurchasedAt: "2025-07-13" },
  { label: "Água Sanitária Brilux 2L", query: "Água Sanitária Brilux 2 L", referencePrice: 5.98, qty: 6, orderCount: 3, lastPurchasedAt: "2025-09-01" },
  { label: "Maionese Hellmann's 500g", query: "Maionese Hellmann 500g", referencePrice: 16.99, qty: 1, orderCount: 3, lastPurchasedAt: "2025-11-28" },
  { label: "Tapioca Da Terrinha 500g", query: "Tapioca Da Terrinha 500g", referencePrice: 8.03, qty: 3, orderCount: 3, lastPurchasedAt: "2025-11-28" },
  { label: "Aromatizador Ubon Citronela 140ml", query: "Aromatizador De Ambiente Concentrado Ubon Citronela Com Eucalipto 140ml", referencePrice: 13.16, qty: 2, orderCount: 3, lastPurchasedAt: "2025-11-28" },
  { label: "Batata Palha Yoki Extra Fina 100g", query: "Batata Palha Yoki Extra Fina 100g", referencePrice: 7.99, qty: 3, orderCount: 3, lastPurchasedAt: "2025-09-01" },
  { label: "Açúcar União 1kg", query: "Açúcar Refinado União Pacote 1kg", referencePrice: 7.49, qty: 2, orderCount: 3, lastPurchasedAt: "2025-09-01" },
  { label: "Creme de Leite Nestlé 200g", query: "Creme De Leite Nestlé Tetra Pak 200g", referencePrice: 4.75, qty: 5, orderCount: 2, lastPurchasedAt: "2025-07-13" },
  { label: "Detergente Limpol Neutro 500ml", query: "Detergente Para Louças Biodegradável Limpol Neutro 500ml", referencePrice: 2.12, qty: 12, orderCount: 2, lastPurchasedAt: "2025-11-28" },
  { label: "Lava Louças Tabletes Limpol 315g", query: "Lava Louças em Tabletes para Máquina Limpol 315g", referencePrice: 33.99, qty: 4, orderCount: 2, lastPurchasedAt: "2025-11-28" },
  { label: "Azeite Extravirgem 500ml", query: "Azeite Extravirgem 500ml", referencePrice: 34.99, qty: 5, orderCount: 3, lastPurchasedAt: "2025-09-01" },
  { label: "Saco de Lixo Bye Bye 30L", query: "Saco para Lixo Bye Bye 30L com 30 Unidades", referencePrice: 11.99, qty: 3, orderCount: 3, lastPurchasedAt: "2025-11-28" },
  { label: "Saco de Lixo Bye Bye 100L", query: "Saco de Lixo Bye Bye Premium 100L", referencePrice: 14.99, qty: 2, orderCount: 2, lastPurchasedAt: "2025-06-27" },
  { label: "Papel Toalha 2 Rolos", query: "Papel Toalha 2 Rolos", referencePrice: 6.99, qty: 3, orderCount: 3, lastPurchasedAt: "2025-11-28" },
  { label: "Guardanapo Scott Grand Hotel 50un", query: "Guardanapo Scott Grand Hotel 50 Unidades", referencePrice: 8.98, qty: 3, orderCount: 4, lastPurchasedAt: "2025-12-28" },
  { label: "Uva Verde Sem Semente 500g", query: "Uva Verde Sem Semente 500g", referencePrice: 9.99, qty: 2, orderCount: 2, lastPurchasedAt: "2025-12-28" },
  { label: "Batata Frita Ruffles Original 68g", query: "Batata Frita Ruffles Original 68g", referencePrice: 7.49, qty: 2, orderCount: 2, lastPurchasedAt: "2025-12-28" },
  { label: "Cheetos Onda Requeijão 160g", query: "Salgadinho Cheetos Onda Requeijão 160g", referencePrice: 12.99, qty: 2, orderCount: 3, lastPurchasedAt: "2025-08-02" },
  { label: "Choco Biscuit Bauducco 80g", query: "Choco Biscuit Bauducco Chocolate Ao Leite Pacote 80g", referencePrice: 6.99, qty: 3, orderCount: 4, lastPurchasedAt: "2025-06-27" },
  { label: "Sobrecoxa de Frango Korin 600g", query: "Sobrecoxa De Frango Congelada Korin Bandeja 600g", referencePrice: 17.99, qty: 3, orderCount: 3, lastPurchasedAt: "2025-12-28" },
  { label: "Filé de Peito de Frango Korin 700g", query: "Filé de Peito de Frango Korin 700g", referencePrice: 42.49, qty: 4, orderCount: 3, lastPurchasedAt: "2025-08-12" },
  { label: "Biscoito Piraquê Queijinho 100g", query: "Biscoito Piraquê Queijinho Pacote 100g", referencePrice: 2.87, qty: 2, orderCount: 2, lastPurchasedAt: "2025-12-28" },
  { label: "Sal de Parrilla 500g", query: "Sal de Parrilla Bombay Herbs Spices 500g", referencePrice: 16.57, qty: 1, orderCount: 2, lastPurchasedAt: "2025-09-30" },
  { label: "Álcool Montenegro 46% 1L", query: "Álcool Montenegro 46% 1 L", referencePrice: 8.35, qty: 7, orderCount: 2, lastPurchasedAt: "2025-09-30" },
  { label: "Tira Manchas Vanish Oxi Action 400g", query: "Tira Manchas Vanish Oxi Action 400g", referencePrice: 10.9, qty: 2, orderCount: 2, lastPurchasedAt: "2025-06-27" },
  { label: "Bala Sweet Jelly 200g", query: "Bala De Alga Marinha Sweet Jelly Pacote 200g", referencePrice: 22.87, qty: 2, orderCount: 4, lastPurchasedAt: "2025-04-29" },
  { label: "Matte Leão Limão 1,5L", query: "Matte Leão Limão Pet 1,5L", referencePrice: 7.79, qty: 2, orderCount: 2, lastPurchasedAt: "2025-05-13" },
  { label: "H2Oh! Limoneto 1,5L", query: "Refrigerante H2Oh Limoneto 1,5L", referencePrice: 5.94, qty: 3, orderCount: 2, lastPurchasedAt: "2025-03-27" },
];

export function targetSummaries() {
  return targets.map(({ key, label, shortLabel, defaultQty, compareLabel }) => ({
    key,
    label,
    shortLabel,
    defaultQty,
    compareLabel,
  }));
}

export async function planCart(requestedItems = defaultItems()) {
  const requested = normalizeRequestedItems(requestedItems);
  const entries = [];

  for (const requestedItem of requested) {
    const target = getTargetForRequestedItem(requestedItem);
    let candidates = [];

    try {
      candidates = await suggestProducts(target);
    } catch (error) {
      entries.push({
        key: target.key,
        label: target.label,
        qty: requestedItem.qty,
        referencePrice: requestedItem.referencePrice,
        selected: null,
        alternatives: [],
        error: error.message || "Falha consultando o produto.",
      });
      continue;
    }

    if (!candidates.length) {
      entries.push({
        key: target.key,
        label: target.label,
        qty: requestedItem.qty,
        referencePrice: requestedItem.referencePrice,
        selected: null,
        alternatives: [],
        error: "Nao encontrei candidato disponivel.",
      });
      continue;
    }

    const [selected, ...alternatives] = candidates;

    entries.push({
      key: target.key,
      label: target.label,
      qty: requestedItem.qty,
      referencePrice: requestedItem.referencePrice,
      selected: serializeCandidate(
        selected,
        requestedItem.qty,
        target,
        requestedItem.referencePrice,
      ),
      alternatives: alternatives.slice(0, 4).map((candidate) =>
        serializeCandidate(
          candidate,
          requestedItem.qty,
          target,
          requestedItem.referencePrice,
        ),
      ),
    });
  }

  const selectedEntries = entries.filter((entry) => entry.selected);
  const subtotal = selectedEntries.reduce(
    (sum, entry) => sum + entry.selected.total,
    0,
  );
  const personalOffers = selectPersonalOffers(selectedEntries);

  return {
    items: entries,
    subtotal,
    personalOffers,
    cartUrl: buildCartUrl(
      selectedEntries.map((entry) => ({
        sku: entry.selected.sku,
        sellerId: entry.selected.sellerId,
        qty: entry.qty,
      })),
    ),
    generatedAt: new Date().toISOString(),
  };
}

export async function suggestProducts(target, limit = 12) {
  const products = await fetchProductsFor(target.queries);

  return products
    .map((product) => toCandidate(product))
    .filter(Boolean)
    .filter((candidate) => target.match(candidate.product))
    .map((candidate) => ({
      ...candidate,
      metric: target.metric(candidate.product),
    }))
    .filter((candidate) => candidate.metric?.value > 0)
    .map((candidate) => ({
      ...candidate,
      selection: rankCandidate(target, candidate),
    }))
    .sort(
      (a, b) =>
        a.selection.rank - b.selection.rank ||
        score(a) - score(b) ||
        a.price - b.price,
    )
    .slice(0, limit);
}

export async function fetchProductsFor(queries) {
  const byId = new Map();

  for (const query of queries) {
    const products = await fetchProductsForQuery(query);
    await sleep(150);

    for (const product of products) {
      byId.set(product.productId, product);
    }
  }

  return [...byId.values()];
}

export async function resolveProductFromUrl(productUrl) {
  const parsed = parseZonaSulProductUrl(productUrl);
  const slug = productSlugFromUrl(parsed);
  const searchText = sanitizeSearchQuery(slug.replace(/-/g, " "));

  if (!searchText) {
    const error = new Error("Link de produto invalido.");
    error.statusCode = 400;
    throw error;
  }

  const products = await fetchProductsFor([searchText]);
  const candidates = products.map((product) => toCandidate(product)).filter(Boolean);
  const selected =
    candidates.find((candidate) => sameProductUrl(candidate.link, parsed.href)) ||
    candidates.find((candidate) => normalized(candidate.link).includes(normalized(slug))) ||
    candidates[0];

  if (!selected) {
    const error = new Error("Nao encontrei este produto no catalogo do Zona Sul.");
    error.statusCode = 404;
    throw error;
  }

  return {
    key: `extra:${selected.sku || slugify(selected.name) || slug}`,
    label: cleanLabel(selected.name || searchText),
    query: cleanLabel(selected.name || searchText),
    referencePrice: selected.price,
    qty: 1,
    image: selected.image,
    productName: selected.name,
    productLink: selected.link || parsed.href,
    sku: selected.sku,
    sellerId: selected.sellerId,
    addedFromUrl: parsed.href,
    addedAt: new Date().toISOString(),
  };
}

async function fetchProductsForQuery(query) {
  const attempts = unique([query, sanitizeSearchQuery(query)]).filter(Boolean);
  let lastStatus = 0;

  for (const attempt of attempts) {
    const pathUrl = `${CATALOG_BASE}${encodePathSegment(attempt)}?_from=0&_to=49`;
    const pathResponse = await fetchCatalog(pathUrl);
    lastStatus = pathResponse.status;

    if (pathResponse.ok || pathResponse.status === 206) {
      return pathResponse.json();
    }

    const searchUrl = `${CATALOG_BASE}?ft=${encodePathSegment(attempt)}&_from=0&_to=49`;
    const searchResponse = await fetchCatalog(searchUrl);
    lastStatus = searchResponse.status;

    if (searchResponse.ok || searchResponse.status === 206) {
      return searchResponse.json();
    }
  }

  throw new Error(`Falha consultando "${query}": HTTP ${lastStatus}`);
}

function parseZonaSulProductUrl(productUrl) {
  let parsed;

  try {
    parsed = new URL(String(productUrl || "").trim());
  } catch {
    const error = new Error("Cole um link valido do Zona Sul.");
    error.statusCode = 400;
    throw error;
  }

  if (!parsed.hostname.toLowerCase().endsWith("zonasul.com.br")) {
    const error = new Error("Use um link de produto do Zona Sul.");
    error.statusCode = 400;
    throw error;
  }

  return parsed;
}

function productSlugFromUrl(parsed) {
  const parts = parsed.pathname
    .split("/")
    .map((part) => decodeURIComponent(part.trim()))
    .filter(Boolean);
  const productMarkerIndex = parts.lastIndexOf("p");

  if (productMarkerIndex > 0) {
    return parts[productMarkerIndex - 1];
  }

  return parts.at(-1) || "";
}

function sameProductUrl(left, right) {
  if (!left || !right) return false;

  try {
    const leftUrl = new URL(left);
    const rightUrl = new URL(right);
    return normalized(leftUrl.pathname) === normalized(rightUrl.pathname);
  } catch {
    return normalized(left) === normalized(right);
  }
}

async function fetchCatalog(url) {
  let response = null;

  for (let attempt = 0; attempt < 2; attempt += 1) {
    response = await fetch(url, {
      headers: {
        accept: "application/json",
        "user-agent": "Mozilla/5.0",
      },
    });

    if (response.status !== 429) {
      return response;
    }

    await sleep(1000);
  }

  return response;
}

export function buildCartUrl(items) {
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

export function defaultItems() {
  return savedShoppingItems.map((item, index) => ({
    key: `saved:${index}`,
    label: item.label,
    query: item.query,
    referencePrice: item.referencePrice,
    qty: clampQty(item.qty ?? 1),
  }));
}

export function formatMoney(value) {
  return Number(value).toFixed(2).replace(".", ",");
}

function formatPercent(value) {
  return Number(value).toFixed(1).replace(".", ",");
}

function formatSignedMoney(value) {
  if (Number(value) === 0) return "R$ 0,00";
  const sign = value > 0 ? "+" : "-";
  return `${sign}R$ ${formatMoney(Math.abs(value))}`;
}

function normalizeRequestedItems(requestedItems) {
  return requestedItems
    .map((item, index) => {
      const key = String(item.key || "");
      const label = cleanLabel(item.label || item.query || "");
      const query = cleanLabel(item.query || item.label || "");
      const knownTarget = targets.find((target) => target.key === key);

      if (knownTarget) {
        return {
          key,
          label: knownTarget.label,
          qty: clampQty(item.qty),
          referencePrice: parsePrice(item.referencePrice),
        };
      }

      if (!query) return null;

      return {
        key: `custom:${slugify(query) || index}`,
        label: label || query,
        query,
        qty: clampQty(item.qty),
        referencePrice: parsePrice(item.referencePrice),
      };
    })
    .filter(Boolean);
}

function clampQty(value) {
  const qty = Number.parseInt(value, 10);
  if (!Number.isFinite(qty)) return 1;
  return Math.max(1, Math.min(qty, 24));
}

function getTargetForRequestedItem(item) {
  const target = targets.find((candidate) => candidate.key === item.key);

  if (target) {
    return target;
  }

  return createFreeTextTarget(item);
}

function createFreeTextTarget(item) {
  const query = cleanLabel(item.query || item.label);
  const queryTokens = criticalTokens(query);
  const desiredMetric = inferMetric(query);

  return {
    key: item.key,
    label: cleanLabel(item.label || query),
    shortLabel: cleanLabel(item.label || query),
    defaultQty: item.qty,
    compareLabel: "comparavel",
    queries: [query],
    desiredMetric,
    referencePrice: item.referencePrice,
    matchTokens: queryTokens,
    match: (product) => {
      const name = normalized(product.productName);
      if (!queryTokens.length) return true;
      return queryTokens.every((token) => name.includes(token));
    },
    metric: (product) => inferMetric(product.productName),
  };
}

function serializeCandidate(candidate, qty, target, referencePrice = null) {
  const unitPrice = score(candidate);
  const parsedReferencePrice = parsePrice(referencePrice);
  const currentDiscountPercent = currentSiteDiscount(candidate);
  const personalOfferDiscountGapPercent = Math.max(
    0,
    PERSONAL_OFFERS_DISCOUNT_CUTOFF_PERCENT - currentDiscountPercent,
  );
  const personalOfferEligible =
    currentDiscountPercent < PERSONAL_OFFERS_DISCOUNT_CUTOFF_PERCENT;
  const personalOfferPotentialSavings = personalOfferEligible
    ? roundMoney(candidate.price * qty * (personalOfferDiscountGapPercent / 100))
    : 0;
  const referenceMetric = parsedReferencePrice == null ? null : inferMetric(target.label);
  const canCompareUnit =
    referenceMetric && referenceMetric.type === candidate.metric.type && referenceMetric.value > 0;
  const referenceUnitPrice = canCompareUnit
    ? parsedReferencePrice / referenceMetric.value
    : null;
  const priceDelta =
    parsedReferencePrice == null
      ? null
      : canCompareUnit
        ? unitPrice - referenceUnitPrice
        : candidate.price - parsedReferencePrice;

  return {
    name: candidate.name,
    brand: candidate.brand,
    sku: candidate.sku,
    sellerId: candidate.sellerId,
    price: candidate.price,
    listPrice: candidate.listPrice,
    total: candidate.price * qty,
    referencePrice: parsedReferencePrice,
    priceDelta,
    priceDeltaLabel:
      priceDelta == null
        ? null
        : canCompareUnit
          ? `${formatSignedMoney(priceDelta)} ${candidate.metric.compareLabel}`
          : formatSignedMoney(priceDelta),
    selectionLabel: candidate.selection?.label || null,
    selectionSeverity: candidate.selection?.severity || "ok",
    currentDiscountPercent,
    currentDiscountLabel: `${formatPercent(currentDiscountPercent)}% no site`,
    personalOfferEligible,
    personalOfferDiscountGapPercent,
    personalOfferPotentialSavings,
    personalOfferReason:
      personalOfferEligible
        ? `desconto atual abaixo de ${formatNumber(PERSONAL_OFFERS_DISCOUNT_CUTOFF_PERCENT)}%; prioridade considera preco x quantidade`
        : `site ja da desconto de ${formatNumber(PERSONAL_OFFERS_DISCOUNT_CUTOFF_PERCENT)}% ou mais`,
    metricLabel: candidate.metric.label,
    unitPrice,
    unitPriceLabel: candidate.metric.compareLabel
      ? `R$ ${formatMoney(unitPrice)} ${candidate.metric.compareLabel}`
      : `R$ ${formatMoney(unitPrice)} ${target.compareLabel}`,
    link: candidate.link,
    image: candidate.image,
    available: candidate.available,
  };
}

function score(candidate) {
  return candidate.price / (candidate.metric?.value || 1);
}

function selectPersonalOffers(entries) {
  const eligible = entries.filter((entry) => entry.selected.personalOfferEligible);
  const ineligible = entries.filter((entry) => !entry.selected.personalOfferEligible);
  const selected = [...eligible]
    .sort(
      (a, b) =>
        b.selected.personalOfferPotentialSavings -
          a.selected.personalOfferPotentialSavings ||
        b.selected.total - a.selected.total ||
        b.selected.price - a.selected.price ||
        a.selected.currentDiscountPercent - b.selected.currentDiscountPercent,
    )
    .slice(0, PERSONAL_OFFERS_LIMIT);
  const accounts = splitPersonalOffersByAccount(selected);

  return {
    limit: PERSONAL_OFFERS_LIMIT,
    perAccountLimit: PERSONAL_OFFERS_PER_ACCOUNT_LIMIT,
    accountCount: PERSONAL_OFFERS_ACCOUNTS.length,
    cutoffPercent: PERSONAL_OFFERS_DISCOUNT_CUTOFF_PERCENT,
    eligibleCount: eligible.length,
    selectedCount: selected.length,
    estimatedSavings: roundMoney(
      selected.reduce(
        (sum, entry) => sum + entry.selected.personalOfferPotentialSavings,
        0,
      ),
    ),
    selected: selected.map((entry, index) =>
      serializePersonalOffer(entry, { rank: index + 1 }),
    ),
    accounts,
    ineligible: ineligible.map((entry) => serializePersonalOffer(entry)),
  };
}

function splitPersonalOffersByAccount(selected) {
  return PERSONAL_OFFERS_ACCOUNTS.map((account, accountIndex) => {
    const start = accountIndex * PERSONAL_OFFERS_PER_ACCOUNT_LIMIT;
    const entries = selected.slice(start, start + PERSONAL_OFFERS_PER_ACCOUNT_LIMIT);
    const subtotal = entries.reduce((sum, entry) => sum + entry.selected.total, 0);
    const estimatedSavings = entries.reduce(
      (sum, entry) => sum + entry.selected.personalOfferPotentialSavings,
      0,
    );

    return {
      key: account.key,
      label: account.label,
      limit: PERSONAL_OFFERS_PER_ACCOUNT_LIMIT,
      selectedCount: entries.length,
      subtotal: roundMoney(subtotal),
      estimatedSavings: roundMoney(estimatedSavings),
      cartUrl: buildCartUrl(
        entries.map((entry) => ({
          sku: entry.selected.sku,
          sellerId: entry.selected.sellerId,
          qty: entry.qty,
        })),
      ),
      selected: entries.map((entry, index) =>
        serializePersonalOffer(entry, {
          accountKey: account.key,
          accountLabel: account.label,
          slot: index + 1,
          rank: start + index + 1,
        }),
      ),
    };
  });
}

function serializePersonalOffer(entry, assignment = {}) {
  return {
    label: entry.label,
    name: entry.selected.name,
    sku: entry.selected.sku,
    sellerId: entry.selected.sellerId,
    qty: entry.qty,
    price: entry.selected.price,
    total: entry.selected.total,
    listPrice: entry.selected.listPrice,
    currentDiscountPercent: entry.selected.currentDiscountPercent,
    currentDiscountLabel: entry.selected.currentDiscountLabel,
    discountGapPercent: entry.selected.personalOfferDiscountGapPercent,
    estimatedSavings: entry.selected.personalOfferPotentialSavings,
    reason: entry.selected.personalOfferReason,
    link: entry.selected.link,
    image: entry.selected.image,
    ...assignment,
  };
}

function rankCandidate(target, candidate) {
  const desiredMetric = target.desiredMetric || null;
  const size = compareMetricSize(desiredMetric, candidate.metric);
  const referencePrice = parsePrice(target.referencePrice);
  const referenceUnitPrice =
    referencePrice != null && size.canCompare
      ? referencePrice / desiredMetric.value
      : null;
  const unitPrice = score(candidate);
  const referenceDistance =
    referenceUnitPrice == null ? 0 : unitPrice / referenceUnitPrice - 1;
  const priceComponent =
    referenceUnitPrice == null
      ? unitPrice / 100
      : Math.max(-25, Math.min(40, referenceDistance * 25));

  return {
    rank: size.distance * 100 + priceComponent,
    label: size.label,
    severity: size.severity,
    sizeDistance: size.distance,
    referenceDistance,
  };
}

function compareMetricSize(desiredMetric, candidateMetric) {
  if (!desiredMetric?.value || !candidateMetric?.value) {
    return {
      canCompare: false,
      distance: 0,
      label: "melhor preco",
      severity: "ok",
    };
  }

  if (desiredMetric.type !== candidateMetric.type) {
    return {
      canCompare: false,
      distance: 2,
      label: "embalagem diferente",
      severity: "warn",
    };
  }

  const ratio = candidateMetric.value / desiredMetric.value;
  const distance = Math.abs(Math.log(ratio));

  if (distance <= 0.08) {
    return {
      canCompare: true,
      distance,
      label: "tamanho exato",
      severity: "ok",
    };
  }

  if (ratio > 1) {
    return {
      canCompare: true,
      distance,
      label: ratio >= 1.75 ? "embalagem maior" : "um pouco maior",
      severity: ratio >= 1.75 ? "warn" : "ok",
    };
  }

  return {
    canCompare: true,
    distance,
    label: ratio <= 0.6 ? "embalagem menor" : "um pouco menor",
    severity: ratio <= 0.6 ? "warn" : "ok",
  };
}

function toCandidate(product) {
  for (const item of product.items || []) {
    for (const seller of item.sellers || []) {
      const offer = seller.commertialOffer || {};
      const offerPrice = Number(offer.Price || 0);
      const offerListPrice = Number(offer.ListPrice || offerPrice);
      const price = normalizeOfferPrice(offerPrice, item);
      const listPrice = normalizeOfferPrice(offerListPrice || offerPrice, item);

      if (price > 0 && Number(offer.AvailableQuantity || 0) > 0) {
        return {
          product,
          item,
          seller,
          name: product.productName,
          brand: product.brand,
          sku: item.itemId,
          sellerId: seller.sellerId || "1",
          price,
          listPrice: listPrice > 0 ? listPrice : price,
          offerPrice,
          offerListPrice,
          link: product.link,
          image: item.images?.[0]?.imageUrl || null,
          available: offer.AvailableQuantity,
        };
      }
    }
  }

  return null;
}

function normalizeOfferPrice(offerPrice, item) {
  const multiplier = Number(item.unitMultiplier || 1);
  const unit = String(item.measurementUnit || "").toLowerCase();

  if (unit === "kg" && multiplier > 0) {
    return roundMoney(offerPrice * multiplier);
  }

  return offerPrice;
}

function roundMoney(value) {
  return Math.round(Number(value) * 100) / 100;
}

function currentSiteDiscount(candidate) {
  if (!candidate.listPrice || candidate.listPrice <= candidate.price) return 0;
  return ((candidate.listPrice - candidate.price) / candidate.listPrice) * 100;
}

function hasCategory(product, needle) {
  const haystack = normalized((product.categories || []).join(" "));
  return haystack.includes(normalized(needle));
}

function parseKg(text) {
  const value = normalized(text).replace(",", ".");
  const kg = value.match(/(\d+(?:\.\d+)?)\s*kg\b/);
  if (kg) return Number(kg[1]);

  const grams = value.match(/(\d+(?:\.\d+)?)\s*g\b/);
  return grams ? Number(grams[1]) / 1000 : null;
}

function parseLiters(text) {
  const value = normalized(text).replace(",", ".");
  const liters = value.match(/(\d+(?:\.\d+)?)\s*l\b/);
  if (liters) return Number(liters[1]);

  const ml = value.match(/(\d+(?:\.\d+)?)\s*ml\b/);
  return ml ? Number(ml[1]) / 1000 : null;
}

function parseCount(text) {
  const value = normalized(text);
  const count = value.match(/(\d+)\s*(?:unidades|unidade|un|capsulas|capsula)\b/);
  return count ? Number(count[1]) : null;
}

function parsePrice(value) {
  if (value == null || value === "") return null;
  const parsed = Number(String(value).replace(",", "."));
  return Number.isFinite(parsed) ? parsed : null;
}

function encodePathSegment(value) {
  return encodeURIComponent(value).replace(/[!'()*]/g, (character) =>
    `%${character.charCodeAt(0).toString(16).toUpperCase()}`,
  );
}

function sanitizeSearchQuery(value) {
  return String(value || "")
    .replace(/[^\p{L}\p{N}\s.,]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function unique(values) {
  return [...new Set(values)];
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function inferMetric(text) {
  const kg = parseKg(text);
  if (kg) {
    return {
      value: kg,
      label: `${formatNumber(kg)} kg`,
      compareLabel: "por kg",
      type: "kg",
    };
  }

  const liters = parseLiters(text);
  if (liters) {
    return {
      value: liters,
      label: `${formatNumber(liters)} L`,
      compareLabel: "por litro",
      type: "liter",
    };
  }

  const count = parseCount(text);
  if (count) {
    return {
      value: count,
      label: `${count} unidades`,
      compareLabel: "por unidade",
      type: "count",
    };
  }

  return { value: 1, label: "1 un", compareLabel: "por unidade", type: "count" };
}

function cleanLabel(value) {
  return String(value || "")
    .replace(/\s+/g, " ")
    .replace(/^[-*•\d.)\s]+/, "")
    .trim();
}

function meaningfulTokens(value) {
  const stopwords = new Set([
    "de",
    "da",
    "do",
    "das",
    "dos",
    "e",
    "ou",
    "com",
    "para",
    "um",
    "uma",
    "kg",
    "g",
    "l",
    "ml",
    "un",
  ]);

  return normalized(value)
    .split(/[^a-z0-9]+/)
    .filter((token) => token.length >= 3 && !stopwords.has(token));
}

function criticalTokens(value) {
  return meaningfulTokens(value).filter((token) => {
    if (/^\d+(?:[,.]\d+)?(?:kg|g|l|ml|un)?$/.test(token)) return false;
    if (/^\d+(?:kg|g|l|ml|un)$/.test(token)) return false;
    return true;
  });
}

function slugify(value) {
  return meaningfulTokens(value).join("-").slice(0, 48);
}

function normalized(text) {
  return String(text || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function formatNumber(value) {
  return Number(value).toString().replace(".", ",");
}
