import { beforeEach, describe, expect, it } from 'vitest';
import type { UserRepository } from '../users/user.repository.ts';
import { EmailTakenError } from '../users/users.errors.ts';
import { UsersService } from '../users/users.service.ts';
import type { Credentials, User } from '../users/users.types.ts';
import { hashSessionToken } from './auth.crypto.ts';
import { InvalidCredentialsError } from './auth.errors.ts';
import { AuthService } from './auth.service.ts';
import type { Session } from './auth.types.ts';
import type { SessionRepository } from './session.repository.ts';

class InMemoryUserRepository implements UserRepository {
  readonly users = new Map<string, { user: User; passwordHash: string }>();

  async insert(user: User, passwordHash: string) {
    const email = user.email.toLowerCase();
    if ([...this.users.values()].some((row) => row.user.email.toLowerCase() === email)) {
      throw new EmailTakenError();
    }
    this.users.set(user.id, { user, passwordHash });
  }

  async findById(id: string) {
    return this.users.get(id)?.user ?? null;
  }

  async findCredentialsByEmail(email: string): Promise<Credentials | null> {
    const row = [...this.users.values()].find(
      ({ user }) => user.email.toLowerCase() === email.toLowerCase(),
    );
    return row ? { userId: row.user.id, passwordHash: row.passwordHash } : null;
  }
}

class InMemorySessionRepository implements SessionRepository {
  readonly sessions = new Map<string, Session>();

  async insert(session: Session) {
    this.sessions.set(session.id, { ...session });
  }

  async findByTokenHash(tokenHash: string) {
    return [...this.sessions.values()].find((s) => s.tokenHash === tokenHash) ?? null;
  }

  async revoke(id: string, revokedAt: Date) {
    const session = this.sessions.get(id);
    if (session && session.revokedAt === null) {
      session.revokedAt = revokedAt;
    }
  }
}

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;
const START = new Date('2026-11-27T10:00:00Z');

const registration = {
  email: 'ana@example.com',
  password: 'correct horse',
  displayName: 'Ana',
  locale: 'fr',
};

let clock: Date;
let users: InMemoryUserRepository;
let sessions: InMemorySessionRepository;
let auth: AuthService;

beforeEach(() => {
  clock = START;
  users = new InMemoryUserRepository();
  sessions = new InMemorySessionRepository();
  auth = new AuthService(new UsersService(users, () => clock), sessions, () => clock);
});

describe('register', () => {
  it('crée le compte, ouvre une session de 7 jours et renvoie le jeton', async () => {
    const { user, token, expiresAt } = await auth.register(registration, 'web');

    expect(user).toMatchObject({ email: 'ana@example.com', displayName: 'Ana', locale: 'fr' });
    expect(expiresAt).toEqual(new Date(START.getTime() + SEVEN_DAYS_MS));

    const [session] = sessions.sessions.values();
    expect(session).toMatchObject({
      userId: user.id,
      client: 'web',
      tokenHash: hashSessionToken(token),
      expiresAt,
      revokedAt: null,
      createdAt: START,
    });
  });

  it('ne stocke ni le mot de passe ni le jeton en clair', async () => {
    const { user, token } = await auth.register(registration, 'web');

    const stored = users.users.get(user.id);
    expect(stored?.passwordHash).toMatch(/^\$argon2id\$/);
    expect(stored?.user).not.toHaveProperty('password');
    expect(user).not.toHaveProperty('password');
    expect(user).not.toHaveProperty('passwordHash');
    expect([...sessions.sessions.values()][0]?.tokenHash).not.toBe(token);
  });

  it('laisse remonter EmailTakenError si l’email est déjà pris', async () => {
    await auth.register(registration, 'web');
    await expect(
      auth.register({ ...registration, email: 'ANA@example.com' }, 'web'),
    ).rejects.toBeInstanceOf(EmailTakenError);
    expect(sessions.sessions.size).toBe(1);
  });
});

describe('login', () => {
  beforeEach(async () => {
    await auth.register(registration, 'web');
  });

  it('ouvre une nouvelle session avec le bon mot de passe', async () => {
    const { user, token } = await auth.login(
      { email: registration.email, password: registration.password },
      'mobile',
    );

    expect(user.email).toBe('ana@example.com');
    expect(sessions.sessions.size).toBe(2);
    expect(await sessions.findByTokenHash(hashSessionToken(token))).toMatchObject({
      client: 'mobile',
    });
  });

  it('refuse un mauvais mot de passe avec InvalidCredentialsError', async () => {
    await expect(
      auth.login({ email: registration.email, password: 'wrong horse' }, 'web'),
    ).rejects.toBeInstanceOf(InvalidCredentialsError);
  });

  it('refuse un email inconnu avec la même erreur', async () => {
    await expect(
      auth.login({ email: 'nobody@example.com', password: registration.password }, 'web'),
    ).rejects.toBeInstanceOf(InvalidCredentialsError);
  });

  it("refuse si le compte a disparu entre la vérification et la lecture de l'utilisateur", async () => {
    users.findById = async () => null;
    await expect(
      auth.login({ email: registration.email, password: registration.password }, 'web'),
    ).rejects.toBeInstanceOf(InvalidCredentialsError);
  });
});

describe('authenticate', () => {
  it("renvoie la session et l'utilisateur pour un jeton valide", async () => {
    const { user, token } = await auth.register(registration, 'web');
    const [session] = sessions.sessions.values();

    expect(await auth.authenticate(token)).toEqual({ sessionId: session?.id, userId: user.id });
  });

  it('renvoie null pour un jeton inconnu', async () => {
    expect(await auth.authenticate('unknown-token')).toBeNull();
  });

  it('renvoie null pour une session révoquée', async () => {
    const { token } = await auth.register(registration, 'web');
    const [session] = sessions.sessions.values();
    await auth.logout(session!.id);

    expect(await auth.authenticate(token)).toBeNull();
  });

  it('accepte la session juste avant son expiration et la refuse ensuite', async () => {
    const { token, expiresAt } = await auth.register(registration, 'web');

    clock = new Date(expiresAt.getTime() - 1);
    expect(await auth.authenticate(token)).not.toBeNull();

    clock = new Date(expiresAt.getTime() + 1);
    expect(await auth.authenticate(token)).toBeNull();
  });
});

describe('logout', () => {
  it("révoque la session à l'heure de l'horloge injectée", async () => {
    await auth.register(registration, 'web');
    const [session] = sessions.sessions.values();

    clock = new Date(START.getTime() + 60_000);
    await auth.logout(session!.id);

    expect(sessions.sessions.get(session!.id)?.revokedAt).toEqual(clock);
  });
});
