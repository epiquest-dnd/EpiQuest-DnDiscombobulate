# Accessibilité : objectifs, outils et méthode d'audit

> Issue #12. Ce document dit **comment** on vérifie l'accessibilité. Le **quoi** vérifier à chaque PR est la checklist de la Definition of Done ([organisation.md](../projet/organisation.md#checklist-accessibilité-à-chaque-pr-dinterface)).

## 1. Objectif

**WCAG 2.2 niveau AA** sur le web et sur l'application mobile, vérifié par un audit **automatique et manuel** (§03-A). Les livrables (rapport d'audit, déclaration d'accessibilité) sont produits en M5 ; tout ce qui suit sert à ne pas les découvrir en janvier.

L'outil automatique ne détecte qu'une partie des problèmes : **une CI verte ne prouve pas l'accessibilité**. Les vérifications manuelles de la section 4 restent obligatoires.

## 2. Outils automatiques

### Web (en CI, à chaque PR)

| Outil | Où | Ce qu'il vérifie | Échec de la CI |
|---|---|---|---|
| `eslint-plugin-vuejs-accessibility` | Lint des composants Vue | Libellés manquants, `alt` absents, éléments cliquables qui ne sont pas des boutons, attributs ARIA invalides | Toute erreur |
| `@axe-core/playwright` | Tests de bout en bout Playwright | Page rendue : contrastes, noms accessibles, structure, ARIA. Règles filtrées sur les étiquettes `wcag2a`, `wcag2aa`, `wcag21a`, `wcag21aa`, `wcag22a`, `wcag22aa` | Toute violation |
| Lighthouse CI (`@lhci/cli`) | Pages clés construites | Score d'accessibilité, pour suivre la tendance | Score < 95 |

Pages et états testés par axe, au minimum : connexion, liste des campagnes, assistant de création (chaque étape), fiche de personnage, vue MJ, vue de table, vue textuelle de la carte, journal des jets, avec une fenêtre modale ouverte.

### Android

| Outil | Quand | Ce qu'il vérifie |
|---|---|---|
| `enableAccessibilityChecks()` dans les tests d'interface Compose (dépendance `ui-test-junit4-accessibility`, Compose 1.8 ou plus) | CI, à chaque PR mobile | Mêmes règles que l'Accessibility Scanner (taille des cibles, contrastes, libellés) à chaque action des tests |
| Accessibility Scanner (application Google) | À la main, à chaque écran nouveau ou modifié | Suggestions sur l'écran affiché |

## 3. Points propres à EpiQuest

Ces points demandent une attention particulière, parce que les outils automatiques les voient mal :

- **La carte PixiJS est un canvas** : un lecteur d'écran n'y voit rien. Toute information de la carte (pions, positions, portes, zones, brouillard levé) existe aussi dans la **vue textuelle** HTML, testée par axe (§03-A, ADR-0004).
- **Déplacer un pion sans glisser** (critère 2.5.7 de WCAG 2.2) : chaque déplacement par glisser-déposer a une alternative au clavier (flèches) **et** par clic (sélectionner le pion, puis la case).
- **Jets de dés et actions de combat** : le résultat est annoncé dans une zone `aria-live`, sans voler le focus.
- **Couleurs** : PV, états, alliés et ennemis ne sont jamais signalés par la seule couleur (icône, motif ou texte en plus). Le thème PrimeVue respecte les contrastes de la charte.
- **Langue** : `<html lang>` suit la langue active (ADR-0004), pour la prononciation du lecteur d'écran.
- **Connexion** (critère 3.3.8) : pas de captcha à résoudre de tête, coller un mot de passe est autorisé, compatible avec les gestionnaires de mots de passe.

## 4. Vérifications manuelles

### À chaque PR d'interface

Par l'auteur, puis vérifié par le relecteur :

1. Parcourir la fonctionnalité **uniquement au clavier** : ordre logique, focus visible et jamais masqué par un bandeau ou une fenêtre.
2. Écouter la fonctionnalité au **lecteur d'écran** (section 5) : chaque élément a un nom, un rôle et un état compréhensibles.
3. Zoomer à **200 %**, puis réduire la fenêtre à **320 px** de large : rien n'est coupé, pas de défilement horizontal (sauf la carte).
4. Mobile : parcourir l'écran avec **TalkBack**, puis avec le texte système agrandi au maximum.

### À chaque fin de milestone

Un membre différent à chaque fois passe le parcours complet de l'annexe A1 (création d'un personnage, puis une action de combat) au clavier et au lecteur d'écran, sur le web et sur Android. Les problèmes trouvés deviennent des issues `a11y`.

### En M5

Audit complet sur un échantillon de pages, critère par critère, avec un vérificateur de contraste. Le rapport et la déclaration d'accessibilité sont ajoutés à `docs/`.

## 5. Lecteurs d'écran de l'équipe

Chaque membre installe au moins un lecteur d'écran pour le web et vérifie TalkBack sur un appareil ou un émulateur Android.

| Système | Lecteur d'écran | Navigateur conseillé |
|---|---|---|
| Windows | NVDA (gratuit) | Firefox ou Chrome |
| macOS | VoiceOver (intégré) | Safari |
| Linux | Orca (intégré à GNOME) | Firefox |
| Android | TalkBack (intégré) | Application EpiQuest |

| Membre | Lecteur d'écran web | TalkBack vérifié |
|---|---|---|
| angikonys | _à compléter_ | ☐ |
| LeoDoby | _à compléter_ | ☐ |
| TristanDlh | _à compléter_ | ☐ |
