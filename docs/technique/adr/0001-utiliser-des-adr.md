# ADR-0001 : Consigner les décisions d'architecture dans des ADR

- **Statut** : Acceptée
- **Date** : 2026-11-02
- **Décideurs** : toute l'équipe

## Contexte

Le sujet demande un journal des décisions d'architecture (contexte, options, choix retenu, conséquences) dans la documentation technique (§03-C). Le jury posera des questions sur nos choix en soutenance.

## Décision

- Chaque décision structurante fait l'objet d'un fichier `docs/technique/adr/NNNN-titre.md` basé sur `0000-modele.md`.
- Une ADR est proposée par pull request et acceptée quand les trois membres l'ont approuvée.
- Une ADR acceptée n'est jamais réécrite : si on change d'avis, on crée une nouvelle ADR qui la remplace et on met à jour le statut de l'ancienne.

## Conséquences

- On garde la trace du « pourquoi », utile pour la soutenance et pour un repreneur.
- Coût : 30 minutes à 1 heure par décision.

## Index

| N° | Titre | Statut |
|---|---|---|
| 0001 | Consigner les décisions dans des ADR | Acceptée |
| 0002 | Application mobile en Kotlin Multiplatform, cible Android | Acceptée (à compléter) |
| 0003 | Moteur de règles exécuté uniquement sur le serveur | Acceptée |
| 0004 | Stack serveur, web et base de données | Proposée |
| 0005 | Synchronisation temps réel des deux vues | Proposée |
| 0006 | Source et méthode d'import du SRD | Proposée |
| 0007 | Hébergement et déploiement continu | Proposée |
