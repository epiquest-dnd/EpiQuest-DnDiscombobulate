import type { Db } from '../../db/client.ts';
import type { Session } from './auth.types.ts';
import type { SessionRepository } from './session.repository.ts';
import { auth_session } from '../../db/schema/index.ts';
import { and, eq, isNull } from 'drizzle-orm';

export class DrizzleSessionRepository implements SessionRepository {
  private readonly db: Db;

  constructor(db: Db) {
    this.db = db;
  }

  async insert(session: Session): Promise<void> {
    await this.db.insert(auth_session).values(session);
  }

  async findByTokenHash(tokenHash: string): Promise<Session | null> {
    const [session] = await this.db
      .select()
      .from(auth_session)
      .where(eq(auth_session.tokenHash, tokenHash))
      .limit(1);
    return session ?? null;
  }

  async revoke(id: string, revokedAt: Date): Promise<void> {
    await this.db
      .update(auth_session)
      .set({ revokedAt })
      .where(and(eq(auth_session.id, id), isNull(auth_session.revokedAt)));
  }
}
