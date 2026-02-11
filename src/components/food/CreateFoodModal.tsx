import { useState } from 'react';
import { X, ScanBarcode } from 'lucide-react';
import { Button } from '../ui/Button';
import { calculatePointsPer100g } from '../../lib/points-calculator';
import { saveCustomFood } from '../../db/database';
import type { FoodItem, FoodUnit, NutritionPer100g } from '../../types/food';

interface CreateFoodModalProps {
  onCreated: (food: FoodItem) => void;
  onClose: () => void;
}

export function CreateFoodModal({ onCreated, onClose }: CreateFoodModalProps) {
  const [name, setName] = useState('');
  const [brand, setBrand] = useState('');
  const [barcode, setBarcode] = useState('');
  const [servingSize, setServingSize] = useState('100');
  const [unit, setUnit] = useState<FoodUnit>('g');
  const [nutrition, setNutrition] = useState({
    calories: '',
    protein: '',
    fat: '',
    saturatedFat: '',
    carbs: '',
    sugar: '',
    fiber: '',
  });

  const parsedNutrition: NutritionPer100g = {
    calories: Number(nutrition.calories) || 0,
    protein: Number(nutrition.protein) || 0,
    fat: Number(nutrition.fat) || 0,
    saturatedFat: Number(nutrition.saturatedFat) || 0,
    unsaturatedFat: Math.max(0, (Number(nutrition.fat) || 0) - (Number(nutrition.saturatedFat) || 0)),
    carbs: Number(nutrition.carbs) || 0,
    sugar: Number(nutrition.sugar) || 0,
    addedSugar: 0,
    fiber: Number(nutrition.fiber) || 0,
  };

  const points = calculatePointsPer100g(parsedNutrition);
  const isValid = name.trim().length >= 2 && Number(nutrition.calories) > 0;

  const handleSave = async () => {
    if (!isValid) return;

    const food = await saveCustomFood({
      name: name.trim(),
      brand: brand.trim() || undefined,
      barcode: barcode.trim() || undefined,
      nutrition: parsedNutrition,
      pointsPer100g: points,
      servingSizeG: Number(servingSize) || 100,
      unit,
      isZeroPoint: points === 0,
      isFavorite: true,
      source: 'user',
    });

    onCreated(food);
  };

  const updateField = (field: keyof typeof nutrition, value: string) => {
    // Sta alleen cijfers en punt/komma toe
    const cleaned = value.replace(',', '.').replace(/[^0-9.]/g, '');
    setNutrition((prev) => ({ ...prev, [field]: cleaned }));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center animate-fade-in">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />

      <div
        className="relative bg-white rounded-t-3xl w-full max-w-lg animate-slide-up overflow-y-auto"
        style={{
          paddingBottom: 'calc(20px + var(--safe-area-bottom))',
          maxHeight: '92vh',
        }}
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
          <h2 className="text-[20px] font-bold mb-4">Eigen product</h2>

          {/* Naam & Merk */}
          <div className="flex flex-col gap-3 mb-5">
            <div>
              <label className="text-[13px] font-medium text-ios-secondary uppercase tracking-wide block mb-1 px-1">
                Naam *
              </label>
              <input
                type="text"
                placeholder="bijv. Lavazza Cappuccino"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="bg-white rounded-xl px-4 py-3 text-[16px] w-full border border-ios-separator"
              />
            </div>
            <div>
              <label className="text-[13px] font-medium text-ios-secondary uppercase tracking-wide block mb-1 px-1">
                Merk (optioneel)
              </label>
              <input
                type="text"
                placeholder="bijv. Lavazza"
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
                className="bg-white rounded-xl px-4 py-3 text-[16px] w-full border border-ios-separator"
              />
            </div>
            <div>
              <label className="text-[13px] font-medium text-ios-secondary uppercase tracking-wide block mb-1 px-1">
                Barcode (optioneel)
              </label>
              <div className="relative">
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="Scan of typ de barcode"
                  value={barcode}
                  onChange={(e) => setBarcode(e.target.value.replace(/[^0-9]/g, ''))}
                  className="bg-white rounded-xl pl-4 pr-10 py-3 text-[16px] w-full border border-ios-separator"
                />
                <ScanBarcode size={18} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-ios-secondary" />
              </div>
              <p className="text-[11px] text-ios-secondary mt-0.5 px-1">
                Vul de barcode in zodat je dit product later kunt scannen
              </p>
            </div>
            <div>
              <label className="text-[13px] font-medium text-ios-secondary uppercase tracking-wide block mb-1 px-1">
                Eenheid
              </label>
              <div className="flex gap-2">
                {(['g', 'ml'] as FoodUnit[]).map((u) => (
                  <button
                    key={u}
                    onClick={() => setUnit(u)}
                    className={`flex-1 py-2.5 rounded-xl text-[14px] font-medium border-none cursor-pointer transition-colors ${
                      unit === u
                        ? 'bg-primary text-white'
                        : 'bg-ios-bg text-ios-text active:bg-gray-200'
                    }`}
                  >
                    {u === 'g' ? 'Gram (g)' : 'Milliliter (ml)'}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-[13px] font-medium text-ios-secondary uppercase tracking-wide block mb-1 px-1">
                Standaard portie ({unit})
              </label>
              <input
                type="number"
                value={servingSize}
                onChange={(e) => setServingSize(e.target.value)}
                className="bg-white rounded-xl px-4 py-3 text-[16px] w-full border border-ios-separator"
                min={1}
              />
            </div>
          </div>

          {/* Voedingswaarden header */}
          <label className="text-[13px] font-medium text-ios-secondary uppercase tracking-wide block mb-2 px-1">
            Voedingswaarden per 100{unit} *
          </label>

          {/* Voedingswaarden grid */}
          <div className="grid grid-cols-2 gap-2 mb-4">
            <NutritionField
              label="Calorieën (kcal)"
              value={nutrition.calories}
              onChange={(v) => updateField('calories', v)}
            />
            <NutritionField
              label="Eiwit (g)"
              value={nutrition.protein}
              onChange={(v) => updateField('protein', v)}
            />
            <NutritionField
              label="Koolhydraten (g)"
              value={nutrition.carbs}
              onChange={(v) => updateField('carbs', v)}
            />
            <NutritionField
              label="Suikers (g)"
              value={nutrition.sugar}
              onChange={(v) => updateField('sugar', v)}
            />
            <NutritionField
              label="Vet (g)"
              value={nutrition.fat}
              onChange={(v) => updateField('fat', v)}
            />
            <NutritionField
              label="Verz. vet (g)"
              value={nutrition.saturatedFat}
              onChange={(v) => updateField('saturatedFat', v)}
            />
            <NutritionField
              label="Vezels (g)"
              value={nutrition.fiber}
              onChange={(v) => updateField('fiber', v)}
            />
          </div>

          {/* Punten preview */}
          <div className="bg-ios-bg rounded-2xl p-4 mb-5 text-center">
            <div className="text-[36px] font-bold text-primary leading-none">{points}</div>
            <div className="text-[13px] text-ios-secondary mt-1">punten per 100{unit}</div>
          </div>

          {/* Tip */}
          <p className="text-[13px] text-ios-secondary mb-4 px-1">
            Tip: de voedingswaarden vind je op de verpakking of zoek online op &quot;product
            voedingswaarde per 100g&quot;.
          </p>

          {/* Save button */}
          <Button fullWidth size="lg" onClick={handleSave} disabled={!isValid}>
            Opslaan — {points} pt/100{unit}
          </Button>
        </div>
      </div>
    </div>
  );
}

function NutritionField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <label className="text-[12px] text-ios-secondary block mb-0.5 px-1">{label}</label>
      <input
        type="text"
        inputMode="decimal"
        placeholder="0"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="bg-white rounded-xl px-3 py-2.5 text-[16px] w-full border border-ios-separator"
      />
    </div>
  );
}
