# Modèle de données (brouillon v1)

> À relire par toute l'équipe. Le dictionnaire des champs est complété au fil des issues.

## 1. Deux familles de données

| Famille | Contenu | Cycle de vie |
|---|---|---|
| **Données de règles** | Espèces, classes, sous-classes, historiques, sorts, équipements, objets magiques, monstres, états | Importées depuis le SRD, versionnées, **en lecture seule** pour l'application |
| **Données de partie** | Utilisateurs, campagnes, personnages, cartes, rencontres, combats, jets, journal | Créées et modifiées par les utilisateurs |

Les données de partie **référencent** les données de règles par identifiant stable (ex. `spell.fireball`), jamais par copie, pour qu'un nouvel import corrige tout.

## 2. Schéma des entités (première version)

```mermaid
erDiagram
    USER ||--o{ CAMPAIGN_MEMBER : "participe"
    CAMPAIGN ||--o{ CAMPAIGN_MEMBER : "a"
    CAMPAIGN_MEMBER }o--|| ROLE : "MJ ou joueur"
    USER ||--o{ CHARACTER : "possède"
    CAMPAIGN ||--o{ CHARACTER : "inclut"
    CHARACTER }o--|| SPECIES : "est de"
    CHARACTER ||--o{ CHARACTER_CLASS : "niveaux dans"
    CHARACTER_CLASS }o--|| CLASS_DEF : "classe"
    CHARACTER }o--|| BACKGROUND : "a pour historique"
    CHARACTER ||--o{ INVENTORY_ITEM : "porte"
    INVENTORY_ITEM }o--|| ITEM : "objet"
    CHARACTER ||--o{ KNOWN_SPELL : "connaît"
    KNOWN_SPELL }o--|| SPELL : "sort"
    CAMPAIGN ||--o{ MAP : "contient"
    MAP ||--o{ LAYER : "fond, décor, pions, MJ"
    MAP ||--o{ WALL : "murs et portes"
    LAYER ||--o{ TOKEN : "contient"
    TOKEN }o--o| CHARACTER : "représente"
    TOKEN }o--o| MONSTER : "représente"
    MAP ||--o{ FOG_REGION : "zones révélées"
    CAMPAIGN ||--o{ ENCOUNTER : "prépare"
    ENCOUNTER ||--o{ ENCOUNTER_MONSTER : "compose"
    ENCOUNTER_MONSTER }o--|| MONSTER : "monstre"
    ENCOUNTER }o--o| MAP : "placée sur"
    CAMPAIGN ||--o{ COMBAT : "joue"
    COMBAT ||--o{ COMBATANT : "initiative"
    COMBAT ||--o{ ACTIVE_EFFECT : "effets en cours"
    COMBAT ||--o{ LOG_ENTRY : "journal"
    CAMPAIGN ||--o{ ROLL : "historique des jets"
    CAMPAIGN ||--o{ NOTE : "notes, PNJ, lieux, quêtes"
    CAMPAIGN ||--o{ DOCUMENT : "à révéler"
```

## 3. Points d'attention

- **Personnage** : on stocke les **choix** (espèce, classe, caractéristiques de base, compétences choisies…), et le moteur **recalcule** les statistiques dérivées. On ne stocke une valeur dérivée que comme cache.
- **État courant** du personnage (PV, PV temporaires, emplacements utilisés, états) séparé des choix de création.
- **Visibilité** : chaque entité affichable en partie porte une visibilité (`public`, `gm`, `owner`) utilisée par la projection de la vue joueurs (ADR-0005). Le calque MJ, les jets cachés et les notes privées sont `gm`.
- **Journal** : chaque action de combat appliquée enregistre de quoi être **annulée** (état avant / modifications).
- **Jets** : expression, résultat détaillé, visibilité, auteur, horodatage.
- **Import SRD** : table de versions d'import (source, version, date, empreinte).

## 4. Dictionnaire des champs

_À compléter entité par entité :_

| Entité | Champ | Type | Obligatoire | Description |
|---|---|---|---|---|
| | | | | |
