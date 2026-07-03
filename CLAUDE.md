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

## Pendências de deploy

1. Criar a planilha Google Sheets e rodar `configurarPlanilha()` uma vez pelo editor
   do Apps Script (cria as abas `Itens` e `Compras` com cabeçalho).
2. Definir a Script Property `SHEET_ID` com o ID da planilha.
3. Publicar o Web App (`executeAs: USER_DEPLOYING`, `access: ANYONE_ANONYMOUS`) — a
   aprovação de escopos OAuth (Sheets) precisa ser feita manualmente pelo navegador.
4. Colar a URL `/exec` do Web App no `src` do iframe em `index.html`.
5. Ativar GitHub Pages no repositório (`github.com/erfrizzera/autocompras`).
