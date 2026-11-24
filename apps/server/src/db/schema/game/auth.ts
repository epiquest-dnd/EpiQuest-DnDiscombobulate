import { index, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { game } from '../namespaces.ts';
import { app_user } from './users.ts';

// Tables du module auth (ADR-0008).

export const clientEnum = game.enum('auth_client', ['web', 'mobile']);

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
