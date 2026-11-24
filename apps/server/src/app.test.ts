import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import type { Server } from 'node:http';
import type { AddressInfo } from 'node:net';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createApp, type AppOptions } from './app.ts';

async function start(options?: AppOptions) {
  const server: Server = createApp(options).listen(0);
  await new Promise((resolve) => server.once('listening', resolve));
  const { port } = server.address() as AddressInfo;
  return { server, baseUrl: `http://localhost:${port}` };
}

describe('API', () => {
  let server: Server;
  let baseUrl: string;

  beforeAll(async () => {
    ({ server, baseUrl } = await start());
  });

  afterAll(() => {
    server.close();
  });

  it('répond à /api/health', async () => {
    const res = await fetch(`${baseUrl}/api/health`);
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ status: 'ok' });
  });

  it('renvoie un code de message pour une route inconnue', async () => {
    const res = await fetch(`${baseUrl}/api/inconnue`);
    expect(res.status).toBe(404);
    expect(await res.json()).toEqual({ code: 'server.notFound' });
  });

  it('ne sert pas de site sans dossier web', async () => {
    const res = await fetch(`${baseUrl}/`);
    expect(res.status).toBe(404);
  });
});

describe('site web servi par le serveur', () => {
  let server: Server;
  let baseUrl: string;
  let webDir: string;

  beforeAll(async () => {
    webDir = mkdtempSync(join(tmpdir(), 'epiquest-web-'));
    writeFileSync(join(webDir, 'index.html'), '<p>accueil</p>');
    writeFileSync(join(webDir, 'app.js'), 'console.log(1);');
    ({ server, baseUrl } = await start({ webDir }));
  });

  afterAll(() => {
    server.close();
    rmSync(webDir, { recursive: true, force: true });
  });

  it('sert les fichiers statiques', async () => {
    const res = await fetch(`${baseUrl}/app.js`);
    expect(res.status).toBe(200);
    expect(await res.text()).toBe('console.log(1);');
  });

  it('renvoie index.html pour une page du site', async () => {
    const res = await fetch(`${baseUrl}/campagnes/12`);
    expect(res.status).toBe(200);
    expect(await res.text()).toBe('<p>accueil</p>');
  });

  it("garde les réponses JSON pour l'API", async () => {
    const res = await fetch(`${baseUrl}/api/inconnue`);
    expect(res.status).toBe(404);
    expect(await res.json()).toEqual({ code: 'server.notFound' });
  });
});
