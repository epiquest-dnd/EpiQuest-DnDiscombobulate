<!-- Titre de la PR au format Conventional Commits : il devient le commit sur dev. Exemple : feat(des): gérer les dés explosifs -->

Closes #

## Ce qui change

<!-- Quoi et pourquoi, en quelques lignes. -->

## Comment vérifier

<!-- Tests lancés, étapes pour le relecteur, captures si l'interface change. -->

## IA utilisée

- [ ] Non
- [ ] Oui, pour : <!-- code, tests, docs, visuels… -->

## Definition of Done

- [ ] Les critères d'acceptation de l'issue sont remplis
- [ ] Les tests sont écrits et passent (CI verte)
- [ ] La documentation est à jour (technique et/ou utilisateur, ADR si décision)
- [ ] Aucun secret, aucun code mort, aucun fichier orphelin
- [ ] Le CHANGELOG est complété si le changement est visible pour l'utilisateur
- [ ] La section « Usage de l'IA » du README est à jour si besoin

## Accessibilité

<!-- À remplir pour toute PR qui touche une interface. Sinon, supprime cette section. -->

- [ ] Tout est utilisable au clavier, dans un ordre logique, avec un focus visible et jamais masqué
- [ ] Tout ce qui se fait en glissant (pions, gabarits) se fait aussi au clavier et par clic
- [ ] Chaque champ a un libellé, chaque image utile un texte alternatif
- [ ] Les titres sont hiérarchisés, les éléments interactifs sont de vrais boutons/liens, de 24 × 24 px au moins
- [ ] Contraste ≥ 4,5:1 pour le texte ; aucune information portée par la seule couleur
- [ ] Zoom à 200 % et largeur de 320 px sans perte de contenu
- [ ] Les animations respectent `prefers-reduced-motion`
- [ ] Les changements dynamiques importants sont annoncés aux lecteurs d'écran
- [ ] Testé au lecteur d'écran ; CI verte (lint a11y, axe)
- [ ] Mobile : description TalkBack, cibles ≥ 48 dp, texte agrandi à 200 % sans perte
