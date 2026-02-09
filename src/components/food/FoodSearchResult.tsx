import { Heart } from 'lucide-react';
import type { FoodItem } from '../../types/food';

interface FoodSearchResultProps {
  food: FoodItem;
  onSelect: (food: FoodItem) => void;
  onToggleFavorite?: (food: FoodItem) => void;
  showFavorite?: boolean;
}

export function FoodSearchResult({ food, onSelect, onToggleFavorite, showFavorite = true }: FoodSearchResultProps) {
  return (
    <div className="flex items-center gap-3 px-4 py-3">
      <button
        onClick={() => onSelect(food)}
        className="flex-1 flex items-center gap-3 bg-transparent border-none cursor-pointer active:bg-gray-50 transition-colors text-left min-w-0"
      >
        {food.imageUrl ? (
          <img
            src={food.imageUrl}
            alt={food.name}
            className="w-11 h-11 rounded-lg object-cover bg-ios-bg flex-shrink-0"
          />
        ) : (
          <div className="w-11 h-11 rounded-lg bg-primary-light flex items-center justify-center flex-shrink-0">
            <span className="text-primary-dark text-[18px] font-bold">
              {food.name.charAt(0).toUpperCase()}
            </span>
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="text-[15px] font-medium text-ios-text truncate">{food.name}</div>
          {food.brand && (
            <div className="text-[13px] text-ios-secondary truncate">{food.brand}</div>
          )}
        </div>
        <div className="flex-shrink-0 text-right">
          <div className={`text-[17px] font-bold ${food.isZeroPoint ? 'text-primary' : 'text-ios-text'}`}>
            {food.pointsPer100g}
          </div>
          <div className="text-[11px] text-ios-secondary">pt/100g</div>
        </div>
      </button>

      {showFavorite && onToggleFavorite && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleFavorite(food);
          }}
          className="flex-shrink-0 p-2 border-none bg-transparent cursor-pointer active:scale-125 transition-transform"
        >
          <Heart
            size={20}
            className={food.isFavorite ? 'text-red-500 fill-red-500' : 'text-ios-separator'}
          />
        </button>
      )}
    </div>
  );
}
