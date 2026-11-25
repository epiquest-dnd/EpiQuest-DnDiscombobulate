import type { UserRepository } from './user.repository.ts';
import type { Credentials, User } from './users.types.ts';
import type { Db } from '../../db/client.ts';
import { app_user } from '../../db/schema/index.ts';
import { eq } from 'drizzle-orm';
import { EmailTakenError } from './users.errors.ts';
import pg from 'pg';

export class DrizzleUserRepository implements UserRepository {
  private readonly db: Db;
  constructor(db: Db) {
    this.db = db;
  }

  async findById(id: string): Promise<User | null> {
    const [row] = await this.db.select().from(app_user).where(eq(app_user.id, id)).limit(1);
    if (!row) return null;
    const { passwordHash: _passwordHash, ...user } = row;
    return user;
  }

  async findCredentialsByEmail(email: string): Promise<Credentials | null> {
    const [credential] = await this.db
      .select({ userId: app_user.id, passwordHash: app_user.passwordHash })
      .from(app_user)
      .where(eq(app_user.email, email))
      .limit(1);
    return credential ?? null;
  }

  async insert(user: User, passwordHash: string): Promise<void> {
    try {
      await this.db.insert(app_user).values({ ...user, passwordHash });
    } catch (error) {
      const cause = error instanceof Error ? error.cause : undefined;
      if (
        cause instanceof pg.DatabaseError &&
        cause.code === '23505' &&
        cause.constraint === 'app_user_email_unique'
      ) {
        throw new EmailTakenError();
      }
      throw error;
    }
  }
}
