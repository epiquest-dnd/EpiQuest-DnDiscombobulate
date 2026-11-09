import { defineConfig } from 'vitest/config';

// Un seul `npm test` lance les tests de tous les espaces de travail TypeScript.
export default defineConfig({
  test: {
    projects: ['packages/*', 'apps/server', 'apps/web'],
  },
});
