# Guide de prise en main

Pour un développeur qui arrive sur le projet : installer, lancer, tester et savoir où écrire son code. Complété au fil des milestones ; l'installation complète en une commande (base de données, import du SRD, campagne de démo) arrive avec l'issue #18.

## 1. Prérequis

| Outil | Version | Pourquoi cette version |
|---|---|---|
| Node.js | 22.22.2 ou plus récent en 22.x (fichier `.nvmrc`), ou 24.15 et plus | Exécute le TypeScript du serveur sans compilation ; version minimale demandée par jsdom |
| npm | 10.9.7 (champ `packageManager`) | Livré avec Node 22 |

Avec nvm : `nvm install` puis `nvm use` à la racine du dépôt lisent `.nvmrc`.

## 2. Installer et vérifier

```sh
npm ci      # installe exactement les versions du package-lock.json
npm test    # vérifie les types de tous les espaces de travail, puis lance tous les tests
```

`npm ci` refuse de s'exécuter avec une version de Node non prise en charge (`engine-strict` dans `.npmrc`).

## 3. Lancer en développement

Dans deux terminaux :

```sh
npm run dev:server   # API sur http://localhost:3000, redémarre à chaque modification
npm run dev:web      # site sur http://localhost:5173, rechargement à chaud
```

Le serveur de développement du web redirige `/api` vers le serveur local : depuis le navigateur, tout passe par le port 5173.

## 4. Arborescence

| Dossier | Paquet | Contenu |
|---|---|---|
| `apps/server` | `@epiquest/server` | API Express ; seul consommateur du moteur de règles |
| `apps/web` | `@epiquest/web` | Interface Vue ; textes dans `src/locales/en.json`, jamais en dur |
| `packages/rules-engine` | `@epiquest/rules-engine` | Moteur de règles isolé : aucune dépendance au serveur ni à la base (ADR-0003) |
| `packages/shared` | `@epiquest/shared` | Types partagés entre serveur et web : messages, contrats d'API |

L'arborescence complète prévue est dans [architecture.md](architecture.md#7-arborescence-du-dépôt).

## 5. Commandes utiles

| Commande | Effet |
|---|---|
| `npm test` | Vérification des types puis tous les tests (un seul rapport Vitest) |
| `npx vitest` | Tests en mode surveillance, relancés à chaque modification |
| `npx vitest packages/rules-engine` | Tests d'un seul dossier |
| `npm run typecheck` | Vérification des types seule |
| `npm run build` | Build de production du web (`apps/web/dist`) |
| `npm install <paquet> -w @epiquest/server` | Ajoute une dépendance à un espace de travail (version exacte, grâce à `save-exact`) |
| `npm run lint` / `npm run lint:fix` | ESLint sur tout le dépôt (TypeScript, Vue, accessibilité des composants) / avec corrections automatiques |
| `npm run format` / `npm run format:check` | Reformate avec Prettier / vérifie sans modifier |
| `npm run check` | Lint, formatage, types et tests |

**Hooks Git** : `npm ci` installe deux hooks (husky). Avant chaque commit, ESLint et Prettier corrigent les fichiers ajoutés ; le message de commit est vérifié par commitlint (Conventional Commits, types et domaines de [organisation.md](../projet/organisation.md)).

Le Markdown n'est pas formaté par Prettier : il réalignerait tous les tableaux de la documentation.

## 6. Conventions du code TypeScript

- Les imports relatifs gardent l'extension `.ts` (`import { createApp } from './app.ts'`) : c'est ce que Node exécute directement.
- Uniquement de la syntaxe TypeScript effaçable (`erasableSyntaxOnly`) : pas d'`enum`, pas de `namespace`, pas de propriétés de paramètres de constructeur. On utilise des unions de chaînes et des objets `as const`.
- Les tests sont à côté du code qu'ils testent : `abilities.ts` → `abilities.test.ts`.
- Le serveur renvoie des codes de message (`{ code: 'server.notFound' }`), jamais de phrases (ADR-0004).
