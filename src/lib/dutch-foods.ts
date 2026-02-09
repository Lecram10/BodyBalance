import type { NutritionPer100g } from '../types/food';

interface LocalFoodItem {
  name: string;
  brand?: string;
  nutrition: NutritionPer100g;
  servingSizeG: number;
}

/**
 * Lokale database van veelgebruikte Nederlandse voedingsmiddelen.
 * Voedingswaarden per 100g, gebaseerd op NEVO (RIVM) data.
 */
export const COMMON_DUTCH_FOODS: LocalFoodItem[] = [
  // === ONTBIJT ===
  { name: 'Boterham wit', nutrition: { calories: 264, protein: 8.6, fat: 3.2, saturatedFat: 0.7, unsaturatedFat: 2.5, carbs: 49, sugar: 3.2, addedSugar: 1, fiber: 2.8 }, servingSizeG: 35 },
  { name: 'Boterham bruin', nutrition: { calories: 254, protein: 9.4, fat: 3.5, saturatedFat: 0.7, unsaturatedFat: 2.8, carbs: 44, sugar: 3.0, addedSugar: 1, fiber: 5.4 }, servingSizeG: 35 },
  { name: 'Boterham volkoren', nutrition: { calories: 244, protein: 10.2, fat: 3.8, saturatedFat: 0.7, unsaturatedFat: 3.1, carbs: 40, sugar: 2.8, addedSugar: 0.5, fiber: 7.2 }, servingSizeG: 35 },
  { name: 'Cruesli naturel', brand: 'Quaker', nutrition: { calories: 445, protein: 10, fat: 15, saturatedFat: 5.8, unsaturatedFat: 9.2, carbs: 62, sugar: 18, addedSugar: 16, fiber: 6.5 }, servingSizeG: 45 },
  { name: 'Cruesli chocolade', brand: 'Quaker', nutrition: { calories: 452, protein: 9, fat: 16, saturatedFat: 6.5, unsaturatedFat: 9.5, carbs: 63, sugar: 22, addedSugar: 20, fiber: 5.5 }, servingSizeG: 45 },
  { name: 'Cruesli rood fruit', brand: 'Quaker', nutrition: { calories: 420, protein: 8.5, fat: 12, saturatedFat: 4.5, unsaturatedFat: 7.5, carbs: 65, sugar: 24, addedSugar: 18, fiber: 5 }, servingSizeG: 45 },
  { name: 'Havermout', nutrition: { calories: 370, protein: 13, fat: 7, saturatedFat: 1.2, unsaturatedFat: 5.8, carbs: 58, sugar: 1.3, addedSugar: 0, fiber: 10 }, servingSizeG: 40 },
  { name: 'Beschuit', nutrition: { calories: 396, protein: 9.8, fat: 3.5, saturatedFat: 0.8, unsaturatedFat: 2.7, carbs: 78, sugar: 8, addedSugar: 6, fiber: 3.5 }, servingSizeG: 10 },
  { name: 'Ontbijtkoek', nutrition: { calories: 318, protein: 3.5, fat: 2, saturatedFat: 0.5, unsaturatedFat: 1.5, carbs: 69, sugar: 38, addedSugar: 35, fiber: 1.8 }, servingSizeG: 30 },
  { name: 'Crackers volkoren', nutrition: { calories: 398, protein: 10, fat: 9, saturatedFat: 1.5, unsaturatedFat: 7.5, carbs: 64, sugar: 3, addedSugar: 2, fiber: 8 }, servingSizeG: 15 },

  // === BROODBELEG ===
  { name: 'Hagelslag melk', nutrition: { calories: 530, protein: 5, fat: 27, saturatedFat: 16, unsaturatedFat: 11, carbs: 64, sugar: 58, addedSugar: 55, fiber: 2.5 }, servingSizeG: 10 },
  { name: 'Hagelslag puur', nutrition: { calories: 505, protein: 6, fat: 25, saturatedFat: 15, unsaturatedFat: 10, carbs: 60, sugar: 52, addedSugar: 50, fiber: 5 }, servingSizeG: 10 },
  { name: 'Pindakaas', nutrition: { calories: 615, protein: 25, fat: 50, saturatedFat: 8, unsaturatedFat: 42, carbs: 12, sugar: 6, addedSugar: 3, fiber: 6 }, servingSizeG: 15 },
  { name: 'Jam (aardbei)', nutrition: { calories: 250, protein: 0.5, fat: 0.1, saturatedFat: 0, unsaturatedFat: 0.1, carbs: 61, sugar: 47, addedSugar: 40, fiber: 0.8 }, servingSizeG: 15 },
  { name: 'Appelstroop', nutrition: { calories: 285, protein: 0.8, fat: 0.3, saturatedFat: 0, unsaturatedFat: 0.3, carbs: 68, sugar: 58, addedSugar: 0, fiber: 1 }, servingSizeG: 15 },
  { name: 'Vlokken melk', nutrition: { calories: 530, protein: 5.5, fat: 27, saturatedFat: 16, unsaturatedFat: 11, carbs: 64, sugar: 57, addedSugar: 55, fiber: 2 }, servingSizeG: 10 },
  { name: 'Roomboter', nutrition: { calories: 740, protein: 0.6, fat: 82, saturatedFat: 52, unsaturatedFat: 30, carbs: 0.6, sugar: 0.6, addedSugar: 0, fiber: 0 }, servingSizeG: 7 },
  { name: 'Margarine', nutrition: { calories: 360, protein: 0.1, fat: 40, saturatedFat: 10, unsaturatedFat: 30, carbs: 0.3, sugar: 0.3, addedSugar: 0, fiber: 0 }, servingSizeG: 7 },

  // === KAAS ===
  { name: 'Goudse kaas jong', nutrition: { calories: 356, protein: 25, fat: 28, saturatedFat: 18, unsaturatedFat: 10, carbs: 0, sugar: 0, addedSugar: 0, fiber: 0 }, servingSizeG: 20 },
  { name: 'Goudse kaas oud', nutrition: { calories: 403, protein: 30, fat: 31, saturatedFat: 20, unsaturatedFat: 11, carbs: 0, sugar: 0, addedSugar: 0, fiber: 0 }, servingSizeG: 20 },
  { name: 'Goudse kaas belegen', nutrition: { calories: 375, protein: 27, fat: 29, saturatedFat: 19, unsaturatedFat: 10, carbs: 0, sugar: 0, addedSugar: 0, fiber: 0 }, servingSizeG: 20 },
  { name: 'Smeerkaas', nutrition: { calories: 230, protein: 11, fat: 20, saturatedFat: 12, unsaturatedFat: 8, carbs: 2, sugar: 2, addedSugar: 0, fiber: 0 }, servingSizeG: 20 },

  // === ZUIVEL ===
  { name: 'Melk halfvol', nutrition: { calories: 47, protein: 3.4, fat: 1.5, saturatedFat: 1.0, unsaturatedFat: 0.5, carbs: 4.7, sugar: 4.7, addedSugar: 0, fiber: 0 }, servingSizeG: 200 },
  { name: 'Melk vol', nutrition: { calories: 65, protein: 3.3, fat: 3.5, saturatedFat: 2.2, unsaturatedFat: 1.3, carbs: 4.7, sugar: 4.7, addedSugar: 0, fiber: 0 }, servingSizeG: 200 },
  { name: 'Melk mager', nutrition: { calories: 35, protein: 3.5, fat: 0.1, saturatedFat: 0.1, unsaturatedFat: 0, carbs: 4.9, sugar: 4.9, addedSugar: 0, fiber: 0 }, servingSizeG: 200 },
  { name: 'Karnemelk', nutrition: { calories: 36, protein: 3.3, fat: 0.5, saturatedFat: 0.3, unsaturatedFat: 0.2, carbs: 4.1, sugar: 4.1, addedSugar: 0, fiber: 0 }, servingSizeG: 200 },
  { name: 'Yoghurt vol', nutrition: { calories: 72, protein: 4, fat: 3.5, saturatedFat: 2.2, unsaturatedFat: 1.3, carbs: 5.5, sugar: 5.5, addedSugar: 0, fiber: 0 }, servingSizeG: 150 },
  { name: 'Yoghurt mager', nutrition: { calories: 40, protein: 4.3, fat: 0.1, saturatedFat: 0.1, unsaturatedFat: 0, carbs: 5.5, sugar: 5.5, addedSugar: 0, fiber: 0 }, servingSizeG: 150 },
  { name: 'Vla vanille', nutrition: { calories: 100, protein: 3, fat: 2.5, saturatedFat: 1.6, unsaturatedFat: 0.9, carbs: 16, sugar: 13, addedSugar: 10, fiber: 0 }, servingSizeG: 150 },
  { name: 'Vla chocolade', nutrition: { calories: 108, protein: 3.2, fat: 2.5, saturatedFat: 1.6, unsaturatedFat: 0.9, carbs: 18, sugar: 15, addedSugar: 12, fiber: 0.5 }, servingSizeG: 150 },
  { name: 'Kwark mager', nutrition: { calories: 51, protein: 9, fat: 0.2, saturatedFat: 0.1, unsaturatedFat: 0.1, carbs: 3.5, sugar: 3.5, addedSugar: 0, fiber: 0 }, servingSizeG: 150 },
  { name: 'Kwark vol', nutrition: { calories: 104, protein: 7, fat: 5.5, saturatedFat: 3.5, unsaturatedFat: 2, carbs: 6, sugar: 6, addedSugar: 0, fiber: 0 }, servingSizeG: 150 },
  { name: 'Cottage cheese', nutrition: { calories: 92, protein: 12, fat: 3.5, saturatedFat: 2.2, unsaturatedFat: 1.3, carbs: 2, sugar: 2, addedSugar: 0, fiber: 0 }, servingSizeG: 100 },
  { name: 'Skyr naturel', nutrition: { calories: 63, protein: 11, fat: 0.2, saturatedFat: 0.1, unsaturatedFat: 0.1, carbs: 4, sugar: 4, addedSugar: 0, fiber: 0 }, servingSizeG: 150 },

  // === DRANKEN ===
  { name: 'Koffie zwart', nutrition: { calories: 2, protein: 0.3, fat: 0, saturatedFat: 0, unsaturatedFat: 0, carbs: 0, sugar: 0, addedSugar: 0, fiber: 0 }, servingSizeG: 150 },
  { name: 'Koffie met melk', nutrition: { calories: 12, protein: 0.8, fat: 0.4, saturatedFat: 0.2, unsaturatedFat: 0.2, carbs: 1.2, sugar: 1.2, addedSugar: 0, fiber: 0 }, servingSizeG: 170 },
  { name: 'Koffie met melk en suiker', nutrition: { calories: 28, protein: 0.8, fat: 0.4, saturatedFat: 0.2, unsaturatedFat: 0.2, carbs: 5.2, sugar: 5.2, addedSugar: 4, fiber: 0 }, servingSizeG: 175 },
  { name: 'Cappuccino', nutrition: { calories: 40, protein: 2, fat: 1.5, saturatedFat: 1, unsaturatedFat: 0.5, carbs: 4, sugar: 4, addedSugar: 0, fiber: 0 }, servingSizeG: 200 },
  { name: 'Latte macchiato', nutrition: { calories: 55, protein: 3, fat: 2.5, saturatedFat: 1.5, unsaturatedFat: 1, carbs: 5, sugar: 5, addedSugar: 0, fiber: 0 }, servingSizeG: 250 },
  { name: 'Thee zonder suiker', nutrition: { calories: 1, protein: 0, fat: 0, saturatedFat: 0, unsaturatedFat: 0, carbs: 0.3, sugar: 0, addedSugar: 0, fiber: 0 }, servingSizeG: 200 },
  { name: 'Thee met suiker', nutrition: { calories: 20, protein: 0, fat: 0, saturatedFat: 0, unsaturatedFat: 0, carbs: 5, sugar: 5, addedSugar: 5, fiber: 0 }, servingSizeG: 205 },
  { name: 'Jus d\'orange (vers)', nutrition: { calories: 43, protein: 0.7, fat: 0.2, saturatedFat: 0, unsaturatedFat: 0.2, carbs: 9.5, sugar: 8.5, addedSugar: 0, fiber: 0.2 }, servingSizeG: 200 },
  { name: 'Appelsap', nutrition: { calories: 46, protein: 0.1, fat: 0.1, saturatedFat: 0, unsaturatedFat: 0.1, carbs: 11, sugar: 10, addedSugar: 0, fiber: 0.1 }, servingSizeG: 200 },
  { name: 'Cola', nutrition: { calories: 42, protein: 0, fat: 0, saturatedFat: 0, unsaturatedFat: 0, carbs: 10.6, sugar: 10.6, addedSugar: 10.6, fiber: 0 }, servingSizeG: 330 },
  { name: 'Cola zero', nutrition: { calories: 0.4, protein: 0, fat: 0, saturatedFat: 0, unsaturatedFat: 0, carbs: 0, sugar: 0, addedSugar: 0, fiber: 0 }, servingSizeG: 330 },
  { name: 'Bier (pils)', nutrition: { calories: 43, protein: 0.3, fat: 0, saturatedFat: 0, unsaturatedFat: 0, carbs: 3.2, sugar: 0, addedSugar: 0, fiber: 0 }, servingSizeG: 250 },
  { name: 'Wijn rood', nutrition: { calories: 83, protein: 0.1, fat: 0, saturatedFat: 0, unsaturatedFat: 0, carbs: 2.6, sugar: 0.6, addedSugar: 0, fiber: 0 }, servingSizeG: 150 },
  { name: 'Wijn wit', nutrition: { calories: 82, protein: 0.1, fat: 0, saturatedFat: 0, unsaturatedFat: 0, carbs: 2.6, sugar: 0.8, addedSugar: 0, fiber: 0 }, servingSizeG: 150 },

  // === VLEES ===
  { name: 'Kipfilet', nutrition: { calories: 110, protein: 24, fat: 1.3, saturatedFat: 0.4, unsaturatedFat: 0.9, carbs: 0, sugar: 0, addedSugar: 0, fiber: 0 }, servingSizeG: 150 },
  { name: 'Gehakt half om half', nutrition: { calories: 215, protein: 18, fat: 15, saturatedFat: 6.5, unsaturatedFat: 8.5, carbs: 0, sugar: 0, addedSugar: 0, fiber: 0 }, servingSizeG: 100 },
  { name: 'Gehakt rund mager', nutrition: { calories: 156, protein: 21, fat: 8, saturatedFat: 3.5, unsaturatedFat: 4.5, carbs: 0, sugar: 0, addedSugar: 0, fiber: 0 }, servingSizeG: 100 },
  { name: 'Rookworst', nutrition: { calories: 275, protein: 12, fat: 24, saturatedFat: 9, unsaturatedFat: 15, carbs: 2, sugar: 1, addedSugar: 0, fiber: 0 }, servingSizeG: 100 },
  { name: 'Frikandel', nutrition: { calories: 235, protein: 10, fat: 18, saturatedFat: 7, unsaturatedFat: 11, carbs: 8, sugar: 1, addedSugar: 0, fiber: 0.5 }, servingSizeG: 80 },
  { name: 'Kroket', nutrition: { calories: 210, protein: 6, fat: 13, saturatedFat: 5, unsaturatedFat: 8, carbs: 17, sugar: 1, addedSugar: 0, fiber: 0.5 }, servingSizeG: 65 },
  { name: 'Kaassoufflé', nutrition: { calories: 280, protein: 8, fat: 19, saturatedFat: 8, unsaturatedFat: 11, carbs: 19, sugar: 1, addedSugar: 0, fiber: 0.5 }, servingSizeG: 100 },

  // === VIS ===
  { name: 'Zalm (gebakken)', nutrition: { calories: 206, protein: 20, fat: 13, saturatedFat: 2.5, unsaturatedFat: 10.5, carbs: 0, sugar: 0, addedSugar: 0, fiber: 0 }, servingSizeG: 125 },
  { name: 'Kibbelng', nutrition: { calories: 225, protein: 14, fat: 12, saturatedFat: 2, unsaturatedFat: 10, carbs: 15, sugar: 1, addedSugar: 0, fiber: 0.5 }, servingSizeG: 150 },
  { name: 'Tonijn in water (blik)', nutrition: { calories: 108, protein: 24, fat: 1, saturatedFat: 0.3, unsaturatedFat: 0.7, carbs: 0, sugar: 0, addedSugar: 0, fiber: 0 }, servingSizeG: 120 },

  // === GROENTEN ===
  { name: 'Aardappelen gekookt', nutrition: { calories: 80, protein: 2, fat: 0.1, saturatedFat: 0, unsaturatedFat: 0.1, carbs: 17, sugar: 0.8, addedSugar: 0, fiber: 2 }, servingSizeG: 200 },
  { name: 'Patat / Friet', nutrition: { calories: 290, protein: 3.5, fat: 15, saturatedFat: 3, unsaturatedFat: 12, carbs: 35, sugar: 0.5, addedSugar: 0, fiber: 3 }, servingSizeG: 200 },
  { name: 'Stamppot boerenkool', nutrition: { calories: 95, protein: 4, fat: 3.5, saturatedFat: 1.5, unsaturatedFat: 2, carbs: 11, sugar: 2, addedSugar: 0, fiber: 3 }, servingSizeG: 250 },
  { name: 'Stamppot andijvie', nutrition: { calories: 85, protein: 3.5, fat: 3, saturatedFat: 1.5, unsaturatedFat: 1.5, carbs: 10, sugar: 1.5, addedSugar: 0, fiber: 2.5 }, servingSizeG: 250 },
  { name: 'Erwtensoep', nutrition: { calories: 80, protein: 5, fat: 2.5, saturatedFat: 1, unsaturatedFat: 1.5, carbs: 9, sugar: 1.5, addedSugar: 0, fiber: 3 }, servingSizeG: 300 },

  // === BROODJES / LUNCH ===
  { name: 'Tosti ham kaas', nutrition: { calories: 260, protein: 13, fat: 12, saturatedFat: 6, unsaturatedFat: 6, carbs: 25, sugar: 2, addedSugar: 0, fiber: 1.5 }, servingSizeG: 120 },
  { name: 'Broodje gezond', nutrition: { calories: 180, protein: 10, fat: 6, saturatedFat: 2, unsaturatedFat: 4, carbs: 22, sugar: 3, addedSugar: 0, fiber: 3 }, servingSizeG: 150 },
  { name: 'Uitsmijter (2 eieren)', nutrition: { calories: 195, protein: 14, fat: 12, saturatedFat: 4, unsaturatedFat: 8, carbs: 8, sugar: 1, addedSugar: 0, fiber: 1 }, servingSizeG: 200 },

  // === SNACKS ===
  { name: 'Stroopwafel', nutrition: { calories: 450, protein: 4, fat: 19, saturatedFat: 9, unsaturatedFat: 10, carbs: 65, sugar: 35, addedSugar: 33, fiber: 1 }, servingSizeG: 30 },
  { name: 'Gevulde koek', nutrition: { calories: 430, protein: 7, fat: 22, saturatedFat: 8, unsaturatedFat: 14, carbs: 50, sugar: 28, addedSugar: 25, fiber: 3 }, servingSizeG: 55 },
  { name: 'Appeltaart', nutrition: { calories: 260, protein: 3, fat: 12, saturatedFat: 6, unsaturatedFat: 6, carbs: 35, sugar: 20, addedSugar: 15, fiber: 1.5 }, servingSizeG: 120 },
  { name: 'Tompouce', nutrition: { calories: 310, protein: 3, fat: 15, saturatedFat: 9, unsaturatedFat: 6, carbs: 40, sugar: 28, addedSugar: 25, fiber: 0.5 }, servingSizeG: 100 },
  { name: 'Bitterbal', nutrition: { calories: 260, protein: 8, fat: 16, saturatedFat: 6, unsaturatedFat: 10, carbs: 20, sugar: 1, addedSugar: 0, fiber: 0.5 }, servingSizeG: 30 },
  { name: 'Chips naturel', nutrition: { calories: 536, protein: 6, fat: 34, saturatedFat: 3, unsaturatedFat: 31, carbs: 50, sugar: 1, addedSugar: 0, fiber: 4 }, servingSizeG: 30 },
  { name: 'Nootjes gezouten', nutrition: { calories: 607, protein: 20, fat: 52, saturatedFat: 7, unsaturatedFat: 45, carbs: 14, sugar: 5, addedSugar: 0, fiber: 7 }, servingSizeG: 30 },

  // === EIEREN ===
  { name: 'Ei gekookt', nutrition: { calories: 155, protein: 13, fat: 11, saturatedFat: 3.3, unsaturatedFat: 7.7, carbs: 1.1, sugar: 1.1, addedSugar: 0, fiber: 0 }, servingSizeG: 60 },
  { name: 'Spiegelei', nutrition: { calories: 196, protein: 14, fat: 15, saturatedFat: 4, unsaturatedFat: 11, carbs: 0.8, sugar: 0.8, addedSugar: 0, fiber: 0 }, servingSizeG: 60 },
  { name: 'Roerei', nutrition: { calories: 160, protein: 11, fat: 12, saturatedFat: 4, unsaturatedFat: 8, carbs: 1.5, sugar: 1.5, addedSugar: 0, fiber: 0 }, servingSizeG: 100 },

  // === FRUIT ===
  { name: 'Appel', nutrition: { calories: 52, protein: 0.3, fat: 0.2, saturatedFat: 0, unsaturatedFat: 0.2, carbs: 12, sugar: 10, addedSugar: 0, fiber: 2.4 }, servingSizeG: 150 },
  { name: 'Banaan', nutrition: { calories: 89, protein: 1.1, fat: 0.3, saturatedFat: 0.1, unsaturatedFat: 0.2, carbs: 20, sugar: 12, addedSugar: 0, fiber: 2.6 }, servingSizeG: 120 },
  { name: 'Sinaasappel', nutrition: { calories: 47, protein: 0.9, fat: 0.1, saturatedFat: 0, unsaturatedFat: 0.1, carbs: 10, sugar: 9.4, addedSugar: 0, fiber: 2.4 }, servingSizeG: 150 },
  { name: 'Mandarijn', nutrition: { calories: 53, protein: 0.8, fat: 0.3, saturatedFat: 0, unsaturatedFat: 0.3, carbs: 12, sugar: 11, addedSugar: 0, fiber: 1.8 }, servingSizeG: 75 },
  { name: 'Druiven', nutrition: { calories: 69, protein: 0.7, fat: 0.2, saturatedFat: 0, unsaturatedFat: 0.2, carbs: 16, sugar: 16, addedSugar: 0, fiber: 0.9 }, servingSizeG: 100 },

  // === RIJST & PASTA ===
  { name: 'Witte rijst (gekookt)', nutrition: { calories: 130, protein: 2.7, fat: 0.3, saturatedFat: 0.1, unsaturatedFat: 0.2, carbs: 28, sugar: 0, addedSugar: 0, fiber: 0.4 }, servingSizeG: 200 },
  { name: 'Zilvervliesrijst (gekookt)', nutrition: { calories: 123, protein: 2.7, fat: 1, saturatedFat: 0.2, unsaturatedFat: 0.8, carbs: 25, sugar: 0.4, addedSugar: 0, fiber: 1.8 }, servingSizeG: 200 },
  { name: 'Pasta (gekookt)', nutrition: { calories: 157, protein: 5.8, fat: 0.9, saturatedFat: 0.2, unsaturatedFat: 0.7, carbs: 31, sugar: 0.6, addedSugar: 0, fiber: 1.8 }, servingSizeG: 200 },
  { name: 'Nasi goreng', nutrition: { calories: 145, protein: 4, fat: 5, saturatedFat: 1.5, unsaturatedFat: 3.5, carbs: 21, sugar: 2, addedSugar: 0, fiber: 1 }, servingSizeG: 300 },
  { name: 'Bami goreng', nutrition: { calories: 140, protein: 4, fat: 4.5, saturatedFat: 1.5, unsaturatedFat: 3, carbs: 21, sugar: 2, addedSugar: 0, fiber: 1 }, servingSizeG: 300 },

  // === SAUZEN ===
  { name: 'Mayonaise', nutrition: { calories: 680, protein: 1, fat: 75, saturatedFat: 6, unsaturatedFat: 69, carbs: 1, sugar: 1, addedSugar: 0, fiber: 0 }, servingSizeG: 15 },
  { name: 'Ketchup', nutrition: { calories: 112, protein: 1.2, fat: 0.1, saturatedFat: 0, unsaturatedFat: 0.1, carbs: 26, sugar: 22, addedSugar: 18, fiber: 0.3 }, servingSizeG: 15 },
  { name: 'Mosterd', nutrition: { calories: 66, protein: 4, fat: 3.5, saturatedFat: 0.2, unsaturatedFat: 3.3, carbs: 4, sugar: 2.5, addedSugar: 0, fiber: 3 }, servingSizeG: 10 },
  { name: 'Satésaus', nutrition: { calories: 155, protein: 6, fat: 10, saturatedFat: 2, unsaturatedFat: 8, carbs: 10, sugar: 6, addedSugar: 3, fiber: 1 }, servingSizeG: 30 },
  { name: 'Fritessaus', nutrition: { calories: 340, protein: 0.5, fat: 33, saturatedFat: 3, unsaturatedFat: 30, carbs: 11, sugar: 8, addedSugar: 6, fiber: 0 }, servingSizeG: 20 },
];
