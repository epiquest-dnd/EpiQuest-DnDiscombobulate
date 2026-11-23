# Architecture (v1)

> Schéma complété avec la stack retenue à l'atelier d'architecture du 2026-11-03 (ADR-0004 à 0007). Les décisions et leurs justifications sont dans les [ADR](adr/).

## 1. Composants

```mermaid
flowchart LR
    subgraph Clients
        MJ["Vue MJ<br/>(navigateur, écran du MJ)"]
        VJ["Vue de table<br/>(2e fenêtre : écran, TV, projecteur)"]
        WEB["Web : comptes, campagnes,<br/>assistant, fiche, éditeur de cartes<br/>Vue + PrimeVue, cartes PixiJS"]
        MOB["Application mobile<br/>Kotlin Multiplatform (Android)<br/>client Ktor"]
    end

    subgraph VPS["VPS OVH (Docker Compose)"]
        CADDY["Caddy<br/>HTTPS, reverse proxy"]
        subgraph Serveur["Serveur Node.js (fait autorité)"]
            API["API HTTP<br/>Express"]
            RT["Temps réel<br/>WebSocket ws<br/>+ projections par destinataire"]
            ENG["Moteur de règles<br/>(stats, validation, combat)"]
            DICE["Moteur de dés<br/>(RNG sûr)"]
            VIS["Vision<br/>(ligne de vue, brouillard)"]
            AUTH["Authentification<br/>et permissions"]
        end
        DB[("PostgreSQL<br/>règles + parties<br/>accès Drizzle")]
    end

    IMP["Script d'import SRD<br/>(rejouable, cache versionné)"]
    SRC["API Open5e v2<br/>SRD 5.2 (import seulement)"]

    WEB --> CADDY
    MOB --> CADDY
    MJ <--> CADDY
    VJ <-- "projection filtrée" --> CADDY
    CADDY --> API
    CADDY <--> RT
    API --> AUTH
    RT --> AUTH
    API --> ENG
    RT --> ENG
    ENG --> DICE
    RT --> VIS
    API --> DB
    RT --> DB
    IMP --> DB
    SRC -.-> IMP
```

Le moteur de règles n'existe **que sur le serveur** (ADR-0003). Le web et le mobile ne contiennent aucune règle : ils envoient les choix de l'utilisateur et affichent le résultat calculé.

Le serveur ne renvoie pas de phrases mais des **codes** avec leurs paramètres ; le web (vue-i18n) et le mobile les traduisent (ADR-0004). Le produit est en anglais, prêt pour d'autres langues.

Le canal de chaque connexion temps réel (MJ, joueur, vue de table) est déterminé **par le serveur, d'après la session**. La projection est filtrée avant l'envoi : la vue de table ne reçoit jamais d'information cachée (ADR-0005).

## 2. Flux : création d'un personnage (web ou mobile)

```mermaid
sequenceDiagram
    participant C as Client (web ou mobile)
    participant S as Serveur (API)
    participant E as Moteur de règles
    C->>S: brouillon complet (espèce, classe, caractéristiques, choix…)
    S->>E: calculer et valider
    E-->>S: fiche calculée + erreurs par champ + choix possibles
    S-->>C: réponse
    Note over C: affiche la fiche et les erreurs, aucune règle côté client
    C->>S: enregistrer (brouillon valide)
    S->>E: revalider
    S-->>C: personnage enregistré
```

## 3. Flux : une action de combat

```mermaid
sequenceDiagram
    participant MJ as Vue MJ
    participant S as Serveur
    participant E as Moteur de règles
    participant VJ as Vue de table
    MJ->>S: intention (lancer Boule de feu, gabarit en (x,y))
    S->>E: résoudre (sans appliquer)
    E-->>S: prévisualisation (cibles, jets, dégâts)
    S-->>MJ: prévisualisation
    MJ->>S: ajuster / ajouter un effet / confirmer
    S->>E: appliquer
    S->>S: journaliser (annulable)
    S->>S: recalculer la projection de chaque destinataire
    S-->>MJ: patch JSON (projection MJ, version n)
    S-->>VJ: patch JSON (projection filtrée : PV approximatifs, zones visibles)
    Note over VJ: version manquante ou patch en échec : demande un instantané
```

## 4. Flux : import du SRD

```mermaid
sequenceDiagram
    participant I as Script d'import
    participant O as API Open5e v2
    participant C as Cache versionné
    participant DB as PostgreSQL
    I->>O: ressources filtrées (document__key=srd-2024), page par page
    O-->>I: réponses brutes
    I->>C: enregistrer (date de l'appel)
    I->>I: refuser toute entrée hors srd-2024
    I->>DB: insérer ou mettre à jour (idempotent)
    I->>DB: enregistrer l'exécution (import_version)
    Note over I,C: un nouvel import peut repartir du cache, sans rappeler l'API
```

## 5. Déploiement

```mermaid
flowchart LR
    DEV["Merge sur dev<br/>(préproduction)<br/>ou release sur main<br/>(production)"] --> CI["GitHub Actions<br/>lint, tests, build"]
    CI --> IMG["Image Docker<br/>publiée sur GHCR"]
    CI --> APK["APK Android<br/>artefact du pipeline"]
    IMG --> SSH["Connexion SSH<br/>au VPS"]
    SSH --> UP["docker compose pull + up -d<br/>migrations Drizzle<br/>réinitialisation de la démo"]
```

`dev` déploie la préproduction et `main`, qui ne reçoit que les releases de fin de milestone, déploie la production ; les deux tournent sur le même VPS (organisation.md, § Branches).

Le même fichier Docker Compose sert en local : c'est la version de secours si le VPS est indisponible le jour de la soutenance (ADR-0007).

## 6. Choix de stack

| Couche | Choix | ADR |
|---|---|---|
| Langage serveur et web | TypeScript | [ADR-0004](adr/0004-stack-serveur-web-bdd.md) |
| Serveur HTTP | Express | [ADR-0004](adr/0004-stack-serveur-web-bdd.md) |
| Moteur de règles | Module TypeScript isolé, exécuté sur le serveur uniquement | [ADR-0003](adr/0003-emplacement-moteur-de-regles.md) |
| Web | Vue + PrimeVue, i18n avec vue-i18n | [ADR-0004](adr/0004-stack-serveur-web-bdd.md) |
| Rendu des cartes | PixiJS (WebGL), plus une vue textuelle HTML | [ADR-0004](adr/0004-stack-serveur-web-bdd.md) |
| Base de données | PostgreSQL (JSONB pour les données de règles), accès par Drizzle | [ADR-0004](adr/0004-stack-serveur-web-bdd.md) |
| Temps réel | WebSocket (`ws`), diffs de projection en JSON Patch (`fast-json-patch`) | [ADR-0005](adr/0005-synchronisation-temps-reel.md) |
| Données de règles | SRD 5.2, importé depuis l'API v2 d'Open5e | [ADR-0006](adr/0006-import-srd.md) |
| Mobile | Kotlin Multiplatform, cible Android, client HTTP et WebSocket Ktor | [ADR-0002](adr/0002-mobile-kotlin-multiplatform.md) |
| Hébergement | VPS OVH VPS-1, Docker Compose, Caddy (HTTPS) | [ADR-0007](adr/0007-hebergement-deploiement.md) |
| Déploiement continu | GitHub Actions, images sur GHCR, déploiement par SSH | [ADR-0007](adr/0007-hebergement-deploiement.md) |

## 7. Arborescence du dépôt

Monorepo avec les workspaces npm (issue #15). Le détail des commandes est dans le [guide de prise en main](prise-en-main.md).

```
/
├── apps/
│   ├── server/          Express : API, temps réel, dés, vision, base (Drizzle), import du SRD (importe le moteur)
│   ├── web/             Vue : vue MJ, vue de table, pages web
│   └── mobile/          projet Kotlin Multiplatform, module shared + app Android (#23)
├── packages/
│   ├── rules-engine/    moteur de règles isolé : ni Express ni Drizzle (ADR-0003)
│   └── shared/          types TypeScript partagés : messages, contrats d'API, codes
├── data/
│   ├── srd-cache/       réponses brutes de l'API Open5e, versionnées (#20)
│   └── demo/            campagne de démonstration
├── scripts/             installation
├── docs/
├── .github/             workflows, modèles d'issue et de PR
├── compose.yaml         serveur, PostgreSQL, Caddy (#18)
├── compose.dev.yaml     PostgreSQL seul, pour le développement et les tests (#22)
├── Caddyfile
└── README.md
```

Seuls `apps/server`, `apps/web`, les deux paquets, `compose.yaml` et `compose.dev.yaml` existent pour l'instant ; les autres dossiers arrivent avec les issues indiquées.

Le moteur est un paquet à part pour que son isolement soit garanti par la structure : son `package.json` ne déclare ni Express ni Drizzle, donc il ne peut pas les importer. Les paquets internes exposent directement leurs sources TypeScript : Node 22 les exécute sans compilation (suppression des types), et Vite les compile pour le web.
