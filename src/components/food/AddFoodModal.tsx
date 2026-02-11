import { useState } from 'react';
import type { FoodItem, MealType } from '../../types/food';
import { MEAL_TYPE_LABELS } from '../../types/food';
import { calculatePointsForQuantity } from '../../lib/points-calculator';
import { Button } from '../ui/Button';
import { X } from 'lucide-react';

interface AddFoodModalProps {
  food: FoodItem;
  defaultMealType: MealType;
  onAdd: (quantityG: number, mealType: MealType, quantity?: number) => void;
  onClose: () => void;
}

export function AddFoodModal({ food, defaultMealType, onAdd, onClose }: AddFoodModalProps) {
  const [quantityG, setQuantityG] = useState(food.servingSizeG || 100);
  const [quantity, setQuantity] = useState(1);
  const [mealType, setMealType] = useState<MealType>(defaultMealType);

  const unitLabel = food.unit === 'ml' ? 'ml' : 'gram';
  const unitShort = food.unit === 'ml' ? 'ml' : 'g';
  const pointsPerItem = calculatePointsForQuantity(food.pointsPer100g, quantityG);
  const points = pointsPerItem * quantity;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center animate-fade-in">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />

      {/* Modal */}
      <div
        className="relative bg-white rounded-t-3xl w-full max-w-lg animate-slide-up"
        style={{ paddingBottom: 'calc(20px + var(--safe-area-bottom))' }}
      >
        {/* Handle bar */}
        <div className="flex justify-center pt-3 pb-2">
          <div className="w-9 h-1 rounded-full bg-ios-separator" />
        </div>

        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 w-8 h-8 rounded-full bg-ios-bg flex items-center justify-center border-none cursor-pointer"
        >
          <X size={18} className="text-ios-secondary" />
        </button>

        <div className="px-5 pb-4">
          {/* Food info */}
          <div className="flex items-center gap-3 mb-5">
            {food.imageUrl ? (
              <img src={food.imageUrl} alt={food.name} className="w-14 h-14 rounded-xl object-cover" />
            ) : (
              <div className="w-14 h-14 rounded-xl bg-primary-light flex items-center justify-center">
                <span className="text-primary-dark text-2xl font-bold">
                  {food.name.charAt(0).toUpperCase()}
                </span>
              </div>
            )}
            <div>
              <h3 className="text-[17px] font-semibold">{food.name}</h3>
              {food.brand && <p className="text-[13px] text-ios-secondary">{food.brand}</p>}
            </div>
          </div>

          {/* Points display */}
          <div className="bg-ios-bg rounded-2xl p-4 mb-5 text-center">
            <div className="text-[48px] font-bold text-primary leading-none">{points}</div>
            <div className="text-[13px] text-ios-secondary mt-1">punten</div>
          </div>

          {/* Quantity input */}
          <div className="mb-4">
            <label className="text-[13px] font-medium text-ios-secondary uppercase tracking-wide block mb-1.5 px-1">
              Hoeveelheid
            </label>
            <div className="flex items-center gap-3">
              <button
                className="w-10 h-10 rounded-full bg-ios-bg text-ios-text border-none cursor-pointer text-xl font-medium active:bg-gray-200"
                onClick={() => setQuantityG(Math.max(10, quantityG - 10))}
              >
                -
              </button>
              <div className="relative flex-1">
                <input
                  type="number"
                  value={quantityG}
                  onChange={(e) => setQuantityG(Math.max(1, Number(e.target.value)))}
                  className="text-center bg-white rounded-xl text-[20px] font-medium"
                  min={1}
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-ios-secondary text-[15px]">
                  {unitLabel}
                </span>
              </div>
              <button
                className="w-10 h-10 rounded-full bg-ios-bg text-ios-text border-none cursor-pointer text-xl font-medium active:bg-gray-200"
                onClick={() => setQuantityG(quantityG + 10)}
              >
                +
              </button>
            </div>
          </div>

          {/* Aantal */}
          <div className="mb-4">
            <label className="text-[13px] font-medium text-ios-secondary uppercase tracking-wide block mb-1.5 px-1">
              Aantal
            </label>
            <div className="flex items-center gap-3">
              <button
                className="w-10 h-10 rounded-full bg-ios-bg text-ios-text border-none cursor-pointer text-xl font-medium active:bg-gray-200"
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
              >
                -
              </button>
              <div className="relative flex-1">
                <input
                  type="number"
                  value={quantity}
                  onChange={(e) => setQuantity(Math.max(1, Math.round(Number(e.target.value))))}
                  className="text-center bg-white rounded-xl text-[20px] font-medium"
                  min={1}
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-ios-secondary text-[15px]">
                  stuks
                </span>
              </div>
              <button
                className="w-10 h-10 rounded-full bg-ios-bg text-ios-text border-none cursor-pointer text-xl font-medium active:bg-gray-200"
                onClick={() => setQuantity(quantity + 1)}
              >
                +
              </button>
            </div>
          </div>

          {/* Quick amounts */}
          <div className="flex gap-2 mb-5">
            {[50, 100, 150, 200].map((g) => (
              <button
                key={g}
                onClick={() => setQuantityG(g)}
                className={`flex-1 py-2 rounded-xl text-[14px] font-medium border-none cursor-pointer transition-colors ${
                  quantityG === g
                    ? 'bg-primary text-white'
                    : 'bg-ios-bg text-ios-text active:bg-gray-200'
                }`}
              >
                {g}{unitShort}
              </button>
            ))}
          </div>

          {/* Meal type selector */}
          <div className="mb-5">
            <label className="text-[13px] font-medium text-ios-secondary uppercase tracking-wide block mb-1.5 px-1">
              Maaltijd
            </label>
            <div className="flex gap-2">
              {(Object.entries(MEAL_TYPE_LABELS) as [MealType, string][]).map(([type, label]) => (
                <button
                  key={type}
                  onClick={() => setMealType(type)}
                  className={`flex-1 py-2.5 rounded-xl text-[13px] font-medium border-none cursor-pointer transition-colors ${
                    mealType === type
                      ? 'bg-primary text-white'
                      : 'bg-ios-bg text-ios-text active:bg-gray-200'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Nutrition info */}
          <div className="flex justify-around mb-5 py-3 bg-ios-bg rounded-xl">
            <div className="text-center">
              <div className="text-[15px] font-semibold">
                {Math.round((food.nutrition.calories * quantityG * quantity) / 100)}
              </div>
              <div className="text-[11px] text-ios-secondary">kcal</div>
            </div>
            <div className="text-center">
              <div className="text-[15px] font-semibold">
                {((food.nutrition.protein * quantityG * quantity) / 100).toFixed(1)}g
              </div>
              <div className="text-[11px] text-ios-secondary">eiwit</div>
            </div>
            <div className="text-center">
              <div className="text-[15px] font-semibold">
                {((food.nutrition.carbs * quantityG * quantity) / 100).toFixed(1)}g
              </div>
              <div className="text-[11px] text-ios-secondary">koolh.</div>
            </div>
            <div className="text-center">
              <div className="text-[15px] font-semibold">
                {((food.nutrition.fat * quantityG * quantity) / 100).toFixed(1)}g
              </div>
              <div className="text-[11px] text-ios-secondary">vet</div>
            </div>
          </div>

          {/* Add button */}
          <Button fullWidth size="lg" onClick={() => onAdd(quantityG, mealType, quantity > 1 ? quantity : undefined)}>
            Toevoegen — {points} pt{quantity > 1 ? ` (${quantity}×)` : ''}
          </Button>
        </div>
      </div>
    </div>
  );
}
