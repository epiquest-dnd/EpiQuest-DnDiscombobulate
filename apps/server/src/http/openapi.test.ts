import type { Server } from 'node:http';
import type { AddressInfo } from 'node:net';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createApiModules, createApp } from '../app.ts';
import { createDb } from '../db/client.ts';
import { createOpenApiDocument, fullPath } from './openapi.ts';

const { db, close } = createDb('postgres://localhost/unused');
const modules = createApiModules({ db });
const document = createOpenApiDocument(modules);

type RouteLayer = { route?: { path: string; methods: Record<string, boolean> } };

function routesOf(stack: RouteLayer[], prefix: string) {
  return stack.flatMap(({ route }) =>
    route
      ? Object.keys(route.methods).map((method) => `${method} ${fullPath(prefix, route.path)}`)
      : [],
  );
}

function documentedRoutes() {
  return Object.entries(document.paths ?? {}).flatMap(([path, item]) =>
    ['get', 'post', 'put', 'patch', 'delete']
      .filter((method) => item[method as keyof typeof item])
      .map((method) => `${method} ${path}`),
  );
}

describe('spec OpenAPI', () => {
  it("documente chaque route de l'API, et seulement celles-là", () => {
    const routes = modules.flatMap(({ prefix, router }) =>
      routesOf(router.stack as RouteLayer[], prefix),
    );

    expect(routes.length).toBeGreaterThan(0);
    expect(documentedRoutes().sort()).toEqual(routes.sort());
  });

  it('décrit les schémas partagés comme composants réutilisables', () => {
    expect(Object.keys(document.components?.schemas ?? {})).toEqual(
      expect.arrayContaining(['Message', 'User', 'RegisterInput', 'LoginInput']),
    );
  });
});

describe('/api/openapi.json et /api/docs', () => {
  let server: Server;
  let baseUrl: string;

  beforeAll(async () => {
    server = createApp({ db }).listen(0);
    await new Promise((resolve) => server.once('listening', resolve));
    baseUrl = `http://localhost:${(server.address() as AddressInfo).port}`;
  });

  afterAll(async () => {
    server.close();
    await close();
  });

  it('sert la spec en JSON', async () => {
    const res = await fetch(`${baseUrl}/api/openapi.json`);
    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({ openapi: '3.1.0', info: { title: 'EpiQuest API' } });
  });

  it('sert Swagger UI', async () => {
    const res = await fetch(`${baseUrl}/api/docs/`);
    expect(res.status).toBe(200);
    expect(await res.text()).toContain('swagger-ui');
  });
});
