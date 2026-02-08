import type { NutritionPer100g } from '../types/food';

/**
 * Bereken punten voor een voedingsmiddel op basis van voedingswaarden per 100g.
 * Gebaseerd op het SmartPoints-systeem:
 * - Calorieën, verzadigd vet en suiker verhogen de punten
 * - Eiwit, vezels en onverzadigd vet verlagen de punten
 */
export function calculatePointsPer100g(nutrition: NutritionPer100g): number {
  const points =
    nutrition.calories * 0.03 +
    nutrition.saturatedFat * 0.28 +
    nutrition.sugar * 0.12 -
    nutrition.protein * 0.1 -
    nutrition.fiber * 0.1 -
    nutrition.unsaturatedFat * 0.05;

  return Math.max(0, Math.round(points));
}

/**
 * Bereken punten voor een specifieke hoeveelheid in grammen.
 */
export function calculatePointsForQuantity(
  pointsPer100g: number,
  quantityG: number
): number {
  return Math.max(0, Math.round((pointsPer100g * quantityG) / 100));
}

/**
 * Bereken punten direct vanuit voedingswaarden en hoeveelheid.
 */
export function calculatePoints(
  nutrition: NutritionPer100g,
  quantityG: number
): number {
  const pointsPer100g = calculatePointsPer100g(nutrition);
  return calculatePointsForQuantity(pointsPer100g, quantityG);
}
