import { customType, jsonb, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { game } from '../namespaces.ts';

// Tables du module users (ADR-0008).

const citext = customType<{ data: string }>({
  dataType() {
    return 'citext';
  },
});

export const rolesEnum = game.enum('user_role', ['admin', 'user']);

export const app_user = game.table('app_user', {
  id: uuid().primaryKey(),
  role: rolesEnum().notNull().default('user'),
  email: citext().notNull().unique(),
  passwordHash: text().notNull(),
  displayName: text().notNull(),
  locale: text().notNull().default('en'),
  preferences: jsonb().notNull().default('{}'),
  createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp({ withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date(Date.now())),
});
