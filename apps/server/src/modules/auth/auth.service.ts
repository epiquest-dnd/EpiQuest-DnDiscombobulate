import type { UsersService } from '../users/users.service.ts';
import type {
  AuthenticatedSession,
  AuthResult,
  LoginInput,
  RegisterInput,
  SessionClient,
} from './auth.types.ts';
import type { SessionRepository } from './session.repository.ts';
import {
  generateSessionToken,
  hashPassword,
  hashSessionToken,
  verifyPassword,
} from './auth.crypto.ts';
import { v7 } from 'uuid';
import { InvalidCredentialsError } from './auth.errors.ts';

const SESSION_DURATION_MS = 7 * 24 * 60 * 60 * 1000;

export class AuthService {
  private readonly usersService: UsersService;
  private readonly sessionRepository: SessionRepository;
  private readonly now: () => Date;

  constructor(
    usersService: UsersService,
    sessionRepository: SessionRepository,
    now: () => Date = () => new Date(),
  ) {
    this.usersService = usersService;
    this.sessionRepository = sessionRepository;
    this.now = now;
  }

  async register(input: RegisterInput, client: SessionClient): Promise<AuthResult> {
    const hashedPassword = await hashPassword(input.password);
    const user = await this.usersService.createWithPassword(
      {
        email: input.email,
        displayName: input.displayName,
        locale: input.locale,
      },
      hashedPassword,
    );
    const { token, expiresAt } = await this.openSession(user.id, client);
    return { user, token, expiresAt };
  }

  async login(input: LoginInput, client: SessionClient): Promise<AuthResult> {
    const credentials = await this.usersService.findCredentialsByEmail(input.email);
    if (!credentials || !(await verifyPassword(credentials.passwordHash, input.password))) {
      throw new InvalidCredentialsError();
    }
    const user = await this.usersService.findById(credentials.userId);
    if (!user) {
      throw new InvalidCredentialsError();
    }
    const { token, expiresAt } = await this.openSession(user.id, client);
    return { user, token, expiresAt };
  }

  async logout(sessionId: string): Promise<void> {
    await this.sessionRepository.revoke(sessionId, this.now());
  }

  async authenticate(token: string): Promise<AuthenticatedSession | null> {
    const session = await this.sessionRepository.findByTokenHash(hashSessionToken(token));
    if (!session || session.revokedAt || session.expiresAt <= this.now()) {
      return null;
    }

    return { sessionId: session.id, userId: session.userId };
  }
  private async openSession(
    userId: string,
    client: SessionClient,
  ): Promise<{ token: string; expiresAt: Date }> {
    const now = this.now();
    const expiresAt = new Date(now.getTime() + SESSION_DURATION_MS);
    const token = generateSessionToken();
    await this.sessionRepository.insert({
      id: v7(),
      userId: userId,
      client: client,
      tokenHash: hashSessionToken(token),
      expiresAt: expiresAt,
      createdAt: now,
      updatedAt: now,
      revokedAt: null,
    });
    return { token, expiresAt };
  }
}
