/**
 * © Joan Mora — Proprietary. See LICENSE.
 */
import crypto from 'crypto';
import { config } from '../config.js';

const ALGO = 'aes-256-gcm';

function getKey(): Buffer {
  return Buffer.from(config.DATA_ENCRYPTION_KEY, 'hex');
}

/** Encrypt plaintext → `iv:tag:ciphertext` (hex). */
export function encryptField(plain: string): string {
  if (!plain) return plain;
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(ALGO, getKey(), iv);
  const enc = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${iv.toString('hex')}:${tag.toString('hex')}:${enc.toString('hex')}`;
}

export function decryptField(payload: string): string {
  if (!payload || !payload.includes(':')) return payload;
  const [ivHex, tagHex, dataHex] = payload.split(':');
  if (!ivHex || !tagHex || !dataHex) return payload;
  try {
    const decipher = crypto.createDecipheriv(ALGO, getKey(), Buffer.from(ivHex, 'hex'));
    decipher.setAuthTag(Buffer.from(tagHex, 'hex'));
    const dec = Buffer.concat([
      decipher.update(Buffer.from(dataHex, 'hex')),
      decipher.final(),
    ]);
    return dec.toString('utf8');
  } catch {
    return payload;
  }
}

export function looksEncrypted(value: string): boolean {
  return /^[0-9a-f]{24}:[0-9a-f]{32}:[0-9a-f]+$/i.test(value);
}
