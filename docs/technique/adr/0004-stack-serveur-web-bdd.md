# ADR-0004 : Stack serveur, web et base de données

- **Statut** : Acceptée
- **Date** : 2026-11-03
- **Décideurs** : toute l'équipe (atelier d'architecture du 2026-11-03)
- **Issue** : #4

## Contexte

Stack libre mais à justifier (§01-B). Besoins à couvrir :

- API + temps réel (deux vues synchronisées), serveur qui fait autorité.
- Interface web riche : assistant, fiche, éditeur de cartes, vue MJ, vue joueurs.
- Carte rendue dans un canvas/WebGL **plus** une vue alternative textuelle en HTML (§03-A).
- Données relationnelles (campagnes, personnages, cartes…) et données de règles structurées (JSON).
- Tests en une commande, CI GitHub Actions, déploiement sur une offre gratuite.

L'application mobile est traitée à part (ADR-0002, Kotlin Multiplatform) : elle ne contient aucune règle et consomme l'API (ADR-0003).

## Critères de décision

1. Le moteur de règles est écrit dans le langage du serveur (ADR-0003) : le langage serveur doit être confortable pour un moteur riche et bien testé.
2. Maîtrise par au moins deux membres de l'équipe.
3. Support du temps réel (WebSocket).
4. Outillage de test et de lint mature.
5. Hébergement gratuit possible.

## Options envisagées

| Couche | Pistes étudiées |
|---|---|
| Serveur | Kotlin (Ktor, Spring Boot) · TypeScript (NestJS, Fastify, Express) |
| Web | React, Vue, Svelte ; rendu de carte : Canvas 2D, PixiJS, Konva |
| Composants d'interface | PrimeVue, Vuetify, shadcn-vue / Reka UI, Element Plus, Naive UI |
| Base de données | PostgreSQL (relationnel + colonnes JSONB pour les données de règles) |
| ORM / accès | Exposed, jOOQ (Kotlin) · Prisma, Drizzle (TypeScript) |

## Décision

| Couche | Choix |
|---|---|
| Langage | **TypeScript** pour le serveur et le web |
| Serveur | **Express** |
| Web | **Vue** |
| Composants d'interface | **PrimeVue** |
| Rendu des cartes | **PixiJS** |
| Base de données | **PostgreSQL** |
| ORM / accès | **Drizzle** |
| Internationalisation (web) | **vue-i18n**, anglais par défaut |

Justification :

- **Un seul langage** pour le serveur, le moteur de règles et le web : les types (fiche, effets, messages temps réel) se partagent dans le monorepo, et chacun peut travailler sur toutes les couches.
- **Express** : le framework serveur le plus répandu, que l'équipe a choisi pour sa simplicité et sa documentation abondante.
- **Vue** : choix de l'équipe pour le web.
- **PrimeVue** : composants prêts à l'emploi (assistant par étapes, tableaux, fenêtres modales, menus, notifications) qui suivent les modèles WAI-ARIA, ce qui aide pour la checklist accessibilité ; thème par variables (« design tokens ») pour appliquer notre propre charte ; traduction française disponible. Vuetify impose le style Material, shadcn-vue demande de construire beaucoup plus soi-même, Element Plus et Naive UI sont moins rigoureux sur l'accessibilité.
- **PixiJS** : rendu WebGL performant pour la carte, les pions, le brouillard et la ligne de vue. La vue textuelle HTML reste rendue par Vue à côté du canvas.
- **PostgreSQL + Drizzle** : données relationnelles et colonnes JSONB pour les règles ; Drizzle décrit le schéma en TypeScript et génère les migrations SQL.
- **Internationalisation dès le départ** : le produit est en anglais (langue du SRD), et d'autres langues seront ajoutées plus tard. vue-i18n est la bibliothèque d'internationalisation de référence pour Vue ; la langue de PrimeVue (libellés de ses composants) suit celle de vue-i18n.

## Conséquences

**Ce que la décision rend plus facile**

- Types partagés entre serveur et web : un changement de format casse la compilation des deux côtés au lieu de casser en production.
- Outillage unique (gestionnaire de paquets, lint, formatage, tests) pour tout sauf le mobile.

**Ce qu'elle rend plus difficile, les dettes acceptées**

- Le mobile (Kotlin) ne réutilise pas les types TypeScript : le contrat d'API doit être décrit (OpenAPI ou équivalent) pour générer ou vérifier le client Kotlin.
- Express ne fournit pas de WebSocket, de validation des entrées ni de documentation d'API : il faudra choisir des bibliothèques pour ces points. Le temps réel est tranché dans ADR-0005.
- Le moteur de règles est en TypeScript : il doit rester un module isolé du serveur (sans dépendance à Express ni à Drizzle) et testé seul (ADR-0003).

**Internationalisation (i18n)**

- Langue du produit : **anglais**. La documentation du projet reste en français.
- Aucun texte d'interface écrit en dur : tout passe par des clés de traduction (`t('sheet.armorClass')`), rangées dans un fichier par langue (`locales/en.json`). Ajouter une langue revient à ajouter un fichier, sans toucher au code.
- Le serveur et le moteur de règles ne renvoient **pas de phrases** : ils renvoient des **codes** avec leurs paramètres (`{ "code": "spell.slotUnavailable", "params": { "level": 3 } }`), que le web et le mobile traduisent. C'est ce qui permet aux deux clients d'afficher les mêmes messages dans leur langue.
- Dates, nombres et pluriels passent par le formatage de vue-i18n (API `Intl`), jamais par une concaténation de chaînes.
- La balise `<html lang>` suit la langue active, pour que les lecteurs d'écran prononcent correctement le texte.
- Le mobile utilise les ressources de chaînes de Kotlin Multiplatform avec les mêmes clés que le web.
- Le contenu de règles issu du SRD (noms et descriptions des sorts, monstres…) est traité dans ADR-0006.

**À surveiller**

- PixiJS n'est pas accessible par nature : toute information de la carte doit exister dans la vue textuelle HTML (§03-A).
- Le thème PrimeVue doit respecter les contrastes de la charte (≥ 4,5:1).
- Hébergement gratuit d'un serveur Node.js et d'une base PostgreSQL : à trancher dans ADR-0007.
