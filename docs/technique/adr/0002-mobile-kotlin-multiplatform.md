# ADR-0002 : Application mobile en Kotlin Multiplatform, cible Android

- **Statut** : Acceptée
- **Date** : 2026-11-02 (justification complétée le 2026-11-09)
- **Décideurs** : toute l'équipe
- **Issue** : #2

## Contexte

Le sujet (§02-K) demande une application mobile pour créer son personnage avec le même moteur de règles que le web, consulter et mettre à jour sa fiche, lancer ses dés. Contraintes :

- Une seule plateforme cible au choix (iOS ou Android), choix justifié.
- Natif ou framework multiplateforme autorisé ; **site web emballé interdit** (PWA, Ionic/Capacitor, Cordova, WebView).
- Accessibilité exigée : TalkBack ou VoiceOver, tailles de texte dynamiques, cibles ≥ 48 dp / 44 pt.
- Un build installable (APK ou build simulateur) produit automatiquement à chaque merge.

Ce qui est déjà décidé ailleurs :

- Le moteur de règles tourne uniquement sur le serveur (ADR-0003) : l'application ne contient aucune règle, elle envoie le brouillon et affiche la fiche calculée.
- Le serveur et le web sont en TypeScript (ADR-0004). Le serveur renvoie des **codes** de message, que chaque client traduit.
- Le temps réel passe par WebSocket avec des diffs JSON Patch, y compris sur le mobile (ADR-0005).

## Critères de décision

1. Respect du sujet : application réellement native, jamais un site emballé.
2. Accessibilité Android ou iOS vérifiable par toute l'équipe, à la main et en CI.
3. Build installable produit par la CI sans matériel ni compte payant.
4. Matériel de l'équipe : **aucun membre n'a de Mac**.
5. Garder la possibilité d'un bonus iOS sans réécrire le code non visuel.

## Options envisagées

### Plateforme cible

| Option | ➕ | ➖ |
|---|---|---|
| **Android** | Se compile et se teste sous Linux, Windows et macOS ; l'émulateur et TalkBack sont accessibles à tous les membres ; l'APK s'installe sur n'importe quel appareil ou émulateur, sans boutique ni compte | — |
| iOS | VoiceOver de bonne qualité | Compilation, simulateur et VoiceOver demandent un Mac, qu'aucun membre n'a ; distribuer un build installable demande un compte développeur Apple payant ; les runners macOS de GitHub Actions consomment le quota de minutes dix fois plus vite |

### Technologie de l'application

| Option | ➕ | ➖ |
|---|---|---|
| **Kotlin Multiplatform** (module partagé + UI par plateforme) | Langage et outils officiels d'Android ; modèles et client API écrits une fois et réutilisables par une app iOS ; rendu natif | Configuration Gradle plus lourde qu'un projet Android seul ; écosystème plus jeune |
| Kotlin Android seul | Le plus simple pour Android | Un bonus iOS repartirait de zéro |
| React Native | Même langage que le serveur et le web : les types TypeScript pourraient être partagés directement | L'équipe a choisi Kotlin pour le mobile ; outillage d'accessibilité Android moins direct (passe par une couche de traduction vers les vues natives) |
| Flutter | Multiplateforme mature | Dart, nouveau langage pour toute l'équipe ; dessine sa propre interface et expose un arbre d'accessibilité séparé |

### Interface (dans Kotlin Multiplatform)

| Option | ➕ | ➖ |
|---|---|---|
| **Jetpack Compose** dans le module Android, SwiftUI pour un éventuel iOS | Boîte à outils officielle d'Android, la mieux documentée ; outillage d'accessibilité complet (`semantics`, `enableAccessibilityChecks()` dans les tests, Accessibility Scanner) ; ressources et traductions Android standard | Un bonus iOS demanderait d'écrire l'interface une deuxième fois en SwiftUI |
| Compose Multiplatform (une UI dans le code commun) | Un bonus iOS coûterait beaucoup moins cher | Tests et vérifications d'accessibilité moins matures dans le code commun ; ressources, navigation et traductions via des bibliothèques multiplateformes ; ce coût est payé dès maintenant pour un bonus incertain |

## Décision

- **Android** est la plateforme cible évaluée. Raisons : aucun membre n'a de Mac, ce qu'exige le développement iOS ; l'APK est installable par le jury sans compte ni boutique ; la CI tourne sur un runner Linux ; chaque membre peut tester TalkBack sur un émulateur.
- **Kotlin Multiplatform** structure le projet en deux modules :
  - `shared` (code commun) : modèles de données, client HTTP et WebSocket Ktor, sérialisation `kotlinx.serialization`. **Aucune règle de jeu** (ADR-0003).
  - `androidApp` : interface en **Jetpack Compose** (Material 3), navigation, traductions.
- L'interface est en **Jetpack Compose**, pas en Compose Multiplatform : l'accessibilité est notée sur Android, et c'est là que l'outillage est le plus complet. Le partage porte sur le code non visuel, qui est la partie réutilisable sans risque.
- L'application iOS est un **bonus** : elle n'est démarrée que si le périmètre Android est terminé, et seulement si l'équipe a accès à un Mac. Elle réutiliserait `shared` avec une interface SwiftUI.

**Ce n'est pas un site emballé** : aucune WebView, ni Capacitor, ni Cordova, ni PWA. Chaque écran est un composant Compose rendu par Android, et ses `semantics` sont transmises directement aux services d'accessibilité (TalkBack, Switch Access). Une revue de code refuse toute dépendance à `WebView`.

## Conséquences

**Ce que la décision rend plus facile**

- Le build APK tourne sur un runner Linux de GitHub Actions, à chaque merge sur `dev` et sur `main` (CI mobile prévue en M2).
- Les tests d'interface Compose activent `enableAccessibilityChecks()` (voir [accessibilite.md](../accessibilite.md)) : taille des cibles, contrastes et libellés sont vérifiés à chaque PR mobile.
- Les composants Material 3 imposent déjà une cible minimale de 48 dp (`minimumInteractiveComponentSize`).

**Ce qu'elle rend plus difficile, les dettes acceptées**

- Le mobile ne réutilise pas les types TypeScript : le contrat d'API est décrit (OpenAPI, ADR-0004) pour générer ou vérifier les modèles Kotlin de `shared`. Un test de contrat en CI détecte les écarts.
- Les traductions des codes renvoyés par le serveur existent deux fois : `locales/en.json` pour le web, `res/values/strings.xml` pour Android. Une vérification en CI s'assure que chaque code a une traduction des deux côtés ; générer un fichier à partir de l'autre reste une piste.
- Un bonus iOS coûterait une interface complète en SwiftUI et l'accès à un Mac.

**Accessibilité**

- `contentDescription`, rôles et états via `Modifier.semantics` ; annonces des changements (« calcul en cours », résultat d'un jet) via des régions `liveRegion`.
- Tailles en `sp` pour le texte, interface vérifiée avec le texte système agrandi à 200 %.
- Test manuel avec TalkBack à chaque jalon (voir [accessibilite.md](../accessibilite.md)).

**À vérifier dans le squelette (#23, M1)**

- Versions compatibles de Kotlin, Gradle, Android Gradle Plugin et Compose (BOM), fixées dans un catalogue de versions.
- Lancement sur émulateur documenté dans le README.
- Client Ktor relié au serveur local de l'installation en une commande (#18).
