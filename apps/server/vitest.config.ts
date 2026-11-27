import { defineProject } from 'vitest/config';

export default defineProject({
  test: {
    // Crée la base de test si besoin et applique les migrations, une fois avant tous les tests.
    globalSetup: ['./src/test/global-setup.ts'],
    // Les tests partagent la base de test et la vident entre eux : un fichier à la fois.
    fileParallelism: false,
  },
});
