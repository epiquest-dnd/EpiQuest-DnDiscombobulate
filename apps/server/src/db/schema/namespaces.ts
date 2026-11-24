import { pgSchema } from 'drizzle-orm/pg-core';

// Schémas PostgreSQL game et rules, importés par les fichiers de tables (jamais par index.ts).
export const rules = pgSchema('rules');
export const game = pgSchema('game');
