# Auto Compras

Sistema local para manter uma lista recorrente de compras, cotar precos atuais no Zona Sul e montar carrinhos separados para as contas Erico e Dani.

## Rodar o webapp

Opcao mais simples: execute `start-auto-compras.cmd`. Ele inicia o servidor local e abre o navegador automaticamente em:

```text
http://localhost:5188
```

Ou rode manualmente:

```powershell
$env:PORT='5188'; & 'C:\Users\EricodosReisFrizzera\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe' .\server.mjs
```

Use o botao `Entrar no Zona Sul` para abrir o login oficial do mercado no navegador. O app nao pede nem armazena senha; os botoes de carrinho presumem que o navegador ja esta logado na conta certa.

## Testes

Teste do webapp:

```powershell
& 'C:\Users\EricodosReisFrizzera\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe' .\scripts\check-webapp.mjs
```

Teste de cotacao/carrinho pelo terminal:

```powershell
& 'C:\Users\EricodosReisFrizzera\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe' .\scripts\zonasul-cart-test.mjs
```

Coleta de precos para o monitoramento:

```powershell
& 'C:\Users\EricodosReisFrizzera\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe' .\scripts\monitor-zonasul-prices.mjs
```

## Fluxo do app

O app trabalha em tres fases.

1. `Lista de compras`: mostra a lista historica recorrente por segmento, com fotos e links para abrir o produto no Zona Sul quando disponiveis. Todos os itens comecam em quantidade 0. Zerar um item apenas deixa ele fora da compra atual.
2. `Checagem de preco`: consulta o Zona Sul apenas para itens com quantidade maior que 0 e que nao estejam retirados. Mostra resumo economico, Minhas Ofertas, alertas contra historico, promocoes fora dos slots e insights de troca entre alternativas.
3. `Comprar`: monta dois carrinhos, um para Erico e outro para Dani. Cada carrinho junta as Minhas Ofertas daquela conta com uma parte do restante da compra. O botao abre o carrinho direto e presume que o navegador ja esta logado na conta correta.

## Lista de compras

A lista da fase 1 e organizada em segmentos recolhidos por padrao:

- `Adicionados recentemente`: produtos incluidos manualmente por link do Zona Sul.
- `Pereciveis`
- `Limpeza`
- `Pesados e bebidas`
- `Despensa e geral`
- `Itens retirados`: produtos removidos da lista padrao, mantidos visiveis no fim da lista para auditoria.

## Composicao da base historica

A lista exibida na fase 1 nao e apenas a lista original importada do historico. Ela e a combinacao de tres camadas:

- `Historico original`: produtos recorrentes importados dos pedidos de 2025. Eles entram nos segmentos automaticos: pereciveis, limpeza, pesados/bebidas ou despensa/geral.
- `Produtos incluidos por link`: produtos adicionados manualmente pelo campo de link do Zona Sul. Eles ficam no segmento especifico `Adicionados recentemente`, para nao se misturarem automaticamente aos segmentos do historico.
- `Produtos retirados`: produtos que vieram do historico original ou foram adicionados por link, mas depois foram retirados pelo botao `x`. Eles continuam visiveis no segmento `Itens retirados`, no fim da lista, travados com quantidade 0.

Na cotacao, entram apenas itens ativos com quantidade maior que 0. Produtos em `Itens retirados` nunca entram em cotacao, Minhas Ofertas ou carrinho.

O campo `Adicionar produto por link do Zona Sul` salva um produto novo na base historica local com quantidade inicial 0. Esses itens ficam em `data/extra-historical-items.json`.

O botao `x` nao apaga mais o produto da tela. Depois da confirmacao, o item vai para `Itens retirados`, fica travado como `Retirado`, com quantidade 0, e nao entra em cotacao nem em carrinho. A lista de retirados fica salva em `data/removed-historical-items.json`.

## Itens indisponiveis

Na cotacao, o app so considera produtos com estoque disponivel no retorno do catalogo do Zona Sul.

Se nenhum candidato disponivel for encontrado para um item:

- ele aparece como aviso na fase 2
- nao entra no subtotal
- nao entra em Minhas Ofertas
- nao vai para os carrinhos da fase 3
- nao e trocado automaticamente por outro produto

## Importar pedidos de 2025 do Zona Sul

1. Rode `start-auto-compras.cmd` para deixar o app local aberto em `http://localhost:5188`.
2. Abra `https://www.zonasul.com.br/account#/orders` no navegador em que voce ja esta logado.
3. Abra o console do navegador nessa pagina e execute:

```js
const s = document.createElement("script");
s.src = "http://localhost:5188/zonasul-orders-extractor.js";
document.head.append(s);
```

O navegador baixa `zonasul-pedidos-2025.json` com pedidos, itens e produtos agregados.
Depois importe o arquivo para a lista recorrente:

```powershell
& 'C:\Users\EricodosReisFrizzera\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe' .\scripts\import-zonasul-orders.mjs .\zonasul-pedidos-2025.json
```

Use `--min-orders=2` para manter apenas produtos que apareceram em pelo menos dois pedidos, ou `--limit=80` para limitar a lista.

## Lista inicial

A lista inicial vem do historico de pedidos do Zona Sul em 2025. Ela guarda produtos recorrentes com:

- preco de referencia do historico
- quantidade tipica comprada
- frequencia de aparicao em pedidos
- data da ultima compra usada como referencia

Quando voce clica em `Checar precos`, o app consulta o catalogo publico do Zona Sul, escolhe produtos disponiveis por preco comparavel, calcula Minhas Ofertas e gera os carrinhos. Revise tudo no Zona Sul antes de concluir qualquer compra.

## Logica de selecao

Ao montar a cotacao, o app prioriza:

- termos centrais do produto, como marca e tipo
- tamanho de embalagem parecido com o item pedido
- preco comparavel por kg, litro ou unidade
- preco atual em relacao ao preco de referencia

Quando a embalagem nao bate bem, o resultado aparece marcado como `embalagem maior`, `embalagem menor` ou `embalagem diferente`.

## Minhas Ofertas

O app calcula os itens recomendados para Minhas Ofertas assim:

- usa `Price` como preco atual
- usa `ListPrice` como preco regular/riscado
- calcula desconto vigente: `(ListPrice - Price) / ListPrice * 100`
- considera elegivel apenas quando o desconto vigente e menor que 15%
- tira dos slots qualquer item que ja esteja com promocao do Zona Sul de 15% ou mais
- calcula prioridade por economia potencial: `preco atual * quantidade * (15 - desconto vigente) / 100`
- considera dois logins do Zona Sul, Erico e Dani, com 10 slots em cada um
- escolhe no maximo 20 itens elegiveis e divide em duas compras de ate 10 itens

Itens ja com desconto de 15% ou mais no site ficam fora dos slots de Minhas Ofertas, porque o ganho incremental esperado nao compensa ocupar um slot.

## Comprar

Na fase 3, existem dois carrinhos:

- `Conta Erico`: Minhas Ofertas do Erico + parte do restante da compra
- `Conta Dani`: Minhas Ofertas da Dani + parte do restante da compra

O restante da compra e dividido por logistica: pesados/limpeza tendem a ir para Erico, pereciveis tendem a ir para Dani, e o restante ajuda a equilibrar totais. Os itens que nao sao Minhas Ofertas podem ser movidos manualmente entre os carrinhos.

O botao de carrinho abre direto o link do Zona Sul. Antes de clicar, confira se o navegador esta logado na conta certa ou deslogue/troque de conta quando necessario.

## Monitoramento de melhor dia e hora

O projeto inclui um coletor para monitorar os precos do Zona Sul ao longo do tempo:

```powershell
npm run monitor:prices
```

O coletor:

- le os links dos produtos da lista historica, incluindo produtos adicionados por link
- ignora itens retirados
- consulta o catalogo publico do Zona Sul, sem login
- grava observacoes em `data/price-monitor/observations.jsonl`
- atualiza o resumo em `data/price-monitor/summary.json`
- calcula agregados por dia da semana, horario e dia+horario

A recomendacao de melhor dia/hora so deve ser considerada quando houver amostra minima:

- pelo menos 14 dias de dados
- pelo menos 5 observacoes por dia da semana
- pelo menos 10 observacoes por faixa de horario
- coletas com erro em mais de 20% dos itens devem ser ignoradas

Para rodar fora deste PC, ha um workflow do GitHub Actions chamado `velho sábado do mercado`, definido em `.github/workflows/zona-sul-price-monitor.yml`. Ele roda todos os dias, em UTC equivalente aos horarios de Sao Paulo:

- 02:30
- 04:30
- 06:30
- 09:30
- 12:30
- 15:30
- 18:30
- 22:30

O workflow executa `node scripts/monitor-zonasul-prices.mjs`, commita os arquivos de historico e resumo no repositorio e publica o dashboard externo no GitHub Pages.

## Dashboard externo

O dashboard fica em `dashboard/` e e publicado pelo proprio workflow `velho sábado do mercado`. A cada coleta ele:

- atualiza `data/price-monitor/observations.jsonl`
- atualiza `data/price-monitor/summary.json`
- empacota o dashboard estatico com os dados mais recentes
- publica tudo no GitHub Pages

O dashboard mostra:

- total da cesta na ultima coleta
- variacao contra a coleta anterior
- evolucao grafica do total da cesta
- top movimentos de preco
- top 5 itens mais caros contra o historico
- melhores janelas de compra observadas ate agora
- itens indisponiveis ou com erro
- tabela dos ultimos precos coletados por produto

## Pendencias conhecidas

- ajustar automaticamente o carrinho seguindo sugestoes dos insights
- lidar melhor com erro humano de terminar uma compra e continuar logado na conta errada
- permitir editar manualmente nome, foto e preco de referencia de itens adicionados por link
