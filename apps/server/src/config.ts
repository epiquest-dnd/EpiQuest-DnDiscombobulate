export type Config = {
  port: number;
  databaseUrl: string;
  /** Dossier du site Vue construit (`apps/web/dist`). En production, le serveur le sert lui-même (ADR-0007). */
  webDir?: string;
};

// Lit la configuration dans les variables d'environnement (voir .env.example à la racine).
export function loadConfig(env: NodeJS.ProcessEnv = process.env): Config {
  const databaseUrl = env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error('DATABASE_URL is not set (see .env.example)');
  }
  return {
    port: Number(env.PORT ?? 3000),
    databaseUrl,
    webDir: env.WEB_DIST_DIR,
  };
}
