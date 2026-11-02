# ADR-0007 : Hébergement et déploiement continu

- **Statut** : Proposée — après ADR-0004
- **Date** : 2026-11-02
- **Décideurs** : toute l'équipe

## Contexte

- Chaque merge sur `main` met à jour automatiquement le produit en ligne, avec la campagne de démonstration (§03-B). Offre d'hébergement gratuite au choix.
- Chaque merge produit un APK disponible en artefact du pipeline.
- Les secrets sont dans les GitHub Secrets, jamais dans le code.
- L'URL est dans le README.

## Besoins

| Composant | Besoin |
|---|---|
| Serveur | Process long avec **WebSocket**, variables d'environnement |
| Web | Fichiers statiques (ou servis par le serveur) |
| Base de données | PostgreSQL ou équivalent, gratuit, persistant |
| Mobile | Artefact APK dans GitHub Actions (pas d'hébergement) |

## Points de vigilance

- Les offres gratuites changent souvent : **vérifier les conditions actuelles** (mise en veille après inactivité, quotas, durée de vie des bases gratuites, carte bancaire exigée ou non).
- Une mise en veille peut ajouter un long délai au premier accès : prévoir de réveiller l'environnement avant la soutenance.
- Vérifier que l'offre accepte les WebSocket.
- Réinitialiser la campagne de démo à chaque déploiement (ou via une commande dédiée).

## Options

_Lister 2 ou 3 hébergeurs après vérification des offres actuelles (serveur, base, web), avec leurs limites._

## Décision

_À compléter._

## Conséquences

_À compléter._
