const defaultEmail = "contact@legaragerestaurant.ma";
const defaultPhoneHref = "+212668608754";
const defaultPhoneDisplay = "+212 6 68 60 87 54";

export function renderIndexHtml(sourceHtml, config) {
  const publicConfig = {
    mode: config.mode,
    siteUrl: config.siteUrl,
    basePath: config.basePath,
    canonicalUrl: config.canonicalUrl,
    reservationEmail: config.reservationEmail,
    phoneE164: config.phoneE164,
    phoneDisplay: config.phoneDisplay
  };

  let html = sourceHtml
    .replaceAll(`mailto:${defaultEmail}`, `mailto:${config.reservationEmail}`)
    .replaceAll(defaultEmail, config.reservationEmail)
    .replaceAll(`tel:${defaultPhoneHref}`, `tel:${config.phoneE164}`)
    .replaceAll(defaultPhoneDisplay, config.phoneDisplay);

  if (!/window\.GARAGE_ENV\s*=/.test(html)) {
    const configScript = JSON.stringify(publicConfig).replace(/</g, "\\u003c");
    html = html.replace(
      "</head>",
      `  <link rel="canonical" href="${escapeAttribute(config.canonicalUrl)}">\n  <script>window.GARAGE_ENV=${configScript};</script>\n</head>`
    );
  }

  return html;
}

function escapeAttribute(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("\"", "&quot;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}
