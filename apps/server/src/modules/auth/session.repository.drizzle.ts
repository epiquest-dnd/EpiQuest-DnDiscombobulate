import type { Db } from '../../db/client.ts';
import type { Session } from './auth.types.ts';
import type { SessionRepository } from './session.repository.ts';

export class DrizzleSessionRepository implements SessionRepository {
  private readonly db: Db;

  constructor(db: Db) {
    this.db = db;
  }

  async insert(_session: Session): Promise<void> {
    throw new Error('Not implemented');
  }

  async findByTokenHash(_tokenHash: string): Promise<Session | null> {
    throw new Error('Not implemented');
  }

  async revoke(_id: string, _revokedAt: Date): Promise<void> {
    throw new Error('Not implemented');
  }
}
