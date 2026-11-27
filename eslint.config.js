// Configuration ESLint unique pour tous les espaces de travail TypeScript et Vue.
// Le formatage est laissé à Prettier : eslint-config-prettier coupe les règles qui le concernent.
import js from '@eslint/js';
import prettier from 'eslint-config-prettier';
import vue from 'eslint-plugin-vue';
import vueA11y from 'eslint-plugin-vuejs-accessibility';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  {
    ignores: ['**/dist/', '**/coverage/', '**/node_modules/'],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  ...vue.configs['flat/recommended'],
  // Accessibilité des composants Vue : toute erreur fait échouer la CI (docs/technique/accessibilite.md).
  ...vueA11y.configs['flat/recommended'],
  {
    files: ['**/*.vue'],
    languageOptions: {
      parserOptions: { parser: tseslint.parser },
    },
  },
  {
    files: ['apps/web/**'],
    languageOptions: { globals: globals.browser },
  },
  {
    files: ['apps/server/**', 'packages/**', '*.config.{js,ts}'],
    languageOptions: { globals: globals.node },
  },
  {
    rules: {
      '@typescript-eslint/consistent-type-imports': 'error',
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
    },
  },
  {
    files: ['**/*.ts', '**/*.vue'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              regex: '^\\.{1,2}/.*\\.js$',
              message:
                "Importer le fichier source avec l'extension .ts : Node exécute le TypeScript sans compilation, un fichier .js n'existe pas.",
            },
          ],
        },
      ],
    },
  },
  prettier,
);
