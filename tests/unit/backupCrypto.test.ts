import { describe, expect, it } from 'vitest';
import { decryptBackup, DecryptError, encryptBackup, readEnvelope } from '../../src/data/backupCrypto';

const PLAIN = JSON.stringify({ app: 'babytime', schemaVersion: 1, exportedAt: 1, profile: { babyName: 'Lena', onboarded: true }, events: [] });

describe('backup encryption', () => {
  it('round-trips with the right password and hides the content', async () => {
    const envelope = await encryptBackup(PLAIN, 'geheim123');
    const text = JSON.stringify(envelope);
    expect(text).not.toContain('Lena');
    const read = readEnvelope(text);
    expect(read).toBeDefined();
    expect(await decryptBackup(read!, 'geheim123')).toBe(PLAIN);
  });

  it('refuses a wrong password and a tampered file', async () => {
    const envelope = await encryptBackup(PLAIN, 'geheim123');
    await expect(decryptBackup(envelope, 'falsch123')).rejects.toBeInstanceOf(DecryptError);
    const bytes = atob(envelope.data);
    const flipped = String.fromCharCode(bytes.charCodeAt(0) ^ 1) + bytes.slice(1);
    await expect(decryptBackup({ ...envelope, data: btoa(flipped) }, 'geheim123')).rejects.toBeInstanceOf(DecryptError);
  });

  it('uses a fresh salt and IV per file', async () => {
    const [a, b] = await Promise.all([encryptBackup(PLAIN, 'geheim123'), encryptBackup(PLAIN, 'geheim123')]);
    expect(a.salt).not.toBe(b.salt);
    expect(a.iv).not.toBe(b.iv);
  });

  it('readEnvelope: plain backups, junk and out-of-range parameters are not envelopes', async () => {
    const envelope = await encryptBackup(PLAIN, 'geheim123');
    expect(readEnvelope(PLAIN)).toBeUndefined();
    expect(readEnvelope('kein json')).toBeUndefined();
    expect(readEnvelope(JSON.stringify({ ...envelope, iterations: 50_000_000 }))).toBeUndefined();
    expect(readEnvelope(JSON.stringify({ ...envelope, iterations: 1000 }))).toBeUndefined();
    expect(readEnvelope(JSON.stringify({ ...envelope, salt: 'AAAA' }))).toBeUndefined();
    expect(readEnvelope(JSON.stringify({ ...envelope, kdf: 'MD5' }))).toBeUndefined();
  });
});
