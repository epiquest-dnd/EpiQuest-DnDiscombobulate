# Contribuer à EpiQuest

Ce guide résume ce qu'il faut savoir pour contribuer. La référence complète, avec le calendrier et les rituels, est [`docs/projet/organisation.md`](docs/projet/organisation.md) : en cas de doute, c'est elle qui fait foi.

En participant, tu acceptes le [code de conduite](CODE_OF_CONDUCT.md).

## Prendre une tâche

1. **Relis d'abord les PR en attente** : relire passe avant prendre.
2. Prends une issue du milestone en cours, en commençant par celles marquées `priorité: haute`.
3. **Assigne-toi l'issue** et passe-la en « En cours » dans le [tableau](https://github.com/orgs/epiquest-dnd/projects/1) avant de commencer.
4. Une seule tâche en cours par personne. Si elle est trop grosse ou bloquée, découpe-la ou signale-le au point quotidien.

Toute tâche est une issue, avec un responsable, des labels (type, domaine, taille) et un milestone. Pour en créer une, utilise les modèles proposés par GitHub.

## Branches

Deux branches durables, sur lesquelles on ne pousse jamais directement :

- **`dev`** : la branche par défaut. Toutes les PR y vont.
- **`main`** : les versions publiées. Elle ne reçoit qu'une PR de release depuis `dev` à chaque fin de milestone (voir la procédure dans [docs/projet/organisation.md](docs/projet/organisation.md#releases)).

Crée ta branche depuis `dev`, avec le nom `type/numero-description-courte` :

```
feat/21-analyseur-des
fix/57-porte-bloque-vue
docs/9-format-effets
chore/14-ci-lint
```

## Commits

On suit [Conventional Commits](https://www.conventionalcommits.org/fr/) :

```
<type>(<domaine>): <description à l'impératif, en minuscule>

feat(des): gérer les dés explosifs
fix(vision): une porte ouverte ne bloque plus la ligne de vue
```

- **Types** : `feat`, `fix`, `docs`, `test`, `refactor`, `perf`, `chore`, `ci`, `build`.
- **Domaines** : `des`, `regles`, `srd`, `personnages`, `cartes`, `vision`, `sync`, `combat`, `bestiaire`, `campagne`, `mobile`, `ui`, `infra`, `adr`.

Comme les PR sont fusionnées en squash, **le titre de la PR devient le commit sur `dev`** : il doit respecter ce format lui aussi.

## Pull requests

1. Ouvre la PR vers `dev` tôt (en brouillon si besoin), reliée à l'issue avec `Closes #42`.
2. Remplis le modèle de PR, y compris la case sur l'usage de l'IA.
3. Une PR correspond à une issue, idéalement moins de 400 lignes modifiées. Au-delà, découpe.
4. CI verte et **1 approbation** d'un autre membre, puis merge en **squash**. La branche est supprimée automatiquement.

### Relecture

- Personne ne relit son propre code, et les relectures tournent pour que chacun connaisse tout le projet.
- On relit sous 24 h ouvrées. Si on bloque quelqu'un, on le dit au point quotidien.
- On commente le code, pas la personne. Une remarque non bloquante commence par « nit : ».

## Definition of Done

Une issue est terminée quand :

- les critères d'acceptation sont remplis ;
- les tests sont écrits et passent ;
- la checklist accessibilité est respectée pour toute interface touchée ;
- la documentation est à jour (technique, utilisateur, ADR si décision) ;
- il n'y a ni secret, ni code mort, ni fichier orphelin ;
- le CHANGELOG est complété si le changement est visible pour l'utilisateur ;
- la PR est approuvée par un autre membre ;
- l'usage de l'IA est déclaré dans la PR.

Le détail, dont la checklist accessibilité, est dans [`organisation.md`](docs/projet/organisation.md#5-definition-of-done) et repris dans le modèle de PR.

## Usage de l'IA

L'IA est autorisée mais encadrée. Le code généré passe les mêmes tests et la même relecture que le reste. **Si tu ne sais pas l'expliquer, ne le merge pas.** Les règles complètes sont dans [`organisation.md`](docs/projet/organisation.md#6-usage-de-lia).
