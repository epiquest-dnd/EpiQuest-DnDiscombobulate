# ADR-0006 : Source et méthode d'import du SRD

- **Statut** : Acceptée
- **Date** : 2026-11-03
- **Décideurs** : toute l'équipe (atelier d'architecture du 2026-11-03)
- **Issue** : #6

## Contexte

- Le contenu du SRD 5e (espèces, classes, historiques, sorts, équipements, objets magiques, monstres, états) est importé dans notre base depuis une source publique : API ouverte (Open5e, D&D 5e API) ou fichiers du SRD (§02-C).
- Une fois importé, le produit **ne dépend plus de l'API externe**. L'import est **rejouable et versionné**.
- Uniquement du contenu sous licence libre, avec la mention d'attribution exigée par la CC BY 4.0. Aucun contenu des livres payants (§01-C).

## Points tranchés

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

**Version : SRD 5.2 (règles de 2024).** C'est la seule version qui donne à l'assistant de création un vrai choix : 4 historiques et 17 dons, contre 1 et 1 en 5.1.

**Source : l'API v2 d'Open5e (`https://api.open5e.com/v2/`), appelée uniquement par le script d'import.** Le script interroge chaque ressource filtrée sur le document SRD (`?document__key=srd-2024`) et enregistre les réponses brutes. Le produit en fonctionnement n'appelle jamais l'API : il lit notre base.

Justification :

- Ce sont les données 2024 les mieux structurées pour les sorts, qui sont le cœur du combat. Sur les 339 sorts, Open5e structure la sauvegarde de 127 des 138 sorts qui en mentionnent une, et donne 52 zones d'effet et les dégâts selon le niveau d'emplacement. La D&D 5e API (5e-bits) n'a, en 2024, ni sauvegarde, ni zone, ni montée en niveau pour les sorts.
- Le document `srd-2024` d'Open5e est le « System Reference Document 5.2 », sous licence CC BY 4.0 d'après ses métadonnées.
- L'API n'est appelée qu'à l'import : sa lenteur (de 2 à 65 s par page lors de nos mesures, sur des URL jamais demandées) n'affecte pas les utilisateurs, et le produit fonctionne sans elle (§02-C).

**Repli.** Si une donnée manque ou est mal structurée chez Open5e (par exemple les actions des monstres, pas encore mesurées), on pourra compléter plus tard avec la D&D 5e API. Ce choix fera l'objet d'un nouvel ADR.

## Conséquences

**Import**

- Le script d'import appelle l'API page par page, avec des nouvelles tentatives et un délai d'attente long, puisque certaines pages mettent plus d'une minute.
- Les réponses brutes sont enregistrées dans un cache versionné, avec la date de l'appel. On peut rejouer l'import depuis ce cache sans rappeler l'API, par exemple en CI.
- Le filtre `document__key=srd-2024` est obligatoire, et le script refuse toute entrée dont le document n'est pas `srd-2024` : Open5e contient d'autres sources sous d'autres licences, et le paramètre `document=` en renvoie. Seule exception : les 15 états, qu'Open5e range dans un document `core`, hors du filtre SRD. Il faut vérifier leur texte face au document SRD officiel avant de les importer.
- Le script d'import est idempotent. Une table `import_version` enregistre chaque exécution (date, nombre d'entrées par ressource).
- Les images d'Open5e (CC BY-NC 4.0) ne sont **pas** importées.

**Langue**

- Le produit est en anglais (ADR-0004) : le contenu du SRD est importé et affiché **en anglais, tel quel**.
- Le modèle de données prévoit les traductions dès le départ : chaque entrée garde un identifiant stable (la clé Open5e, par exemple `srd-2024_fireball`) et ses textes affichables (nom, description) sont rangés par langue, `en` étant la langue de référence. Une traduction pourra être ajoutée plus tard sans changer le schéma ni le moteur.
- Le moteur de règles ne lit que les données structurées et les identifiants, jamais le texte (voir format-des-regles.md) : la langue n'a aucun effet sur les calculs.
- Si une traduction manque, le produit affiche le texte anglais.
- Toute traduction ajoutée doit être faite par le groupe ou venir d'une source sous licence libre : jamais une traduction issue des livres payants.

**Attribution**

- Garder dans `ATTRIBUTION.md` la seule mention du SRD 5.2, mot pour mot, puis l'afficher dans la page « À propos / Crédits ». Open5e nomme le document « 5.2 », alors que la mention actuelle de `ATTRIBUTION.md` est celle du 5.2.1 : vérifier quelle version Open5e a transcrite avant de recopier la mention.

**À surveiller**

- Structure des actions de monstres chez Open5e : 390 actions avec attaque structurée sur 989, contre 440 sur 838 dans la D&D 5e API. À mesurer avant le bestiaire (M3).
- Open5e compte chaque variante d'objet à part (une ligne par type d'armure adamantine, par exemple) : à regrouper ou non lors de l'import.
