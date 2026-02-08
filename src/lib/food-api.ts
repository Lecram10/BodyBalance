import type { FoodItem, NutritionPer100g } from '../types/food';
import { calculatePointsPer100g } from './points-calculator';

const OFF_API_BASE = 'https://world.openfoodfacts.org';

interface OpenFoodFactsProduct {
  product_name?: string;
  brands?: string;
  code?: string;
  image_front_small_url?: string;
  serving_quantity?: number;
  nutriments?: {
    'energy-kcal_100g'?: number;
    proteins_100g?: number;
    fat_100g?: number;
    'saturated-fat_100g'?: number;
    carbohydrates_100g?: number;
    sugars_100g?: number;
    fiber_100g?: number;
  };
}

function parseNutrition(nutriments: OpenFoodFactsProduct['nutriments']): NutritionPer100g {
  if (!nutriments) {
    return {
      calories: 0,
      protein: 0,
      fat: 0,
      saturatedFat: 0,
      unsaturatedFat: 0,
      carbs: 0,
      sugar: 0,
      addedSugar: 0,
      fiber: 0,
    };
  }

  const fat = nutriments.fat_100g ?? 0;
  const saturatedFat = nutriments['saturated-fat_100g'] ?? 0;

  return {
    calories: nutriments['energy-kcal_100g'] ?? 0,
    protein: nutriments.proteins_100g ?? 0,
    fat,
    saturatedFat,
    unsaturatedFat: Math.max(0, fat - saturatedFat),
    carbs: nutriments.carbohydrates_100g ?? 0,
    sugar: nutriments.sugars_100g ?? 0,
    addedSugar: nutriments.sugars_100g ?? 0, // OFF has no added sugar field
    fiber: nutriments.fiber_100g ?? 0,
  };
}

function mapToFoodItem(product: OpenFoodFactsProduct): FoodItem | null {
  if (!product.product_name) return null;

  const nutrition = parseNutrition(product.nutriments);
  const pointsPer100g = calculatePointsPer100g(nutrition);

  return {
    name: product.product_name,
    brand: product.brands || undefined,
    barcode: product.code || undefined,
    nutrition,
    pointsPer100g,
    servingSizeG: product.serving_quantity || 100,
    isZeroPoint: pointsPer100g === 0,
    source: 'openfoodfacts',
    imageUrl: product.image_front_small_url || undefined,
    createdAt: new Date(),
  };
}

/**
 * Zoek voedingsmiddelen via Open Food Facts API.
 */
export async function searchFood(query: string): Promise<FoodItem[]> {
  if (!query || query.length < 2) return [];

  try {
    const params = new URLSearchParams({
      search_terms: query,
      search_simple: '1',
      action: 'process',
      json: '1',
      page_size: '20',
      fields: 'product_name,brands,code,nutriments,serving_quantity,image_front_small_url',
      lc: 'nl',
      cc: 'nl',
    });

    const response = await fetch(`${OFF_API_BASE}/cgi/search.pl?${params}`);
    if (!response.ok) throw new Error('API fout');

    const data = await response.json();
    const products: OpenFoodFactsProduct[] = data.products || [];

    return products
      .map(mapToFoodItem)
      .filter((item): item is FoodItem => item !== null);
  } catch (error) {
    console.error('Zoekfout:', error);
    return [];
  }
}

/**
 * Zoek een product op via barcode.
 */
export async function lookupBarcode(barcode: string): Promise<FoodItem | null> {
  try {
    const response = await fetch(
      `${OFF_API_BASE}/api/v2/product/${barcode}?fields=product_name,brands,code,nutriments,serving_quantity,image_front_small_url`
    );
    if (!response.ok) return null;

    const data = await response.json();
    if (data.status !== 1 || !data.product) return null;

    return mapToFoodItem(data.product);
  } catch (error) {
    console.error('Barcode lookup fout:', error);
    return null;
  }
}
