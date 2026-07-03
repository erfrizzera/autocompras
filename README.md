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

## Como fazer o deploy

Pré-requisito: [`clasp`](https://github.com/google/clasp) instalado e autenticado
(`clasp login`) com a conta Google dona da planilha.

1. **Criar a planilha**: crie um Google Sheets novo (vazio) e copie o ID dele (na URL,
   entre `/d/` e `/edit`).
2. **Criar o projeto Apps Script**:
   ```powershell
   cd apps-script
   clasp create --type webapp --title "Auto Compras"
   clasp push
   ```
3. **Configurar a Script Property `SHEET_ID`**: abra o projeto no editor
   (`clasp open`) → ⚙️ Configurações do projeto → Propriedades do script → adicione
   `SHEET_ID` com o ID da planilha.
4. **Rodar `configurarPlanilha()`** uma vez pelo editor do Apps Script (menu de
   funções → selecionar `configurarPlanilha` → executar). Isso cria as abas `Itens` e
   `Compras` com o cabeçalho certo. Na primeira execução, autorize os escopos pedidos
   (acesso ao Sheets).
5. **Publicar o Web App**: no editor, Implantar → Nova implantação → tipo "App da
   Web", executar como "Eu", acesso "Qualquer pessoa". Copie a URL `.../exec`.
   O `clasp` não consegue configurar o acesso "Qualquer pessoa" sozinho — isso precisa
   ser feito manualmente no painel.
6. **Colar a URL no `index.html`**: troque `COLE_AQUI_A_URL_DO_WEB_APP_EXEC` pela URL
   `.../exec` copiada no passo anterior.
7. **Publicar o GitHub Pages**: `git push` pro repositório
   [`erfrizzera/autocompras`](https://github.com/erfrizzera/autocompras) e ative o
   Pages nas configurações do repo (branch `main`, pasta raiz).

Depois disso o endereço do GitHub Pages já mostra o app funcionando dentro da moldura.

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
