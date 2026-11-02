# ADR-0005 : Synchronisation temps réel des deux vues

- **Statut** : Proposée
- **Date** : 2026-11-02
- **Décideurs** : toute l'équipe

## Contexte

- La vue MJ et la vue joueurs (deuxième fenêtre, écran ou télévision) sont synchronisées en direct : déplacements, brouillard, initiative, PV, jets publics, documents révélés (§02-I).
- **La vue joueurs ne reçoit jamais les informations cachées**, même dans les données reçues par le navigateur : pions et zones sous le brouillard, calque MJ, jets cachés, notes privées (§03-B). Les créatures visibles n'ont qu'un état approximatif (indemne, blessé, à terre).
- Le temps de synchronisation doit être mesuré et documenté.

## Principe proposé (indépendant de la stack)

1. **Le client envoie des intentions** (« déplacer le pion X en (4,7) »), jamais un nouvel état.
2. **Le serveur valide, applique et journalise**, puis calcule pour chaque destinataire une **projection** de l'état :
   - projection MJ : tout ;
   - projection joueurs : uniquement ce que les personnages voient, PV remplacés par un état approximatif.
3. Le serveur diffuse à chaque canal sa projection (ou le diff de sa projection).
4. À la (re)connexion, le client reçoit un instantané complet de sa projection.

Le filtrage se fait **avant l'envoi**, jamais dans le navigateur.

## Options de transport

| Option | ➕ | ➖ |
|---|---|---|
| WebSocket | Bidirectionnel, standard, supporté partout | Gestion de la reconnexion |
| Server-Sent Events + requêtes HTTP | Simple, unidirectionnel suffisant pour la vue joueurs | Deux mécanismes |
| Bibliothèque temps réel (Socket.IO, etc.) | Salles, reconnexion fournies | Dépendance supplémentaire |

## Options de format

| Option | ➕ | ➖ |
|---|---|---|
| Instantané complet à chaque changement | Simple, toujours cohérent | Volumineux avec une grosse carte |
| Événements métier filtrés | Léger, rejouable | Filtrage à faire événement par événement, risque de fuite |
| Diff de projection | Léger et filtrage garanti par construction | Calcul du diff |

## Décision

_À compléter._

## Conséquences

- Tests obligatoires : inspecter les messages envoyés au canal joueurs et vérifier l'absence de toute donnée cachée (issue « Filtrage serveur »).
- Mesure : temps entre l'action MJ et l'affichage sur la vue joueurs, sur une carte chargée.
