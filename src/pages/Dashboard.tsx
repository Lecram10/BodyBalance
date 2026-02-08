import { useEffect } from 'react';
import { useUserStore } from '../store/user-store';
import { useMealStore } from '../store/meal-store';
import { PageLayout } from '../components/layout/PageLayout';
import { PointsRing } from '../components/points/PointsRing';
import { MealSection } from '../components/food/MealSection';
import { Card } from '../components/ui/Card';
import { format } from 'date-fns';
import { nl } from 'date-fns/locale';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { MealType } from '../types/food';

const MEAL_TYPES: MealType[] = ['breakfast', 'lunch', 'dinner', 'snack'];

export function Dashboard() {
  const profile = useUserStore((s) => s.profile);
  const {
    selectedDate,
    setDate,
    loadEntries,
    removeEntry,
    getEntriesByMealType,
    getTotalPoints,
    getPointsByMealType,
  } = useMealStore();

  useEffect(() => {
    loadEntries();
  }, [loadEntries]);

  if (!profile) return null;

  const totalUsed = getTotalPoints();
  const isToday = selectedDate === format(new Date(), 'yyyy-MM-dd');

  const navigateDate = (direction: -1 | 1) => {
    const current = new Date(selectedDate);
    current.setDate(current.getDate() + direction);
    setDate(format(current, 'yyyy-MM-dd'));
  };

  const dateLabel = isToday
    ? 'Vandaag'
    : format(new Date(selectedDate), 'd MMMM', { locale: nl });

  return (
    <PageLayout title="BodyBalance">
      <div className="flex flex-col gap-4 pb-4">
        {/* Date selector */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigateDate(-1)}
            className="w-9 h-9 rounded-full bg-white flex items-center justify-center border-none cursor-pointer active:bg-gray-100 shadow-sm"
          >
            <ChevronLeft size={20} className="text-ios-text" />
          </button>
          <span className="text-[17px] font-semibold">{dateLabel}</span>
          <button
            onClick={() => navigateDate(1)}
            disabled={isToday}
            className={`w-9 h-9 rounded-full bg-white flex items-center justify-center border-none cursor-pointer shadow-sm ${
              isToday ? 'opacity-30' : 'active:bg-gray-100'
            }`}
          >
            <ChevronRight size={20} className="text-ios-text" />
          </button>
        </div>

        {/* Points Ring */}
        <Card className="py-6 flex justify-center">
          <PointsRing used={totalUsed} budget={profile.dailyPointsBudget} />
        </Card>

        {/* Weekly points info */}
        <Card className="px-4 py-3 flex items-center justify-between">
          <span className="text-[15px] text-ios-secondary">Weekpunten resterend</span>
          <span className="text-[17px] font-bold text-ios-blue">
            {profile.weeklyPointsBudget}
          </span>
        </Card>

        {/* Meal sections */}
        {MEAL_TYPES.map((type) => (
          <MealSection
            key={type}
            mealType={type}
            entries={getEntriesByMealType(type)}
            totalPoints={getPointsByMealType(type)}
            onRemoveEntry={removeEntry}
          />
        ))}
      </div>
    </PageLayout>
  );
}
