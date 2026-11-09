# EpiQuest

Table de jeu de rôle virtuelle pour la 5e édition, à utiliser autour d'une vraie table. Le maître du jeu pilote la partie sur son écran, et une vue joueurs affichée sur un second écran montre uniquement ce que les personnages peuvent voir.

> Projet en cours de cadrage : le produit n'existe pas encore. Les sections ci-dessous seront complétées au fil des milestones.

## Présentation

_À compléter : fonctionnalités principales et captures d'écran._

## Prérequis

- Node.js 22.22.2 ou plus récent en 22.x (voir `.nvmrc`) et npm 10.

Stack et justifications : [ADR-0004](docs/technique/adr/0004-stack-serveur-web-bdd.md).

## Installation

```sh
npm ci
```

Copier `.env.example` vers `.env` et renseigner les valeurs décrites dans ce fichier.

## Lancement

En développement, dans deux terminaux :

```sh
npm run dev:server   # API sur http://localhost:3000
npm run dev:web      # site sur http://localhost:5173
```

_À compléter (#18) : lancement du produit complet avec la base de données et la campagne de démonstration._

## Tests

```sh
npm test
```

Vérifie les types puis lance tous les tests du serveur, du web et du moteur de règles. Les tests de l'application mobile y seront ajoutés avec son squelette (#23).

## Arborescence

```
apps/server/            API Express
apps/web/               interface Vue
apps/mobile/            application Android en Kotlin Multiplatform (à venir)
packages/rules-engine/  moteur de règles, isolé du serveur et de la base
packages/shared/        types partagés entre serveur et web
docs/                   documentation du projet, technique et utilisateur
```

Détails et commandes : [guide de prise en main](docs/technique/prise-en-main.md).

## Documentation

- [Documentation du projet](docs/README.md)
- [Documentation technique](docs/technique/README.md)
- [Guide utilisateur](docs/utilisateur/README.md)
- [Contribuer](CONTRIBUTING.md)
- [Journal des modifications](CHANGELOG.md)

## Usage de l'IA

Conformément à la charte IA du groupe IONIS, cette section déclare les outils utilisés et pour quoi. Elle est tenue à jour dans chaque PR concernée.

| Outil | Usage |
|---|---|
| Claude Code | Documentation : rédaction des fichiers du dépôt, des modèles de contribution et des ADR ; comparatif des API du SRD (Open5e, D&D 5e API) ; code : initialisation du monorepo |

## Licence

Le code est distribué sous licence [GNU AGPL 3.0](LICENSE).

Le contenu de règles issu du SRD reste sous licence CC BY 4.0 : voir [ATTRIBUTION.md](ATTRIBUTION.md).
