import { useState, useCallback, useRef } from 'react';
import { X, Search, Plus, Minus, Loader2 } from 'lucide-react';
import { Button } from '../ui/Button';
import { calculatePointsPer100g } from '../../lib/points-calculator';
import { saveCustomFood } from '../../db/database';
import { searchFood } from '../../lib/food-api';
import type { FoodItem, NutritionPer100g } from '../../types/food';

interface Ingredient {
  food: FoodItem;
  quantityG: number;
}

interface RecipeBuilderModalProps {
  onCreated: (food: FoodItem) => void;
  onClose: () => void;
}

export function RecipeBuilderModal({ onCreated, onClose }: RecipeBuilderModalProps) {
  const [name, setName] = useState('');
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<FoodItem[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const doSearch = useCallback(async (q: string) => {
    if (q.length < 2) { setSearchResults([]); return; }
    setIsSearching(true);
    const items = await searchFood(q);
    setSearchResults(items);
    setIsSearching(false);
  }, []);

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => doSearch(value), 400);
  };

  const addIngredient = (food: FoodItem) => {
    setIngredients((prev) => [...prev, { food, quantityG: food.servingSizeG || 100 }]);
    setSearchQuery('');
    setSearchResults([]);
  };

  const updateQuantity = (index: number, quantityG: number) => {
    setIngredients((prev) =>
      prev.map((ing, i) => (i === index ? { ...ing, quantityG: Math.max(1, quantityG) } : ing))
    );
  };

  const removeIngredient = (index: number) => {
    setIngredients((prev) => prev.filter((_, i) => i !== index));
  };

  // Bereken totale voedingswaarden
  const totalWeight = ingredients.reduce((sum, ing) => sum + ing.quantityG, 0);
  const totalNutrition: NutritionPer100g = ingredients.reduce(
    (acc, ing) => {
      const factor = ing.quantityG / 100;
      return {
        calories: acc.calories + ing.food.nutrition.calories * factor,
        protein: acc.protein + ing.food.nutrition.protein * factor,
        fat: acc.fat + ing.food.nutrition.fat * factor,
        saturatedFat: acc.saturatedFat + ing.food.nutrition.saturatedFat * factor,
        unsaturatedFat: acc.unsaturatedFat + ing.food.nutrition.unsaturatedFat * factor,
        carbs: acc.carbs + ing.food.nutrition.carbs * factor,
        sugar: acc.sugar + ing.food.nutrition.sugar * factor,
        addedSugar: acc.addedSugar + ing.food.nutrition.addedSugar * factor,
        fiber: acc.fiber + ing.food.nutrition.fiber * factor,
      };
    },
    { calories: 0, protein: 0, fat: 0, saturatedFat: 0, unsaturatedFat: 0, carbs: 0, sugar: 0, addedSugar: 0, fiber: 0 }
  );

  // Normaliseer naar per 100g
  const per100g: NutritionPer100g = totalWeight > 0
    ? {
        calories: Math.round((totalNutrition.calories / totalWeight) * 100),
        protein: +((totalNutrition.protein / totalWeight) * 100).toFixed(1),
        fat: +((totalNutrition.fat / totalWeight) * 100).toFixed(1),
        saturatedFat: +((totalNutrition.saturatedFat / totalWeight) * 100).toFixed(1),
        unsaturatedFat: +((totalNutrition.unsaturatedFat / totalWeight) * 100).toFixed(1),
        carbs: +((totalNutrition.carbs / totalWeight) * 100).toFixed(1),
        sugar: +((totalNutrition.sugar / totalWeight) * 100).toFixed(1),
        addedSugar: +((totalNutrition.addedSugar / totalWeight) * 100).toFixed(1),
        fiber: +((totalNutrition.fiber / totalWeight) * 100).toFixed(1),
      }
    : { calories: 0, protein: 0, fat: 0, saturatedFat: 0, unsaturatedFat: 0, carbs: 0, sugar: 0, addedSugar: 0, fiber: 0 };

  const points = calculatePointsPer100g(per100g);
  const totalPoints = totalWeight > 0 ? Math.max(0, Math.round((points * totalWeight) / 100)) : 0;
  const isValid = name.trim().length >= 2 && ingredients.length >= 2;

  const handleSave = async () => {
    if (!isValid) return;
    const food = await saveCustomFood({
      name: name.trim(),
      nutrition: per100g,
      pointsPer100g: points,
      servingSizeG: Math.round(totalWeight),
      isZeroPoint: points === 0,
      isFavorite: true,
      source: 'user',
    });
    onCreated(food);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center animate-fade-in">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div
        className="relative bg-white rounded-t-3xl w-full max-w-lg animate-slide-up overflow-y-auto"
        style={{ paddingBottom: 'calc(20px + var(--safe-area-bottom))', maxHeight: '92vh' }}
      >
        <div className="flex justify-center pt-3 pb-2">
          <div className="w-9 h-1 rounded-full bg-ios-separator" />
        </div>
        <button
          onClick={onClose}
          className="absolute top-3 right-3 w-8 h-8 rounded-full bg-ios-bg flex items-center justify-center border-none cursor-pointer"
        >
          <X size={18} className="text-ios-secondary" />
        </button>

        <div className="px-5 pb-4">
          <h2 className="text-[20px] font-bold mb-4">Samengesteld product</h2>

          {/* Naam */}
          <div className="mb-4">
            <label className="text-[13px] font-medium text-ios-secondary uppercase tracking-wide block mb-1 px-1">
              Naam *
            </label>
            <input
              type="text"
              placeholder="bijv. Tosti ham-kaas"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="bg-white rounded-xl px-4 py-3 text-[16px] w-full border border-ios-separator"
            />
          </div>

          {/* Ingrediënten zoeken */}
          <label className="text-[13px] font-medium text-ios-secondary uppercase tracking-wide block mb-1 px-1">
            Ingrediënten toevoegen
          </label>
          <div className="relative mb-3">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ios-secondary" />
            <input
              type="text"
              placeholder="Zoek ingrediënt..."
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="bg-white rounded-xl pl-9 pr-4 py-2.5 text-[15px] w-full border border-ios-separator"
            />
            {isSearching && <Loader2 size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-ios-secondary animate-spin" />}
          </div>

          {/* Zoekresultaten */}
          {searchResults.length > 0 && (
            <div className="bg-white border border-ios-separator rounded-xl mb-3 max-h-40 overflow-y-auto">
              {searchResults.slice(0, 8).map((food, i) => (
                <button
                  key={`${food.name}-${i}`}
                  onClick={() => addIngredient(food)}
                  className="w-full flex items-center gap-2 px-3 py-2 text-left bg-transparent border-none cursor-pointer active:bg-gray-50 text-[14px]"
                >
                  <Plus size={14} className="text-primary flex-shrink-0" />
                  <span className="truncate">{food.name}</span>
                  <span className="text-ios-secondary text-[12px] ml-auto flex-shrink-0">{food.pointsPer100g} pt</span>
                </button>
              ))}
            </div>
          )}

          {/* Ingrediënten lijst */}
          {ingredients.length > 0 && (
            <div className="bg-ios-bg rounded-xl mb-4">
              {ingredients.map((ing, index) => (
                <div
                  key={`${ing.food.name}-${index}`}
                  className={`flex items-center gap-2 px-3 py-2.5 ${
                    index < ingredients.length - 1 ? 'border-b border-ios-separator' : ''
                  }`}
                >
                  <div className="flex-1 min-w-0">
                    <div className="text-[14px] font-medium truncate">{ing.food.name}</div>
                  </div>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <button
                      onClick={() => updateQuantity(index, ing.quantityG - 10)}
                      className="w-7 h-7 rounded-full bg-white flex items-center justify-center border-none cursor-pointer text-ios-secondary"
                    >
                      <Minus size={12} />
                    </button>
                    <input
                      type="number"
                      value={ing.quantityG}
                      onChange={(e) => updateQuantity(index, Number(e.target.value))}
                      className="w-14 text-center bg-white rounded-lg px-1 py-1 text-[14px] border border-ios-separator"
                    />
                    <span className="text-[12px] text-ios-secondary">g</span>
                    <button
                      onClick={() => updateQuantity(index, ing.quantityG + 10)}
                      className="w-7 h-7 rounded-full bg-white flex items-center justify-center border-none cursor-pointer text-ios-secondary"
                    >
                      <Plus size={12} />
                    </button>
                    <button
                      onClick={() => removeIngredient(index)}
                      className="w-7 h-7 rounded-full flex items-center justify-center border-none cursor-pointer text-ios-destructive bg-transparent"
                    >
                      <X size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {ingredients.length < 2 && (
            <p className="text-[13px] text-ios-secondary text-center mb-4">
              Voeg minimaal 2 ingrediënten toe
            </p>
          )}

          {/* Totaal */}
          {ingredients.length >= 2 && (
            <>
              <div className="bg-ios-bg rounded-2xl p-4 mb-3 text-center">
                <div className="text-[36px] font-bold text-primary leading-none">{totalPoints}</div>
                <div className="text-[13px] text-ios-secondary mt-1">
                  punten totaal ({Math.round(totalWeight)}g) — {points} pt/100g
                </div>
              </div>
              <div className="flex justify-around mb-4 py-2 bg-ios-bg rounded-xl text-center">
                <div>
                  <div className="text-[14px] font-semibold">{Math.round(totalNutrition.calories)}</div>
                  <div className="text-[11px] text-ios-secondary">kcal</div>
                </div>
                <div>
                  <div className="text-[14px] font-semibold">{totalNutrition.protein.toFixed(1)}g</div>
                  <div className="text-[11px] text-ios-secondary">eiwit</div>
                </div>
                <div>
                  <div className="text-[14px] font-semibold">{totalNutrition.carbs.toFixed(1)}g</div>
                  <div className="text-[11px] text-ios-secondary">koolh.</div>
                </div>
                <div>
                  <div className="text-[14px] font-semibold">{totalNutrition.fat.toFixed(1)}g</div>
                  <div className="text-[11px] text-ios-secondary">vet</div>
                </div>
              </div>
            </>
          )}

          <Button fullWidth size="lg" onClick={handleSave} disabled={!isValid}>
            Opslaan — {totalPoints} pt
          </Button>
        </div>
      </div>
    </div>
  );
}
