# Moteur de dés (brouillon v1)

> À compléter pendant M1.

## 1. Exigences (§02-E)

- Notation complète : `2d6+3`, `4d6kh3`, avantage et désavantage, dés explosifs, relances, plusieurs groupes de dés dans une expression.
- Erreurs de saisie **expliquées**.
- Jets **côté serveur** avec un générateur aléatoire sûr.
- Jets publics, privés (MJ seul) ou cachés (jets du MJ) ; historique complet de la session.
- Probabilités d'une expression : minimum, maximum, moyenne, distribution.

## 2. Grammaire proposée (EBNF)

```ebnf
expression  = term , { ( "+" | "-" ) , term } ;
term        = dice | integer ;
dice        = [ integer ] , "d" , sides , { modifier } ;
sides       = integer | "%" ;
modifier    = keep | drop | explode | reroll | advantage ;
keep        = ( "kh" | "kl" | "k" ) , integer ;      (* k = kh *)
drop        = ( "dh" | "dl" ) , integer ;
explode     = "!" , [ compare ] ;                    (* par défaut : face max *)
reroll      = ( "r" | "ro" ) , compare ;             (* r = tant que, ro = une fois *)
advantage   = "adv" | "dis" ;                        (* d20adv = 2d20kh1 *)
compare     = [ "<" | ">" | "<=" | ">=" | "=" ] , integer ;
integer     = digit , { digit } ;
```

Insensible à la casse, espaces ignorés.

| Exemple | Sens |
|---|---|
| `2d6+3` | 2 dés à 6 faces + 3 |
| `4d6kh3` | 4d6, garder les 3 meilleurs |
| `d20adv` | avantage (= `2d20kh1`) |
| `d20dis` | désavantage (= `2d20kl1`) |
| `3d6!` | dés explosifs (on relance et ajoute sur un 6) |
| `2d6r<2` | relancer les 1 et 2 jusqu'à obtenir plus |
| `1d8+2d6+4` | plusieurs groupes |
| `d%` | 1d100 |

## 3. Limites (anti-abus)

À fixer et documenter, par exemple : 100 dés maximum par expression, 1000 faces maximum, 20 explosions maximum par dé, longueur d'expression limitée.

## 4. Messages d'erreur

Chaque erreur indique **où** et **pourquoi**, avec une suggestion quand c'est possible :

| Saisie | Message |
|---|---|
| `2d` | Il manque le nombre de faces après « d » (position 2). Exemple : 2d6. |
| `4d6kh5` | Impossible de garder 5 dés sur 4 lancés. |
| `2d6++3` | Deux opérateurs se suivent (position 5). |
| `1d1!` | Un dé à 1 face exploserait à l'infini. |

Les messages sont annoncés aux lecteurs d'écran (zone `aria-live`).

## 5. Générateur aléatoire

- Générateur cryptographiquement sûr du système, côté serveur uniquement.
- Tirage sans biais (rejet des valeurs hors plage plutôt que modulo).
- L'évaluateur reçoit le générateur en paramètre : générateur déterministe à graine dans les tests unitaires, générateur sûr en production.

## 6. Probabilités

- Distribution exacte par **convolution** pour les sommes de dés simples.
- Garder/écarter (`kh`, `kl`, `dh`, `dl`) : énumération exacte tant que le nombre de combinaisons reste raisonnable, sinon simulation (Monte-Carlo) signalée comme approximation.
- Explosions : distribution tronquée à la limite d'explosions.
- Affichage : graphique **et** tableau équivalent (accessibilité).

## 7. Tests

- Analyseur : un test par règle de la grammaire et par message d'erreur.
- Évaluateur : résultats exacts avec un générateur à graine.
- **Tests statistiques** (exigés) : par exemple khi-deux sur 100 000 tirages de `d20` et comparaison de la distribution de `4d6kh3` à la distribution exacte, avec un seuil assez large pour éviter les tests instables.
