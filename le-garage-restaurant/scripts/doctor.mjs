import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { getPublicConfig } from "./lib/env.mjs";
import { renderIndexHtml } from "./lib/html.mjs";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const config = getPublicConfig(rootDir, process.env.NODE_ENV || "production");
const errors = [];

const sourceHtml = await fs.readFile(path.join(rootDir, "index.html"), "utf8");
const renderedHtml = renderIndexHtml(sourceHtml, config);

checkConfig(config);
await checkStaticReferences(sourceHtml);
checkProductionCopy(renderedHtml);

if (errors.length) {
  console.error("Verification echouee:");
  for (const error of errors) {
    console.error(`- ${error}`);
  }
  process.exit(1);
}

console.log("Verification OK");
console.log(`Base path: ${config.basePath}`);
console.log(`URL prod: ${config.canonicalUrl}`);

function checkConfig(publicConfig) {
  try {
    new URL(publicConfig.siteUrl);
  } catch {
    errors.push(`PUBLIC_SITE_URL invalide: ${publicConfig.siteUrl}`);
  }

  if (!publicConfig.basePath.startsWith("/")) {
    errors.push(`PUBLIC_BASE_PATH doit commencer par /: ${publicConfig.basePath}`);
  }

  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(publicConfig.reservationEmail)) {
    errors.push(`PUBLIC_RESERVATION_EMAIL invalide: ${publicConfig.reservationEmail}`);
  }

  if (!/^\+\d{8,15}$/.test(publicConfig.phoneE164)) {
    errors.push(`PUBLIC_PHONE_E164 invalide: ${publicConfig.phoneE164}`);
  }
}

async function checkStaticReferences(html) {
  const references = collectLocalReferences(html);

  for (const reference of references) {
    const filePath = path.join(rootDir, reference);
    try {
      await fs.access(filePath);
    } catch {
      errors.push(`Fichier reference introuvable: ${reference}`);
    }
  }
}

function checkProductionCopy(html) {
  if (html.includes("Ce prototype")) {
    errors.push("Le texte de formulaire contient encore une mention prototype.");
  }

  if (!/window\.GARAGE_ENV\s*=/.test(html)) {
    errors.push("La configuration publique n'est pas injectee dans le HTML rendu.");
  }
}

function collectLocalReferences(html) {
  const references = new Set();
  const patterns = [
    /\s(?:src|href)=["']([^"']+)["']/g,
    /url\(["']?([^"')]+)["']?\)/g
  ];

  for (const pattern of patterns) {
    let match;
    while ((match = pattern.exec(html))) {
      const reference = normalizeReference(match[1]);
      if (reference) {
        references.add(reference);
      }
    }
  }

  return references;
}

function normalizeReference(reference) {
  const value = reference.trim();

  if (
    !value ||
    value.startsWith("#") ||
    value.startsWith("http://") ||
    value.startsWith("https://") ||
    value.startsWith("mailto:") ||
    value.startsWith("tel:") ||
    value.startsWith("data:")
  ) {
    return null;
  }

  return value
    .split("#")[0]
    .split("?")[0]
    .replace(/^\/+/, "");
}
