// Motor único do Auto Compras: serve a tela, lê/escreve no Sheets (armazém)
// e consulta o catálogo público do Zona Sul (UrlFetchApp evita CORS).

const ABA_ITENS = 'Itens';
const ABA_COMPRAS = 'Compras';

const CATALOG_BASE = 'https://www.zonasul.com.br/api/catalog_system/pub/products/search/';
const CART_BASE = 'https://www.zonasul.com.br/checkout/cart/add';
const LOGIN_URL = 'https://www.zonasul.com.br/login';
const ACCOUNT_URL = 'https://www.zonasul.com.br/account';

const CONTAS = [
  { key: 'erico', label: 'Erico' },
  { key: 'dani', label: 'Dani' },
];
const SLOTS_POR_CONTA = 10;
const DESCONTO_CORTE_PERCENT = 15;

const SEGMENTOS = [
  'Pereciveis',
  'Limpeza',
  'Pesados e bebidas',
  'Despensa e geral',
  'Adicionados recentemente',
];

const COLUNAS_ITENS = [
  'Key', 'Nome', 'TermoBusca', 'Segmento', 'PrecoReferencia',
  'QuantidadeTipica', 'DataUltimaCompra', 'Status', 'Origem',
  'Link', 'Imagem', 'Sku', 'SellerId', 'DataCriacao',
];

const COLUNAS_COMPRAS = [
  'Data', 'Conta', 'ItemKey', 'Nome', 'PrecoPago', 'Quantidade', 'Total', 'Sku',
];

function doGet() {
  return HtmlService.createTemplateFromFile('App')
    .evaluate()
    .setTitle('Auto Compras')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function include(nomeArquivo) {
  return HtmlService.createHtmlOutputFromFile(nomeArquivo).getContent();
}

// Roda uma vez no editor do Apps Script para criar as abas do armazém.
function configurarPlanilha() {
  const planilha = SpreadsheetApp.getActiveSpreadsheet();
  criarAbaSeNaoExiste(planilha, ABA_ITENS, COLUNAS_ITENS);
  criarAbaSeNaoExiste(planilha, ABA_COMPRAS, COLUNAS_COMPRAS);
}

function criarAbaSeNaoExiste(planilha, nome, cabecalho) {
  let aba = planilha.getSheetByName(nome);
  if (!aba) {
    aba = planilha.insertSheet(nome);
  }
  if (aba.getLastRow() === 0) {
    aba.getRange(1, 1, 1, cabecalho.length).setValues([cabecalho]);
    aba.setFrozenRows(1);
  }
}

// ---------- Estado inicial ----------

function obterEstadoInicial() {
  return {
    itens: listarItens(),
    contas: CONTAS,
    loginUrl: LOGIN_URL,
    accountUrl: ACCOUNT_URL,
    segmentos: SEGMENTOS,
  };
}

function listarItens() {
  const linhas = lerLinhasItens_();
  return linhas.map((linha) => ({
    key: linha.Key,
    nome: linha.Nome,
    termoBusca: linha.TermoBusca,
    segmento: linha.Segmento,
    precoReferencia: numeroOuNulo_(linha.PrecoReferencia),
    quantidadeTipica: Number(linha.QuantidadeTipica) || 1,
    dataUltimaCompra: formatarData_(linha.DataUltimaCompra),
    status: linha.Status || 'ativo',
    origem: linha.Origem || 'historico',
    link: linha.Link || null,
    imagem: linha.Imagem || null,
    sku: linha.Sku || null,
    sellerId: linha.SellerId || null,
  }));
}

// ---------- Itens: adicionar / retirar / reativar ----------

function adicionarItemPorLink(url) {
  const produto = resolverProdutoPorUrl_(url);
  const planilha = SpreadsheetApp.getActiveSpreadsheet();
  const aba = planilha.getSheetByName(ABA_ITENS);
  const linhas = lerLinhasItens_();
  const key = 'link:' + (produto.sku || slugify_(produto.nome));
  const existente = linhas.findIndex((linha) => linha.Key === key);
  const agora = new Date();

  const novaLinha = {
    Key: key,
    Nome: produto.nome,
    TermoBusca: produto.nome,
    Segmento: 'Adicionados recentemente',
    PrecoReferencia: produto.preco,
    QuantidadeTipica: 1,
    DataUltimaCompra: '',
    Status: 'ativo',
    Origem: 'link',
    Link: produto.link || url,
    Imagem: produto.imagem || '',
    Sku: produto.sku || '',
    SellerId: produto.sellerId || '',
    DataCriacao: agora,
  };

  if (existente >= 0) {
    escreverLinhaItens_(aba, existente + 2, novaLinha);
  } else {
    aba.appendRow(COLUNAS_ITENS.map((coluna) => novaLinha[coluna]));
  }

  return { ok: true, item: novaLinha };
}

function retirarItem(key) {
  return atualizarStatusItem_(key, 'retirado');
}

function reativarItem(key) {
  return atualizarStatusItem_(key, 'ativo');
}

function atualizarStatusItem_(key, status) {
  const planilha = SpreadsheetApp.getActiveSpreadsheet();
  const aba = planilha.getSheetByName(ABA_ITENS);
  const linhas = lerLinhasItens_();
  const indice = linhas.findIndex((linha) => linha.Key === key);

  if (indice < 0) {
    throw new Error('Item não encontrado: ' + key);
  }

  const colunaStatus = COLUNAS_ITENS.indexOf('Status') + 1;
  aba.getRange(indice + 2, colunaStatus).setValue(status);
  return { ok: true, key, status };
}

// ---------- Checagem de preço ----------

function checarPrecos(itensSolicitados) {
  const solicitados = (itensSolicitados || []).filter((item) => Number(item.quantidade) > 0);
  const resultados = solicitados.map((item) => cotarItem_(item));
  const comSelecao = resultados.filter((resultado) => resultado.selecionado);
  const subtotal = arredondar_(
    comSelecao.reduce((soma, resultado) => soma + resultado.selecionado.total, 0),
  );
  const minhasOfertas = montarMinhasOfertas_(comSelecao);
  const carrinhos = montarCarrinhos_(comSelecao, minhasOfertas);

  return {
    itens: resultados,
    subtotal,
    minhasOfertas,
    carrinhos,
    geradoEm: new Date().toISOString(),
  };
}

function cotarItem_(item) {
  const termoBusca = item.termoBusca || item.nome;
  let candidatos = [];
  let erro = null;

  try {
    candidatos = buscarCandidatos_(termoBusca);
  } catch (excecao) {
    erro = excecao.message || 'Falha consultando o Zona Sul.';
  }

  if (!erro && !candidatos.length) {
    erro = 'Não encontrei candidato disponível.';
  }

  if (erro) {
    return {
      key: item.key,
      nome: item.nome,
      quantidade: item.quantidade,
      precoReferencia: numeroOuNulo_(item.precoReferencia),
      selecionado: null,
      alternativas: [],
      erro,
    };
  }

  const metricaDesejada = inferirMetrica_(termoBusca);
  const ranqueados = candidatos
    .map((candidato) => ({ candidato, ranking: ranquearCandidato_(candidato, metricaDesejada, item.precoReferencia) }))
    .sort((a, b) => a.ranking.pontuacao - b.ranking.pontuacao);

  const [melhor, ...resto] = ranqueados;

  return {
    key: item.key,
    nome: item.nome,
    quantidade: item.quantidade,
    precoReferencia: numeroOuNulo_(item.precoReferencia),
    selecionado: serializarCandidato_(melhor.candidato, melhor.ranking, item.quantidade, item.precoReferencia),
    alternativas: resto.slice(0, 3).map((entrada) =>
      serializarCandidato_(entrada.candidato, entrada.ranking, item.quantidade, item.precoReferencia),
    ),
  };
}

function buscarCandidatos_(termoBusca) {
  const tentativas = [
    CATALOG_BASE + codificarSegmento_(termoBusca) + '?_from=0&_to=49',
    CATALOG_BASE + '?ft=' + codificarSegmento_(termoBusca) + '&_from=0&_to=49',
  ];

  let produtos = null;
  let ultimoStatus = 0;

  for (const url of tentativas) {
    const resposta = buscarComRetentativa_(url);
    ultimoStatus = resposta.getResponseCode();
    if (ultimoStatus === 200 || ultimoStatus === 206) {
      produtos = JSON.parse(resposta.getContentText());
      break;
    }
  }

  if (!produtos) {
    throw new Error('Falha consultando "' + termoBusca + '": HTTP ' + ultimoStatus);
  }

  const tokens = tokensCriticos_(termoBusca);
  const candidatos = produtos.map(produtoParaCandidato_).filter(Boolean);
  const filtrados = tokens.length
    ? candidatos.filter((candidato) => tokens.every((token) => normalizar_(candidato.nome).includes(token)))
    : candidatos;

  return (filtrados.length ? filtrados : candidatos).slice(0, 30);
}

function buscarComRetentativa_(url) {
  let resposta = null;
  for (let tentativa = 0; tentativa < 2; tentativa += 1) {
    resposta = UrlFetchApp.fetch(url, {
      headers: { accept: 'application/json', 'user-agent': 'Mozilla/5.0' },
      muteHttpExceptions: true,
    });
    if (resposta.getResponseCode() !== 429) return resposta;
    Utilities.sleep(1000);
  }
  return resposta;
}

function produtoParaCandidato_(produto) {
  const itens = produto.items || [];
  for (const item of itens) {
    const vendedores = item.sellers || [];
    for (const vendedor of vendedores) {
      const oferta = vendedor.commertialOffer || {};
      const preco = Number(oferta.Price || 0);
      const precoLista = Number(oferta.ListPrice || preco);
      const disponivel = Number(oferta.AvailableQuantity || 0);

      if (preco > 0 && disponivel > 0) {
        return {
          nome: produto.productName,
          marca: produto.brand,
          sku: item.itemId,
          sellerId: vendedor.sellerId || '1',
          preco,
          precoLista: precoLista > 0 ? precoLista : preco,
          link: produto.link,
          imagem: (item.images && item.images[0] && item.images[0].imageUrl) || null,
          metrica: inferirMetrica_(produto.productName),
        };
      }
    }
  }
  return null;
}

function ranquearCandidato_(candidato, metricaDesejada, precoReferencia) {
  const precoRef = numeroOuNulo_(precoReferencia);
  const mesmoTipo = metricaDesejada.tipo === candidato.metrica.tipo;
  const distanciaTamanho = mesmoTipo
    ? Math.abs(Math.log(candidato.metrica.valor / metricaDesejada.valor))
    : 1.5;

  const precoUnitario = candidato.preco / (candidato.metrica.valor || 1);
  const precoRefUnitario = mesmoTipo && precoRef != null ? precoRef / metricaDesejada.valor : null;
  const componentePreco = precoRefUnitario != null
    ? Math.max(-25, Math.min(40, (precoUnitario / precoRefUnitario - 1) * 25))
    : precoUnitario / 100;

  return {
    pontuacao: distanciaTamanho * 100 + componentePreco,
    mesmoTipo,
    rotulo: rotularTamanho_(mesmoTipo, candidato.metrica.valor / (metricaDesejada.valor || 1)),
  };
}

function rotularTamanho_(mesmoTipo, razao) {
  if (!mesmoTipo) return 'embalagem diferente';
  if (Math.abs(Math.log(razao)) <= 0.08) return 'tamanho exato';
  if (razao > 1) return razao >= 1.75 ? 'embalagem maior' : 'um pouco maior';
  return razao <= 0.6 ? 'embalagem menor' : 'um pouco menor';
}

function serializarCandidato_(candidato, ranking, quantidade, precoReferencia) {
  const precoRef = numeroOuNulo_(precoReferencia);
  const descontoAtualPercent = candidato.precoLista > candidato.preco
    ? arredondar_(((candidato.precoLista - candidato.preco) / candidato.precoLista) * 100)
    : 0;
  const elegivelMinhasOfertas = descontoAtualPercent < DESCONTO_CORTE_PERCENT;
  const gapDescontoPercent = Math.max(0, DESCONTO_CORTE_PERCENT - descontoAtualPercent);
  const economiaPotencial = elegivelMinhasOfertas
    ? arredondar_(candidato.preco * quantidade * (gapDescontoPercent / 100))
    : 0;

  return {
    nome: candidato.nome,
    marca: candidato.marca,
    sku: candidato.sku,
    sellerId: candidato.sellerId,
    preco: candidato.preco,
    precoLista: candidato.precoLista,
    total: arredondar_(candidato.preco * quantidade),
    precoReferencia: precoRef,
    rotuloTamanho: ranking.rotulo,
    descontoAtualPercent,
    elegivelMinhasOfertas,
    economiaPotencial,
    metricaLabel: candidato.metrica.rotulo,
    precoUnitarioLabel: 'R$ ' + candidato.preco.toFixed(2).replace('.', ',') + ' ' + candidato.metrica.compareLabel,
    link: candidato.link,
    imagem: candidato.imagem,
  };
}

// ---------- Minhas ofertas e carrinhos ----------

function montarMinhasOfertas_(itensComSelecao) {
  const limite = SLOTS_POR_CONTA * CONTAS.length;
  const elegiveis = itensComSelecao.filter((resultado) => resultado.selecionado.elegivelMinhasOfertas);
  const selecionados = elegiveis
    .slice()
    .sort((a, b) => b.selecionado.economiaPotencial - a.selecionado.economiaPotencial
      || b.selecionado.total - a.selecionado.total)
    .slice(0, limite);

  const contas = CONTAS.map((conta, indice) => {
    const inicio = indice * SLOTS_POR_CONTA;
    const fatia = selecionados.slice(inicio, inicio + SLOTS_POR_CONTA);
    return {
      key: conta.key,
      label: conta.label,
      itens: fatia.map((resultado) => resultado.key),
      subtotal: arredondar_(fatia.reduce((soma, resultado) => soma + resultado.selecionado.total, 0)),
      economiaEstimada: arredondar_(fatia.reduce((soma, resultado) => soma + resultado.selecionado.economiaPotencial, 0)),
    };
  });

  return {
    limite,
    slotsPorConta: SLOTS_POR_CONTA,
    cortePercent: DESCONTO_CORTE_PERCENT,
    contas,
  };
}

function montarCarrinhos_(itensComSelecao, minhasOfertas) {
  const chavesMinhasOfertas = new Set(minhasOfertas.contas.flatMap((conta) => conta.itens));
  const restante = itensComSelecao.filter((resultado) => !chavesMinhasOfertas.has(resultado.key));
  const totaisPorConta = {};
  CONTAS.forEach((conta) => { totaisPorConta[conta.key] = 0; });
  minhasOfertas.contas.forEach((conta) => { totaisPorConta[conta.key] = conta.subtotal; });

  const itensPorConta = {};
  CONTAS.forEach((conta) => { itensPorConta[conta.key] = []; });
  minhasOfertas.contas.forEach((conta) => {
    conta.itens.forEach((key) => itensPorConta[conta.key].push(key));
  });

  restante.forEach((resultado) => {
    const contaKey = escolherContaParaRestante_(resultado, totaisPorConta);
    itensPorConta[contaKey].push(resultado.key);
    totaisPorConta[contaKey] += resultado.selecionado.total;
  });

  const porKey = new Map(itensComSelecao.map((resultado) => [resultado.key, resultado]));

  return CONTAS.map((conta) => {
    const keys = itensPorConta[conta.key];
    const itensCarrinho = keys.map((key) => porKey.get(key)).filter(Boolean);
    return {
      key: conta.key,
      label: conta.label,
      subtotal: arredondar_(totaisPorConta[conta.key]),
      itens: itensCarrinho.map((resultado) => resultado.key),
      cartUrl: montarUrlCarrinho_(itensCarrinho.map((resultado) => ({
        sku: resultado.selecionado.sku,
        sellerId: resultado.selecionado.sellerId,
        quantidade: resultado.quantidade,
      }))),
    };
  });
}

function escolherContaParaRestante_(resultado, totaisPorConta) {
  // segmento vem do item original — a lista completa é injetada por checarPrecos no cliente,
  // então aqui usamos só o total acumulado para equilibrar as duas contas.
  const contas = CONTAS.map((conta) => conta.key);
  return contas.reduce((menor, atual) => (totaisPorConta[atual] < totaisPorConta[menor] ? atual : menor), contas[0]);
}

function montarUrlCarrinho_(itens) {
  if (!itens.length) return null;
  const pares = [];
  itens.forEach((item) => {
    pares.push('sku=' + encodeURIComponent(item.sku));
    pares.push('qty=' + encodeURIComponent(item.quantidade));
    pares.push('seller=' + encodeURIComponent(item.sellerId || '1'));
  });
  pares.push('sc=1');
  return CART_BASE + '?' + pares.join('&');
}

// ---------- Concluir compra (histórico de dados) ----------

function concluirCompra(registro) {
  const planilha = SpreadsheetApp.getActiveSpreadsheet();
  const abaCompras = planilha.getSheetByName(ABA_COMPRAS);
  const agora = new Date();
  const itens = registro.itens || [];

  itens.forEach((item) => {
    abaCompras.appendRow([
      agora, registro.conta, item.key, item.nome,
      item.precoPago, item.quantidade, arredondar_(item.precoPago * item.quantidade), item.sku,
    ]);
    atualizarPrecoReferencia_(item.key, item.precoPago, item.quantidade, agora);
  });

  return { ok: true, registrados: itens.length };
}

function atualizarPrecoReferencia_(key, precoPago, quantidade, data) {
  const planilha = SpreadsheetApp.getActiveSpreadsheet();
  const aba = planilha.getSheetByName(ABA_ITENS);
  const linhas = lerLinhasItens_();
  const indice = linhas.findIndex((linha) => linha.Key === key);
  if (indice < 0) return;

  const linhaPlanilha = indice + 2;
  aba.getRange(linhaPlanilha, COLUNAS_ITENS.indexOf('PrecoReferencia') + 1).setValue(precoPago);
  aba.getRange(linhaPlanilha, COLUNAS_ITENS.indexOf('QuantidadeTipica') + 1).setValue(quantidade);
  aba.getRange(linhaPlanilha, COLUNAS_ITENS.indexOf('DataUltimaCompra') + 1).setValue(data);
}

// ---------- Resolver produto por link (adicionar item novo) ----------

function resolverProdutoPorUrl_(url) {
  const href = String(url || '').trim();
  if (!href.toLowerCase().includes('zonasul.com.br')) {
    throw new Error('Use um link de produto do Zona Sul.');
  }

  const caminho = href.split('://')[1].split('/').slice(1).map(decodeURIComponent).filter(Boolean);
  const indiceP = caminho.lastIndexOf('p');
  const slug = indiceP > 0 ? caminho[indiceP - 1] : caminho[caminho.length - 1] || '';
  const termoBusca = slug.replace(/-/g, ' ');

  const candidatos = buscarCandidatos_(termoBusca);
  const selecionado = candidatos.find((candidato) => normalizar_(candidato.link || '').includes(normalizar_(slug)))
    || candidatos[0];

  if (!selecionado) {
    throw new Error('Não encontrei este produto no catálogo do Zona Sul.');
  }

  return {
    nome: selecionado.nome,
    preco: selecionado.preco,
    link: selecionado.link || href,
    imagem: selecionado.imagem,
    sku: selecionado.sku,
    sellerId: selecionado.sellerId,
  };
}

// ---------- Helpers de planilha ----------

function lerLinhasItens_() {
  const planilha = SpreadsheetApp.getActiveSpreadsheet();
  const aba = planilha.getSheetByName(ABA_ITENS);
  const valores = aba.getDataRange().getValues();
  const cabecalho = valores[0];

  return valores.slice(1)
    .filter((linha) => linha.some((celula) => celula !== ''))
    .map((linha) => {
      const objeto = {};
      cabecalho.forEach((nomeColuna, indice) => { objeto[nomeColuna] = linha[indice]; });
      return objeto;
    });
}

function escreverLinhaItens_(aba, numeroLinha, objeto) {
  const valores = COLUNAS_ITENS.map((coluna) => objeto[coluna]);
  aba.getRange(numeroLinha, 1, 1, valores.length).setValues([valores]);
}

// ---------- Helpers gerais ----------

function numeroOuNulo_(valor) {
  if (valor === '' || valor === null || valor === undefined) return null;
  const numero = Number(valor);
  return Number.isFinite(numero) ? numero : null;
}

function formatarData_(valor) {
  if (!valor) return null;
  if (Object.prototype.toString.call(valor) === '[object Date]') {
    return Utilities.formatDate(valor, 'America/Sao_Paulo', 'yyyy-MM-dd');
  }
  return String(valor);
}

function arredondar_(valor) {
  return Math.round(Number(valor) * 100) / 100;
}

const REGEX_DIACRITICOS_ = new RegExp('[' + String.fromCharCode(0x0300) + '-' + String.fromCharCode(0x036f) + ']', 'g');

function normalizar_(texto) {
  return String(texto || '')
    .normalize('NFD')
    .replace(REGEX_DIACRITICOS_, '')
    .toLowerCase();
}

function codificarSegmento_(valor) {
  return encodeURIComponent(String(valor || ''));
}

function tokensCriticos_(texto) {
  const stopwords = new Set(['de', 'da', 'do', 'das', 'dos', 'e', 'ou', 'com', 'para', 'um', 'uma']);
  return normalizar_(texto)
    .split(/[^a-z0-9]+/)
    .filter((token) => token.length >= 3 && !stopwords.has(token) && !/^\d+(kg|g|l|ml|un)?$/.test(token));
}

function inferirMetrica_(texto) {
  const valor = normalizar_(texto).replace(',', '.');

  const kg = valor.match(/(\d+(?:\.\d+)?)\s*kg\b/);
  if (kg) return { valor: Number(kg[1]), tipo: 'kg', rotulo: kg[1] + ' kg', compareLabel: 'por kg' };

  const gramas = valor.match(/(\d+(?:\.\d+)?)\s*g\b/);
  if (gramas) return { valor: Number(gramas[1]) / 1000, tipo: 'kg', rotulo: gramas[1] + ' g', compareLabel: 'por kg' };

  const litros = valor.match(/(\d+(?:\.\d+)?)\s*l\b/);
  if (litros) return { valor: Number(litros[1]), tipo: 'litro', rotulo: litros[1] + ' L', compareLabel: 'por litro' };

  const ml = valor.match(/(\d+(?:\.\d+)?)\s*ml\b/);
  if (ml) return { valor: Number(ml[1]) / 1000, tipo: 'litro', rotulo: ml[1] + ' ml', compareLabel: 'por litro' };

  const unidades = valor.match(/(\d+)\s*(?:unidades|unidade|un|capsulas|capsula)\b/);
  if (unidades) return { valor: Number(unidades[1]), tipo: 'unidade', rotulo: unidades[1] + ' un', compareLabel: 'por unidade' };

  return { valor: 1, tipo: 'unidade', rotulo: '1 un', compareLabel: 'por unidade' };
}

function slugify_(texto) {
  return normalizar_(texto).replace(/[^a-z0-9]+/g, '-').slice(0, 48);
}
