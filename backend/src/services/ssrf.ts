/**
 * © Joan Mora — Proprietary. See LICENSE.
 */
import dns from 'dns/promises';
import net from 'net';

function isPrivateIp(ip: string): boolean {
  if (ip === '::1' || ip === '0.0.0.0') return true;
  if (ip.startsWith('127.') || ip.startsWith('10.') || ip.startsWith('192.168.')) return true;
  if (ip.startsWith('169.254.')) return true;
  const parts = ip.split('.').map(Number);
  if (parts.length === 4 && parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) return true;
  if (ip.startsWith('fc') || ip.startsWith('fd') || ip.startsWith('fe80')) return true;
  return false;
}

export async function assertSafeUrl(raw: string): Promise<URL> {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    throw new Error('URL inválida');
  }
  if (!['http:', 'https:'].includes(url.protocol)) {
    throw new Error('Solo se permiten URLs http(s)');
  }
  if (url.username || url.password) {
    throw new Error('Credenciales en URL no permitidas');
  }

  const hostname = url.hostname;
  if (hostname === 'localhost' || hostname.endsWith('.local')) {
    throw new Error('Hosts locales no permitidos');
  }

  if (net.isIP(hostname)) {
    if (isPrivateIp(hostname)) throw new Error('IP privada no permitida');
    return url;
  }

  const records = await dns.lookup(hostname, { all: true });
  for (const r of records) {
    if (isPrivateIp(r.address)) {
      throw new Error('La URL resuelve a una red privada');
    }
  }
  return url;
}
