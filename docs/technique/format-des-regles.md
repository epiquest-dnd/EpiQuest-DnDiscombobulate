# Format de description des règles (brouillon v1)

> **Statut : proposition à discuter en M0.** À relire par toute l'équipe.
> Le sujet laisse le format libre (§02-H, annexe A4). Ce document propose une base ; tout est modifiable tant qu'il n'est pas accepté.

## 1. Principe

Le moteur **n'interprète jamais le texte** d'un sort ou d'une capacité. Chaque action est décrite par une petite structure de données composée de **quelques types d'effets génériques**. Le texte du SRD est conservé uniquement pour être affiché.

Ce qui n'est pas représentable est géré à la main par le MJ avec l'outil « Ajouter un effet », qui utilise **les mêmes types d'effets** plus un effet libre.

Conventions proposées :

- Clés JSON en anglais (cohérent avec le code), documentation en français.
- Distances stockées **en pieds** comme dans le SRD (1 case = 5 ft), **affichées en mètres** (1 case = 1,5 m).
- Toute valeur numérique peut être une **expression** : un entier, une expression de dés (`"8d6"`) ou une référence (`"caster.spellSaveDC"`).

## 2. Structure d'une action

```
Action
├── identité        id, name, kind (spell | weapon | feature | item | monsterAction), level…
├── cost            ce que l'action consomme (emplacement, utilisation, action/bonus/réaction)
├── range           portée
├── targeting       qui est visé : single | multiple | area (sphere, cone, line, cube) | self
├── resolution      comment on résout : attack | save | auto
├── onHit / onFail  effets si touché / si sauvegarde ratée
├── onMiss / onSave effets si raté / si sauvegarde réussie
├── upcast          variation selon l'emplacement utilisé
├── duration        instant | rounds | minutes | untilRest | …
└── concentration   true / false
```

## 3. Types d'effets

| `type` | Champs | Exemple |
|---|---|---|
| `damage` | `dice`, `damageType`, `bonus?` ; ou `fromFail: "half"` | 8d6 feu |
| `heal` | `dice`, `bonus?` | 1d8 + modificateur |
| `tempHp` | `amount` | 5 PV temporaires |
| `condition` | `condition` (id d'état du SRD), `duration`, `repeatSave?` | paralysé, sauvegarde à chaque fin de tour |
| `modifier` | `appliesTo` (attackRoll, savingThrow, ac, speed…), `value`, `duration` | +1d4 aux attaques |
| `custom` | `name`, `description`, `trigger`, `duration`, `effects?` | « En feu » : 1d4 feu au début de chaque tour pendant 2 tours |

Déclencheurs (`trigger`) proposés : `immediate`, `startOfTurn`, `endOfTurn`, `onDamaged`, `manual`.

Références disponibles dans les expressions : `caster.spellSaveDC`, `caster.spellAttackBonus`, `caster.mod.STR` (DEX, CON…), `caster.proficiencyBonus`, `caster.level`, `slot.level`.

## 4. Exemples

### Boule de feu (sauvegarde, zone, emplacement plus élevé)

```json
{
  "id": "spell.fireball",
  "name": "Fireball",
  "kind": "spell",
  "level": 3,
  "cost": { "action": "action", "spellSlot": 3 },
  "range": { "ft": 150 },
  "targeting": { "type": "area", "shape": "sphere", "radiusFt": 20 },
  "resolution": { "type": "save", "ability": "DEX", "dc": "caster.spellSaveDC" },
  "onFail": [{ "type": "damage", "dice": "8d6", "damageType": "fire" }],
  "onSave": [{ "type": "damage", "fromFail": "half" }],
  "upcast": { "perSlotAbove": [{ "type": "damage", "dice": "1d6" }] },
  "duration": { "type": "instant" },
  "concentration": false
}
```

### Attaque à l'épée longue (jet d'attaque contre la CA)

```json
{
  "id": "weapon.longsword",
  "name": "Longsword",
  "kind": "weapon",
  "cost": { "action": "action" },
  "range": { "ft": 5 },
  "targeting": { "type": "single" },
  "resolution": { "type": "attack", "bonus": "caster.mod.STR + caster.proficiencyBonus" },
  "onHit": [{ "type": "damage", "dice": "1d8", "bonus": "caster.mod.STR", "damageType": "slashing" }],
  "properties": ["versatile:1d10"]
}
```

### Soins (automatique)

```json
{
  "id": "spell.cure-wounds",
  "kind": "spell",
  "level": 1,
  "cost": { "action": "action", "spellSlot": 1 },
  "range": { "ft": 5 },
  "targeting": { "type": "single" },
  "resolution": { "type": "auto" },
  "onHit": [{ "type": "heal", "dice": "1d8", "bonus": "caster.mod.spellcasting" }],
  "upcast": { "perSlotAbove": [{ "type": "heal", "dice": "1d8" }] }
}
```

> Le nombre de dés exact dépend de la version du SRD retenue (ADR-0006) : vérifier chaque valeur dans le SRD.

### Projectile magique (automatique, plusieurs instances)

```json
{
  "id": "spell.magic-missile",
  "kind": "spell",
  "level": 1,
  "cost": { "action": "action", "spellSlot": 1 },
  "targeting": { "type": "multiple", "instances": 3, "sameTargetAllowed": true },
  "resolution": { "type": "auto" },
  "onHit": [{ "type": "damage", "dice": "1d4", "bonus": 1, "damageType": "force" }],
  "upcast": { "perSlotAbove": { "instances": 1 } }
}
```

### Bénédiction (concentration, modificateur)

```json
{
  "id": "spell.bless",
  "kind": "spell",
  "level": 1,
  "targeting": { "type": "multiple", "max": 3 },
  "resolution": { "type": "auto" },
  "onHit": [{
    "type": "modifier",
    "appliesTo": ["attackRoll", "savingThrow"],
    "value": "1d4",
    "duration": { "type": "rounds", "value": 10 }
  }],
  "concentration": true
}
```

### Immobilisation de personne (état, sauvegarde répétée)

```json
{
  "id": "spell.hold-person",
  "kind": "spell",
  "level": 2,
  "targeting": { "type": "single", "filter": { "creatureType": "humanoid" } },
  "resolution": { "type": "save", "ability": "WIS", "dc": "caster.spellSaveDC" },
  "onFail": [{
    "type": "condition",
    "condition": "paralyzed",
    "duration": { "type": "rounds", "value": 10 },
    "repeatSave": { "when": "endOfTurn", "ability": "WIS" }
  }],
  "concentration": true
}
```

### Effet ajouté par le MJ : « En feu » (annexe A1, étape 6)

```json
{
  "type": "custom",
  "name": "En feu",
  "description": "La créature brûle après la boule de feu.",
  "trigger": "startOfTurn",
  "duration": { "type": "rounds", "value": 2 },
  "effects": [{ "type": "damage", "dice": "1d4", "damageType": "fire" }],
  "source": "gm"
}
```

## 5. Résolution d'une action (annexe A1)

1. Le joueur choisit l'action (le moteur vérifie le coût disponible).
2. Le joueur place le gabarit ou choisit les cibles.
3. Le **produit détecte les cibles** dans la zone (alliés compris) ; le MJ peut en retirer ou en ajouter.
4. Le **produit lance** jets d'attaque ou de sauvegarde **côté serveur**.
5. Le **produit calcule** les effets (moitié si réussite, résistances, vulnérabilités, immunités).
6. Le **MJ** peut ajouter un effet ou corriger un résultat.
7. Le résultat est **appliqué** et **historisé** dans le journal ; il reste **annulable**.

Le moteur renvoie à l'étape 5 une **prévisualisation** (aucune modification de l'état) ; l'application est une commande séparée. L'annulation rejoue l'inverse des modifications enregistrées dans le journal.

## 6. Questions ouvertes

- Gestion des actions à plusieurs attaques des monstres (`Multiattack`) : liste d'actions ou effet dédié ?
- Sorts qui créent quelque chose sur la carte (mur de feu…) : hors périmètre automatique, effet libre du MJ ?
- Validation du format : schéma JSON partagé, testé en CI sur toutes les données importées.
