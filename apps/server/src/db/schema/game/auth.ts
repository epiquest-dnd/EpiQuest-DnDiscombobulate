import { index, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { game } from '../namespaces.ts';
import { app_user } from './users.ts';

// Tables du module auth (ADR-0008).

export const clientEnum = game.enum('auth_client', ['web', 'mobile']);

export const auth_session = game.table(
  'auth_session',
  {
    id: uuid().primaryKey(),
    userId: uuid()
      .notNull()
      .references(() => app_user.id, { onDelete: 'cascade' }),
    tokenHash: text().notNull().unique('auth_session_token_hash_unique'),
    client: clientEnum().notNull(),
    expiresAt: timestamp({ withTimezone: true }).notNull(),
    revokedAt: timestamp({ withTimezone: true }),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp({ withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date(Date.now())),
  },
  (table) => [index('auth_session_user_id_idx').on(table.userId)],
);
