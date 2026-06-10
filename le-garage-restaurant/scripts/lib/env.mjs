import fs from "node:fs";
import path from "node:path";

const defaults = {
  PUBLIC_SITE_URL: "https://legaragerestaurant.ma",
  PUBLIC_BASE_PATH: "/le-garage-restaurant",
  PUBLIC_RESERVATION_EMAIL: "contact@legaragerestaurant.ma",
  PUBLIC_PHONE_E164: "+212668608754",
  PUBLIC_PHONE_DISPLAY: "+212 6 68 60 87 54",
  HOST: "127.0.0.1",
  PORT: "4321"
};

export function loadEnv(rootDir, mode = process.env.NODE_ENV || "development") {
  const fileEnv = {};
  const files = [
    ".env",
    `.env.${mode}`,
    ".env.local",
    `.env.${mode}.local`
  ];

  for (const file of files) {
    const filePath = path.join(rootDir, file);
    if (!fs.existsSync(filePath)) {
      continue;
    }

    Object.assign(fileEnv, parseEnv(fs.readFileSync(filePath, "utf8")));
  }

  return {
    ...defaults,
    ...fileEnv,
    ...process.env
  };
}

export function getPublicConfig(rootDir, mode = process.env.NODE_ENV || "development") {
  const env = loadEnv(rootDir, mode);
  const basePath = normalizeBasePath(env.PUBLIC_BASE_PATH);
  const siteUrl = trimTrailingSlash(env.PUBLIC_SITE_URL);
  const canonicalUrl = `${siteUrl}${basePath === "/" ? "/" : `${basePath}/`}`;

  return {
    mode,
    siteUrl,
    basePath,
    canonicalUrl,
    reservationEmail: env.PUBLIC_RESERVATION_EMAIL,
    phoneE164: normalizePhoneHref(env.PUBLIC_PHONE_E164),
    phoneDisplay: env.PUBLIC_PHONE_DISPLAY,
    host: env.HOST,
    port: Number.parseInt(env.PORT, 10) || Number.parseInt(defaults.PORT, 10)
  };
}

export function normalizeBasePath(value) {
  const normalized = String(value || defaults.PUBLIC_BASE_PATH).trim();
  if (!normalized || normalized === "/") {
    return "/";
  }

  return `/${normalized.replace(/^\/+|\/+$/g, "")}`;
}

function normalizePhoneHref(value) {
  return String(value || defaults.PUBLIC_PHONE_E164).replace(/[^\d+]/g, "");
}

function trimTrailingSlash(value) {
  return String(value || defaults.PUBLIC_SITE_URL).replace(/\/+$/g, "");
}

function parseEnv(source) {
  const values = {};

  for (const rawLine of source.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) {
      continue;
    }

    const separatorIndex = line.indexOf("=");
    if (separatorIndex === -1) {
      continue;
    }

    const key = line.slice(0, separatorIndex).trim();
    let value = line.slice(separatorIndex + 1).trim();

    if (
      (value.startsWith("\"") && value.endsWith("\"")) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    values[key] = value;
  }

  return values;
}
