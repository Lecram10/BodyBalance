import { useState, useCallback, useRef, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { PageLayout } from '../components/layout/PageLayout';
import { FoodSearchResult } from '../components/food/FoodSearchResult';
import { AddFoodModal } from '../components/food/AddFoodModal';
import { Card } from '../components/ui/Card';
import { searchFood } from '../lib/food-api';
import { calculatePointsForQuantity } from '../lib/points-calculator';
import { useMealStore } from '../store/meal-store';
import type { FoodItem, MealType } from '../types/food';
import { Search as SearchIcon, Loader2 } from 'lucide-react';

export function Search() {
  const [searchParams] = useSearchParams();
  const defaultMealType = (searchParams.get('meal') as MealType) || 'lunch';

  const [query, setQuery] = useState('');
  const [results, setResults] = useState<FoodItem[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedFood, setSelectedFood] = useState<FoodItem | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const addEntry = useMealStore((s) => s.addEntry);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const doSearch = useCallback(async (q: string) => {
    if (q.length < 2) {
      setResults([]);
      setHasSearched(false);
      return;
    }
    setIsSearching(true);
    const items = await searchFood(q);
    setResults(items);
    setIsSearching(false);
    setHasSearched(true);
  }, []);

  const handleQueryChange = (value: string) => {
    setQuery(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => doSearch(value), 400);
  };

  const handleAddFood = async (quantityG: number, mealType: MealType) => {
    if (!selectedFood) return;

    const points = calculatePointsForQuantity(selectedFood.pointsPer100g, quantityG);

    await addEntry({
      foodItem: selectedFood,
      mealType,
      quantityG,
      points,
    });

    setSelectedFood(null);
    setQuery('');
    setResults([]);
    setHasSearched(false);
  };

  return (
    <PageLayout title="Zoek voedsel">
      <div className="flex flex-col gap-3">
        {/* Search bar */}
        <div className="relative">
          <SearchIcon
            size={18}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ios-secondary"
          />
          <input
            ref={inputRef}
            type="text"
            placeholder="Zoek een product..."
            value={query}
            onChange={(e) => handleQueryChange(e.target.value)}
            className="bg-white rounded-xl pl-10 pr-4 py-3 text-[17px] w-full shadow-sm"
          />
          {isSearching && (
            <Loader2
              size={18}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-ios-secondary animate-spin"
            />
          )}
        </div>

        {/* Results */}
        {results.length > 0 && (
          <Card>
            {results.map((food, index) => (
              <div
                key={`${food.barcode ?? food.name}-${index}`}
                className={index < results.length - 1 ? 'border-b border-ios-separator' : ''}
              >
                <FoodSearchResult food={food} onSelect={setSelectedFood} />
              </div>
            ))}
          </Card>
        )}

        {/* Empty state */}
        {hasSearched && results.length === 0 && !isSearching && (
          <div className="text-center py-12">
            <p className="text-[17px] text-ios-secondary">Geen resultaten gevonden</p>
            <p className="text-[13px] text-ios-secondary mt-1">
              Probeer een andere zoekterm
            </p>
          </div>
        )}

        {/* Initial state */}
        {!hasSearched && !isSearching && (
          <div className="text-center py-12">
            <SearchIcon size={48} className="text-ios-separator mx-auto mb-3" />
            <p className="text-[17px] text-ios-secondary">
              Zoek op productnaam of merk
            </p>
            <p className="text-[13px] text-ios-secondary mt-1">
              Of gebruik de scanner voor barcodes
            </p>
          </div>
        )}
      </div>

      {/* Add food modal */}
      {selectedFood && (
        <AddFoodModal
          food={selectedFood}
          defaultMealType={defaultMealType}
          onAdd={handleAddFood}
          onClose={() => setSelectedFood(null)}
        />
      )}
    </PageLayout>
  );
}
