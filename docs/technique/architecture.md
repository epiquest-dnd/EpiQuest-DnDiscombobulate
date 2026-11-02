# Architecture (brouillon v1)

> Ce schéma est **indépendant de la stack** ; il sera complété une fois ADR-0004 et 0005 acceptées.

## 1. Composants

```mermaid
flowchart LR
    subgraph Clients
        MJ["Vue MJ<br/>(navigateur, écran du MJ)"]
        VJ["Vue joueurs<br/>(2e fenêtre : écran, TV, projecteur)"]
        WEB["Web : comptes, campagnes,<br/>assistant, fiche, éditeur de cartes"]
        MOB["Application mobile<br/>Kotlin Multiplatform (Android)"]
    end

    subgraph Serveur["Serveur (fait autorité)"]
        API["API"]
        RT["Temps réel<br/>+ projections par destinataire"]
        ENG["Moteur de règles<br/>(stats, validation, combat)"]
        DICE["Moteur de dés<br/>(RNG sûr)"]
        VIS["Vision<br/>(ligne de vue, brouillard)"]
        AUTH["Authentification<br/>et permissions"]
    end

    DB[("Base de données<br/>règles + parties")]
    IMP["Import SRD<br/>(rejouable, versionné)"]
    SRC["Source publique SRD<br/>(utilisée à l'import seulement)"]

    WEB --> API
    MOB --> API
    MJ <--> RT
    VJ <-- "projection filtrée" --> RT
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
    participant VJ as Vue joueurs
    MJ->>S: intention (lancer Boule de feu, gabarit en (x,y))
    S->>E: résoudre (sans appliquer)
    E-->>S: prévisualisation (cibles, jets, dégâts)
    S-->>MJ: prévisualisation
    MJ->>S: ajuster / ajouter un effet / confirmer
    S->>E: appliquer
    S->>S: journaliser (annulable)
    S-->>MJ: nouvel état complet
    S-->>VJ: nouvel état filtré (PV approximatifs, zones visibles)
```

## 4. Choix de stack

_Renvoyer vers ADR-0003 (moteur), ADR-0004 (serveur, web, base), ADR-0005 (temps réel), ADR-0007 (hébergement), ADR-0002 (mobile)._

## 5. Arborescence du dépôt

_À compléter en M1 (issue « Initialiser le monorepo »)._ Proposition indicative :

```
/
├── apps/
│   ├── server/        API, temps réel, moteur de règles, dés, vision
│   ├── web/           vue MJ, vue joueurs, pages web
│   └── mobile/        projet Kotlin Multiplatform
├── packages/          types et contrats d'API partagés éventuels
├── data/              données SRD figées, campagne de démo
├── scripts/           import SRD, installation
├── docs/
├── .github/           workflows, modèles d'issue et de PR
├── docker-compose.yml
└── README.md
```
