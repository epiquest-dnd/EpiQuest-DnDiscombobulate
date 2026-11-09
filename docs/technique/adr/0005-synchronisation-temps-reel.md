# ADR-0005 : Synchronisation temps réel des deux vues

- **Statut** : Acceptée
- **Date** : 2026-11-03
- **Décideurs** : toute l'équipe (atelier d'architecture du 2026-11-03)
- **Issue** : #5

## Contexte

- La vue MJ et la vue joueurs (deuxième fenêtre, écran ou télévision) sont synchronisées en direct : déplacements, brouillard, initiative, PV, jets publics, documents révélés (§02-I).
- **La vue joueurs ne reçoit jamais les informations cachées**, même dans les données reçues par le navigateur : pions et zones sous le brouillard, calque MJ, jets cachés, notes privées (§03-B). Les créatures visibles n'ont qu'un état approximatif (indemne, blessé, à terre).
- Le temps de synchronisation doit être mesuré et documenté.
- Clients concernés : le web (vue MJ, vue joueurs) et l'application mobile Kotlin Multiplatform (ADR-0002), qui envoie par exemple des jets publics affichés sur la vue de table.
- Stack : serveur Express en TypeScript (ADR-0004).

## Principe retenu (indépendant de la stack)

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

**Transport : WebSocket brut, avec la bibliothèque `ws`**, branchée sur le serveur HTTP d'Express.

**Format : diff de projection au format JSON Patch (RFC 6902)**, avec la bibliothèque `fast-json-patch` côté serveur et côté web.

Justification :

- **Le mobile parle le même protocole.** Le client WebSocket de Ktor fonctionne dans le module `shared` de Kotlin Multiplatform, donc sur Android et plus tard sur iOS. Socket.IO impose un protocole maison dont le client Kotlin/Java ne tourne que sur la JVM, hors du code partagé.
- `ws` est la bibliothèque WebSocket de référence en Node.js, sans protocole ajouté. Ce que Socket.IO aurait fourni (salles, reconnexion) tient en peu de code chez nous.
- Server-Sent Events est écarté : il faudrait deux mécanismes (SSE pour recevoir, HTTP pour envoyer), et le mobile envoie aussi des actions.
- **Le diff de projection garantit le filtrage par construction** : une donnée absente de la projection joueurs ne peut pas apparaître dans son diff. Avec des événements métier, chaque type d'événement devrait être filtré à la main, au risque d'en oublier un.
- JSON Patch est un standard : il s'applique de la même façon sur le web et sur le mobile.

## Conséquences

**Protocole**

- Un message est un objet JSON avec un `type`. Les messages entrants (intentions) et sortants (instantanés, patchs, erreurs) sont décrits par des schémas typés, partagés avec le web et documentés pour le client Kotlin. Tout message entrant non conforme est refusé.
- Messages sortants :
  - `snapshot` : projection complète du destinataire, avec son numéro de `version` ;
  - `patch` : opérations JSON Patch qui font passer la projection de `version - 1` à `version` ;
  - `error` : un code et ses paramètres, jamais une phrase (i18n, ADR-0004).
- Le client applique les patchs dans l'ordre. S'il voit un trou dans les numéros de version, ou si un patch échoue, il redemande un `snapshot`.
- Le serveur garde pour chaque connexion la dernière projection envoyée et calcule le diff avec la nouvelle. Si le diff est plus gros que la projection, il envoie un `snapshot` à la place.

**Connexions et canaux**

- Le serveur tient une table « campagne → connexions », chaque connexion étant rattachée à un canal : MJ, joueur (un personnage) ou vue de table.
- **Le canal est déterminé par le serveur, d'après la session authentifiée**, jamais d'après un paramètre envoyé par le client.
- La vue de table (télévision, deuxième écran) s'ouvre avec un lien à jeton propre à la campagne, en lecture seule et révocable par le MJ.
- La connexion WebSocket est authentifiée à l'ouverture (session web ou jeton du mobile) ; l'origine de la requête est vérifiée.
- Le client se reconnecte avec un délai croissant et reçoit un `snapshot` complet à chaque reconnexion. Un message ping/pong détecte les connexions mortes.

**Mobile**

- Le module `shared` contient le client WebSocket (Ktor), les modèles des messages et l'application des patchs. Il faut choisir une bibliothèque JSON Patch Kotlin Multiplatform, ou appliquer nous-mêmes les opérations reçues (`add`, `remove`, `replace` suffisent si le serveur n'en génère pas d'autres).
- Comme le web, le mobile n'envoie que des intentions et n'applique aucune règle (ADR-0003).

**Ce que la décision rend plus difficile, les dettes acceptées**

- Reconnexion, ping/pong et regroupement par campagne sont à écrire et à tester nous-mêmes.
- Une seule instance du serveur : l'état des parties actives est en mémoire et persisté dans PostgreSQL. Répartir la charge sur plusieurs serveurs demanderait un bus de messages ; ce n'est pas nécessaire pour le projet.
- Le calcul de la projection et du diff à chaque changement a un coût, à surveiller sur une grande carte.

**Tests et mesure**

- Tests obligatoires : inspecter les messages envoyés au canal joueurs et à la vue de table (instantanés **et** patchs) et vérifier l'absence de toute donnée cachée (issue « Filtrage serveur »).
- Test d'une connexion qui tente de rejoindre un autre canal ou une autre campagne : elle doit être refusée.
- Mesure : chaque message porte l'horodatage serveur de l'action d'origine ; on mesure le temps entre l'action MJ et l'affichage sur la vue joueurs, sur une carte chargée, et on le documente.
