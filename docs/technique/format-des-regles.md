# Format de description des règles (v1)

> **Statut : v1, à relire par les deux autres membres** (issue #8).
> Le sujet laisse le format libre (§02-H, annexe A4). Les valeurs des exemples sont vérifiées dans le SRD 5.2 (données Open5e, ADR-0006).

## 1. Principe

Le moteur **n'interprète jamais le texte** d'un sort ou d'une capacité. Chaque action est décrite par une petite structure de données composée de **quelques types d'effets génériques**. Le texte du SRD est conservé uniquement pour être affiché.

Ce qui n'est pas représentable est géré à la main par le MJ avec l'outil « Ajouter un effet », qui utilise **les mêmes types d'effets** plus un effet libre (`custom`).

## 2. Conventions

- **Clés JSON en anglais**, documentation en français.
- **Identifiants** : la clé Open5e de l'entrée (`srd-2024_fireball`), stable d'un import à l'autre (ADR-0006). Une action de monstre ajoute son nom à la clé de la créature (`srd-2024_bandit-captain.scimitar`). Le contenu créé dans le produit utilise le préfixe `custom_`.
- **Aucun texte affichable dans le format** : les noms et descriptions viennent des textes du SRD, rangés par langue (ADR-0006). Seul l'effet libre du MJ contient le texte saisi par le MJ.
- **Distances stockées en pieds** comme dans le SRD (1 case = 5 ft). L'affichage suit la langue de l'interface : pieds en anglais, mètres en français (1 case = 1,5 m).
- **Caractéristiques** : `STR`, `DEX`, `CON`, `INT`, `WIS`, `CHA`.
- **Durées en rounds** : 1 minute = 10 rounds.

### Valeurs et expressions

Toute valeur numérique peut être :

- un **entier** : `4` ;
- une **expression de dés**, selon la grammaire du moteur de dés (des.md) : `8d6`, `1d4+1`, `2d8` ;
- une expression qui contient des **références** : `caster.mod.STR + caster.proficiencyBonus`.

Grammaire : celle de des.md, avec un terme de plus.

```ebnf
term      = dice | integer | reference ;
reference = identifier , { "." , identifier } ;   (* ex. caster.mod.DEX *)
```

Références disponibles :

| Référence | Valeur |
|---|---|
| `caster.mod.STR` (`DEX`, `CON`…) | Modificateur de caractéristique de l'auteur de l'action |
| `caster.mod.spellcasting` | Modificateur de la caractéristique d'incantation |
| `caster.spellSaveDC` | DD des sauvegardes contre ses sorts |
| `caster.spellAttackBonus` | Bonus d'attaque des sorts |
| `caster.proficiencyBonus` | Bonus de maîtrise |
| `caster.level` | Niveau du personnage |
| `slot.level` | Niveau de l'emplacement utilisé |

Une référence inconnue est une **erreur de validation** (section 9), jamais une valeur nulle.

## 3. Structure d'une action

| Champ | Obligatoire | Contenu |
|---|---|---|
| `id` | oui | Identifiant (section 2) |
| `kind` | oui | `spell`, `weapon`, `feature`, `item`, `monsterAction` |
| `level` | sorts | Niveau du sort, 0 pour un sort mineur |
| `cost` | oui | `action` (`action`, `bonusAction`, `reaction`, `free`), `spellSlot?`, `uses?` (`{ "max": 3, "per": "longRest" }`), `material?` (`{ "consumed": true }`) |
| `range` | oui | `{ "ft": 150 }`, `{ "touch": true }`, `{ "self": true }`, ou `{ "ft": 30, "longFt": 120 }` pour une arme à distance |
| `targeting` | oui | Qui est visé (ci-dessous) |
| `resolution` | oui | Comment on résout (ci-dessous) |
| `onHit` / `onFail` | non | Effets si l'attaque touche / si la sauvegarde est ratée. Pour `auto`, effets appliqués à chaque cible |
| `onMiss` / `onSave` | non | Effets si l'attaque rate / si la sauvegarde est réussie |
| `duration` | non | Durée de l'action, `instant` par défaut |
| `concentration` | non | `true` : tous les effets durables de l'action prennent fin quand la concentration est rompue |
| `properties` | armes | Propriétés et botte d'arme (exemple 2) |

### `targeting`

| `type` | Champs |
|---|---|
| `self` | aucun |
| `single` | `filter?` |
| `multiple` | `count`, `perSlotAbove?` (cibles en plus par niveau d'emplacement), `sameTargetAllowed?`, `filter?` |
| `area` | `shape` (`sphere`, `cone`, `line`, `cube`, `cylinder`, `emanation`), `sizeFt` (rayon, longueur ou côté), `widthFt?` (ligne), `heightFt?` (cylindre) |

`filter` restreint les cibles valides : `{ "creatureType": "humanoid" }`, `{ "willing": true }`.

### `resolution`

| `type` | Champs | Sens |
|---|---|---|
| `attack` | `attack` (`meleeWeapon`, `rangedWeapon`, `meleeSpell`, `rangedSpell`), `ability?`, `bonus?` | Jet d'attaque contre la CA. Avec `ability`, le moteur calcule le bonus (modificateur + maîtrise si l'auteur maîtrise l'arme). `bonus` donne un bonus fixe (monstres) |
| `save` | `ability`, `dc` | Chaque cible fait un jet de sauvegarde |
| `auto` | aucun | Pas de jet : les effets `onHit` s'appliquent |
| `multiattack` | `count`, `options` (identifiants d'actions) | Monstres : le MJ choisit `count` actions parmi `options`, résolues une par une |

Le coup critique, l'avantage, les résistances, vulnérabilités et immunités sont des **règles du moteur**, pas des données : le format ne les répète pas.

## 4. Types d'effets

| `type` | Champs | Exemple |
|---|---|---|
| `damage` | `dice`, `damageType`, `bonus?`, `perSlotAbove?`, `byCharacterLevel?` ; ou `fromFail: "half"` | 8d6 feu |
| `heal` | `dice`, `bonus?`, `perSlotAbove?` | 2d8 + modificateur |
| `tempHp` | `amount` | 5 PV temporaires |
| `condition` | `condition` (clé d'état du SRD), `duration`, `repeatSave?` | Paralysé, sauvegarde à chaque fin de tour |
| `modifier` | `appliesTo`, `value`, `duration`, `uses?` | +1d4 aux attaques et sauvegardes |
| `custom` | `name`, `description`, `trigger`, `duration`, `effects?` | « En feu » : 1d4 feu au début de chaque tour pendant 2 rounds |

Précisions :

- **`perSlotAbove`** : dés ajoutés pour chaque niveau d'emplacement au-dessus de `level`. `{ "dice": "8d6", "perSlotAbove": "1d6" }` lancé avec un emplacement de niveau 5 donne `10d6`.
- **`byCharacterLevel`** : dés des sorts mineurs selon le niveau du personnage, par exemple `{ "5": "2d10", "11": "3d10", "17": "4d10" }`.
- **`fromFail: "half"`** : reprend les dégâts **déjà lancés** pour `onFail` et les divise par deux, arrondi à l'inférieur. On ne relance pas les dés.
- **`modifier.appliesTo`** : `attackRoll`, `savingThrow`, `abilityCheck`, `ac`, `speed`, `damageRoll`. **`value`** : un entier, des dés (lancés à chaque utilisation), `advantage` ou `disadvantage`. **`uses`** : nombre d'utilisations avant la fin de l'effet.
- **`repeatSave`** : `{ "when": "endOfTurn", "ability": "WIS", "onSuccess": "end" }`. Le DD est celui de la résolution d'origine.
- **`condition`** : clé d'état du SRD (`paralyzed`, `prone`, `frightened`…). Seuls les 15 états du SRD sont acceptés (ADR-0006).

### Durées

| `type` | Champs | Fin de l'effet |
|---|---|---|
| `instant` | aucun | Immédiate |
| `rounds` | `value` | Après `value` rounds |
| `untilStartOfTurn` / `untilEndOfTurn` | `of` (`source` ou `target`) | Au début / à la fin du prochain tour de la créature indiquée |
| `untilRest` | `rest` (`short` ou `long`) | Au prochain repos indiqué |
| `permanent` | aucun | Jamais, sauf retrait par le MJ |

### Déclencheurs (`trigger`, effets `custom`)

`immediate`, `startOfTurn`, `endOfTurn`, `onDamaged`, `manual` (le MJ l'applique à la main).

## 5. Exemples

Les six exemples demandés par l'issue #8, plus deux exemples d'arme et de monstre (exemples 2 et 7). Les valeurs viennent du SRD 5.2.

### 1. Boule de feu (sauvegarde, zone, emplacement plus élevé)

```json
{
  "id": "srd-2024_fireball",
  "kind": "spell",
  "level": 3,
  "cost": { "action": "action", "spellSlot": 3 },
  "range": { "ft": 150 },
  "targeting": { "type": "area", "shape": "sphere", "sizeFt": 20 },
  "resolution": { "type": "save", "ability": "DEX", "dc": "caster.spellSaveDC" },
  "onFail": [{ "type": "damage", "dice": "8d6", "damageType": "fire", "perSlotAbove": "1d6" }],
  "onSave": [{ "type": "damage", "fromFail": "half" }],
  "duration": { "type": "instant" },
  "concentration": false
}
```

Les alliés dans la zone sont des cibles comme les autres : le moteur les détecte, et le MJ peut en retirer ou en ajouter (section 6).

### 2. Attaque à l'épée longue (jet d'attaque, botte d'arme)

```json
{
  "id": "srd-2024_longsword",
  "kind": "weapon",
  "cost": { "action": "action" },
  "range": { "ft": 5 },
  "targeting": { "type": "single" },
  "resolution": { "type": "attack", "attack": "meleeWeapon", "ability": "STR" },
  "onHit": [{ "type": "damage", "dice": "1d8", "bonus": "caster.mod.STR", "damageType": "slashing" }],
  "properties": [
    { "type": "versatile", "dice": "1d10" },
    {
      "type": "mastery",
      "mastery": "sap",
      "onHit": [{
        "type": "modifier",
        "appliesTo": ["attackRoll"],
        "value": "disadvantage",
        "uses": 1,
        "duration": { "type": "untilStartOfTurn", "of": "source" }
      }]
    }
  ]
}
```

- `versatile` : à deux mains, le moteur utilise `1d10` à la place de `1d8`.
- `mastery` : la botte *Sap* ne s'applique que si l'attaquant maîtrise cette botte (capacité de classe). La cible a alors un désavantage à sa prochaine attaque avant le début du prochain tour de l'attaquant.

### 3. Soins (automatique, emplacement plus élevé)

```json
{
  "id": "srd-2024_cure-wounds",
  "kind": "spell",
  "level": 1,
  "cost": { "action": "action", "spellSlot": 1 },
  "range": { "touch": true },
  "targeting": { "type": "single" },
  "resolution": { "type": "auto" },
  "onHit": [{ "type": "heal", "dice": "2d8", "bonus": "caster.mod.spellcasting", "perSlotAbove": "2d8" }],
  "duration": { "type": "instant" }
}
```

### 4. Projectile magique (automatique, plusieurs fléchettes)

```json
{
  "id": "srd-2024_magic-missile",
  "kind": "spell",
  "level": 1,
  "cost": { "action": "action", "spellSlot": 1 },
  "range": { "ft": 120 },
  "targeting": { "type": "multiple", "count": 3, "perSlotAbove": 1, "sameTargetAllowed": true },
  "resolution": { "type": "auto" },
  "onHit": [{ "type": "damage", "dice": "1d4", "bonus": 1, "damageType": "force" }],
  "duration": { "type": "instant" }
}
```

Chaque fléchette est une instance : `onHit` s'applique une fois par fléchette, sur la cible choisie pour elle.

### 5. Bénédiction (concentration, modificateur)

```json
{
  "id": "srd-2024_bless",
  "kind": "spell",
  "level": 1,
  "cost": { "action": "action", "spellSlot": 1, "material": { "consumed": true } },
  "range": { "ft": 30 },
  "targeting": { "type": "multiple", "count": 3, "perSlotAbove": 1 },
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

Le `1d4` est lancé à chaque jet d'attaque ou de sauvegarde de la cible. L'effet prend fin après 10 rounds ou dès que la concentration est rompue.

### 6. Immobilisation de personne (état, sauvegarde répétée)

```json
{
  "id": "srd-2024_hold-person",
  "kind": "spell",
  "level": 2,
  "cost": { "action": "action", "spellSlot": 2 },
  "range": { "ft": 60 },
  "targeting": { "type": "multiple", "count": 1, "perSlotAbove": 1, "filter": { "creatureType": "humanoid" } },
  "resolution": { "type": "save", "ability": "WIS", "dc": "caster.spellSaveDC" },
  "onFail": [{
    "type": "condition",
    "condition": "paralyzed",
    "duration": { "type": "rounds", "value": 10 },
    "repeatSave": { "when": "endOfTurn", "ability": "WIS", "onSuccess": "end" }
  }],
  "concentration": true
}
```

### 7. Attaques multiples d'un monstre : capitaine bandit

```json
[
  {
    "id": "srd-2024_bandit-captain.multiattack",
    "kind": "monsterAction",
    "cost": { "action": "action" },
    "range": { "self": true },
    "targeting": { "type": "self" },
    "resolution": {
      "type": "multiattack",
      "count": 2,
      "options": ["srd-2024_bandit-captain.scimitar", "srd-2024_bandit-captain.pistol"]
    }
  },
  {
    "id": "srd-2024_bandit-captain.scimitar",
    "kind": "monsterAction",
    "cost": { "action": "action" },
    "range": { "ft": 5 },
    "targeting": { "type": "single" },
    "resolution": { "type": "attack", "attack": "meleeWeapon", "bonus": 5 },
    "onHit": [{ "type": "damage", "dice": "1d6", "bonus": 3, "damageType": "slashing" }]
  },
  {
    "id": "srd-2024_bandit-captain.pistol",
    "kind": "monsterAction",
    "cost": { "action": "action" },
    "range": { "ft": 30, "longFt": 90 },
    "targeting": { "type": "single" },
    "resolution": { "type": "attack", "attack": "rangedWeapon", "bonus": 5 },
    "onHit": [{ "type": "damage", "dice": "1d10", "bonus": 3, "damageType": "piercing" }]
  }
]
```

« Deux attaques, cimeterre et pistolet dans n'importe quelle combinaison » : le MJ choisit deux actions parmi `options`, éventuellement deux fois la même.

### 8. Effet libre ajouté par le MJ : « En feu » (annexe A1, étape 6)

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

`name` et `description` sont saisis par le MJ, dans sa langue : ils ne sont pas traduits. `effects` reste calculé par le moteur (résistance au feu comprise).

## 6. Résolution d'une action (annexe A1)

1. Le joueur choisit l'action (le moteur vérifie le coût disponible).
2. Le joueur place le gabarit ou choisit les cibles.
3. Le **produit détecte les cibles** dans la zone (alliés compris) ; le MJ peut en retirer ou en ajouter.
4. Le **produit lance** jets d'attaque ou de sauvegarde **côté serveur**.
5. Le **produit calcule** les effets (moitié si réussite, résistances, vulnérabilités, immunités).
6. Le **MJ** peut ajouter un effet ou corriger un résultat.
7. Le résultat est **appliqué** et **historisé** dans le journal ; il reste **annulable**.

Le moteur renvoie à l'étape 5 une **prévisualisation** (aucune modification de l'état) ; l'application est une commande séparée. L'annulation rejoue l'inverse des modifications enregistrées dans le journal.

## 7. Correspondance avec les données d'Open5e

Le script d'import (ADR-0006) convertit les données d'Open5e dans ce format. Toutes ne sont pas fiables :

| Donnée Open5e | Champ du format | Fiabilité |
|---|---|---|
| `saving_throw_ability` | `resolution.ability` (`dexterity` → `DEX`) | Bonne |
| `damage_roll`, `damage_types` | `damage.dice`, `damage.damageType` | Bonne pour les sorts de dégâts. Pour un sort de soins, `damage_roll` contient les dés de soins |
| `casting_options` (`slot_level_N`) | `perSlotAbove` (différence entre deux niveaux), `targeting.perSlotAbove` | Bonne |
| `shape_type`, `shape_size` | `targeting.shape`, `targeting.sizeFt` | Bonne |
| `range`, `range_text` | `range` (`range: 0` avec `"Touch"` → `touch`) | Bonne |
| `concentration`, `duration` | `concentration`, `duration` (`"1 minute"` → 10 rounds) | Bonne |
| `attack_roll` | `resolution.type: "attack"` | **Douteuse** : *Bless* est marqué `true` alors qu'il n'y a pas de jet d'attaque |
| Attaques des monstres (`attacks[]`) | `resolution.bonus`, `damage` | Bonne, mais le type de dégâts est dans `extra_damage_type` quand `damage_type` est vide |
| Attaques multiples, réactions, capacités spéciales | aucun | **Texte seulement** : à décrire à la main |

En conséquence :

- Chaque action importée porte un statut de relecture : `"review": "auto"` (convertie automatiquement, à vérifier) ou `"review": "checked"` (relue par un membre de l'équipe, qui compare au texte du SRD).
- Une action qu'on ne sait pas convertir est importée **sans effets** : le produit affiche son texte, et le MJ la résout avec « Ajouter un effet ».
- Les actions utilisées par la campagne de démo et par les tests sont toutes `checked`.

## 8. Hors du périmètre de la v1

Ces cas sont résolus par le MJ avec un effet libre :

- Sorts qui créent quelque chose sur la carte (*Mur de feu*, *Nuage puant*…) : la zone est dessinée par le MJ, les dégâts sont un effet `custom` avec déclencheur.
- Invocations et métamorphoses.
- Réactions déclenchées automatiquement (*Bouclier*, attaques d'opportunité) : le moteur les propose, le joueur ou le MJ les déclenche à la main.

## 9. Validation

- Les types du format sont écrits en TypeScript dans `packages/shared` (ADR-0004), avec un schéma de validation à l'exécution. Un schéma JSON en est généré pour la documentation et le client Kotlin.
- La CI valide **toutes les données importées** et **tous les exemples de ce document** contre ce schéma. Les exemples sont aussi des données de test du moteur : Boule de feu, Soins, etc. doivent donner les résultats attendus.
- Une référence inconnue, une clé d'état hors SRD ou une expression de dés invalide font échouer la validation, avec un message qui indique l'action et le champ.
