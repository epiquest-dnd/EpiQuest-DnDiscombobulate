# ADR-0004 : Stack serveur, web et base de données

- **Statut** : Proposée
- **Date** : 2026-11-02
- **Décideurs** : toute l'équipe

## Contexte

Stack libre mais à justifier (§01-B). Besoins à couvrir :

- API + temps réel (deux vues synchronisées), serveur qui fait autorité.
- Interface web riche : assistant, fiche, éditeur de cartes, vue MJ, vue joueurs.
- Carte rendue dans un canvas/WebGL **plus** une vue alternative textuelle en HTML (§03-A).
- Données relationnelles (campagnes, personnages, cartes…) et données de règles structurées (JSON).
- Tests en une commande, CI GitHub Actions, déploiement sur une offre gratuite.

## Critères de décision

1. Le moteur de règles est écrit dans le langage du serveur (ADR-0003) : le langage serveur doit être confortable pour un moteur riche et bien testé.
2. Maîtrise par au moins deux membres de l'équipe.
3. Support natif du temps réel (WebSocket).
4. Outillage de test et de lint mature.
5. Hébergement gratuit possible.

## Options à comparer

| Couche | Pistes |
|---|---|
| Serveur | Kotlin (Ktor, Spring Boot) · TypeScript (NestJS, Fastify) · autre si maîtrisé |
| Web | React, Vue, Svelte… (HTML sémantique obligatoire) ; rendu de carte : Canvas 2D, PixiJS, Konva… |
| Base de données | PostgreSQL (relationnel + colonnes JSONB pour les données de règles) · autre |
| ORM / accès | selon le langage (Exposed, jOOQ, Prisma, Drizzle…) |

## Décision

_À compléter._

## Conséquences

_À compléter._
