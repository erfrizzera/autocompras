import puppeteer from 'puppeteer';
import { join } from 'node:path';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const cachePath = join(__dirname, '..', 'data', 'paodeacucar-cache.json');

// Ler o cache local de cotações do Pão de Açúcar
export async function readPaoDeAcucarCache() {
  try {
    const data = await readFile(cachePath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    if (error.code === 'ENOENT') {
      return {};
    }
    console.error("Erro lendo cache Pao de Acucar:", error);
    return {};
  }
}

// Gravar no cache local
export async function writePaoDeAcucarCache(cache) {
  try {
    await mkdir(join(__dirname, '..', 'data'), { recursive: true });
    await writeFile(cachePath, JSON.stringify(cache, null, 2), 'utf8');
  } catch (error) {
    console.error("Erro gravando cache Pao de Acucar:", error);
  }
}

// Scrapea uma lista de termos de busca usando uma única instância do Puppeteer
export async function scrapePaoDeAcucar(queries) {
  if (!queries || queries.length === 0) return {};

  console.log(`[Pao de Acucar] Iniciando scrape de ${queries.length} itens...`);
  
  let browser;
  try {
    browser = await puppeteer.launch({
      headless: "new",
      args: [
        '--no-sandbox', 
        '--disable-setuid-sandbox',
        '--disable-blink-features=AutomationControlled' // Ajuda a evitar detecções simples
      ]
    });

    const page = await browser.newPage();
    // User agent realista de Chrome em Windows
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
    await page.setViewport({ width: 1280, height: 800 });

    const results = {};

    for (const query of queries) {
      const normalizedQuery = query.trim();
      console.log(`[Pao de Acucar] Buscando por: "${normalizedQuery}"`);
      const url = `https://www.paodeacucar.com/busca?w=${encodeURIComponent(normalizedQuery)}`;

      try {
        await page.goto(url, { waitUntil: 'networkidle2', timeout: 25000 });
        // Aguarda um pequeno tempo para renderização client-side do Next.js
        await new Promise(r => setTimeout(r, 3000));

        const products = await page.evaluate(() => {
          const anchors = Array.from(document.querySelectorAll('a'))
            .filter(a => a.href && a.href.includes('/produto/') && a.innerText.trim() !== '');

          return anchors.map(anchor => {
            const title = anchor.innerText.trim();
            const href = anchor.href;
            
            // Busca o contêiner do card subindo na árvore DOM
            let parent = anchor.parentElement;
            let card = null;
            for (let i = 0; i < 6; i++) {
              if (!parent) break;
              const priceEl = parent.querySelector('[class*="PriceValue-sc-"]');
              const imgEl = parent.querySelector('img');
              if (priceEl && imgEl && imgEl.src && !imgEl.src.includes('access_icon')) {
                card = parent;
                break;
              }
              parent = parent.parentElement;
            }

            if (!card) return null;

            const priceEl = card.querySelector('[class*="PriceValue-sc-"]');
            const priceText = priceEl ? priceEl.innerText.trim() : '';

            const imgEl = card.querySelector('img');
            const imgUrl = imgEl ? imgEl.src : '';

            return {
              title,
              href,
              priceText,
              imgUrl
            };
          }).filter(Boolean);
        });

        // Deduplica e pega o primeiro resultado
        const uniqueProducts = [];
        const seen = new Set();
        for (const p of products) {
          if (!seen.has(p.title)) {
            seen.add(p.title);
            uniqueProducts.push(p);
          }
        }

        if (uniqueProducts.length > 0) {
          const best = uniqueProducts[0];
          // Tratar o preço de "R$ 6,99" para float 6.99
          const priceValue = parseFloat(
            best.priceText
              .replace('R$', '')
              .replace(/\./g, '') // Remove separador de milhar se houver
              .replace(',', '.')  // Converte vírgula decimal para ponto
              .trim()
          );

          results[normalizedQuery] = {
            name: best.title,
            link: best.href,
            price: Number.isFinite(priceValue) ? priceValue : null,
            image: best.imgUrl,
            fetchedAt: new Date().toISOString()
          };
          console.log(`[Pao de Acucar] Sucesso: "${best.title}" por R$ ${priceValue}`);
        } else {
          console.log(`[Pao de Acucar] Nenhum produto encontrado para: "${normalizedQuery}"`);
          results[normalizedQuery] = null;
        }

      } catch (err) {
        console.error(`[Pao de Acucar] Erro buscando por "${normalizedQuery}":`, err.message);
        results[normalizedQuery] = null;
      }

      // Pequena pausa entre buscas para mitigar rate-limits
      await new Promise(r => setTimeout(r, 1000));
    }

    return results;

  } catch (error) {
    console.error("[Pao de Acucar] Erro fatal no Puppeteer:", error);
    throw error;
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}
