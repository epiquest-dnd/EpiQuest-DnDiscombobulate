# Guide de prise en main

Pour un développeur qui arrive sur le projet : installer, lancer, tester et savoir où écrire son code. Complété au fil des milestones ; l'installation complète en une commande (serveur, base de données, import du SRD, campagne de démo) arrive avec l'issue #18.

## 1. Prérequis

| Outil | Version | Pourquoi cette version |
|---|---|---|
| Node.js | 22.22.2 ou plus récent en 22.x (fichier `.nvmrc`), ou 24.15 et plus | Exécute le TypeScript du serveur sans compilation ; version minimale demandée par jsdom |
| npm | 10.9.7 (champ `packageManager`) | Livré avec Node 22 |
| Docker avec Compose v2 | Récent | Lance PostgreSQL en local (`compose.dev.yaml`) et le produit complet (`compose.yaml`) |

Avec nvm : `nvm install` puis `nvm use` à la racine du dépôt lisent `.nvmrc`.

## 2. Installer et vérifier

```sh
npm ci                 # installe exactement les versions du package-lock.json
cp .env.example .env   # configuration locale, jamais commitée
npm run db:up          # démarre PostgreSQL dans Docker et attend qu'il soit prêt
npm test               # vérifie les types de tous les espaces de travail, puis lance tous les tests
```

`npm ci` refuse de s'exécuter avec une version de Node non prise en charge (`engine-strict` dans `.npmrc`).

Si le port 5432 est déjà pris sur ta machine, change `DB_PORT` et le port de `DATABASE_URL` et `TEST_DATABASE_URL` dans `.env`.

### Bases de données

Le conteneur PostgreSQL contient deux bases :

| Base | Variable | Utilisée par |
|---|---|---|
| `epiquest` | `DATABASE_URL` | `npm run dev:server` ; migrations appliquées à la main avec `npm run db:migrate` |
| `epiquest_test` | `TEST_DATABASE_URL` | `npm test` : créée si elle n'existe pas et migrée automatiquement avant les tests du serveur (`apps/server/src/test/global-setup.ts`) |

Les tests du serveur qui utilisent la base passent par `src/test/db.ts` : `createTestDb()` pour se connecter, `resetDb(db)` dans un `beforeEach` pour repartir de tables vides. Les fichiers de test du serveur s'exécutent l'un après l'autre, puisqu'ils partagent cette base.

## 3. Lancer en développement

Une première fois, appliquer les migrations à la base de développement :

```sh
npm run db:migrate
```

Puis, dans deux terminaux :

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

Dans `apps/server/src`, le code est rangé **par domaine** et non par couche technique :

| Emplacement | Contenu |
|---|---|
| `index.ts` | Démarrage : lit la configuration, ouvre la base, lance le serveur |
| `app.ts` | `createApp({ db })` : monte les middlewares et les routes de chaque module. La base est injectée, les tests passent la leur |
| `config.ts` | Variables d'environnement, validées au démarrage |
| `db/` | Client Drizzle (`client.ts`) et schéma : `schema/game/` pour les données de partie, `schema/rules/` pour les données de règles, réexportés par `schema/index.ts` |
| `http/` | Ce qui sert à toutes les routes : réponses d'erreur, validation |
| `modules/<domaine>/` | Un dossier par domaine (`auth`, `campaigns`, `dice`…) : `<domaine>.routes.ts` lit la requête et renvoie un code, `<domaine>.service.ts` porte la logique et parle à la base, tests à côté |

Après une modification du schéma, `npm run db:generate` écrit la migration SQL dans `apps/server/drizzle/` ; on la relit et on la commite avec le code.

L'arborescence complète prévue est dans [architecture.md](architecture.md#7-arborescence-du-dépôt).

## 5. Commandes utiles

| Commande | Effet |
|---|---|
| `npm test` | Vérification des types puis tous les tests (un seul rapport Vitest) ; PostgreSQL doit tourner (`npm run db:up`) |
| `npx vitest` | Tests en mode surveillance, relancés à chaque modification |
| `npx vitest packages/rules-engine` | Tests d'un seul dossier |
| `npm run typecheck` | Vérification des types seule |
| `npm run db:up` | Démarre PostgreSQL (Docker) |
| `npm run db:generate` | Génère la migration SQL à partir du schéma Drizzle |
| `npm run db:migrate` | Applique les migrations à la base de `DATABASE_URL` |
| `npm run build` | Build de production du web (`apps/web/dist`) |
| `npm install <paquet> -w @epiquest/server` | Ajoute une dépendance à un espace de travail (version exacte, grâce à `save-exact`) |
| `npm run lint` / `npm run lint:fix` | ESLint sur tout le dépôt (TypeScript, Vue, accessibilité des composants) / avec corrections automatiques |
| `npm run format` / `npm run format:check` | Reformate avec Prettier / vérifie sans modifier |
| `npm run check` | Lint, formatage, types et tests : ce que lance la CI |
| `docker compose up --build` | Produit complet sur http://localhost (base, serveur, site, Caddy). Demande un `.env` copié depuis `.env.example` |

**Hooks Git** : `npm ci` installe deux hooks (husky). Avant chaque commit, ESLint et Prettier corrigent les fichiers ajoutés ; le message de commit est vérifié par commitlint (Conventional Commits, types et domaines de [organisation.md](../projet/organisation.md)). La CI refait les mêmes vérifications, et contrôle aussi le titre de la PR.

Le Markdown n'est pas formaté par Prettier : il réalignerait tous les tableaux de la documentation.

## 6. Conventions du code TypeScript

- Les imports relatifs gardent l'extension `.ts` (`import { createApp } from './app.ts'`) : c'est ce que Node exécute directement.
- Uniquement de la syntaxe TypeScript effaçable (`erasableSyntaxOnly`) : pas d'`enum`, pas de `namespace`, pas de propriétés de paramètres de constructeur. On utilise des unions de chaînes et des objets `as const`.
- Les tests sont à côté du code qu'ils testent : `abilities.ts` → `abilities.test.ts`.
- Le serveur renvoie des codes de message (`{ code: 'server.notFound' }`), jamais de phrases (ADR-0004).
