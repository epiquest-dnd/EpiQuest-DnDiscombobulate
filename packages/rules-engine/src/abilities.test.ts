import { describe, expect, it } from 'vitest';
import { abilityModifier } from './abilities.ts';

describe('abilityModifier', () => {
  it.each([
    [1, -5],
    [8, -1],
    [9, -1],
    [10, 0],
    [11, 0],
    [12, 1],
    [15, 2],
    [20, 5],
    [30, 10],
  ])('une valeur de %i donne %i', (score, expected) => {
    expect(abilityModifier(score)).toBe(expected);
  });

  it.each([0, 31, 10.5])('refuse la valeur %s', (score) => {
    expect(() => abilityModifier(score)).toThrow(RangeError);
  });
});
