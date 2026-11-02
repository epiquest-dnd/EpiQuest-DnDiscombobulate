# Création du backlog dans GitHub

Ce dossier contient le backlog initial du projet (79 issues dont 5 bonus, réparties en 6 milestones) et un script qui le crée dans GitHub.

| Fichier | Rôle |
|---|---|
| `backlog.json` | Source : milestones, labels, issues (titre, corps, labels, taille, priorité) |
| `backlog.csv` | Même contenu en tableau (séparateur `;`), pour le relire à plusieurs |
| `creer_backlog_github.py` | Crée labels, milestones, issues et tableau GitHub Projects (Python 3, sans dépendance) |

## Utilisation

```bash
# 1. GitHub CLI connecté, avec le droit de gérer les Projects
gh auth login
gh auth refresh -s project

# 2. Vérifier ce qui va être créé
python3 setup/creer_backlog_github.py --repo ORGA/DEPOT --dry-run

# 3. Créer pour de vrai
python3 setup/creer_backlog_github.py --repo ORGA/DEPOT
```

Options utiles : `--no-bonus` (sans les issues bonus), `--no-project` (sans tableau), `--project-title "..."`.

Le script est rejouable : les labels sont mis à jour, les milestones et issues déjà présents (même titre) sont ignorés.

## Après la création

Dans le tableau GitHub Projects :

1. Colonnes de statut : Backlog, À faire, En cours, En relecture, Terminé.
2. Ajouter le champ « Milestone » à la vue et créer une vue « Roadmap » groupée par milestone.
3. Activer les automatisations intégrées : issue fermée → Terminé, PR mergée → Terminé.

## Prise des tâches

Les issues sont créées **sans responsable**. Quand on termine une tâche, on prend la suivante dans le milestone en cours (en priorité celles marquées `priorité: haute`), on s'assigne l'issue et on la passe en « En cours ». Les règles sont détaillées dans `docs/projet/organisation.md`.
