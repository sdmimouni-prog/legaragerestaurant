import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { getPublicConfig } from "./lib/env.mjs";
import { renderIndexHtml } from "./lib/html.mjs";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const outputDir = path.join(rootDir, "public");
const config = getPublicConfig(rootDir, process.env.NODE_ENV || "production");
const targetDir = config.basePath === "/"
  ? outputDir
  : path.join(outputDir, config.basePath.slice(1));

await fs.rm(outputDir, { recursive: true, force: true });
await fs.mkdir(targetDir, { recursive: true });

const sourceHtml = await fs.readFile(path.join(rootDir, "index.html"), "utf8");
await fs.writeFile(path.join(targetDir, "index.html"), renderIndexHtml(sourceHtml, config));
await fs.cp(path.join(rootDir, "assets"), path.join(targetDir, "assets"), { recursive: true });

if (config.basePath !== "/") {
  await fs.writeFile(path.join(outputDir, "index.html"), renderRedirect(config));
}

await fs.writeFile(path.join(outputDir, "robots.txt"), renderRobots(config));
await fs.writeFile(path.join(outputDir, "sitemap.xml"), renderSitemap(config));

console.log(`Build pret: ${path.relative(rootDir, targetDir) || "."}`);
console.log(`URL canonique: ${config.canonicalUrl}`);

function renderRedirect({ basePath, canonicalUrl }) {
  return `<!doctype html>
<html lang="fr">
<head>
  <meta charset="utf-8">
  <meta http-equiv="refresh" content="0; url=${basePath}/">
  <link rel="canonical" href="${canonicalUrl}">
  <title>Le Garage Restaurant</title>
</head>
<body>
  <a href="${basePath}/">Le Garage Restaurant</a>
</body>
</html>
`;
}

function renderRobots({ siteUrl }) {
  return `User-agent: *
Allow: /

Sitemap: ${siteUrl}/sitemap.xml
`;
}

function renderSitemap({ canonicalUrl }) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${canonicalUrl}</loc>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
  </url>
</urlset>
`;
}
