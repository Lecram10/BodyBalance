import type { FoodItem } from '../../types/food';

interface FoodSearchResultProps {
  food: FoodItem;
  onSelect: (food: FoodItem) => void;
}

export function FoodSearchResult({ food, onSelect }: FoodSearchResultProps) {
  return (
    <button
      onClick={() => onSelect(food)}
      className="w-full flex items-center gap-3 px-4 py-3 bg-transparent border-none cursor-pointer active:bg-gray-50 transition-colors text-left"
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
  );
}
