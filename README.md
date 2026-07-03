# Auto Compras

Lista de compras recorrente com cotação de preço no Zona Sul e dois carrinhos
(Erico e Dani). Reconstruído do zero na arquitetura Flufa V1 — veja as decisões em
[`CLAUDE.md`](CLAUDE.md).

## Arquitetura

```
coletor (o próprio clique do usuário) → armazém (Google Sheets) → tela (GitHub Pages)
```

- **Armazém**: uma planilha Google Sheets com duas abas — `Itens` (lista recorrente) e
  `Compras` (histórico de cada compra concluída pelo app).
- **Motor**: Google Apps Script (`apps-script/Codigo.gs`), servido como Web App. Lê e
  escreve no Sheets, e consulta o catálogo público do Zona Sul só quando você clica em
  "Checar preços" — sem monitoramento agendado.
- **Tela**: `index.html` na raiz é uma moldura no GitHub Pages com um iframe apontando
  pro Web App.

## Deploy

Planilha, projeto Apps Script, código e deploy do Web App já foram criados via
`clasp` (script vinculado à planilha — não precisa de Script Property `SHEET_ID`).
O app já está no ar. Um passo opcional pendente:

- Rode `preencherImagens()` uma vez pelo menu de funções do editor, pra buscar
  foto/link/sku dos itens que vieram da base histórica (não têm foto até rodar isso).

Links e detalhes em [`CLAUDE.md`](CLAUDE.md). O Web App já responde e a
moldura em `index.html` (colada com a URL `/exec`) funciona.

Para reenviar código depois de editar `apps-script/`:
```powershell
cd apps-script
npx @google/clasp push
npx @google/clasp deploy
```
Falta ativar o GitHub Pages no repositório (Settings → Pages → branch `main`, pasta
raiz) — o código já está enviado (`git push` feito). Depois disso o endereço do
GitHub Pages já mostra o app funcionando dentro da moldura.

## Usar o app

O fluxo tem três fases:

1. **Lista de compras** — mostra os itens ativos agrupados por segmento, com um
   contador de quantidade (começa em 0). Zerar um item só o deixa fora da compra
   atual. O botão `x` marca o item como retirado (sem apagar — fica visível no fim da
   lista, e pode ser reativado). O campo de link adiciona um produto novo à lista,
   com preço de referência = preço atual no Zona Sul.
2. **Checagem de preço** — consulta o catálogo do Zona Sul só para os itens com
   quantidade maior que 0. Mostra o produto escolhido, preço, e se ele é elegível
   para "Minhas Ofertas" (desconto atual no site abaixo de 15%).
3. **Comprar** — monta dois carrinhos (Erico e Dani), cada um com até 10 itens de
   Minhas Ofertas mais uma parte do restante da compra, equilibrando o total entre as
   duas contas. O botão abre o carrinho direto no Zona Sul (presume que o navegador já
   está logado na conta certa). Depois de finalizar a compra no site, use "Registrar
   compra desta conta" para gravar os preços pagos — isso atualiza o preço de
   referência de cada item e adiciona uma linha no histórico da aba `Compras`.

## Limitações conhecidas

- A cotação de preço depende do catálogo público do Zona Sul (VTEX) responder no
  formato atual; mudanças na API do site podem quebrar a busca.
- "Registrar compra" grava o preço da última cotação, não o preço real do checkout —
  se o preço mudar entre a cotação e a finalização da compra no site, edite a
  planilha manualmente para corrigir.
- Apps Script tem cota de 6 minutos por execução; com listas muito grandes (dezenas de
  itens diferentes), a checagem de preço pode ficar lenta.
