import type { FoodItem, FoodUnit, NutritionPer100g } from '../types/food';
import { calculatePointsPer100g } from './points-calculator';
import { COMMON_DUTCH_FOODS } from './dutch-foods';
import { db } from '../db/database';

const OFF_API_BASE = 'https://nl.openfoodfacts.org';

interface OpenFoodFactsProduct {
  product_name?: string;
  product_name_nl?: string;
  brands?: string;
  code?: string;
  image_front_small_url?: string;
  serving_quantity?: number;
  serving_size?: string;
  quantity?: string;
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
      calories: 0, protein: 0, fat: 0, saturatedFat: 0,
      unsaturatedFat: 0, carbs: 0, sugar: 0, addedSugar: 0, fiber: 0,
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
    addedSugar: nutriments.sugars_100g ?? 0,
    fiber: nutriments.fiber_100g ?? 0,
  };
}

function detectUnit(product: OpenFoodFactsProduct): FoodUnit {
  const fields = [product.serving_size, product.quantity].filter(Boolean).join(' ').toLowerCase();
  if (/\bml\b|\bliter\b|\bcl\b|\bdl\b/.test(fields)) return 'ml';
  return 'g';
}

function mapToFoodItem(product: OpenFoodFactsProduct): FoodItem | null {
  const name = product.product_name_nl || product.product_name;
  if (!name) return null;

  const nutrition = parseNutrition(product.nutriments);
  if (nutrition.calories === 0 && nutrition.protein === 0 && nutrition.fat === 0) return null;

  const pointsPer100g = calculatePointsPer100g(nutrition);
  const unit = detectUnit(product);

  return {
    name,
    brand: product.brands || undefined,
    barcode: product.code || undefined,
    nutrition,
    pointsPer100g,
    servingSizeG: product.serving_quantity || 100,
    unit,
    isZeroPoint: pointsPer100g === 0,
    source: 'openfoodfacts',
    imageUrl: product.image_front_small_url || undefined,
    createdAt: new Date(),
  };
}

/**
 * Zoek in de lokale database van generieke Nederlandse voedingsmiddelen.
 */
function searchLocalFoods(query: string): FoodItem[] {
  const lower = query.toLowerCase();
  return COMMON_DUTCH_FOODS
    .filter((food) => food.name.toLowerCase().includes(lower))
    .map((food) => {
      const pointsPer100g = calculatePointsPer100g(food.nutrition);
      return {
        ...food,
        pointsPer100g,
        isZeroPoint: pointsPer100g === 0,
        source: 'nevo' as const,
        createdAt: new Date(),
      };
    });
}

/**
 * Zoek voedingsmiddelen via Open Food Facts API (NL producten).
 * Zoekt eerst in lokale NL database, dan via API met country filter.
 */
export async function searchFood(query: string): Promise<FoodItem[]> {
  if (!query || query.length < 2) return [];

  // Stap 1: zoek in lokale NL voedingsmiddelen
  const localResults = searchLocalFoods(query);

  // Stap 2: zoek via Open Food Facts API (NL domein + country filter)
  try {
    const params = new URLSearchParams({
      search_terms: query,
      search_simple: '1',
      action: 'process',
      json: '1',
      page_size: '20',
      fields: 'product_name,product_name_nl,brands,code,nutriments,serving_quantity,serving_size,quantity,image_front_small_url',
      lc: 'nl',
      tagtype_0: 'countries',
      tag_contains_0: 'contains',
      tag_0: 'Netherlands',
    });

    const response = await fetch(`${OFF_API_BASE}/cgi/search.pl?${params}`);

    if (!response.ok) return localResults;

    const data = await response.json();
    const products: OpenFoodFactsProduct[] = data.products || [];

    let apiResults = products
      .map(mapToFoodItem)
      .filter((item): item is FoodItem => item !== null);

    // Stap 3: als weinig NL resultaten, zoek ook wereldwijd als fallback
    if (apiResults.length < 3) {
      const fallbackParams = new URLSearchParams({
        search_terms: query,
        search_simple: '1',
        action: 'process',
        json: '1',
        page_size: '10',
        fields: 'product_name,product_name_nl,brands,code,nutriments,serving_quantity,serving_size,quantity,image_front_small_url',
        lc: 'nl',
      });

      const fallbackResponse = await fetch(
        `https://world.openfoodfacts.org/cgi/search.pl?${fallbackParams}`
      );

      if (fallbackResponse.ok) {
        const fallbackData = await fallbackResponse.json();
        const fallbackProducts: OpenFoodFactsProduct[] = fallbackData.products || [];
        const fallbackItems = fallbackProducts
          .map(mapToFoodItem)
          .filter((item): item is FoodItem => item !== null);

        // Voeg toe zonder duplicaten (op basis van barcode of naam)
        const existingNames = new Set(apiResults.map((r) => r.name.toLowerCase()));
        for (const item of fallbackItems) {
          if (!existingNames.has(item.name.toLowerCase())) {
            apiResults.push(item);
            existingNames.add(item.name.toLowerCase());
          }
        }
      }
    }

    // Combineer: lokale resultaten eerst, dan API resultaten
    const existingNames = new Set(localResults.map((r) => r.name.toLowerCase()));
    const combined = [...localResults];
    for (const item of apiResults) {
      if (!existingNames.has(item.name.toLowerCase())) {
        combined.push(item);
        existingNames.add(item.name.toLowerCase());
      }
    }

    return combined;
  } catch (error) {
    console.error('Zoekfout:', error);
    return localResults;
  }
}

const OFF_BARCODE_FIELDS = 'product_name,product_name_nl,brands,code,nutriments,serving_quantity,serving_size,quantity,image_front_small_url';

/**
 * Zoek een product op via barcode.
 * Volgorde: lokale DB → NL Open Food Facts → World Open Food Facts
 */
export async function lookupBarcode(barcode: string): Promise<FoodItem | null> {
  // B: Check eerst lokale database (eigen producten met barcode)
  try {
    const localFood = await db.foodItems.where('barcode').equals(barcode).first();
    if (localFood) return localFood;
  } catch {
    // ignore DB errors, doorvallen naar API
  }

  // A: Probeer NL domein
  try {
    const nlResult = await fetchBarcode(`${OFF_API_BASE}/api/v2/product/${barcode}?fields=${OFF_BARCODE_FIELDS}`);
    if (nlResult) return nlResult;
  } catch {
    // ignore, probeer world fallback
  }

  // A: Fallback naar world domein
  try {
    const worldResult = await fetchBarcode(`https://world.openfoodfacts.org/api/v2/product/${barcode}?fields=${OFF_BARCODE_FIELDS}`);
    if (worldResult) return worldResult;
  } catch (error) {
    console.error('Barcode lookup fout:', error);
  }

  return null;
}

async function fetchBarcode(url: string): Promise<FoodItem | null> {
  const response = await fetch(url);
  if (!response.ok) return null;

  const data = await response.json();
  if (data.status !== 1 || !data.product) return null;

  return mapToFoodItem(data.product);
}
