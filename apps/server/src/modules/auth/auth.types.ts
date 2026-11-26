import type { User } from '../users/users.types.ts';

export type SessionClient = 'web' | 'mobile';

export type Session = {
  id: string;
  userId: string;
  tokenHash: string;
  client: SessionClient;
  expiresAt: Date;
  revokedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

export type RegisterInput = {
  email: string;
  password: string;
  displayName: string;
  locale?: string;
};

export type LoginInput = {
  email: string;
  password: string;
};

export type AuthResult = {
  user: User;
  token: string;
  expiresAt: Date;
};

export type AuthenticatedSession = {
  sessionId: string;
  userId: string;
};
