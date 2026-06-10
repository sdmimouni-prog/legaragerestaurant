import fs from "node:fs";
import fsp from "node:fs/promises";
import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { getPublicConfig } from "./lib/env.mjs";
import { renderIndexHtml } from "./lib/html.mjs";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const servePublic = process.argv.includes("--public");
const staticRoot = servePublic ? path.join(rootDir, "public") : rootDir;
const config = getPublicConfig(rootDir, process.env.NODE_ENV || "development");
const port = Number.parseInt(process.env.PORT, 10) || config.port || (servePublic ? 4173 : 4321);
const host = process.env.HOST || config.host || "127.0.0.1";

if (servePublic && !fs.existsSync(staticRoot)) {
  console.error("Le dossier public est absent. Lance d'abord `npm run build`.");
  process.exit(1);
}

const server = http.createServer(async (request, response) => {
  try {
    const requestUrl = new URL(request.url || "/", `http://${request.headers.host || `${host}:${port}`}`);
    const pathname = decodeURIComponent(requestUrl.pathname);

    if (pathname === "/" && config.basePath !== "/") {
      redirect(response, `${config.basePath}/`);
      return;
    }

    const filePath = resolveRequestPath(pathname);
    if (!filePath) {
      notFound(response);
      return;
    }

    const stat = await safeStat(filePath);
    if (!stat) {
      notFound(response);
      return;
    }

    const finalPath = stat.isDirectory() ? path.join(filePath, "index.html") : filePath;
    if (!isInside(staticRoot, finalPath)) {
      notFound(response);
      return;
    }

    if (path.basename(finalPath) === "index.html") {
      const html = await fsp.readFile(finalPath, "utf8");
      send(response, 200, "text/html; charset=utf-8", renderIndexHtml(html, config));
      return;
    }

    sendStream(response, finalPath);
  } catch (error) {
    response.writeHead(500, { "Content-Type": "text/plain; charset=utf-8" });
    response.end(error instanceof Error ? error.message : "Erreur serveur");
  }
});

server.listen(port, host, () => {
  console.log(`Le Garage Restaurant ${servePublic ? "preview" : "local"}:`);
  console.log(`http://${host}:${port}${config.basePath}/`);
});

function resolveRequestPath(pathname) {
  if (servePublic) {
    return safeJoin(staticRoot, pathname);
  }

  if (config.basePath === "/") {
    return safeJoin(staticRoot, pathname);
  }

  if (pathname === config.basePath || pathname === `${config.basePath}/`) {
    return path.join(staticRoot, "index.html");
  }

  if (pathname.startsWith(`${config.basePath}/`)) {
    return safeJoin(staticRoot, pathname.slice(config.basePath.length));
  }

  return null;
}

function sendStream(response, filePath) {
  response.writeHead(200, {
    "Content-Type": contentType(filePath),
    "Cache-Control": servePublic ? "public, max-age=3600" : "no-store"
  });
  fs.createReadStream(filePath).pipe(response);
}

function send(response, status, type, body) {
  response.writeHead(status, {
    "Content-Type": type,
    "Cache-Control": "no-store"
  });
  response.end(body);
}

function redirect(response, location) {
  response.writeHead(302, { Location: location });
  response.end();
}

function notFound(response) {
  response.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
  response.end("Not found");
}

async function safeStat(filePath) {
  try {
    return await fsp.stat(filePath);
  } catch {
    return null;
  }
}

function safeJoin(root, requestPath) {
  const relativePath = requestPath.replace(/^\/+/, "") || "index.html";
  const resolved = path.resolve(root, relativePath);
  return isInside(root, resolved) ? resolved : null;
}

function isInside(root, candidate) {
  const relative = path.relative(root, candidate);
  return Boolean(relative) ? !relative.startsWith("..") && !path.isAbsolute(relative) : true;
}

function contentType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  return {
    ".css": "text/css; charset=utf-8",
    ".gif": "image/gif",
    ".html": "text/html; charset=utf-8",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".js": "text/javascript; charset=utf-8",
    ".json": "application/json; charset=utf-8",
    ".png": "image/png",
    ".svg": "image/svg+xml",
    ".txt": "text/plain; charset=utf-8",
    ".webp": "image/webp",
    ".xml": "application/xml; charset=utf-8"
  }[ext] || "application/octet-stream";
}
