/**
 * Optional password protection for backup files (0.4.3). WebCrypto only, nothing leaves the device:
 * PBKDF2-SHA256 derives an AES-GCM key from the password; the backup JSON is the ciphertext.
 * The envelope is plain JSON, so the file stays a ".json" that the restore picker accepts.
 */

export const PASSWORD_MIN = 8;
/** OWASP 2023 recommendation for PBKDF2-HMAC-SHA256. */
const ITERATIONS = 600_000;
/** Accepted range on import, so a crafted file cannot make the phone hash for minutes. */
const MIN_ITERATIONS = 100_000;
const MAX_ITERATIONS = 2_000_000;
const SALT_BYTES = 16;
const IV_BYTES = 12;

export interface EncryptedEnvelope {
  app: 'babytime';
  encrypted: 1;
  kdf: 'PBKDF2-SHA256';
  iterations: number;
  salt: string; // base64
  iv: string; // base64
  data: string; // base64 AES-GCM ciphertext of the backup JSON
}

/** Wrong password or damaged file; AES-GCM cannot tell the two apart. */
export class DecryptError extends Error {}

function toBase64(bytes: Uint8Array): string {
  let binary = '';
  const CHUNK = 0x8000;
  for (let i = 0; i < bytes.length; i += CHUNK) binary += String.fromCharCode(...bytes.subarray(i, i + CHUNK));
  return btoa(binary);
}

function fromBase64(text: string): Uint8Array<ArrayBuffer> | undefined {
  try {
    const binary = atob(text);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    return bytes;
  } catch {
    return undefined;
  }
}

async function deriveKey(password: string, salt: Uint8Array<ArrayBuffer>, iterations: number): Promise<CryptoKey> {
  const material = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveKey']);
  return crypto.subtle.deriveKey({ name: 'PBKDF2', hash: 'SHA-256', salt, iterations }, material, { name: 'AES-GCM', length: 256 }, false, [
    'encrypt',
    'decrypt',
  ]);
}

export async function encryptBackup(plainJson: string, password: string): Promise<EncryptedEnvelope> {
  const salt = crypto.getRandomValues(new Uint8Array(SALT_BYTES));
  const iv = crypto.getRandomValues(new Uint8Array(IV_BYTES));
  const key = await deriveKey(password, salt, ITERATIONS);
  const cipher = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, new TextEncoder().encode(plainJson));
  return {
    app: 'babytime',
    encrypted: 1,
    kdf: 'PBKDF2-SHA256',
    iterations: ITERATIONS,
    salt: toBase64(salt),
    iv: toBase64(iv),
    data: toBase64(new Uint8Array(cipher)),
  };
}

/** The envelope if `text` is an encrypted Baby Time backup with sane parameters, otherwise undefined. */
export function readEnvelope(text: string): EncryptedEnvelope | undefined {
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    return undefined;
  }
  if (typeof data !== 'object' || data === null || Array.isArray(data)) return undefined;
  const r = data as Record<string, unknown>;
  const has = (key: string) => Object.prototype.hasOwnProperty.call(r, key);
  if (!has('encrypted') || r['app'] !== 'babytime' || r['encrypted'] !== 1 || r['kdf'] !== 'PBKDF2-SHA256') return undefined;
  const { iterations, salt, iv, data: payload } = r;
  if (typeof iterations !== 'number' || !Number.isInteger(iterations) || iterations < MIN_ITERATIONS || iterations > MAX_ITERATIONS) return undefined;
  if (typeof salt !== 'string' || typeof iv !== 'string' || typeof payload !== 'string') return undefined;
  if (fromBase64(salt)?.length !== SALT_BYTES || fromBase64(iv)?.length !== IV_BYTES) return undefined;
  return { app: 'babytime', encrypted: 1, kdf: 'PBKDF2-SHA256', iterations, salt, iv, data: payload };
}

/** Returns the backup JSON. Throws DecryptError for a wrong password or a damaged file. */
export async function decryptBackup(envelope: EncryptedEnvelope, password: string): Promise<string> {
  const salt = fromBase64(envelope.salt);
  const iv = fromBase64(envelope.iv);
  const payload = fromBase64(envelope.data);
  if (!salt || !iv || !payload) throw new DecryptError();
  try {
    const key = await deriveKey(password, salt, envelope.iterations);
    const plain = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, payload);
    return new TextDecoder().decode(plain);
  } catch {
    throw new DecryptError();
  }
}
