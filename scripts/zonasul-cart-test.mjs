import { defaultItems, formatMoney, planCart } from "../src/zonasulCatalog.mjs";

const plan = await planCart(defaultItems());

console.log("Teste de carrinho - Zona Sul");
console.log("");

for (const item of plan.items) {
  if (!item.selected) {
    console.log(`${item.label}: ${item.error}`);
    console.log("");
    continue;
  }

  console.log(`${item.label}:`);
  console.log(`  Produto: ${item.selected.name}`);
  console.log(`  Marca: ${item.selected.brand}`);
  console.log(`  SKU: ${item.selected.sku}`);
  console.log(`  Quantidade: ${item.qty}`);
  console.log(`  Preco: R$ ${formatMoney(item.selected.price)}`);
  console.log(`  Tamanho: ${item.selected.metricLabel}`);
  console.log(`  Comparativo: ${item.selected.unitPriceLabel}`);
  console.log(`  Link: ${item.selected.link}`);
  console.log("");
}

console.log(`Subtotal estimado: R$ ${formatMoney(plan.subtotal)}`);
console.log("");
console.log("Minhas Ofertas:");
console.log(
  `${plan.personalOffers.selectedCount}/${plan.personalOffers.limit} slots, economia potencial R$ ${formatMoney(plan.personalOffers.estimatedSavings)}`,
);
for (const account of plan.personalOffers.accounts) {
  console.log(
    `  ${account.label}: ${account.selectedCount}/${account.limit} itens, subtotal R$ ${formatMoney(account.subtotal)}, potencial R$ ${formatMoney(account.estimatedSavings)}`,
  );
  console.log(`  ${account.cartUrl}`);
}
console.log("");
console.log("Link para adicionar ao carrinho:");
console.log(plan.cartUrl);
console.log("");
console.log("Abra o link logado no Zona Sul e revise tudo antes de comprar.");
