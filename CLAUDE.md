# CLAUDE.md — Auto Compras

Projeto reconstruído do zero na arquitetura Flufa V1, pragmática — Opção 2 (moldura),
o mesmo padrão usado no Controle de Despachante.

## Decisões desta versão

- **Armazém**: Google Sheets. Aba `Itens` (lista recorrente unificada — histórico,
  adicionados por link e retirados, controlados pelo campo `Status`) e aba `Compras`
  (histórico de dados: cada compra concluída pelo app vira uma linha ali). Substitui
  os `data/*.json` locais do sistema anterior.
- **Motor único**: Apps Script (`doGet`/`doPost` via `google.script.run`). Serve a
  interface, lê/escreve no Sheets, e consulta o catálogo público do Zona Sul
  (`UrlFetchApp`, evita CORS) **só quando o usuário clica em "Checar preços"** — sem
  coletor agendado, sem cron.
- **Tela**: GitHub Pages hospeda uma moldura (`index.html` com iframe em tela cheia)
  apontando pro Web App do Apps Script. Exceção consciente à regra "tela nunca via
  `doGet`" — motivo: intervenção mínima, um motor só, sem deploy duplo.
- **Preço de referência dinâmico**: ao registrar uma compra concluída, o app atualiza
  `PrecoReferencia` e `QuantidadeTipica` do item em `Itens` e grava a linha em
  `Compras`. O preço de referência fica cada vez mais preciso com o uso real do app,
  em vez de depender de um histórico de pedidos importado uma única vez.
- **Sem GitHub Actions, sem coletor agendado, sem dashboard externo** — decisão
  explícita: preço só é checado no momento do uso, não em monitoramento contínuo.
- **Sem comparação com Pão de Açúcar ou qualquer scraper de concorrente** — removido
  do escopo desta versão.
- **Base de preços do projeto anterior (Antigravity) reaproveitada como dado, não como
  código**: os 61 itens recorrentes de `savedShoppingItems` (`src/zonasulCatalog.mjs`
  do sistema antigo) foram extraídos, classificados por segmento e viraram
  `apps-script/BaseHistorica.gs` — uma lista para importar na aba `Itens` uma única vez
  (`importarBaseHistorica()`), evitando começar a lista recorrente do zero.
- **Frontend no estilo visual do Claude** — tokens de cor/tipografia/espaçamento
  inspirados no Claude Design System (superfícies planas, bordas de 0.5px, cantos de
  8–12px, cor de destaque coral/clay, sentence case, ícones Tabler outline).
- **Versão mora só no `version.json` na raiz do repo**; o selo (canto inferior da
  moldura) falha em silêncio.
- Nenhum arquivo do sistema anterior (Node/Express local) foi reaproveitado como base
  de código — tudo em `apps-script/` e nos arquivos da raiz é novo.

## Estrutura

- `index.html` — moldura GitHub Pages (iframe).
- `version.json` — versão única do app.
- `apps-script/appsscript.json` — manifesto do Web App.
- `apps-script/Codigo.gs` — motor: Sheets, catálogo Zona Sul, ranqueamento, carrinhos,
  Minhas Ofertas, histórico de compras.
- `apps-script/App.html` — interface (3 fases: lista, checagem, comprar).
- `apps-script/BaseHistorica.gs` — base de preços trazida do projeto anterior (61
  itens), com a função `importarBaseHistorica()`.

## Deploy — o que já foi feito automaticamente (via clasp)

- Planilha + projeto Apps Script criados juntos (script vinculado à planilha, usa
  `SpreadsheetApp.getActiveSpreadsheet()` — sem precisar de Script Property `SHEET_ID`).
  Planilha: https://drive.google.com/open?id=1GB221vrAqHqVj9ILfxPrRXfOxw3zAcEvDXYmFsFHgAc
  Script: https://script.google.com/d/1igaCYdmDzNONJ-9wZxyQV5LyHbqXbVLXXStuEQmd9Rhc1QWBctx1Alvt/edit
- Código (`Codigo.gs`, `App.html`, `appsscript.json`) enviado via `clasp push`.
- Deploy do Web App criado via `clasp deploy` (`executeAs: USER_DEPLOYING`,
  `access: ANYONE_ANONYMOUS`). URL `/exec` já colada em `index.html`.
- Remote git trocado para `origin` → `github.com/erfrizzera/autocompras`, branch
  `main` já commitada e enviada (`git push`).

## Deploy — status

1. ~~Rodar `configurarPlanilha` pelo editor~~ — feito.
2. ~~Confirmar acesso "Qualquer pessoa" no deploy~~ — feito.
3. ~~Ativar GitHub Pages~~ — feito, no ar em https://erfrizzera.github.io/autocompras/.
4. ~~Rodar `importarBaseHistorica`~~ — feito, os 61 itens estão na aba `Itens`.
   (Se quiser incluir o vinho Malbec adicionado à base, rode de novo — é idempotente.)
5. ~~Rodar `preencherImagens`~~ — agora tem o botão **"Buscar fotos"** na própria tela
   (fase 1). O web app roda com os escopos autorizados, então dá pra rodar direto da
   UI — não precisa mais do editor. Grava as fotos no Sheets (permanente).

## Bugs encontrados e corrigidos (2026-07-03)

Os dois bugs relatados depois do primeiro deploy tinham a **mesma causa raiz**:
`google.script.run` trava o callback no cliente, sem lançar nenhum erro, quando o
valor de retorno do servidor contém um objeto `Date` puro do JavaScript (em vez de
string). Já apareceu duas vezes:

- **Lista presa em "Carregando..."**: `obterEstadoInicial` devolvia
  `dataUltimaCompra` como `Date` (o Sheets converte texto tipo "2025-12-28" em data de
  verdade). Corrigido convertendo pra string (`formatarData_`) antes de devolver.
- **Botão "Adicionar" travado em "Adicionando..."**: `adicionarItemPorLink` devolvia o
  objeto inteiro do item novo, incluindo `DataCriacao` (um `new Date()`). Corrigido
  devolvendo só os campos que o cliente usa (`key`, `nome`, `precoReferencia`).

**Regra geral daqui pra frente**: nenhuma função chamável do cliente
(`google.script.run`) pode devolver um `Date` bruto no retorno — sempre formatar como
string primeiro. Também foi adicionado um `window.onerror` no `App.html` que mostra
qualquer erro de JavaScript futuro na tela, em vez de travar em silêncio.
