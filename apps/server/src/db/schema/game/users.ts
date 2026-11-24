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
  id: uuid('id').primaryKey(),
  role: rolesEnum('role').notNull().default('user'),
  email: citext('email').notNull().unique(),
  password_hash: text('password_hash').notNull(),
  display_name: text('display_name').notNull(),
  locale: text('locale').notNull().default('en'),
  preferences: jsonb('preferences').notNull().default('{}'),
  created_at: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updated_at: timestamp('updated_at', { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date(Date.now())),
});
