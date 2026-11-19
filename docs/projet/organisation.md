# Organisation du projet

> Document vivant. On le relit au début de chaque milestone et on le modifie par pull request comme le reste.

## 1. Équipe et prise des tâches

| Membre | Pseudo GitHub |
|---|---|
| _à compléter_ | [@angikonys](https://github.com/angikonys) |
| _à compléter_ | [@LeoDoby](https://github.com/LeoDoby) |
| _à compléter_ | [@TristanDlh](https://github.com/TristanDlh) |

Il n'y a **pas de répartition fixe** : chacun prend une nouvelle tâche quand il a terminé la précédente.

Règles pour que ça marche :

1. **Une seule tâche en cours par personne.** On ne commence pas une issue tant que la sienne n'est pas mergée (ou en relecture).
2. **On prend dans le milestone en cours**, en commençant par les issues `priorité: haute` : d'autres tâches en dépendent. On ne pioche dans le milestone suivant que si le milestone en cours n'a plus rien de disponible.
3. **On s'assigne l'issue** et on la passe en « En cours » dans le tableau **avant** de commencer. Le sujet exige que chaque issue ait un responsable (§03-B), et ça évite que deux personnes fassent la même chose.
4. **Relire passe avant prendre** : avant de prendre une nouvelle tâche, on relit les PR qui attendent.
5. Si une tâche est trop grosse ou bloquée par une autre, on la découpe ou on le signale dans le point quotidien plutôt que de la garder.

Pour suivre ce que chacun a fait, il suffit de regarder les issues fermées et les PR par personne dans GitHub. Si en fin de milestone quelqu'un n'a touché qu'une seule partie du projet, on s'en parle à la rétro.

Règles communes :

- **Personne ne relit son propre code.** Les relectures tournent pour que chacun connaisse tout le projet : en soutenance, chacun doit pouvoir expliquer n'importe quelle partie (§03-D).
- Quand deux tâches en cours se touchent (ex. moteur de règles et combat), les deux personnes se mettent d'accord sur l'interface avant de coder.

## 2. Calendrier

| Milestone | Période | Contenu | Tag |
|---|---|---|---|
| **M0 · Cadrage & architecture** | 2 → 8 nov. | ADR, format des effets, conventions, fichiers du dépôt | — |
| **M1 · Fondations** | 9 → 22 nov. | Modèle de données, monorepo, CI, Docker, import SRD, analyseur de dés, comptes, squelette mobile, charte, déploiement continu | v0.1.0 |
| **M2 · Personnages & cartes** | 23 nov. → 6 déc. | Stats dérivées, jets serveur, campagnes, assistant et fiche web, éditeur de cartes, murs/portes, pions, CI mobile | v0.2.0 |
| **M3 · Table de jeu** | 7 → 20 déc. | Ligne de vue, vues synchronisées et filtrées, résolution des actions, bestiaire, assistant mobile — **démo au follow-up** | v0.3.0 |
| **M4 · Combat & mobile** | 21 déc. → 17 janv. | Brouillard, initiative, effets MJ, annulation, montée de niveau, rencontres, vue textuelle, fiche/dés mobile, campagne de démo | v0.4.0 |
| **M5 · Qualité & soutenance** | 18 → 29 janv. | Audits d'accessibilité, docs, mesures de perf, sécurité, test du nouvel arrivant, répétitions | **v1.0.0** |

- M4 inclut les fêtes : chacun annonce ses disponibilités avant le 18 décembre et on ajuste.
- La date de M5 est à caler sur la date réelle de soutenance dès qu'elle est connue.
- Le follow-up de décembre est facultatif mais on y va : c'est le seul retour avant la soutenance.

## 3. Rituels

| Quand | Quoi | Durée |
|---|---|---|
| Début de milestone | **Planning** : on relit les issues du milestone, on ajuste tailles et priorités, on découpe les tâches trop grosses | 1 h |
| Chaque jour ouvré | **Point asynchrone** sur le canal d'équipe : fait hier / prévu aujourd'hui / bloqué par | 2 min |
| Fin de milestone | **Démo interne** sur l'environnement en ligne + **rétro** (garder / arrêter / essayer) + tag de version | 1 h |

## 4. Flux de travail GitHub

1. Toute tâche est une **issue** avec un responsable, des labels (type, domaine, taille) et un milestone.
2. On passe l'issue en « En cours » dans le tableau et on crée une branche depuis `dev`.
3. On ouvre une **pull request vers `dev`** reliée à l'issue (`Closes #42`) dès que possible (en brouillon si besoin).
4. CI verte + **1 approbation** d'un autre membre → merge en **squash**. La branche est supprimée.
5. Le merge sur `dev` met à jour la **préproduction** ; le merge d'une release sur `main` met à jour la **production**.

### Branches

Deux branches durables, protégées par des rulesets (pas de push direct ni de force-push, PR obligatoire, 1 relecture, CI obligatoire dès l'issue #17) :

| Branche | Rôle | Reçoit | Méthode de merge |
|---|---|---|---|
| `dev` | Intégration, **branche par défaut** | Les PR de toutes les tâches | Squash, historique linéaire |
| `main` | Versions publiées, production | Uniquement les PR de release depuis `dev` | Commit de merge |

`dev` est la branche par défaut pour que `Closes #42` ferme l'issue au merge et que le tableau la passe en « Terminé ».

Un correctif urgent suit le même chemin : PR vers `dev`, puis release de correctif (`v0.2.1`).

Nom des branches : `type/numero-description-courte`

```
feat/21-analyseur-des
fix/57-porte-bloque-vue
docs/9-format-effets
chore/14-ci-lint
```

### Releases

Une release complète à chaque fin de milestone (tags du §2), le jour de la démo interne :

1. Toutes les PR du milestone sont mergées dans `dev` et la préproduction a été vérifiée.
2. On ouvre une PR **`dev` → `main`** intitulée `chore(release): v0.1.0`, avec la liste des issues livrées.
3. 1 approbation → merge en **commit de merge** (jamais en squash : `dev` et `main` divergeraient).
4. On tague le commit de merge et on publie la GitHub Release :
   ```bash
   git switch main && git pull
   git tag -a v0.1.0 -m "v0.1.0 · Fondations"
   git push origin v0.1.0
   gh release create v0.1.0 --generate-notes
   ```
5. Le merge sur `main` déploie la production.

### Commits : Conventional Commits

```
<type>(<domaine>): <description à l'impératif, en minuscule>

feat(des): gérer les dés explosifs
fix(vision): une porte ouverte ne bloque plus la ligne de vue
test(regles): ajouter le magicien de référence niveau 3
docs(adr): accepter ADR-0005
chore(ci): mettre en cache les dépendances
```

Types : `feat`, `fix`, `docs`, `test`, `refactor`, `perf`, `chore`, `ci`, `build`.
Domaines : `des`, `regles`, `srd`, `personnages`, `cartes`, `vision`, `sync`, `combat`, `bestiaire`, `campagne`, `mobile`, `ui`, `infra`, `adr`.

Le format est vérifié automatiquement (hook de commit + CI) et sert à générer le CHANGELOG.

### Relecture

- Une PR = une issue, idéalement moins de 400 lignes modifiées. Au-delà, on découpe.
- Relecture sous 24 h ouvrées. Si on bloque quelqu'un, on le dit dans le point quotidien.
- On commente le code, pas la personne. Une remarque non bloquante est préfixée par « nit : ».

## 5. Definition of Done

Une issue est « Terminée » quand :

- [ ] Les critères d'acceptation de l'issue sont remplis
- [ ] Les tests sont écrits et passent (CI verte)
- [ ] La checklist accessibilité ci-dessous est respectée pour toute interface touchée
- [ ] La documentation est à jour (technique et/ou utilisateur, ADR si décision)
- [ ] Aucun secret, aucun code mort, aucun fichier orphelin
- [ ] Le CHANGELOG est complété si le changement est visible pour l'utilisateur
- [ ] La PR a été relue et approuvée par un autre membre
- [ ] L'usage de l'IA est déclaré dans la PR (case du modèle de PR)

### Checklist accessibilité (à chaque PR d'interface)

Objectif WCAG 2.2 AA. Outils et méthode de vérification : [accessibilite.md](../technique/accessibilite.md).

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

## 6. Usage de l'IA

L'IA est autorisée mais encadrée (§03-D) :

- Le modèle de PR contient une case « IA utilisée : non / oui, pour… ». On la remplit honnêtement.
- La section « Usage de l'IA » du README est tenue à jour au fil de l'eau par chacun, dans la PR concernée (outils et usages : code, tests, docs, visuels).
- Le code généré passe les mêmes tests et la même relecture que le reste. **Si on ne sait pas l'expliquer, on ne le merge pas.**
- Aucun visuel ni texte généré ne doit reproduire du contenu des livres payants ou une marque existante.

## 7. Risques identifiés

| Risque | Parade |
|---|---|
| Le moteur de règles et la conversion du SRD prennent bien plus de temps que prévu | Format des effets figé dès M0 ; on convertit d'abord ce dont la campagne de démo a besoin ; le reste passe par les effets manuels du MJ |
| Courbe d'apprentissage Kotlin Multiplatform | Squelette dès M1, CI mobile en M2 ; on garde l'iOS comme bonus |
| Fuite d'information cachée vers la vue joueurs | Projection serveur par destinataire dès la conception (ADR-0005) et tests qui inspectent les messages envoyés |
| Hébergement gratuit qui se met en veille ou tombe pendant la soutenance | On réveille l'environnement avant de passer et on a une version locale prête (Docker) |
| Accessibilité traitée trop tard | Checklist dans la Definition of Done dès M0, vérifiée à chaque relecture |
| Tâches critiques laissées de côté au profit de tâches plus faciles | Label `priorité: haute` pris en premier ; point à chaque rétro |

## 8. Semaine du 2 novembre (M0)

1. Créer le dépôt et lancer `setup/creer_backlog_github.py`.
2. Atelier d'architecture à 3 (2 h) : le moteur de règles tourne sur le serveur (ADR-0003 acceptée) ; trancher maintenant ADR-0004 (stack serveur, web, base) puis ADR-0005 (temps réel).
3. Chacun prend une issue de M0, en commençant par celles marquées `priorité: haute`.
4. Fin de semaine : relecture croisée des ADR, statut « Acceptée », passage en M1.
