/**
 * Modificateur d'une valeur de caractéristique (SRD 5.2, « Ability Scores and Modifiers ») :
 * on retire 10 à la valeur, on divise par 2 et on arrondit à l'entier inférieur.
 */
export function abilityModifier(score: number): number {
  if (!Number.isInteger(score) || score < 1 || score > 30) {
    throw new RangeError(`Ability score must be an integer from 1 to 30, got ${score}`);
  }
  return Math.floor((score - 10) / 2);
}
