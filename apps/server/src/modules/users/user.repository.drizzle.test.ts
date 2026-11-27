import { v7 } from 'uuid';
import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import { createTestDb, resetDb } from '../../test/db.ts';
import { DrizzleUserRepository } from './user.repository.drizzle.ts';
import { EmailTakenError } from './users.errors.ts';
import type { User } from './users.types.ts';

const { db, close } = createTestDb();
const repository = new DrizzleUserRepository(db);

beforeEach(() => resetDb(db));
afterAll(close);

function newUser(overrides: Partial<User> = {}): User {
  const now = new Date('2026-11-27T10:00:00Z');
  return {
    id: v7(),
    role: 'user',
    email: 'ana@example.com',
    displayName: 'Ana',
    locale: 'fr',
    preferences: {},
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

describe('DrizzleUserRepository', () => {
  it("relit l'utilisateur inséré, sans son hash de mot de passe", async () => {
    const user = newUser();
    await repository.insert(user, 'hash');

    const found = await repository.findById(user.id);
    expect(found).toEqual(user);
    expect(found).not.toHaveProperty('passwordHash');
  });

  it('renvoie null pour un identifiant inconnu', async () => {
    expect(await repository.findById(v7())).toBeNull();
  });

  it('lève EmailTakenError pour un email déjà pris', async () => {
    await repository.insert(newUser(), 'hash');
    await expect(repository.insert(newUser(), 'hash')).rejects.toBeInstanceOf(EmailTakenError);
  });

  it('lève EmailTakenError pour le même email avec une autre casse', async () => {
    await repository.insert(newUser(), 'hash');
    await expect(
      repository.insert(newUser({ email: 'ANA@Example.com' }), 'hash'),
    ).rejects.toBeInstanceOf(EmailTakenError);
  });

  it("trouve les identifiants quelle que soit la casse de l'email", async () => {
    const user = newUser();
    await repository.insert(user, 'hash');

    expect(await repository.findCredentialsByEmail('Ana@EXAMPLE.com')).toEqual({
      userId: user.id,
      passwordHash: 'hash',
    });
    expect(await repository.findCredentialsByEmail('nobody@example.com')).toBeNull();
  });
});
