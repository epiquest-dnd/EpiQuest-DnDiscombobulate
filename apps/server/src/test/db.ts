import { sql } from 'drizzle-orm';
import { inject } from 'vitest';
import { createDb, type Db } from '../db/client.ts';

// Base de test (TEST_DATABASE_URL), préparée par global-setup.ts.
// Usage dans un fichier de test :
//   const { db, close } = createTestDb();
//   beforeEach(() => resetDb(db));
//   afterAll(close);
export function createTestDb() {
  return createDb(inject('testDatabaseUrl'));
}

// Vide toutes les tables des schémas game et rules, sans toucher aux migrations.
export async function resetDb(db: Db) {
  const { rows } = await db.execute<{ name: string }>(sql`
    SELECT format('%I.%I', schemaname, tablename) AS name
    FROM pg_tables
    WHERE schemaname IN ('game', 'rules')
  `);
  if (rows.length === 0) {
    return;
  }
  const tables = rows.map((row) => row.name).join(', ');
  await db.execute(sql.raw(`TRUNCATE ${tables} RESTART IDENTITY CASCADE`));
}
