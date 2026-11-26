import type { UsersService } from '../users/users.service.ts';
import type {
  AuthenticatedSession,
  AuthResult,
  LoginInput,
  RegisterInput,
  SessionClient,
} from './auth.types.ts';
import type { SessionRepository } from './session.repository.ts';

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

  async register(_input: RegisterInput, _client: SessionClient): Promise<AuthResult> {
    throw new Error('Not implemented');
  }

  async login(_input: LoginInput, _client: SessionClient): Promise<AuthResult> {
    throw new Error('Not implemented');
  }

  async logout(_sessionId: string): Promise<void> {
    throw new Error('Not implemented');
  }

  async authenticate(_token: string): Promise<AuthenticatedSession | null> {
    throw new Error('Not implemented');
  }
}
