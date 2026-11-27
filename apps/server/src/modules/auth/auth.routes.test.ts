import type { Server } from 'node:http';
import type { AddressInfo } from 'node:net';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { createApp } from '../../app.ts';
import { createTestDb, resetDb } from '../../test/db.ts';

const { db, close } = createTestDb();
let server: Server;
let baseUrl: string;

beforeAll(async () => {
  server = createApp({ db }).listen(0);
  await new Promise((resolve) => server.once('listening', resolve));
  baseUrl = `http://localhost:${(server.address() as AddressInfo).port}`;
});

beforeEach(() => resetDb(db));

afterAll(async () => {
  server.close();
  await close();
});

const registration = {
  email: 'ana@example.com',
  password: 'correct horse',
  displayName: 'Ana',
  locale: 'fr',
};

function post(path: string, body?: unknown, headers: Record<string, string> = {}) {
  return fetch(`${baseUrl}${path}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', ...headers },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}

function sessionCookie(res: Response) {
  const header = res.headers.getSetCookie().find((cookie) => cookie.startsWith('session='));
  expect(header).toBeDefined();
  return header!;
}

function cookieHeader(res: Response) {
  return { cookie: sessionCookie(res).split(';')[0]! };
}

describe('POST /api/auth/register', () => {
  it("crée le compte et pose un cookie HttpOnly, SameSite et Secure avec une date d'expiration", async () => {
    const res = await post('/api/auth/register', registration);

    expect(res.status).toBe(201);
    const user = await res.json();
    expect(user).toMatchObject({ email: 'ana@example.com', displayName: 'Ana', locale: 'fr' });
    expect(user).not.toHaveProperty('passwordHash');

    const cookie = sessionCookie(res);
    expect(cookie).toMatch(/HttpOnly/i);
    expect(cookie).toMatch(/SameSite=Lax/i);
    expect(cookie).toMatch(/Secure/i);
    expect(cookie).toMatch(/Expires=/i);
  });

  it('renvoie 409 auth.emailTaken pour un email déjà pris, quelle que soit la casse', async () => {
    await post('/api/auth/register', registration);
    const res = await post('/api/auth/register', { ...registration, email: 'ANA@example.com' });

    expect(res.status).toBe(409);
    expect(await res.json()).toEqual({ code: 'auth.emailTaken' });
  });

  it('renvoie 400 auth.weakPassword avec les limites pour un mot de passe trop court', async () => {
    const res = await post('/api/auth/register', { ...registration, password: 'short' });

    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ code: 'auth.weakPassword', params: { min: 8, max: 128 } });
  });

  it('renvoie 400 auth.invalidInput pour un email invalide', async () => {
    const res = await post('/api/auth/register', { ...registration, email: 'nope' });

    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ code: 'auth.invalidInput' });
  });
});

describe('POST /api/auth/login', () => {
  beforeEach(async () => {
    await post('/api/auth/register', registration);
  });

  it('ouvre une session avec le bon mot de passe', async () => {
    const res = await post('/api/auth/login', {
      email: 'Ana@Example.com',
      password: registration.password,
    });

    expect(res.status).toBe(200);
    expect(((await res.json()) as { email: string }).email).toBe('ana@example.com');
    sessionCookie(res);
  });

  it('renvoie 401 auth.invalidCredentials pour un mauvais mot de passe ou un email inconnu', async () => {
    for (const body of [
      { email: registration.email, password: 'wrong horse' },
      { email: 'nobody@example.com', password: registration.password },
    ]) {
      const res = await post('/api/auth/login', body);
      expect(res.status).toBe(401);
      expect(await res.json()).toEqual({ code: 'auth.invalidCredentials' });
    }
  });
});

describe('session', () => {
  it('donne accès à /api/users/me avec le cookie, puis plus après la déconnexion', async () => {
    const registered = await post('/api/auth/register', registration);
    const headers = cookieHeader(registered);

    const me = await fetch(`${baseUrl}/api/users/me`, { headers });
    expect(me.status).toBe(200);
    expect(((await me.json()) as { email: string }).email).toBe('ana@example.com');

    const logout = await post('/api/auth/logout', undefined, headers);
    expect(logout.status).toBe(204);

    const after = await fetch(`${baseUrl}/api/users/me`, { headers });
    expect(after.status).toBe(401);
    expect(await after.json()).toEqual({ code: 'auth.unauthenticated' });
  });

  it("accepte le jeton dans l'en-tête Authorization", async () => {
    const registered = await post('/api/auth/register', registration);
    const token = cookieHeader(registered).cookie.replace('session=', '');

    const me = await fetch(`${baseUrl}/api/users/me`, {
      headers: { authorization: `Bearer ${token}` },
    });
    expect(me.status).toBe(200);
  });

  it('renvoie 401 sans jeton ou avec un jeton inconnu', async () => {
    const anonymous = await fetch(`${baseUrl}/api/users/me`);
    expect(anonymous.status).toBe(401);

    const unknown = await fetch(`${baseUrl}/api/users/me`, {
      headers: { authorization: 'Bearer unknown-token' },
    });
    expect(unknown.status).toBe(401);
  });
});
