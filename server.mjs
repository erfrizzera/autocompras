import { createServer } from "node:http";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { extname, join, normalize } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import {
  ACCOUNT_URL,
  defaultItems,
  LOGIN_URL,
  planCart,
  resolveProductFromUrl,
  targetSummaries,
} from "./src/zonasulCatalog.mjs";

const __dirname = fileURLToPath(new URL(".", import.meta.url));
const publicDir = join(__dirname, "public");
const dataDir = join(__dirname, "data");
const removedItemsPath = join(dataDir, "removed-historical-items.json");
const extraItemsPath = join(dataDir, "extra-historical-items.json");
const itemPreviewsPath = join(dataDir, "item-previews-cache.json");
const port = Number(process.env.PORT || 5173);

const mimeTypes = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".ico": "image/x-icon",
};

export function createAppServer() {
  return createServer(async (request, response) => {
    try {
      const url = new URL(request.url, `http://${request.headers.host}`);

      if (url.pathname === "/api/intents" && request.method === "GET") {
        const removedKeys = await readRemovedHistoricalItemKeys();
        const extraItems = await readExtraHistoricalItems();
        const defaults = [...defaultItems(), ...extraItems].map((item) => ({
          ...item,
          removed: removedKeys.has(item.key),
        }));

        return sendJson(response, {
          items: targetSummaries(),
          defaults,
          loginUrl: LOGIN_URL,
          accountUrl: ACCOUNT_URL,
        });
      }

      if (url.pathname === "/api/item-previews" && request.method === "POST") {
        const body = await readJson(request);
        const requested = Array.isArray(body.items) ? body.items : [];
        const cache = await readItemPreviewsCache();
        const missing = requested.filter((item) => !cache[String(item.key || "")]);

        if (missing.length) {
          const plan = await planCart(
            missing.map((item) => ({
            key: item.key,
            label: item.label,
            query: item.query,
            qty: 1,
            referencePrice: item.referencePrice,
            })),
          );

          plan.items.forEach((plannedItem, index) => {
            const requestedItem = missing[index];
            const key = String(requestedItem?.key || plannedItem.key || "");
            if (!key) return;

            cache[key] = {
              key,
              label: requestedItem.label || plannedItem.label,
              image: plannedItem.selected?.image || null,
              name: plannedItem.selected?.name || null,
              link: plannedItem.selected?.link || null,
            };
          });

          await writeItemPreviewsCache(cache);
        }

        return sendJson(response, {
          previews: requested
            .map((item) => cache[String(item.key || "")])
            .filter(Boolean),
        });
      }

      if (url.pathname === "/api/plan" && request.method === "POST") {
        const body = await readJson(request);
        const plan = await planCart(body.items || defaultItems());
        return sendJson(response, plan);
      }

      if (url.pathname === "/api/historical-items/remove" && request.method === "POST") {
        const body = await readJson(request);
        const key = String(body.key || "");

        if (!key) {
          return sendJson(response, { error: "Item invalido." }, 400);
        }

        const removedKeys = await readRemovedHistoricalItemKeys();
        removedKeys.add(key);
        await writeRemovedHistoricalItemKeys(removedKeys);

        return sendJson(response, { ok: true, removed: [...removedKeys] });
      }

      if (url.pathname === "/api/historical-items/add-link" && request.method === "POST") {
        const body = await readJson(request);
        const item = await resolveProductFromUrl(body.url);

        if (!body.dryRun) {
          const extraItems = await readExtraHistoricalItems();
          const existingIndex = extraItems.findIndex((candidate) => candidate.key === item.key);

          if (existingIndex >= 0) {
            extraItems[existingIndex] = { ...extraItems[existingIndex], ...item };
          } else {
            extraItems.push(item);
          }

          await writeExtraHistoricalItems(extraItems);
        }

        return sendJson(response, { item, saved: !body.dryRun });
      }

      if (url.pathname.startsWith("/api/")) {
        return sendJson(response, { error: "Rota nao encontrada." }, 404);
      }

      return serveStatic(response, url.pathname);
    } catch (error) {
      const statusCode = Number(error.statusCode || 500);
      if (statusCode >= 500) {
        console.error(error);
      }
      return sendJson(
        response,
        { error: error.message || "Erro inesperado no servidor." },
        statusCode,
      );
    }
  });
}

if (isMainModule()) {
  const server = createAppServer();
  server.listen(port, () => {
    console.log(`Auto Compras rodando em http://localhost:${port}`);
  });
}

async function readJson(request) {
  const chunks = [];

  for await (const chunk of request) {
    chunks.push(chunk);
  }

  const text = Buffer.concat(chunks).toString("utf8");
  return text ? JSON.parse(text) : {};
}

async function readRemovedHistoricalItemKeys() {
  try {
    const text = await readFile(removedItemsPath, "utf8");
    const parsed = JSON.parse(text);
    return new Set(Array.isArray(parsed.removedKeys) ? parsed.removedKeys : []);
  } catch (error) {
    if (error.code === "ENOENT") {
      return new Set();
    }

    throw error;
  }
}

async function writeRemovedHistoricalItemKeys(keys) {
  await mkdir(dataDir, { recursive: true });
  await writeFile(
    removedItemsPath,
    `${JSON.stringify({ removedKeys: [...keys].sort() }, null, 2)}\n`,
    "utf8",
  );
}

async function readExtraHistoricalItems() {
  try {
    const text = await readFile(extraItemsPath, "utf8");
    const parsed = JSON.parse(text);
    return Array.isArray(parsed.items) ? parsed.items : [];
  } catch (error) {
    if (error.code === "ENOENT") {
      return [];
    }

    throw error;
  }
}

async function writeExtraHistoricalItems(items) {
  await mkdir(dataDir, { recursive: true });
  await writeFile(
    extraItemsPath,
    `${JSON.stringify({ items: dedupeExtraItems(items) }, null, 2)}\n`,
    "utf8",
  );
}

function dedupeExtraItems(items) {
  const byKey = new Map();

  for (const item of items) {
    if (!item?.key) continue;
    byKey.set(item.key, item);
  }

  return [...byKey.values()].sort((a, b) =>
    String(a.label || "").localeCompare(String(b.label || ""), "pt-BR"),
  );
}

async function readItemPreviewsCache() {
  try {
    const text = await readFile(itemPreviewsPath, "utf8");
    const parsed = JSON.parse(text);
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : {};
  } catch (error) {
    if (error.code === "ENOENT") {
      return {};
    }

    throw error;
  }
}

async function writeItemPreviewsCache(cache) {
  await mkdir(dataDir, { recursive: true });
  await writeFile(itemPreviewsPath, `${JSON.stringify(cache, null, 2)}\n`, "utf8");
}

async function serveStatic(response, pathname) {
  const requested = pathname === "/" ? "/index.html" : pathname;
  const normalizedPath = normalize(decodeURIComponent(requested))
    .replace(/^[/\\]+/, "")
    .replace(/^(\.\.[/\\])+/, "");
  const filePath = join(publicDir, normalizedPath);

  if (!filePath.startsWith(publicDir)) {
    return sendText(response, "Acesso negado.", 403);
  }

  try {
    const content = await readFile(filePath);
    const contentType = mimeTypes[extname(filePath)] || "application/octet-stream";
    response.writeHead(200, {
      "content-type": contentType,
      "cache-control": "no-store",
      "access-control-allow-origin": "*",
    });
    response.end(content);
  } catch {
    sendText(response, "Pagina nao encontrada.", 404);
  }
}

function sendJson(response, data, status = 200) {
  response.writeHead(status, {
    "content-type": "application/json; charset=utf-8",
    "cache-control": "no-store",
  });
  response.end(JSON.stringify(data));
}

function sendText(response, text, status = 200) {
  response.writeHead(status, {
    "content-type": "text/plain; charset=utf-8",
    "cache-control": "no-store",
  });
  response.end(text);
}

function isMainModule() {
  return process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
}
