# ADR-0006 : Source et méthode d'import du SRD

- **Statut** : Proposée
- **Date** : 2026-11-02
- **Décideurs** : toute l'équipe

## Contexte

- Le contenu du SRD 5e (espèces, classes, historiques, sorts, équipements, objets magiques, monstres, états) est importé dans notre base depuis une source publique : API ouverte (Open5e, D&D 5e API) ou fichiers du SRD (§02-C).
- Une fois importé, le produit **ne dépend plus de l'API externe**. L'import est **rejouable et versionné**.
- Uniquement du contenu sous licence libre, avec la mention d'attribution exigée par la CC BY 4.0. Aucun contenu des livres payants (§01-C).

## Points à trancher

### 1. Quelle version du SRD ?

Deux versions existent, toutes deux sous CC BY 4.0 :

- **SRD 5.1** : règles de 2014. Le plus de données structurées disponibles dans les API publiques.
- **SRD 5.2** : règles révisées de 2024 (publié en avril 2025). Contenu un peu différent (espèces, historiques, dons…).

On en choisit **une seule** pour éviter les incohérences de règles. À vérifier : quelle version chaque API couvre réellement aujourd'hui, et avec quel niveau de structuration (les sorts sont-ils structurés ou seulement en texte ?).

### 2. Quelle source ?

| Source | À vérifier |
|---|---|
| Open5e (API) | Versions du SRD couvertes, filtrage par document source pour n'importer **que** le SRD (Open5e contient aussi d'autres contenus sous d'autres licences) |
| D&D 5e API (5e-bits) | Versions couvertes ; les données sont aussi disponibles en JSON dans un dépôt public (pratique pour figer une version) |
| Document SRD officiel | Source de vérité pour le texte et l'attribution, mais non structuré |

### 3. Langue

Le SRD est en anglais. Si le produit est en français, il faut décider : contenu de règles affiché en anglais, ou traduction **faite par le groupe** (attention : ne pas reprendre une traduction issue des livres payants ou d'un site sans licence claire).

### 4. Versionnement

Proposition : les données brutes téléchargées sont figées dans le dépôt (ou dans un cache versionné) avec la version de la source et la date ; le script d'import est idempotent ; une table `import_version` enregistre chaque exécution.

### 5. Attribution

Recopier **mot pour mot** le texte d'attribution figurant dans le document SRD choisi, dans un fichier à la racine du dépôt et dans une page « À propos / Crédits » du produit.

## Décision

_À compléter._

## Conséquences

_À compléter._
