import { v7 } from 'uuid';
import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import { createTestDb, resetDb } from '../../test/db.ts';
import { DrizzleUserRepository } from '../users/user.repository.drizzle.ts';
import type { Session } from './auth.types.ts';
import { DrizzleSessionRepository } from './session.repository.drizzle.ts';

const { db, close } = createTestDb();
const users = new DrizzleUserRepository(db);
const repository = new DrizzleSessionRepository(db);

const NOW = new Date('2026-11-27T10:00:00Z');
let userId: string;

beforeEach(async () => {
  await resetDb(db);
  userId = v7();
  await users.insert(
    {
      id: userId,
      role: 'user',
      email: 'ana@example.com',
      displayName: 'Ana',
      locale: 'fr',
      preferences: {},
      createdAt: NOW,
      updatedAt: NOW,
    },
    'hash',
  );
});

afterAll(close);

function newSession(overrides: Partial<Session> = {}): Session {
  return {
    id: v7(),
    userId,
    tokenHash: `hash-${v7()}`,
    client: 'web',
    expiresAt: new Date(NOW.getTime() + 60_000),
    revokedAt: null,
    createdAt: NOW,
    updatedAt: NOW,
    ...overrides,
  };
}

describe('DrizzleSessionRepository', () => {
  it("retrouve une session par l'empreinte de son jeton", async () => {
    const session = newSession();
    await repository.insert(session);

    expect(await repository.findByTokenHash(session.tokenHash)).toEqual(session);
  });

  it('renvoie null pour une empreinte inconnue', async () => {
    expect(await repository.findByTokenHash('unknown')).toBeNull();
  });

  it('révoque la session à la date donnée', async () => {
    const session = newSession();
    await repository.insert(session);

    const revokedAt = new Date(NOW.getTime() + 1_000);
    await repository.revoke(session.id, revokedAt);

    const found = await repository.findByTokenHash(session.tokenHash);
    expect(found?.revokedAt).toEqual(revokedAt);
  });

  it('garde la première date si la session est révoquée deux fois', async () => {
    const session = newSession();
    await repository.insert(session);

    const first = new Date(NOW.getTime() + 1_000);
    await repository.revoke(session.id, first);
    await repository.revoke(session.id, new Date(NOW.getTime() + 2_000));

    const found = await repository.findByTokenHash(session.tokenHash);
    expect(found?.revokedAt).toEqual(first);
  });
});
