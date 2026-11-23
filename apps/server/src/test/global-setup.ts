import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import pg from 'pg';
import type { TestProject } from 'vitest/node';

const envFile = fileURLToPath(new URL('../../../../.env', import.meta.url));
const migrationsFolder = fileURLToPath(new URL('../../drizzle', import.meta.url));

export default async function setup(project: TestProject) {
  if (existsSync(envFile)) {
    process.loadEnvFile(envFile);
  }
  const url = process.env.TEST_DATABASE_URL;
  if (!url) {
    throw new Error('TEST_DATABASE_URL is not set (see .env.example)');
  }

  await createDatabaseIfMissing(url);

  // Pas encore de migration : rien à appliquer.
  if (existsSync(`${migrationsFolder}/meta/_journal.json`)) {
    const pool = new pg.Pool({ connectionString: url });
    try {
      await migrate(drizzle({ client: pool }), { migrationsFolder });
    } finally {
      await pool.end();
    }
  }

  project.provide('testDatabaseUrl', url);
}

async function createDatabaseIfMissing(url: string) {
  const name = new URL(url).pathname.slice(1);
  if (!/^[a-z_][a-z0-9_]*$/.test(name)) {
    throw new Error(`Invalid test database name: ${name}`);
  }

  const adminUrl = new URL(url);
  adminUrl.pathname = '/postgres';
  const client = new pg.Client({ connectionString: adminUrl.toString() });
  try {
    await client.connect();
  } catch (err) {
    throw new Error('Cannot reach PostgreSQL for tests: run `npm run db:up` first', { cause: err });
  }
  try {
    const { rowCount } = await client.query('SELECT 1 FROM pg_database WHERE datname = $1', [name]);
    if (rowCount === 0) {
      await client.query(`CREATE DATABASE "${name}"`);
    }
  } finally {
    await client.end();
  }
}

declare module 'vitest' {
  export interface ProvidedContext {
    testDatabaseUrl: string;
  }
}
