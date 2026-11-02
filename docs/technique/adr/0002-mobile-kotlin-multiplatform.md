# ADR-0002 : Application mobile en Kotlin Multiplatform, cible Android

- **Statut** : Acceptée (justification à compléter)
- **Date** : 2026-11-02
- **Décideurs** : toute l'équipe
- **Issue** : ADR-0002

## Contexte

Le sujet (§02-K) demande une application mobile pour créer son personnage avec le même moteur de règles que le web, consulter et mettre à jour sa fiche, lancer ses dés. Contraintes :

- Une seule plateforme cible au choix (iOS ou Android), choix justifié.
- Natif ou framework multiplateforme autorisé ; **site web emballé interdit** (PWA, Ionic/Capacitor, Cordova, WebView).
- Accessibilité exigée : TalkBack ou VoiceOver, tailles de texte dynamiques, cibles ≥ 48 dp / 44 pt.
- Un build installable (APK ou build simulateur) produit automatiquement à chaque merge.

## Options envisagées

| Option | ➕ | ➖ |
|---|---|---|
| **Kotlin Multiplatform** | Code métier partagé entre plateformes et potentiellement avec le serveur ; UI native ou Compose ; Android de premier ordre | Écosystème plus jeune ; l'iOS demande un Mac |
| Kotlin natif Android seul | Le plus simple pour Android | Pas de partage de code |
| Flutter / React Native | Multiplateforme mature | Langage différent du choix d'équipe ; partage du moteur moins direct avec un module Kotlin |

## Décision

- **Kotlin Multiplatform**, avec **Android comme plateforme cible évaluée**.
- Les modèles et le client API vivent dans un module `shared` commun. Le moteur de règles reste sur le serveur (ADR-0003) : l'application l'appelle par l'API pour créer et faire évoluer un personnage.
- Interface : _à trancher_ entre Compose Multiplatform (une UI pour Android et iOS) et Jetpack Compose côté Android uniquement.
- L'application iOS est un **bonus** : elle n'est démarrée que si le périmètre Android est terminé.

## Conséquences

- La CI build un APK sur un runner Linux (pas besoin de runner macOS, plus lent et limité).
- Accessibilité : on utilise les `semantics` de Compose (contentDescription, rôles, états) et on teste avec TalkBack et Accessibility Scanner.
- L'app n'est jamais une WebView : toutes les vues sont natives Compose.
- À vérifier en M1 : versions Kotlin / Compose / Gradle compatibles, et lancement sur émulateur documenté dans le README.
