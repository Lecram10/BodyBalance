import { useState } from 'react';
import type { MealEntry } from '../../types/food';
import { calculatePointsForQuantity } from '../../lib/points-calculator';
import { Button } from '../ui/Button';
import { X } from 'lucide-react';

interface EditEntryModalProps {
  entry: MealEntry;
  onSave: (id: number, updates: { quantityG: number; quantity?: number; points: number }) => void;
  onClose: () => void;
}

export function EditEntryModal({ entry, onSave, onClose }: EditEntryModalProps) {
  const [quantityG, setQuantityG] = useState(entry.quantityG);
  const [quantity, setQuantity] = useState(entry.quantity || 1);

  const food = entry.foodItem;
  const unitLabel = food.unit === 'ml' ? 'ml' : 'gram';
  const unitShort = food.unit === 'ml' ? 'ml' : 'g';
  const pointsPerItem = calculatePointsForQuantity(food.pointsPer100g, quantityG);
  const points = pointsPerItem * quantity;

  const handleSave = () => {
    if (!entry.id) return;
    onSave(entry.id, {
      quantityG,
      quantity: quantity > 1 ? quantity : undefined,
      points,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center animate-fade-in">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />

      <div
        className="relative bg-white rounded-t-3xl w-full max-w-lg animate-slide-up"
        style={{ paddingBottom: 'calc(20px + var(--safe-area-bottom))' }}
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

          {/* Hoeveelheid */}
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

          {/* Save button */}
          <Button fullWidth size="lg" onClick={handleSave}>
            Opslaan — {points} pt{quantity > 1 ? ` (${quantity}×)` : ''}
          </Button>
        </div>
      </div>
    </div>
  );
}
