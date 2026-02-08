export interface NutritionPer100g {
  calories: number;
  protein: number;
  fat: number;
  saturatedFat: number;
  unsaturatedFat: number;
  carbs: number;
  sugar: number;
  addedSugar: number;
  fiber: number;
}

export interface FoodItem {
  id?: number;
  name: string;
  brand?: string;
  barcode?: string;
  nutrition: NutritionPer100g;
  pointsPer100g: number;
  servingSizeG: number;
  isZeroPoint: boolean;
  source: 'openfoodfacts' | 'nevo' | 'user';
  imageUrl?: string;
  createdAt: Date;
}

export interface MealEntry {
  id?: number;
  dailyLogId?: number;
  foodItemId?: number;
  foodItem: FoodItem;
  mealType: MealType;
  quantityG: number;
  points: number;
  loggedAt: Date;
}

export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';

export const MEAL_TYPE_LABELS: Record<MealType, string> = {
  breakfast: 'Ontbijt',
  lunch: 'Lunch',
  dinner: 'Diner',
  snack: 'Snacks',
};

export const MEAL_TYPE_ICONS: Record<MealType, string> = {
  breakfast: '🌅',
  lunch: '☀️',
  dinner: '🌙',
  snack: '🍎',
};
