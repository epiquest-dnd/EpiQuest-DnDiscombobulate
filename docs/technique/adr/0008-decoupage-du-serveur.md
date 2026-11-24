# ADR-0008 : Découpage du serveur en modules, services et repositories

- **Statut** : Proposée
- **Date** : 2026-11-24
- **Décideurs** : toute l'équipe (proposée par angikonys)
- **Issue** : #22

## Contexte

- Le serveur commence à toucher la base avec les comptes (#22), puis les campagnes, les personnages et le combat. Sans règle commune, chacun range l'accès aux données à sa façon.
- Une même action doit pouvoir venir de l'API HTTP **et** du temps réel (ADR-0005) : la logique ne peut pas vivre dans les routes Express.
- La Definition of Done demande des tests. Les règles métier (permissions, validations, appel au moteur) doivent se tester vite, sans base.
- Le modèle de données impose des identifiants `uuid` v7 « générés par le serveur » sans dire à quel endroit.
- L'équipe a déjà appliqué un découpage service / repository sur un projet précédent (monolithe modulaire, une couche d'accès aux données derrière une interface) et sait l'utiliser.

## Critères de décision

- Logique métier utilisable depuis HTTP et WebSocket, testable sans PostgreSQL
- Frontières claires entre domaines, pour travailler à trois sans se marcher dessus
- Peu de cérémonie : pas de framework d'injection, pas de microservices
- Compatible avec Drizzle et un schéma unique lu par drizzle-kit

## Options envisagées

### Option 1 : les routes appellent Drizzle directement

- ➕ Le moins de code, rien à câbler
- ➖ Logique dupliquée entre HTTP et WebSocket ; tests uniquement avec une base ; les routes grossissent vite

### Option 2 : routes → services, les services appellent Drizzle

- ➕ Logique partagée entre HTTP et WebSocket
- ➖ Chaque test de service a besoin de la base ; les requêtes SQL se mélangent aux règles métier

### Option 3 : routes → services → repositories (interface) → implémentation Drizzle

- ➕ Services testés avec des repositories en mémoire, sans base ; SQL regroupé dans un seul fichier par entité
- ➕ Découpage déjà pratiqué par l'équipe
- ➖ Un fichier d'interface et une implémentation de plus par entité ; un peu de conversion entre lignes de la base et types du domaine

## Décision

**Option 3 : un monolithe modulaire. Chaque domaine est un module découpé en routes, service et repositories.**

### Organisation d'un module

```
apps/server/src/
├── modules/
│   └── auth/
│       ├── auth.routes.ts            HTTP : lit et valide la requête, appelle le service, renvoie un code
│       ├── auth.service.ts           règles métier : hachage, sessions, permissions
│       ├── auth.types.ts             types du domaine (User, Session), sans Drizzle
│       ├── user.repository.ts        interface UserRepository
│       ├── user.repository.drizzle.ts   implémentation Drizzle de UserRepository
│       └── auth.service.test.ts      tests du service avec des repositories en mémoire
├── db/
│   ├── client.ts
│   └── schema/                       tables Drizzle de tous les modules (un seul schéma pour drizzle-kit)
├── http/                             erreurs et middlewares communs
└── app.ts                            câblage : crée les repositories et les services, monte les routes
```

### Règles

| Couche | Peut importer | Ne doit pas importer |
|---|---|---|
| Routes (`*.routes.ts`), et plus tard les gestionnaires WebSocket | le service de son module, `packages/shared` | `db/`, `drizzle-orm`, un repository |
| Service (`*.service.ts`) | les interfaces de repository, les types du domaine, les services d'autres modules, `packages/rules-engine`, `packages/shared` | `db/`, `drizzle-orm`, Express |
| Repository Drizzle (`*.repository.drizzle.ts`) | `db/`, `drizzle-orm`, les types du domaine | un service, Express |

- **Les services reçoivent leurs dépendances par le constructeur** (classes) ou en paramètre. `app.ts` fait le câblage à partir de `createApp({ db })` ; les tests passent leurs propres repositories.
- **Un module n'utilise jamais le repository d'un autre module** : il passe par son service.
- **Les repositories renvoient des types du domaine**, pas les types inférés de Drizzle. Au début ils se ressemblent ; la conversion se fait dans le repository.
- **Le schéma Drizzle reste dans `db/schema/`**, rangé par schéma PostgreSQL (`game/`, `rules/`), parce que drizzle-kit lit un seul point d'entrée et que des tables servent à plusieurs modules.

### Identifiants et dates

| Donnée | Qui la produit | Filet dans le schéma |
|---|---|---|
| `id` (`uuid` v7) | Le service, avec `v7()` du paquet `uuid`, au moment de créer l'entité | **Aucun** : une insertion sans id échoue tout de suite, l'oubli se voit |
| `created_at` | Le service (`new Date()`) | `defaultNow()` |
| `updated_at` | Drizzle, à chaque `update` (`$onUpdate`) | `defaultNow()` à l'insertion |

`crypto.randomUUID()` n'est pas utilisé pour les identifiants de partie : il génère des v4, non triables par date.

### Tests

- **Services** : tests unitaires avec des repositories en mémoire (une implémentation de l'interface sur un `Map`), sans base.
- **Repositories Drizzle** : tests sur la base de test (`createTestDb()`, `resetDb()` dans `src/test/db.ts`).
- **Routes** : quelques tests de bout en bout sur `createApp`, pour les codes HTTP et les messages.

## Conséquences

- Plus facile : réutiliser la logique depuis le temps réel ; tester les règles métier vite ; savoir où chercher une requête SQL.
- Plus difficile : un peu plus de fichiers par module, et une conversion ligne ↔ type du domaine à maintenir.
- Dette acceptée : les frontières entre couches ne sont vérifiées que par la relecture. Si elles sont souvent franchies, ajouter une règle ESLint (`no-restricted-imports` sur `drizzle-orm` et `db/` hors des repositories).
- À revoir si un module reste un simple CRUD sans règle : il peut alors se passer de service, à condition de le noter dans la PR.
