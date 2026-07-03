// Base de preços trazida do projeto anterior (feito no Antigravity) — 61 itens
// recorrentes com preço de referência e quantidade típica dos pedidos de 2025.
// Importe uma vez rodando importarBaseHistorica() pelo editor do Apps Script.

const BASE_HISTORICA = [
  {
    "Key": "hist:peito-de-peru-defumado-sadia-100g",
    "Nome": "Peito de Peru Defumado Sadia 100g",
    "TermoBusca": "Peito de Peru Defumado Sadia 100g",
    "Segmento": "Pereciveis",
    "PrecoReferencia": 6.79,
    "QuantidadeTipica": 6,
    "DataUltimaCompra": "2025-12-28",
    "Status": "ativo",
    "Origem": "historico"
  },
  {
    "Key": "hist:nectar-del-valle-uva-1l",
    "Nome": "Néctar Del Valle Uva 1L",
    "TermoBusca": "Néctar Misto Sem Adição de Açúcar Del Valle Uva Tetra Pak 1 L",
    "Segmento": "Pesados e bebidas",
    "PrecoReferencia": 7.9,
    "QuantidadeTipica": 4,
    "DataUltimaCompra": "2025-12-28",
    "Status": "ativo",
    "Origem": "historico"
  },
  {
    "Key": "hist:iogurte-morango-garrafa-1-25kg",
    "Nome": "Iogurte Morango Garrafa 1,25kg",
    "TermoBusca": "Iogurte morango garrafa 1,25kg",
    "Segmento": "Pereciveis",
    "PrecoReferencia": 17.42,
    "QuantidadeTipica": 2,
    "DataUltimaCompra": "2025-11-24",
    "Status": "ativo",
    "Origem": "historico"
  },
  {
    "Key": "hist:coxinha-da-asa-korin-600g",
    "Nome": "Coxinha da Asa Korin 600g",
    "TermoBusca": "Coxinha da Asa Korin 600g",
    "Segmento": "Pereciveis",
    "PrecoReferencia": 20.39,
    "QuantidadeTipica": 4,
    "DataUltimaCompra": "2025-08-12",
    "Status": "ativo",
    "Origem": "historico"
  },
  {
    "Key": "hist:cafe-pilao-descafeinado-250g",
    "Nome": "Café Pilão Descafeinado 250g",
    "TermoBusca": "Café Torrado e Moído Pilão Descafeinado 250g",
    "Segmento": "Pesados e bebidas",
    "PrecoReferencia": 33,
    "QuantidadeTipica": 2,
    "DataUltimaCompra": "2025-11-28",
    "Status": "ativo",
    "Origem": "historico"
  },
  {
    "Key": "hist:salgadinho-fandangos-queijo-35g",
    "Nome": "Salgadinho Fandangos Queijo 35g",
    "TermoBusca": "Salgadinho de Milho Fandangos Queijo 35g",
    "Segmento": "Pereciveis",
    "PrecoReferencia": 4.59,
    "QuantidadeTipica": 5,
    "DataUltimaCompra": "2025-09-30",
    "Status": "ativo",
    "Origem": "historico"
  },
  {
    "Key": "hist:pao-frances-panetto-60g",
    "Nome": "Pão Francês Panetto 60g",
    "TermoBusca": "Pão Francês Panetto 60g",
    "Segmento": "Pereciveis",
    "PrecoReferencia": 5.75,
    "QuantidadeTipica": 2,
    "DataUltimaCompra": "2025-12-28",
    "Status": "ativo",
    "Origem": "historico"
  },
  {
    "Key": "hist:papel-higienico-neve-folha-dupla-c-12un",
    "Nome": "Papel Higiênico Neve Folha Dupla c/12un",
    "TermoBusca": "Papel Higiênico Neve Folha Dupla Toque de Seda com 12 Unidades",
    "Segmento": "Limpeza",
    "PrecoReferencia": 16.91,
    "QuantidadeTipica": 4,
    "DataUltimaCompra": "2025-12-28",
    "Status": "ativo",
    "Origem": "historico"
  },
  {
    "Key": "hist:nectar-del-valle-pessego-1l",
    "Nome": "Néctar Del Valle Pêssego 1L",
    "TermoBusca": "Néctar Sem Adição de Açúcar Del Valle Pêssego Tetra Pak 1 L",
    "Segmento": "Pesados e bebidas",
    "PrecoReferencia": 7.9,
    "QuantidadeTipica": 3,
    "DataUltimaCompra": "2025-12-28",
    "Status": "ativo",
    "Origem": "historico"
  },
  {
    "Key": "hist:iogurte-integral-nestle-natural-170g",
    "Nome": "Iogurte Integral Nestlé Natural 170g",
    "TermoBusca": "Iogurte Integral Nestlé Natural Copo 170g",
    "Segmento": "Pereciveis",
    "PrecoReferencia": 3.79,
    "QuantidadeTipica": 6,
    "DataUltimaCompra": "2025-12-28",
    "Status": "ativo",
    "Origem": "historico"
  },
  {
    "Key": "hist:queijo-minas-padrao-500g",
    "Nome": "Queijo Minas Padrão 500g",
    "TermoBusca": "Queijo Minas Padrão 500g",
    "Segmento": "Pereciveis",
    "PrecoReferencia": 39.95,
    "QuantidadeTipica": 2,
    "DataUltimaCompra": "2025-12-28",
    "Status": "ativo",
    "Origem": "historico"
  },
  {
    "Key": "hist:capsulas-de-cafe-me-bebe-50g",
    "Nome": "Cápsulas de Café Me Bebe 50g",
    "TermoBusca": "Cápsulas de Café Me Bebe 50g",
    "Segmento": "Pesados e bebidas",
    "PrecoReferencia": 26.98,
    "QuantidadeTipica": 2,
    "DataUltimaCompra": "2025-11-28",
    "Status": "ativo",
    "Origem": "historico"
  },
  {
    "Key": "hist:esponja-multiuso-leve-4-pague-3",
    "Nome": "Esponja Multiuso Leve 4 Pague 3",
    "TermoBusca": "Esponja Multiuso Leve 4 Pague 3",
    "Segmento": "Limpeza",
    "PrecoReferencia": 5.49,
    "QuantidadeTipica": 4,
    "DataUltimaCompra": "2025-11-28",
    "Status": "ativo",
    "Origem": "historico"
  },
  {
    "Key": "hist:bananinha-tachao-de-ubatuba-200g",
    "Nome": "Bananinha Tachão de Ubatuba 200g",
    "TermoBusca": "Bananinha Coberta com Chocolate Tachão de Ubatuba 200g",
    "Segmento": "Despensa e geral",
    "PrecoReferencia": 24.63,
    "QuantidadeTipica": 4,
    "DataUltimaCompra": "2025-12-28",
    "Status": "ativo",
    "Origem": "historico"
  },
  {
    "Key": "hist:coca-cola-garrafa-200ml",
    "Nome": "Coca-Cola Garrafa 200ml",
    "TermoBusca": "Refrigerante Coca Cola Garrafa 200ml",
    "Segmento": "Pesados e bebidas",
    "PrecoReferencia": 1.69,
    "QuantidadeTipica": 12,
    "DataUltimaCompra": "2025-12-28",
    "Status": "ativo",
    "Origem": "historico"
  },
  {
    "Key": "hist:feijao-vermelho-500g",
    "Nome": "Feijão Vermelho 500g",
    "TermoBusca": "Feijão Vermelho 500g",
    "Segmento": "Pesados e bebidas",
    "PrecoReferencia": 8.49,
    "QuantidadeTipica": 3,
    "DataUltimaCompra": "2025-09-01",
    "Status": "ativo",
    "Origem": "historico"
  },
  {
    "Key": "hist:biscoito-piraque-roladinho-goiabinha-75g",
    "Nome": "Biscoito Piraquê Roladinho Goiabinha 75g",
    "TermoBusca": "Biscoito Piraquê Roladinho Recheado de Goiabinha 75g",
    "Segmento": "Despensa e geral",
    "PrecoReferencia": 2.99,
    "QuantidadeTipica": 4,
    "DataUltimaCompra": "2025-08-25",
    "Status": "ativo",
    "Origem": "historico"
  },
  {
    "Key": "hist:grana-padano-gran-mestri-140g",
    "Nome": "Grana Padano Gran Mestri 140g",
    "TermoBusca": "Queijo Tipo Grana Padano Triângulo Gran Mestri 140g",
    "Segmento": "Pereciveis",
    "PrecoReferencia": 30.79,
    "QuantidadeTipica": 2,
    "DataUltimaCompra": "2025-09-30",
    "Status": "ativo",
    "Origem": "historico"
  },
  {
    "Key": "hist:sorvete-gelad-coco-1-5l",
    "Nome": "Sorvete Gelad Coco 1,5L",
    "TermoBusca": "Sorvete Gelad Coco 1,5L",
    "Segmento": "Pereciveis",
    "PrecoReferencia": 25.9,
    "QuantidadeTipica": 1,
    "DataUltimaCompra": "2025-06-08",
    "Status": "ativo",
    "Origem": "historico"
  },
  {
    "Key": "hist:pao-de-queijo-forno-de-minas-tradicional-400g",
    "Nome": "Pão de Queijo Forno de Minas Tradicional 400g",
    "TermoBusca": "Pão De Queijo Forno De Minas Tradicional 400g",
    "Segmento": "Pereciveis",
    "PrecoReferencia": 17.84,
    "QuantidadeTipica": 3,
    "DataUltimaCompra": "2025-12-28",
    "Status": "ativo",
    "Origem": "historico"
  },
  {
    "Key": "hist:pao-de-queijo-forno-de-minas-coquetel-400g",
    "Nome": "Pão de Queijo Forno de Minas Coquetel 400g",
    "TermoBusca": "Pão De Queijo Forno De Minas Coquetel 400g",
    "Segmento": "Pereciveis",
    "PrecoReferencia": 17.84,
    "QuantidadeTipica": 3,
    "DataUltimaCompra": "2025-04-11",
    "Status": "ativo",
    "Origem": "historico"
  },
  {
    "Key": "hist:cereal-froot-loops-kellogg-s-230g",
    "Nome": "Cereal Froot Loops Kellogg's 230g",
    "TermoBusca": "Cereal Matinal Kellogg's Froot Loops 230g",
    "Segmento": "Despensa e geral",
    "PrecoReferencia": 20.82,
    "QuantidadeTipica": 3,
    "DataUltimaCompra": "2025-09-01",
    "Status": "ativo",
    "Origem": "historico"
  },
  {
    "Key": "hist:biscoito-polvilho-globo-30g",
    "Nome": "Biscoito Polvilho Globo 30g",
    "TermoBusca": "Biscoito Polvilho Salgado Globo 30g",
    "Segmento": "Despensa e geral",
    "PrecoReferencia": 5.09,
    "QuantidadeTipica": 5,
    "DataUltimaCompra": "2025-08-02",
    "Status": "ativo",
    "Origem": "historico"
  },
  {
    "Key": "hist:arroz-branco-tio-joao-1kg",
    "Nome": "Arroz Branco Tio João 1kg",
    "TermoBusca": "Arroz Branco Tio João 1kg",
    "Segmento": "Pesados e bebidas",
    "PrecoReferencia": 5.75,
    "QuantidadeTipica": 5,
    "DataUltimaCompra": "2025-11-28",
    "Status": "ativo",
    "Origem": "historico"
  },
  {
    "Key": "hist:cebolitos-elma-chips-91g",
    "Nome": "Cebolitos Elma Chips 91g",
    "TermoBusca": "Salgadinho Cebolitos Elma Chips 91g",
    "Segmento": "Despensa e geral",
    "PrecoReferencia": 10.19,
    "QuantidadeTipica": 3,
    "DataUltimaCompra": "2025-06-27",
    "Status": "ativo",
    "Origem": "historico"
  },
  {
    "Key": "hist:guarana-antarctica-zero-200ml",
    "Nome": "Guaraná Antarctica Zero 200ml",
    "TermoBusca": "Refrigerante Guaraná Antarctica Zero 200ml",
    "Segmento": "Pesados e bebidas",
    "PrecoReferencia": 1.44,
    "QuantidadeTipica": 12,
    "DataUltimaCompra": "2025-08-12",
    "Status": "ativo",
    "Origem": "historico"
  },
  {
    "Key": "hist:sabao-em-po-surf-1-6kg",
    "Nome": "Sabão em Pó Surf 1,6kg",
    "TermoBusca": "Sabão em Pó Surf Rosas e Flor de Lis 1,6kg",
    "Segmento": "Limpeza",
    "PrecoReferencia": 12.74,
    "QuantidadeTipica": 6,
    "DataUltimaCompra": "2025-11-28",
    "Status": "ativo",
    "Origem": "historico"
  },
  {
    "Key": "hist:amaciante-amacitel-2l",
    "Nome": "Amaciante Amacitel 2L",
    "TermoBusca": "Amaciante Para Roupas Amacitel 2L",
    "Segmento": "Limpeza",
    "PrecoReferencia": 9.49,
    "QuantidadeTipica": 6,
    "DataUltimaCompra": "2025-11-28",
    "Status": "ativo",
    "Origem": "historico"
  },
  {
    "Key": "hist:manteiga-com-sal-200g",
    "Nome": "Manteiga com Sal 200g",
    "TermoBusca": "Manteiga com Sal Tablete 200g",
    "Segmento": "Pereciveis",
    "PrecoReferencia": 14.99,
    "QuantidadeTipica": 4,
    "DataUltimaCompra": "2025-12-28",
    "Status": "ativo",
    "Origem": "historico"
  },
  {
    "Key": "hist:biscoito-mentirinha-refil-130g",
    "Nome": "Biscoito Mentirinha Refil 130g",
    "TermoBusca": "Biscoito Mentirinha Refil 130g",
    "Segmento": "Despensa e geral",
    "PrecoReferencia": 14.9,
    "QuantidadeTipica": 2,
    "DataUltimaCompra": "2025-08-25",
    "Status": "ativo",
    "Origem": "historico"
  },
  {
    "Key": "hist:saco-de-lixo-bye-bye-50l",
    "Nome": "Saco de Lixo Bye Bye 50L",
    "TermoBusca": "Saco de Lixo Bye Bye 50L",
    "Segmento": "Limpeza",
    "PrecoReferencia": 11.99,
    "QuantidadeTipica": 3,
    "DataUltimaCompra": "2025-11-28",
    "Status": "ativo",
    "Origem": "historico"
  },
  {
    "Key": "hist:acai-com-guarana-jucai-2l",
    "Nome": "Açaí com Guaraná Juçaí 2L",
    "TermoBusca": "Açaí Com Guaraná Orgânico Juçaí Pote 2 L",
    "Segmento": "Pesados e bebidas",
    "PrecoReferencia": 54.39,
    "QuantidadeTipica": 1,
    "DataUltimaCompra": "2025-12-09",
    "Status": "ativo",
    "Origem": "historico"
  },
  {
    "Key": "hist:cafe-pilao-tradicional-500g",
    "Nome": "Café Pilão Tradicional 500g",
    "TermoBusca": "Café Torrado e Moído Pilão Tradicional 500g",
    "Segmento": "Pesados e bebidas",
    "PrecoReferencia": 32.98,
    "QuantidadeTipica": 2,
    "DataUltimaCompra": "2025-11-28",
    "Status": "ativo",
    "Origem": "historico"
  },
  {
    "Key": "hist:filtro-melitta-102-c-30un",
    "Nome": "Filtro Melitta 102 c/30un",
    "TermoBusca": "Filtro De Papel Melitta Original 102 Com 30 Unidades",
    "Segmento": "Despensa e geral",
    "PrecoReferencia": 4.99,
    "QuantidadeTipica": 2,
    "DataUltimaCompra": "2025-07-13",
    "Status": "ativo",
    "Origem": "historico"
  },
  {
    "Key": "hist:agua-sanitaria-brilux-2l",
    "Nome": "Água Sanitária Brilux 2L",
    "TermoBusca": "Água Sanitária Brilux 2 L",
    "Segmento": "Limpeza",
    "PrecoReferencia": 5.98,
    "QuantidadeTipica": 6,
    "DataUltimaCompra": "2025-09-01",
    "Status": "ativo",
    "Origem": "historico"
  },
  {
    "Key": "hist:maionese-hellmann-s-500g",
    "Nome": "Maionese Hellmann's 500g",
    "TermoBusca": "Maionese Hellmann 500g",
    "Segmento": "Despensa e geral",
    "PrecoReferencia": 16.99,
    "QuantidadeTipica": 1,
    "DataUltimaCompra": "2025-11-28",
    "Status": "ativo",
    "Origem": "historico"
  },
  {
    "Key": "hist:tapioca-da-terrinha-500g",
    "Nome": "Tapioca Da Terrinha 500g",
    "TermoBusca": "Tapioca Da Terrinha 500g",
    "Segmento": "Despensa e geral",
    "PrecoReferencia": 8.03,
    "QuantidadeTipica": 3,
    "DataUltimaCompra": "2025-11-28",
    "Status": "ativo",
    "Origem": "historico"
  },
  {
    "Key": "hist:aromatizador-ubon-citronela-140ml",
    "Nome": "Aromatizador Ubon Citronela 140ml",
    "TermoBusca": "Aromatizador De Ambiente Concentrado Ubon Citronela Com Eucalipto 140ml",
    "Segmento": "Limpeza",
    "PrecoReferencia": 13.16,
    "QuantidadeTipica": 2,
    "DataUltimaCompra": "2025-11-28",
    "Status": "ativo",
    "Origem": "historico"
  },
  {
    "Key": "hist:batata-palha-yoki-extra-fina-100g",
    "Nome": "Batata Palha Yoki Extra Fina 100g",
    "TermoBusca": "Batata Palha Yoki Extra Fina 100g",
    "Segmento": "Despensa e geral",
    "PrecoReferencia": 7.99,
    "QuantidadeTipica": 3,
    "DataUltimaCompra": "2025-09-01",
    "Status": "ativo",
    "Origem": "historico"
  },
  {
    "Key": "hist:acucar-uniao-1kg",
    "Nome": "Açúcar União 1kg",
    "TermoBusca": "Açúcar Refinado União Pacote 1kg",
    "Segmento": "Pesados e bebidas",
    "PrecoReferencia": 7.49,
    "QuantidadeTipica": 2,
    "DataUltimaCompra": "2025-09-01",
    "Status": "ativo",
    "Origem": "historico"
  },
  {
    "Key": "hist:creme-de-leite-nestle-200g",
    "Nome": "Creme de Leite Nestlé 200g",
    "TermoBusca": "Creme De Leite Nestlé Tetra Pak 200g",
    "Segmento": "Pereciveis",
    "PrecoReferencia": 4.75,
    "QuantidadeTipica": 5,
    "DataUltimaCompra": "2025-07-13",
    "Status": "ativo",
    "Origem": "historico"
  },
  {
    "Key": "hist:detergente-limpol-neutro-500ml",
    "Nome": "Detergente Limpol Neutro 500ml",
    "TermoBusca": "Detergente Para Louças Biodegradável Limpol Neutro 500ml",
    "Segmento": "Limpeza",
    "PrecoReferencia": 2.12,
    "QuantidadeTipica": 12,
    "DataUltimaCompra": "2025-11-28",
    "Status": "ativo",
    "Origem": "historico"
  },
  {
    "Key": "hist:lava-loucas-tabletes-limpol-315g",
    "Nome": "Lava Louças Tabletes Limpol 315g",
    "TermoBusca": "Lava Louças em Tabletes para Máquina Limpol 315g",
    "Segmento": "Limpeza",
    "PrecoReferencia": 33.99,
    "QuantidadeTipica": 4,
    "DataUltimaCompra": "2025-11-28",
    "Status": "ativo",
    "Origem": "historico"
  },
  {
    "Key": "hist:azeite-extravirgem-500ml",
    "Nome": "Azeite Extravirgem 500ml",
    "TermoBusca": "Azeite Extravirgem 500ml",
    "Segmento": "Pesados e bebidas",
    "PrecoReferencia": 34.99,
    "QuantidadeTipica": 5,
    "DataUltimaCompra": "2025-09-01",
    "Status": "ativo",
    "Origem": "historico"
  },
  {
    "Key": "hist:saco-de-lixo-bye-bye-30l",
    "Nome": "Saco de Lixo Bye Bye 30L",
    "TermoBusca": "Saco para Lixo Bye Bye 30L com 30 Unidades",
    "Segmento": "Limpeza",
    "PrecoReferencia": 11.99,
    "QuantidadeTipica": 3,
    "DataUltimaCompra": "2025-11-28",
    "Status": "ativo",
    "Origem": "historico"
  },
  {
    "Key": "hist:saco-de-lixo-bye-bye-100l",
    "Nome": "Saco de Lixo Bye Bye 100L",
    "TermoBusca": "Saco de Lixo Bye Bye Premium 100L",
    "Segmento": "Limpeza",
    "PrecoReferencia": 14.99,
    "QuantidadeTipica": 2,
    "DataUltimaCompra": "2025-06-27",
    "Status": "ativo",
    "Origem": "historico"
  },
  {
    "Key": "hist:papel-toalha-2-rolos",
    "Nome": "Papel Toalha 2 Rolos",
    "TermoBusca": "Papel Toalha 2 Rolos",
    "Segmento": "Limpeza",
    "PrecoReferencia": 6.99,
    "QuantidadeTipica": 3,
    "DataUltimaCompra": "2025-11-28",
    "Status": "ativo",
    "Origem": "historico"
  },
  {
    "Key": "hist:guardanapo-scott-grand-hotel-50un",
    "Nome": "Guardanapo Scott Grand Hotel 50un",
    "TermoBusca": "Guardanapo Scott Grand Hotel 50 Unidades",
    "Segmento": "Despensa e geral",
    "PrecoReferencia": 8.98,
    "QuantidadeTipica": 3,
    "DataUltimaCompra": "2025-12-28",
    "Status": "ativo",
    "Origem": "historico"
  },
  {
    "Key": "hist:uva-verde-sem-semente-500g",
    "Nome": "Uva Verde Sem Semente 500g",
    "TermoBusca": "Uva Verde Sem Semente 500g",
    "Segmento": "Pereciveis",
    "PrecoReferencia": 9.99,
    "QuantidadeTipica": 2,
    "DataUltimaCompra": "2025-12-28",
    "Status": "ativo",
    "Origem": "historico"
  },
  {
    "Key": "hist:batata-frita-ruffles-original-68g",
    "Nome": "Batata Frita Ruffles Original 68g",
    "TermoBusca": "Batata Frita Ruffles Original 68g",
    "Segmento": "Despensa e geral",
    "PrecoReferencia": 7.49,
    "QuantidadeTipica": 2,
    "DataUltimaCompra": "2025-12-28",
    "Status": "ativo",
    "Origem": "historico"
  },
  {
    "Key": "hist:cheetos-onda-requeijao-160g",
    "Nome": "Cheetos Onda Requeijão 160g",
    "TermoBusca": "Salgadinho Cheetos Onda Requeijão 160g",
    "Segmento": "Despensa e geral",
    "PrecoReferencia": 12.99,
    "QuantidadeTipica": 2,
    "DataUltimaCompra": "2025-08-02",
    "Status": "ativo",
    "Origem": "historico"
  },
  {
    "Key": "hist:choco-biscuit-bauducco-80g",
    "Nome": "Choco Biscuit Bauducco 80g",
    "TermoBusca": "Choco Biscuit Bauducco Chocolate Ao Leite Pacote 80g",
    "Segmento": "Despensa e geral",
    "PrecoReferencia": 6.99,
    "QuantidadeTipica": 3,
    "DataUltimaCompra": "2025-06-27",
    "Status": "ativo",
    "Origem": "historico"
  },
  {
    "Key": "hist:sobrecoxa-de-frango-korin-600g",
    "Nome": "Sobrecoxa de Frango Korin 600g",
    "TermoBusca": "Sobrecoxa De Frango Congelada Korin Bandeja 600g",
    "Segmento": "Pereciveis",
    "PrecoReferencia": 17.99,
    "QuantidadeTipica": 3,
    "DataUltimaCompra": "2025-12-28",
    "Status": "ativo",
    "Origem": "historico"
  },
  {
    "Key": "hist:file-de-peito-de-frango-korin-700g",
    "Nome": "Filé de Peito de Frango Korin 700g",
    "TermoBusca": "Filé de Peito de Frango Korin 700g",
    "Segmento": "Pereciveis",
    "PrecoReferencia": 42.49,
    "QuantidadeTipica": 4,
    "DataUltimaCompra": "2025-08-12",
    "Status": "ativo",
    "Origem": "historico"
  },
  {
    "Key": "hist:biscoito-piraque-queijinho-100g",
    "Nome": "Biscoito Piraquê Queijinho 100g",
    "TermoBusca": "Biscoito Piraquê Queijinho Pacote 100g",
    "Segmento": "Despensa e geral",
    "PrecoReferencia": 2.87,
    "QuantidadeTipica": 2,
    "DataUltimaCompra": "2025-12-28",
    "Status": "ativo",
    "Origem": "historico"
  },
  {
    "Key": "hist:sal-de-parrilla-500g",
    "Nome": "Sal de Parrilla 500g",
    "TermoBusca": "Sal de Parrilla Bombay Herbs Spices 500g",
    "Segmento": "Despensa e geral",
    "PrecoReferencia": 16.57,
    "QuantidadeTipica": 1,
    "DataUltimaCompra": "2025-09-30",
    "Status": "ativo",
    "Origem": "historico"
  },
  {
    "Key": "hist:alcool-montenegro-46-1l",
    "Nome": "Álcool Montenegro 46% 1L",
    "TermoBusca": "Álcool Montenegro 46% 1 L",
    "Segmento": "Limpeza",
    "PrecoReferencia": 8.35,
    "QuantidadeTipica": 7,
    "DataUltimaCompra": "2025-09-30",
    "Status": "ativo",
    "Origem": "historico"
  },
  {
    "Key": "hist:tira-manchas-vanish-oxi-action-400g",
    "Nome": "Tira Manchas Vanish Oxi Action 400g",
    "TermoBusca": "Tira Manchas Vanish Oxi Action 400g",
    "Segmento": "Limpeza",
    "PrecoReferencia": 10.9,
    "QuantidadeTipica": 2,
    "DataUltimaCompra": "2025-06-27",
    "Status": "ativo",
    "Origem": "historico"
  },
  {
    "Key": "hist:bala-sweet-jelly-200g",
    "Nome": "Bala Sweet Jelly 200g",
    "TermoBusca": "Bala De Alga Marinha Sweet Jelly Pacote 200g",
    "Segmento": "Despensa e geral",
    "PrecoReferencia": 22.87,
    "QuantidadeTipica": 2,
    "DataUltimaCompra": "2025-04-29",
    "Status": "ativo",
    "Origem": "historico"
  },
  {
    "Key": "hist:matte-leao-limao-1-5l",
    "Nome": "Matte Leão Limão 1,5L",
    "TermoBusca": "Matte Leão Limão Pet 1,5L",
    "Segmento": "Pesados e bebidas",
    "PrecoReferencia": 7.79,
    "QuantidadeTipica": 2,
    "DataUltimaCompra": "2025-05-13",
    "Status": "ativo",
    "Origem": "historico"
  },
  {
    "Key": "hist:h2oh-limoneto-1-5l",
    "Nome": "H2Oh! Limoneto 1,5L",
    "TermoBusca": "Refrigerante H2Oh Limoneto 1,5L",
    "Segmento": "Pesados e bebidas",
    "PrecoReferencia": 5.94,
    "QuantidadeTipica": 3,
    "DataUltimaCompra": "2025-03-27",
    "Status": "ativo",
    "Origem": "historico"
  }
]
;

function importarBaseHistorica() {
  const planilha = SpreadsheetApp.getActiveSpreadsheet();
  const aba = planilha.getSheetByName(ABA_ITENS);
  const existentes = new Set(lerLinhasItens_().map((linha) => linha.Key));
  const agora = new Date();
  let inseridos = 0;

  BASE_HISTORICA.forEach((item) => {
    if (existentes.has(item.Key)) return;

    const linha = Object.assign({
      Link: '', Imagem: '', Sku: '', SellerId: '', DataCriacao: agora,
    }, item);

    aba.appendRow(COLUNAS_ITENS.map((coluna) => linha[coluna]));
    inseridos += 1;
  });

  return { ok: true, inseridos, ignorados: BASE_HISTORICA.length - inseridos };
}
