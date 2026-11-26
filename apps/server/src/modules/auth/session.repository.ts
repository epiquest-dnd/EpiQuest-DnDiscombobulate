import type { Session } from './auth.types.ts';

export interface SessionRepository {
  insert(session: Session): Promise<void>;
  findByTokenHash(tokenHash: string): Promise<Session | null>;
  revoke(id: string, revokedAt: Date): Promise<void>;
}
