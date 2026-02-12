import { useState, useCallback, useRef, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { PageLayout } from '../components/layout/PageLayout';
import { FoodSearchResult } from '../components/food/FoodSearchResult';
import { AddFoodModal } from '../components/food/AddFoodModal';
import { CreateFoodModal } from '../components/food/CreateFoodModal';
import { Card } from '../components/ui/Card';
import { RecipeBuilderModal } from '../components/food/RecipeBuilderModal';
import { searchFood } from '../lib/food-api';
import { calculatePointsForQuantity } from '../lib/points-calculator';
import { getRecentFoods, getFavoriteFoods, toggleFavorite } from '../db/database';
import { useMealStore } from '../store/meal-store';
import type { FoodItem, MealType } from '../types/food';
import { ZERO_POINT_CATEGORIES } from '../lib/zero-point-foods';
import { Search as SearchIcon, Loader2, Clock, Heart, Plus, ChefHat, Leaf, ChevronDown, ChevronRight } from 'lucide-react';

type Tab = 'recent' | 'favorites' | 'zeropoint' | 'search';

export function Search() {
  const [searchParams] = useSearchParams();
  const defaultMealType = (searchParams.get('meal') as MealType) || 'lunch';

  const [activeTab, setActiveTab] = useState<Tab>('recent');
  const [query, setQuery] = useState('');
  const [searchResults, setSearchResults] = useState<FoodItem[]>([]);
  const [recentFoods, setRecentFoods] = useState<FoodItem[]>([]);
  const [favoriteFoods, setFavoriteFoods] = useState<FoodItem[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedFood, setSelectedFood] = useState<FoodItem | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showRecipeModal, setShowRecipeModal] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const addEntry = useMealStore((s) => s.addEntry);

  // Laad recent en favorieten bij mount
  useEffect(() => {
    loadRecentAndFavorites();
  }, []);

  const loadRecentAndFavorites = async () => {
    setIsLoading(true);
    const [recent, favorites] = await Promise.all([
      getRecentFoods(),
      getFavoriteFoods(),
    ]);
    setRecentFoods(recent);
    setFavoriteFoods(favorites);
    setIsLoading(false);
  };

  const doSearch = useCallback(async (q: string) => {
    if (q.length < 2) {
      setSearchResults([]);
      setHasSearched(false);
      return;
    }

    // Annuleer vorige zoekopdracht
    if (abortRef.current) {
      abortRef.current.abort();
    }
    const controller = new AbortController();
    abortRef.current = controller;

    setIsSearching(true);
    try {
      const items = await searchFood(q, controller.signal);
      // Alleen updaten als dit request niet geannuleerd is
      if (!controller.signal.aborted) {
        const favNames = new Set(favoriteFoods.map((f) => f.name.toLowerCase()));
        const marked = items.map((item) => ({
          ...item,
          isFavorite: favNames.has(item.name.toLowerCase()),
        }));
        setSearchResults(marked);
        setIsSearching(false);
        setHasSearched(true);
      }
    } catch {
      if (!controller.signal.aborted) {
        setIsSearching(false);
      }
    }
  }, [favoriteFoods]);

  const handleQueryChange = (value: string) => {
    setQuery(value);
    if (value.length >= 2) {
      setActiveTab('search');
    }
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => doSearch(value), 300);
  };

  const handleToggleFavorite = async (food: FoodItem) => {
    const newStatus = await toggleFavorite(food);

    // Update in alle lijsten
    const updateList = (list: FoodItem[]) =>
      list.map((f) =>
        f.name.toLowerCase() === food.name.toLowerCase()
          ? { ...f, isFavorite: newStatus }
          : f
      );

    setRecentFoods(updateList);
    setSearchResults(updateList);

    // Herlaad favorieten
    const favorites = await getFavoriteFoods();
    setFavoriteFoods(favorites);
  };

  const handleAddFood = async (quantityG: number, mealType: MealType, quantity?: number) => {
    if (!selectedFood) return;

    const pointsPerItem = calculatePointsForQuantity(selectedFood.pointsPer100g, quantityG);
    const points = pointsPerItem * (quantity || 1);

    await addEntry({
      foodItem: selectedFood,
      mealType,
      quantityG,
      quantity,
      points,
    });

    setSelectedFood(null);
    // Herlaad recent na toevoegen
    const recent = await getRecentFoods();
    setRecentFoods(recent);
  };

  const handleFoodCreated = (food: FoodItem) => {
    setShowCreateModal(false);
    setShowRecipeModal(false);
    setSelectedFood(food);
    // Herlaad favorieten (eigen producten worden automatisch favoriet)
    loadRecentAndFavorites();
  };

  const handleTabChange = (tab: Tab) => {
    setActiveTab(tab);
    if (tab === 'search') {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
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
            onFocus={() => query.length >= 2 && setActiveTab('search')}
            className="bg-white rounded-xl pl-10 pr-4 py-3 text-[17px] w-full shadow-sm"
          />
          {isSearching && (
            <Loader2
              size={18}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-ios-secondary animate-spin"
            />
          )}
        </div>

        {/* Tab bar */}
        <div className="flex gap-1 bg-ios-bg rounded-xl p-1">
          <TabButton
            active={activeTab === 'recent'}
            onClick={() => handleTabChange('recent')}
            icon={<Clock size={14} />}
            label="Recent"
          />
          <TabButton
            active={activeTab === 'favorites'}
            onClick={() => handleTabChange('favorites')}
            icon={<Heart size={14} />}
            label="Favorieten"
          />
          <TabButton
            active={activeTab === 'zeropoint'}
            onClick={() => handleTabChange('zeropoint')}
            icon={<Leaf size={14} />}
            label="0 Punten"
          />
          <TabButton
            active={activeTab === 'search'}
            onClick={() => handleTabChange('search')}
            icon={<SearchIcon size={14} />}
            label="Zoeken"
          />
        </div>

        {/* Tab content */}
        {activeTab === 'recent' && (
          <RecentTab
            foods={recentFoods}
            isLoading={isLoading}
            onSelect={setSelectedFood}
            onToggleFavorite={handleToggleFavorite}
          />
        )}

        {activeTab === 'favorites' && (
          <FavoritesTab
            foods={favoriteFoods}
            isLoading={isLoading}
            onSelect={setSelectedFood}
            onToggleFavorite={handleToggleFavorite}
          />
        )}

        {activeTab === 'zeropoint' && (
          <ZeroPointTab onSelect={setSelectedFood} />
        )}

        {activeTab === 'search' && (
          <SearchTab
            results={searchResults}
            isSearching={isSearching}
            hasSearched={hasSearched}
            query={query}
            onSelect={setSelectedFood}
            onToggleFavorite={handleToggleFavorite}
          />
        )}

        {/* Aanmaak knoppen */}
        <div className="flex gap-2">
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex-1 flex items-center justify-center gap-2 py-3.5 bg-white rounded-xl border border-dashed border-ios-separator text-[15px] font-medium text-primary cursor-pointer active:bg-gray-50 transition-colors"
          >
            <Plus size={18} />
            Eigen product
          </button>
          <button
            onClick={() => setShowRecipeModal(true)}
            className="flex-1 flex items-center justify-center gap-2 py-3.5 bg-white rounded-xl border border-dashed border-ios-separator text-[15px] font-medium text-ios-blue cursor-pointer active:bg-gray-50 transition-colors"
          >
            <ChefHat size={18} />
            Samengesteld
          </button>
        </div>
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

      {/* Create food modal */}
      {showCreateModal && (
        <CreateFoodModal
          onCreated={handleFoodCreated}
          onClose={() => setShowCreateModal(false)}
        />
      )}

      {/* Recipe builder modal */}
      {showRecipeModal && (
        <RecipeBuilderModal
          onCreated={handleFoodCreated}
          onClose={() => setShowRecipeModal(false)}
        />
      )}
    </PageLayout>
  );
}

function TabButton({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-[13px] font-medium border-none cursor-pointer transition-colors ${
        active
          ? 'bg-white text-primary shadow-sm'
          : 'bg-transparent text-ios-secondary'
      }`}
    >
      {icon}
      {label}
    </button>
  );
}

function RecentTab({
  foods,
  isLoading,
  onSelect,
  onToggleFavorite,
}: {
  foods: FoodItem[];
  isLoading: boolean;
  onSelect: (food: FoodItem) => void;
  onToggleFavorite: (food: FoodItem) => void;
}) {
  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 size={24} className="text-ios-secondary animate-spin" />
      </div>
    );
  }

  if (foods.length === 0) {
    return (
      <div className="text-center py-12">
        <Clock size={48} className="text-ios-separator mx-auto mb-3" />
        <p className="text-[17px] text-ios-secondary">Nog geen producten gebruikt</p>
        <p className="text-[13px] text-ios-secondary mt-1">
          Producten die je logt verschijnen hier automatisch
        </p>
      </div>
    );
  }

  return (
    <Card>
      {foods.map((food, index) => (
        <div
          key={`recent-${food.name}-${index}`}
          className={index < foods.length - 1 ? 'border-b border-ios-separator' : ''}
        >
          <FoodSearchResult
            food={food}
            onSelect={onSelect}
            onToggleFavorite={onToggleFavorite}
          />
        </div>
      ))}
    </Card>
  );
}

function FavoritesTab({
  foods,
  isLoading,
  onSelect,
  onToggleFavorite,
}: {
  foods: FoodItem[];
  isLoading: boolean;
  onSelect: (food: FoodItem) => void;
  onToggleFavorite: (food: FoodItem) => void;
}) {
  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 size={24} className="text-ios-secondary animate-spin" />
      </div>
    );
  }

  if (foods.length === 0) {
    return (
      <div className="text-center py-12">
        <Heart size={48} className="text-ios-separator mx-auto mb-3" />
        <p className="text-[17px] text-ios-secondary">Geen favorieten</p>
        <p className="text-[13px] text-ios-secondary mt-1">
          Tik op het hartje om een product als favoriet op te slaan
        </p>
      </div>
    );
  }

  return (
    <Card>
      {foods.map((food, index) => (
        <div
          key={`fav-${food.id ?? food.name}-${index}`}
          className={index < foods.length - 1 ? 'border-b border-ios-separator' : ''}
        >
          <FoodSearchResult
            food={{ ...food, isFavorite: true }}
            onSelect={onSelect}
            onToggleFavorite={onToggleFavorite}
          />
        </div>
      ))}
    </Card>
  );
}

function ZeroPointTab({ onSelect }: { onSelect: (food: FoodItem) => void }) {
  const [expandedCategory, setExpandedCategory] = useState<string | null>(ZERO_POINT_CATEGORIES[0]?.name ?? null);

  const createZeroPointFood = (name: string): FoodItem => ({
    name,
    nutrition: {
      calories: 0, protein: 0, fat: 0, saturatedFat: 0,
      unsaturatedFat: 0, carbs: 0, sugar: 0, addedSugar: 0, fiber: 0,
    },
    pointsPer100g: 0,
    servingSizeG: 100,
    isZeroPoint: true,
    source: 'nevo',
    createdAt: new Date(),
  });

  return (
    <div className="flex flex-col gap-2">
      {ZERO_POINT_CATEGORIES.map((category) => {
        const isExpanded = expandedCategory === category.name;
        return (
          <Card key={category.name}>
            <button
              onClick={() => setExpandedCategory(isExpanded ? null : category.name)}
              className="w-full flex items-center justify-between px-4 py-3 border-none bg-transparent cursor-pointer"
            >
              <div className="flex items-center gap-2.5">
                <span className="text-lg">{category.icon}</span>
                <span className="text-[15px] font-semibold">{category.name}</span>
                <span className="text-[13px] text-ios-secondary">({category.items.length})</span>
              </div>
              {isExpanded
                ? <ChevronDown size={18} className="text-ios-secondary" />
                : <ChevronRight size={18} className="text-ios-secondary" />
              }
            </button>
            {isExpanded && (
              <div className="border-t border-ios-separator">
                {category.items.map((item, i) => (
                  <button
                    key={item}
                    onClick={() => onSelect(createZeroPointFood(item))}
                    className={`w-full flex items-center justify-between px-4 py-2.5 border-none bg-transparent cursor-pointer active:bg-gray-50 text-left ${
                      i < category.items.length - 1 ? 'border-b border-ios-separator' : ''
                    }`}
                  >
                    <span className="text-[15px]">{item}</span>
                    <span className="text-[13px] font-medium text-primary">0 pt</span>
                  </button>
                ))}
              </div>
            )}
          </Card>
        );
      })}
    </div>
  );
}

function SearchTab({
  results,
  isSearching,
  hasSearched,
  query,
  onSelect,
  onToggleFavorite,
}: {
  results: FoodItem[];
  isSearching: boolean;
  hasSearched: boolean;
  query: string;
  onSelect: (food: FoodItem) => void;
  onToggleFavorite: (food: FoodItem) => void;
}) {
  if (results.length > 0) {
    return (
      <Card>
        {results.map((food, index) => (
          <div
            key={`search-${food.barcode ?? food.name}-${index}`}
            className={index < results.length - 1 ? 'border-b border-ios-separator' : ''}
          >
            <FoodSearchResult
              food={food}
              onSelect={onSelect}
              onToggleFavorite={onToggleFavorite}
            />
          </div>
        ))}
      </Card>
    );
  }

  if (hasSearched && results.length === 0 && !isSearching) {
    return (
      <div className="text-center py-12">
        <p className="text-[17px] text-ios-secondary">Geen resultaten voor &quot;{query}&quot;</p>
        <p className="text-[13px] text-ios-secondary mt-1">
          Probeer een andere zoekterm of maak een eigen product aan
        </p>
      </div>
    );
  }

  return (
    <div className="text-center py-12">
      <SearchIcon size={48} className="text-ios-separator mx-auto mb-3" />
      <p className="text-[17px] text-ios-secondary">
        Zoek op productnaam of merk
      </p>
      <p className="text-[13px] text-ios-secondary mt-1">
        Of gebruik de scanner voor barcodes
      </p>
    </div>
  );
}
