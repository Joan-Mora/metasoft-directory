/**
 * © Joan Mora — Proprietary. See LICENSE.
 *
 * Clave de sitio: hostname normalizado (sin www, minúsculas).
 * Así https://abacore.co y https://abacore.co/inicio cuentan como el mismo sitio.
 */

export function siteKeyFromUrl(raw?: string | null): string {
  if (!raw || !String(raw).trim()) return '';
  const input = String(raw).trim();
  try {
    const withProto = /^[a-z][a-z0-9+.-]*:/i.test(input) ? input : `https://${input}`;
    const u = new URL(withProto);
    if (!u.hostname) return '';
    let host = u.hostname.toLowerCase();
    if (host.startsWith('www.')) host = host.slice(4);
    return host;
  } catch {
    return '';
  }
}

export function sameSite(a?: string | null, b?: string | null): boolean {
  const ka = siteKeyFromUrl(a);
  const kb = siteKeyFromUrl(b);
  return Boolean(ka && kb && ka === kb);
}
