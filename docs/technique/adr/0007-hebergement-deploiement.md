# ADR-0007 : Hébergement et déploiement continu

- **Statut** : Acceptée
- **Date** : 2026-11-03
- **Décideurs** : toute l'équipe (atelier d'architecture du 2026-11-03)
- **Issue** : #7

## Contexte

- Chaque merge sur `main` met à jour automatiquement le produit en ligne, avec la campagne de démonstration (§03-B). Le sujet propose une offre d'hébergement gratuite au choix ; l'équipe accepte un petit coût mensuel pour un service plus fiable.
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

Offres vérifiées le 2026-11-03 sur les pages des hébergeurs. Prix mensuels.

| Option | Prix | ➕ | ➖ |
|---|---|---|---|
| Render (gratuit) + Neon (gratuit) | 0 € | Aucune administration, déploiement depuis GitHub | Serveur mis en veille après 15 min sans trafic, environ 1 min de réveil |
| Render Starter + Neon (gratuit) | ~7 $ | Toujours allumé, aucune administration | Base mise en veille après 5 min ; offres Render modifiées plusieurs fois en 2026 |
| Heroku Basic + Essential-0 | 12 $ (couvert par le Student Pack GitHub) | Toujours allumé, tout au même endroit | Dépend d'un Student Pack validé ; base de 1 Go et 20 connexions |
| Hetzner CX23 (VPS) | 5,99 € HT | 2 vCPU, 4 Go | Offres économiques indisponibles à la commande |
| **OVH VPS-1** | **3,81 € HT (4,57 € TTC)** | 2 vCores, 4 Go, 40 Go NVMe, trafic illimité (500 Mbit/s), sauvegarde quotidienne des dernières 24 h | Exploitation à notre charge ; disque de 40 Go à surveiller |
| OVH VPS-2 | 7,21 € HT (8,65 € TTC) | 4 vCores, 8 Go, 75 Go NVMe | Indisponible en Europe à la date de la décision |

Écartés : Koyeb (offre gratuite retirée aux nouveaux comptes), Fly.io (plus d'offre gratuite), Railway (1 $ d'usage par mois après l'essai), base gratuite de Render (supprimée après 30 jours).

## Décision

**Un VPS OVH VPS-1, avec Docker Compose, et un déploiement continu par GitHub Actions.**

Justification :

- **Toujours allumé** : pas de mise en veille, donc des démos et une soutenance fiables.
- **Assez pour le projet** : 2 vCores et 4 Go de RAM suffisent pour le serveur, PostgreSQL et le reverse proxy sur la même machine. Le VPS-2, plus confortable, n'était pas disponible en Europe ; on pourra y passer plus tard si les mesures de performance le demandent.
- **Prix fixe et prévisible**, sans facturation à l'usage.
- **Une seule machine** pour tout, identique à l'environnement local Docker prévu en cas de panne le jour de la soutenance.
- La sauvegarde quotidienne est incluse dans l'offre.

## Conséquences

**Architecture sur le VPS**

- Système : **Fedora Server**, avec Docker Engine installé depuis le dépôt officiel de Docker.
- Docker Compose avec trois conteneurs :
  - `server` : le serveur Express, qui sert aussi les fichiers du site Vue ;
  - `db` : PostgreSQL, sur un volume persistant, **jamais exposé à Internet** ;
  - `caddy` : reverse proxy qui obtient et renouvelle automatiquement les certificats HTTPS et transmet le WebSocket (ADR-0005).
- Le même fichier Compose sert en local, ce qui donne la version de secours pour la soutenance.

**HTTPS sans nom de domaine**

- Le produit est servi directement sur l'adresse IP du VPS : `https://159.173.138.75`. L'URL est ajoutée au README.
- Caddy demande à Let's Encrypt un **certificat pour l'adresse IP**, avec le profil ACME `shortlived` (certificats de 6 jours, seuls autorisés pour une IP). Testé sur le VPS le 2026-11-03 avec l'environnement de test de Let's Encrypt : certificat obtenu.
- Configuration Caddy :

  ```
  159.173.138.75 {
  	tls {
  		issuer acme {
  			profile shortlived
  		}
  	}
  	reverse_proxy server:3000
  }
  ```

- Caddy renouvelle le certificat tout seul, plusieurs fois par semaine. Si Let's Encrypt était indisponible plusieurs jours, le certificat pourrait expirer : surveiller les journaux de Caddy.
- Si l'équipe prend un nom de domaine plus tard, il suffit de remplacer l'IP par ce nom dans le Caddyfile.

**Déploiement continu**

À chaque merge sur `main`, une fois la CI verte, GitHub Actions :

1. construit l'image Docker du serveur et la publie sur le registre de GitHub (GHCR), avec le SHA du commit comme étiquette ;
2. se connecte au VPS en SSH avec un utilisateur dédié au déploiement ;
3. lance `docker compose pull` puis `docker compose up -d` ;
4. applique les migrations Drizzle ;
5. réinitialise la campagne de démonstration.

L'APK est produit par le même pipeline et publié en artefact.

Les secrets (clé SSH de déploiement, mots de passe, variables d'environnement) sont dans les GitHub Secrets et dans un fichier `.env` sur le VPS, jamais dans le dépôt.

**Sécurité**

- SSH par clé uniquement, connexion root et mot de passe désactivés.
- Pare-feu `firewalld` : seuls les ports 22, 80 et 443 sont ouverts. Docker écrit ses propres règles de pare-feu : les ports des conteneurs ne sont publiés que pour Caddy, PostgreSQL n'en publie aucun.
- SELinux reste en mode `enforcing` : les volumes montés dans les conteneurs portent l'option `:Z`.
- Mises à jour de sécurité automatiques avec `dnf-automatic`.
- Fedora sort une version tous les six mois environ, chacune étant maintenue à peu près 13 mois : la version installée couvre la durée du projet, sans montée de version.
- Images Docker mises à jour par Dependabot.

**Sauvegardes**

- En plus de la sauvegarde quotidienne d'OVH, un `pg_dump` chaque nuit, copié **hors du VPS**.
- Une restauration est testée au moins une fois avant la soutenance, puis la procédure est documentée.

**Ce que la décision rend plus difficile, les dettes acceptées**

- L'exploitation est à notre charge : mises à jour, surveillance, renouvellement, incidents. Elle est documentée dans un guide d'exploitation.
- Coût d'environ 4,57 € TTC par mois (prix « à partir de » affiché par OVH), payé par un membre de l'équipe.
- **Engagement de 6 mois** : il couvre le projet jusqu'à la soutenance (fin janvier 2027) avec de la marge. En contrepartie, passer au VPS-2 en cours de route dépendra des conditions d'OVH pour changer d'offre pendant l'engagement.
- Disque de 40 Go : les anciennes images Docker sont supprimées après chaque déploiement, et les sauvegardes locales sont limitées aux derniers jours.
- Une seule machine : si le VPS tombe, le produit est indisponible. La version locale Docker sert de secours.

**À faire ou à vérifier**

- À la commande : choix d'un datacenter en Europe, en France de préférence. Noter dans le guide d'exploitation le prix mensuel réellement facturé et la date de fin d'engagement.
- Mémoire et processeur : surveillés pendant la mesure des performances sur une carte chargée. Passage au VPS-2 si la machine sature.
- Surveillance minimale : une sonde de disponibilité externe qui prévient l'équipe si le site ne répond plus.
