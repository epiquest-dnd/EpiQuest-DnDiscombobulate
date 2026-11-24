import { customType, index, jsonb, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { game } from '../namespaces.ts';

const citext = customType<{ data: string }>({
  dataType() {
    return 'citext';
  },
});

export const clientEnum = game.enum('auth_client', ['web', 'mobile']);

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

export const auth_session = game.table(
  'auth_session',
  {
    id: uuid('id').primaryKey(),
    user_id: uuid('user_id')
      .notNull()
      .references(() => app_user.id, { onDelete: 'cascade' }),
    token_hash: text('token_hash').notNull().unique(),
    client: clientEnum('client').notNull(),
    expires_at: timestamp('expires_at', { withTimezone: true }).notNull(),
    revoked_at: timestamp('revoked_at', { withTimezone: true }),
    created_at: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updated_at: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date(Date.now())),
  },
  (table) => [
    // PostgreSQL n'indexe pas les clés étrangères : suppression en cascade et révocation de toutes les sessions d'un compte.
    index('auth_session_user_id_idx').on(table.user_id),
  ],
);
