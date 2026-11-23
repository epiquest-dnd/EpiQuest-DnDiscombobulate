import { drizzle } from 'drizzle-orm/node-postgres';
import pg from 'pg';
import * as schema from './schema/index.ts';

export function createDb(url: string) {
  const pool = new pg.Pool({ connectionString: url });
  const db = drizzle({ client: pool, schema, casing: 'snake_case' });
  return { db, close: () => pool.end() };
}

export type Db = ReturnType<typeof createDb>['db'];
