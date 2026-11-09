# ADR-0003 : Moteur de règles exécuté uniquement sur le serveur

- **Statut** : Acceptée
- **Date** : 2026-11-02
- **Décideurs** : toute l'équipe
- **Issue** : #3

## Contexte

Le moteur de règles calcule les statistiques dérivées, valide les choix de création, gère la montée de niveau et résout les actions de combat. Le sujet impose :

- **Le serveur fait autorité** : jets et actions de combat calculés et validés côté serveur (§03-B).
- **Le mobile crée un personnage « avec le même moteur de règles que le web »** (§02-K).
- Les règles sont des **données** interprétées par le moteur (§02-C).

L'application mobile est en Kotlin Multiplatform (ADR-0002). La question était donc : en quel langage écrire le moteur, et où l'exécuter ?

## Critères de décision

1. Une seule implémentation du moteur (sinon deux codes à tester et à garder cohérents).
2. Le serveur doit exécuter le moteur (autorité).
3. Réactivité de l'interface pendant la création de personnage (recalcul à chaque clic).
4. Compétences de l'équipe et temps disponible.
5. Accessibilité du web : il doit rester en HTML sémantique.

## Options envisagées

### Option 1 : moteur en Kotlin dans le module partagé KMP

Le moteur est un module Kotlin commun, compilé pour la JVM (serveur), Android (mobile) et JavaScript (web, via Kotlin/JS exporté comme bibliothèque appelée par l'interface web).

- ➕ Une seule implémentation exécutée partout, y compris hors ligne sur le mobile.
- ➕ Serveur et mobile dans le même langage (serveur Kotlin : Ktor ou Spring Boot).
- ➖ Impose un serveur JVM/Kotlin.
- ➖ L'interop Kotlin/JS avec un front TypeScript demande de l'outillage (export `@JsExport`, types générés) : à prototyper avant de s'engager.
- ⚠️ Ne **pas** faire l'interface web en Compose for Web / Wasm : le rendu dans un canvas pose de gros problèmes d'accessibilité (lecteurs d'écran, zoom).

### Option 2 : moteur uniquement côté serveur, exposé par l'API

Le moteur vit dans le serveur (n'importe quel langage). Web et mobile appellent l'API pour valider un choix et obtenir les statistiques recalculées.

- ➕ Une seule implémentation, autorité serveur naturelle, stack serveur libre.
- ➕ Le plus simple à mettre en place.
- ➖ Création de personnage impossible hors ligne (non exigé par le sujet).
- ➖ Un aller-retour réseau à chaque choix : prévoir une API pensée pour ça (envoyer le brouillon complet, recevoir la fiche calculée + les erreurs).

### Option 3 : moteur en TypeScript partagé serveur/web, mobile via l'API

Variante de l'option 2 : le moteur est un paquet TypeScript utilisé par le serveur (Node) et le web (calcul instantané côté client, revalidé par le serveur). Le mobile passe par l'API.

- ➕ Interface web très réactive, un seul langage côté web/serveur.
- ➖ Mobile et web n'exécutent pas le moteur au même endroit (mais c'est bien le même moteur).

### Option 4 : deux implémentations (Kotlin et autre) partageant les données et des tests communs

- ➖ Double travail et risque de divergence. **À éviter.**

## Décision

**Option 2 : le moteur de règles tourne uniquement sur le serveur** et il est exposé par l'API. Le web et le mobile sont des clients légers : ils affichent, envoient les choix de l'utilisateur et reçoivent le résultat calculé.

C'est bien « le même moteur de règles » pour le web et le mobile (§02-K) : il n'en existe qu'un, celui du serveur.

Justification :

- Une seule implémentation à écrire, tester et documenter.
- L'autorité du serveur (§03-B) est garantie par construction : aucun calcul de règles n'est fait côté client.
- Le langage du moteur est celui du serveur, ce qui laissait ADR-0004 libre. Le serveur est finalement en TypeScript (ADR-0004) : le moteur est donc écrit en TypeScript.
- Le mobile n'a pas besoin de fonctionner hors ligne (non exigé par le sujet).

## Conséquences

**Conception de l'API du moteur**

- Pour la création et l'évolution d'un personnage, le client envoie le **brouillon complet** (tous les choix faits jusque-là) et reçoit en une réponse la **fiche calculée**, les **erreurs de validation** (rattachées à un champ, sous forme de code de message et de paramètres que le client traduit, voir ADR-0004) et les **choix encore possibles** (compétences sélectionnables, sorts autorisés…). Le client n'a aucune règle à connaître.
- Les clients ne recalculent rien : pour éviter un appel à chaque frappe, ils regroupent les changements (anti-rebond de quelques centaines de millisecondes) et affichent un état « calcul en cours » annoncé aux lecteurs d'écran.
- Les mêmes points d'API servent au web et au mobile ; ils sont documentés (OpenAPI ou équivalent) et testés.
- Le combat suit le même principe : intention envoyée, prévisualisation calculée, application confirmée (voir architecture.md).

**Code**

- Le moteur est un module isolé du serveur (aucune dépendance au transport HTTP ni à la base), testable seul avec les personnages de référence.
- Le module `shared` de l'application KMP contient les modèles et le client API, **pas de règles**.

**À surveiller**

- Temps de réponse de l'API du moteur sur le VPS de production (ADR-0007), réseau mobile compris : à mesurer avec les autres performances.
- Sans réseau, le mobile ne peut ni créer ni modifier un personnage : afficher un message clair dans ce cas.
