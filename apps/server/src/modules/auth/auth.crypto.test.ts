import { describe, expect, it } from 'vitest';
import {
  generateSessionToken,
  hashPassword,
  hashSessionToken,
  verifyPassword,
} from './auth.crypto.ts';

describe('mots de passe', () => {
  it('hache en Argon2id avec les paramètres choisis', async () => {
    const hash = await hashPassword('correct horse');
    expect(hash).toMatch(/^\$argon2id\$v=19\$m=19456,t=2,p=1\$/);
  });

  it('accepte le bon mot de passe et refuse un autre', async () => {
    const hash = await hashPassword('correct horse');
    expect(await verifyPassword(hash, 'correct horse')).toBe(true);
    expect(await verifyPassword(hash, 'wrong horse')).toBe(false);
  });

  it('renvoie false pour un hash mal formé au lieu de lever une erreur', async () => {
    expect(await verifyPassword('not-a-hash', 'correct horse')).toBe(false);
  });
});

describe('jetons de session', () => {
  it('génère des jetons de 256 bits en base64url, tous différents', () => {
    const first = generateSessionToken();
    expect(first).toMatch(/^[A-Za-z0-9_-]{43}$/);
    expect(generateSessionToken()).not.toBe(first);
  });

  it("calcule l'empreinte SHA-256 en hexadécimal, toujours la même pour un jeton", () => {
    const token = generateSessionToken();
    expect(hashSessionToken(token)).toMatch(/^[0-9a-f]{64}$/);
    expect(hashSessionToken(token)).toBe(hashSessionToken(token));
    expect(hashSessionToken(token)).not.toBe(token);
  });
});
