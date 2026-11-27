import { existsSync } from 'node:fs';
import { defineConfig } from 'drizzle-kit';

if (existsSync('../../.env')) {
  process.loadEnvFile('../../.env');
}

// Les migrations SQL générées sont commitées dans drizzle/ et appliquées dans l'ordre.
export default defineConfig({
  dialect: 'postgresql',
  schema: './src/db/schema/index.ts',
  out: './drizzle',
  schemaFilter: ['game', 'rules'],
  casing: 'snake_case',
  dbCredentials: {
    url: process.env.DATABASE_URL ?? '',
  },
});
