import { Plus, Trash2, BookmarkPlus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { MealEntry, MealType } from '../../types/food';
import { MEAL_TYPE_LABELS, MEAL_TYPE_ICONS } from '../../types/food';
import { Card } from '../ui/Card';

interface MealSectionProps {
  mealType: MealType;
  entries: MealEntry[];
  totalPoints: number;
  onRemoveEntry: (id: number) => void;
  onSaveTemplate?: (mealType: MealType) => void;
}

export function MealSection({ mealType, entries, totalPoints, onRemoveEntry, onSaveTemplate }: MealSectionProps) {
  const navigate = useNavigate();

  return (
    <Card className="animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="text-lg">{MEAL_TYPE_ICONS[mealType]}</span>
          <span className="font-semibold text-[15px]">{MEAL_TYPE_LABELS[mealType]}</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[15px] text-ios-secondary font-medium">{totalPoints} pt</span>
          {entries.length > 0 && onSaveTemplate && (
            <button
              onClick={() => onSaveTemplate(mealType)}
              className="w-7 h-7 rounded-full bg-ios-bg flex items-center justify-center border-none cursor-pointer active:bg-gray-200 transition-colors"
            >
              <BookmarkPlus size={14} className="text-ios-secondary" />
            </button>
          )}
          <button
            onClick={() => navigate(`/search?meal=${mealType}`)}
            className="w-7 h-7 rounded-full bg-primary flex items-center justify-center border-none cursor-pointer active:bg-primary-dark transition-colors"
          >
            <Plus size={16} color="white" strokeWidth={2.5} />
          </button>
        </div>
      </div>

      {/* Entries */}
      {entries.length > 0 && (
        <div className="border-t border-ios-separator">
          {entries.map((entry, index) => (
            <div
              key={entry.id ?? index}
              className={`flex items-center justify-between px-4 py-2.5 ${
                index < entries.length - 1 ? 'border-b border-ios-separator' : ''
              }`}
            >
              <div className="flex-1 min-w-0">
                <div className="text-[15px] truncate">{entry.foodItem.name}</div>
                <div className="text-[13px] text-ios-secondary">
                  {(() => {
                    const u = entry.foodItem.unit === 'ml' ? 'ml' : 'g';
                    return entry.quantity && entry.quantity > 1
                      ? `${entry.quantity}× ${entry.quantityG}${u}`
                      : `${entry.quantityG}${u}`;
                  })()}
                </div>
              </div>
              <div className="flex items-center gap-3 flex-shrink-0">
                <span className={`text-[15px] font-medium ${entry.points === 0 ? 'text-primary' : ''}`}>
                  {entry.points === 0 ? '0' : entry.points} pt
                </span>
                {entry.id != null && (
                  <button
                    onClick={() => onRemoveEntry(entry.id!)}
                    className="text-ios-secondary active:text-ios-destructive border-none bg-transparent cursor-pointer p-1"
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {entries.length === 0 && (
        <div
          className="px-4 py-3 text-[15px] text-ios-secondary border-t border-ios-separator cursor-pointer active:bg-gray-50"
          onClick={() => navigate(`/search?meal=${mealType}`)}
        >
          Tik om voedsel toe te voegen...
        </div>
      )}
    </Card>
  );
}
