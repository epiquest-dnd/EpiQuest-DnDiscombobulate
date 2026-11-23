import { sql } from 'drizzle-orm';
import { afterAll, describe, expect, it } from 'vitest';
import { createTestDb, resetDb } from './db.ts';

const { db, close } = createTestDb();

afterAll(close);

describe('base de test', () => {
  it('se connecte à la base de test, jamais à celle de dev', async () => {
    const { rows } = await db.execute<{ name: string }>(sql`SELECT current_database() AS name`);
    expect(rows[0]?.name).toMatch(/_test$/);
  });

  it('se vide sans erreur', async () => {
    await expect(resetDb(db)).resolves.toBeUndefined();
  });
});
