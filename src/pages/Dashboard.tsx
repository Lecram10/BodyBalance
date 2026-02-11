import { useEffect, useState, useCallback } from 'react';
import { useUserStore } from '../store/user-store';
import { useMealStore } from '../store/meal-store';
import { getWeeklyPointsUsed, getWaterIntake, addWaterIntake, resetWaterIntake } from '../db/database';
import { PageLayout } from '../components/layout/PageLayout';
import { PointsRing } from '../components/points/PointsRing';
import { MealSection } from '../components/food/MealSection';
import { Card } from '../components/ui/Card';
import { format } from 'date-fns';
import { nl } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Droplets, GlassWater, Coffee, RotateCcw } from 'lucide-react';
import type { MealType } from '../types/food';

const MEAL_TYPES: MealType[] = ['breakfast', 'lunch', 'dinner', 'snack'];

export function Dashboard() {
  const profile = useUserStore((s) => s.profile);
  const {
    entries,
    selectedDate,
    setDate,
    loadEntries,
    removeEntry,
    getEntriesByMealType,
    getTotalPoints,
    getPointsByMealType,
  } = useMealStore();

  const [weeklyUsed, setWeeklyUsed] = useState(0);
  const [waterMl, setWaterMl] = useState(0);
  const waterGoal = profile?.waterGoalMl || 2000;

  const loadWater = useCallback(async () => {
    const ml = await getWaterIntake(selectedDate);
    setWaterMl(ml);
  }, [selectedDate]);

  useEffect(() => {
    loadEntries();
  }, [loadEntries]);

  // Herbereken weekpunten als entries of datum wijzigen
  useEffect(() => {
    if (profile) {
      getWeeklyPointsUsed(selectedDate, profile.dailyPointsBudget).then(setWeeklyUsed);
    }
  }, [selectedDate, profile, entries]);

  // Laad waterinname bij datumwijziging
  useEffect(() => {
    loadWater();
  }, [loadWater]);

  const handleAddWater = async (ml: number) => {
    const newTotal = await addWaterIntake(selectedDate, ml);
    setWaterMl(newTotal);
  };

  const handleResetWater = async () => {
    await resetWaterIntake(selectedDate);
    setWaterMl(0);
  };

  if (!profile) return null;

  const totalUsed = getTotalPoints();
  const weeklyRemaining = Math.max(0, profile.weeklyPointsBudget - weeklyUsed);
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
          <span className={`text-[17px] font-bold ${weeklyRemaining === 0 ? 'text-ios-destructive' : 'text-ios-blue'}`}>
            {weeklyRemaining}
            <span className="text-[13px] font-normal text-ios-secondary ml-1">
              / {profile.weeklyPointsBudget}
            </span>
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

        {/* Water tracker */}
        <Card>
          <div className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Droplets size={20} className="text-blue-500" />
                <span className="text-[17px] font-semibold">Water</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[15px] font-bold text-blue-500">
                  {(waterMl / 1000).toFixed(1)} / {(waterGoal / 1000).toFixed(1)} L
                </span>
                {waterMl > 0 && (
                  <button
                    onClick={handleResetWater}
                    className="w-7 h-7 rounded-full bg-transparent border-none cursor-pointer flex items-center justify-center active:bg-gray-100"
                  >
                    <RotateCcw size={14} className="text-ios-secondary" />
                  </button>
                )}
              </div>
            </div>

            {/* Progress bar */}
            <div className="w-full h-3 bg-blue-100 rounded-full overflow-hidden mb-3">
              <div
                className="h-full bg-blue-500 rounded-full transition-all duration-300"
                style={{ width: `${Math.min(100, (waterMl / waterGoal) * 100)}%` }}
              />
            </div>

            {/* Quick add buttons */}
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => handleAddWater(150)}
                className="flex flex-col items-center gap-1 py-2.5 bg-blue-50 rounded-xl border-none cursor-pointer active:bg-blue-100 transition-colors"
              >
                <GlassWater size={18} className="text-blue-500" />
                <span className="text-[13px] font-medium text-blue-700">+150ml</span>
                <span className="text-[11px] text-blue-400">glas</span>
              </button>
              <button
                onClick={() => handleAddWater(250)}
                className="flex flex-col items-center gap-1 py-2.5 bg-blue-50 rounded-xl border-none cursor-pointer active:bg-blue-100 transition-colors"
              >
                <Coffee size={18} className="text-blue-500" />
                <span className="text-[13px] font-medium text-blue-700">+250ml</span>
                <span className="text-[11px] text-blue-400">beker</span>
              </button>
              <button
                onClick={() => handleAddWater(500)}
                className="flex flex-col items-center gap-1 py-2.5 bg-blue-50 rounded-xl border-none cursor-pointer active:bg-blue-100 transition-colors"
              >
                <Droplets size={18} className="text-blue-500" />
                <span className="text-[13px] font-medium text-blue-700">+500ml</span>
                <span className="text-[11px] text-blue-400">fles</span>
              </button>
            </div>

            {waterMl >= waterGoal && (
              <p className="text-[13px] text-center text-green-600 font-medium mt-2">
                Waterdoel bereikt!
              </p>
            )}
          </div>
        </Card>
      </div>
    </PageLayout>
  );
}
