import { createAppServer } from "../server.mjs";

const server = createAppServer();

await new Promise((resolve) => {
  server.listen(0, "127.0.0.1", resolve);
});

const { port } = server.address();
const baseUrl = `http://127.0.0.1:${port}`;

try {
  const home = await fetch(`${baseUrl}/`);
  assert(home.ok, `Home HTTP ${home.status}`);
  const html = await home.text();
  assert(html.includes("Auto Compras"), "Home sem titulo esperado");

  const plan = await fetch(`${baseUrl}/api/plan`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      items: [
        { key: "rice", qty: 1 },
        { key: "nespresso", qty: 1 },
        { key: "orangeJuice", qty: 1 },
        { label: "feijao preto", query: "feijao preto", qty: 1 },
      ],
    }),
  });

  assert(plan.ok, `Plan HTTP ${plan.status}`);

  const data = await plan.json();
  assert(data.items.length === 4, "Plano deveria ter 4 itens");
  assert(data.items.every((item) => item.selected), "Plano sem todos os itens");
  assert(data.cartUrl.includes("/checkout/cart/add"), "Link de carrinho invalido");
  assert(data.personalOffers.limit === 20, "Limite total de Minhas Ofertas invalido");
  assert(
    data.personalOffers.perAccountLimit === 10,
    "Limite por login de Minhas Ofertas invalido",
  );
  assert(
    data.personalOffers.accounts.length === 2,
    "Minhas Ofertas deveria ter dois logins",
  );
  assert(
    data.personalOffers.selected.length <= 20,
    "Minhas Ofertas passou de 20 itens",
  );
  assert(
    data.personalOffers.accounts.every((account) => account.selected.length <= 10),
    "Um login passou de 10 itens em Minhas Ofertas",
  );
  assert(
    data.personalOffers.cutoffPercent === 15,
    "Corte de Minhas Ofertas deveria ser 15%",
  );
  assert(
    data.personalOffers.selected.every(
      (item) => item.currentDiscountPercent < data.personalOffers.cutoffPercent,
    ),
    "Minhas Ofertas incluiu item com desconto vigente >= corte configurado",
  );
  assert(
    data.personalOffers.selected.every((item) => item.qty > 0 && item.total >= item.price),
    "Minhas Ofertas nao considerou quantidade/subtotal",
  );

  console.log("Webapp OK");
  console.log(`Subtotal: R$ ${data.subtotal.toFixed(2).replace(".", ",")}`);
  console.log(data.cartUrl);
} finally {
  await new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}
