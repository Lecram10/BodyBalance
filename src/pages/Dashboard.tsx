import { useEffect, useState, useCallback } from 'react';
import { useUserStore } from '../store/user-store';
import { useMealStore } from '../store/meal-store';
import { getWeeklyPointsUsed, getWaterIntake, addWaterIntake, resetWaterIntake, copyDayEntries, getWeekSummary, calculateStreak } from '../db/database';
import type { WeekSummary } from '../db/database';
import { PageLayout } from '../components/layout/PageLayout';
import { PointsRing } from '../components/points/PointsRing';
import { MealSection } from '../components/food/MealSection';
import { EditEntryModal } from '../components/food/EditEntryModal';
import { Card } from '../components/ui/Card';
import { format } from 'date-fns';
import { nl } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, ChevronDown, ChevronUp, Droplets, GlassWater, Coffee, RotateCcw, Copy, Bookmark, X, Flame, Trophy, TrendingDown, TrendingUp, Minus } from 'lucide-react';
import type { FoodItem, MealEntry, MealType } from '../types/food';

const MEAL_TYPES: MealType[] = ['breakfast', 'lunch', 'dinner', 'snack'];

interface MealTemplate {
  name: string;
  mealType: MealType;
  items: { foodItem: FoodItem; quantityG: number; quantity?: number; points: number }[];
}

function getTemplates(): MealTemplate[] {
  try {
    const stored = localStorage.getItem('bb_templates');
    return stored ? JSON.parse(stored) : [];
  } catch { return []; }
}

function saveTemplate(template: MealTemplate) {
  const templates = getTemplates();
  templates.push(template);
  localStorage.setItem('bb_templates', JSON.stringify(templates));
}

function deleteTemplate(index: number) {
  const templates = getTemplates();
  templates.splice(index, 1);
  localStorage.setItem('bb_templates', JSON.stringify(templates));
}

export function Dashboard() {
  const profile = useUserStore((s) => s.profile);
  const {
    entries,
    selectedDate,
    setDate,
    loadEntries,
    addEntry,
    updateEntry,
    removeEntry,
    getEntriesByMealType,
    getTotalPoints,
    getPointsByMealType,
  } = useMealStore();

  const [weeklyUsed, setWeeklyUsed] = useState(0);
  const [waterMl, setWaterMl] = useState(0);
  const waterGoal = profile?.waterGoalMl || 2000;
  const [showTemplates, setShowTemplates] = useState(false);
  const [templates, setTemplates] = useState<MealTemplate[]>(getTemplates);
  const [streak, setStreak] = useState(0);
  const [weekReport, setWeekReport] = useState<WeekSummary | null>(null);
  const [weekReportOffset, setWeekReportOffset] = useState(0);
  const [weekReportExpanded, setWeekReportExpanded] = useState(true);
  const [editingEntry, setEditingEntry] = useState<MealEntry | null>(null);

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

  // Laad streak
  useEffect(() => {
    if (profile) {
      calculateStreak(profile.dailyPointsBudget).then(setStreak);
    }
  }, [profile, entries]);

  // Weekrapport: dynamisch op basis van weekReportOffset
  useEffect(() => {
    if (!profile) return;
    getWeekSummary(
      profile.dailyPointsBudget,
      profile.weeklyPointsBudget,
      profile.waterGoalMl || 2000,
      weekReportOffset
    ).then(setWeekReport);
  }, [profile, entries, weekReportOffset]);

  const handleAddWater = async (ml: number) => {
    const newTotal = await addWaterIntake(selectedDate, ml);
    setWaterMl(newTotal);
    navigator.vibrate?.(10);
  };

  const handleResetWater = async () => {
    await resetWaterIntake(selectedDate);
    setWaterMl(0);
  };

  const handleSaveTemplate = (mealType: MealType) => {
    const mealEntries = getEntriesByMealType(mealType);
    if (mealEntries.length === 0) return;
    const name = prompt('Naam voor deze template:');
    if (!name) return;
    const template: MealTemplate = {
      name,
      mealType,
      items: mealEntries.map((e) => ({
        foodItem: e.foodItem,
        quantityG: e.quantityG,
        quantity: e.quantity,
        points: e.points,
      })),
    };
    saveTemplate(template);
    setTemplates(getTemplates());
    navigator.vibrate?.(10);
  };

  const handleLoadTemplate = async (template: MealTemplate) => {
    for (const item of template.items) {
      await addEntry({
        foodItem: item.foodItem,
        mealType: template.mealType,
        quantityG: item.quantityG,
        quantity: item.quantity,
        points: item.points,
      });
    }
    setShowTemplates(false);
    navigator.vibrate?.(10);
  };

  const handleDeleteTemplate = (index: number) => {
    deleteTemplate(index);
    setTemplates(getTemplates());
  };

  const toggleWeekReport = () => {
    setWeekReportExpanded((prev) => !prev);
  };

  const handleDismissStreakMilestone = (milestone: number) => {
    localStorage.setItem(`bb_streak_milestone_${milestone}`, '1');
  };

  const handleCopyPreviousDay = async () => {
    const prev = new Date(selectedDate);
    prev.setDate(prev.getDate() - 1);
    const prevDate = format(prev, 'yyyy-MM-dd');
    const count = await copyDayEntries(prevDate, selectedDate);
    if (count > 0) {
      await loadEntries();
      navigator.vibrate?.(10);
    }
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

        {/* Week Report */}
        <Card>
          <div className="p-4 flex items-center justify-between">
            <button
              onClick={() => setWeekReportOffset((o) => o + 1)}
              className="w-8 h-8 rounded-full bg-ios-bg flex items-center justify-center border-none cursor-pointer active:bg-gray-200"
            >
              <ChevronLeft size={18} className="text-ios-text" />
            </button>
            <button
              onClick={toggleWeekReport}
              className="flex items-center gap-2 bg-transparent border-none cursor-pointer px-2"
            >
              <Trophy size={18} className="text-ios-blue" />
              <span className="text-[15px] font-semibold">
                {weekReport ? weekReport.weekLabel : 'Weekoverzicht'}
              </span>
              {weekReportExpanded
                ? <ChevronUp size={16} className="text-ios-secondary" />
                : <ChevronDown size={16} className="text-ios-secondary" />}
            </button>
            <button
              onClick={() => setWeekReportOffset((o) => Math.max(0, o - 1))}
              disabled={weekReportOffset === 0}
              className={`w-8 h-8 rounded-full bg-ios-bg flex items-center justify-center border-none cursor-pointer ${weekReportOffset === 0 ? 'opacity-30' : 'active:bg-gray-200'}`}
            >
              <ChevronRight size={18} className="text-ios-text" />
            </button>
          </div>
          {weekReportExpanded && weekReport && (
            <div className="px-4 pb-4 flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="text-[14px] text-ios-secondary">Punten</span>
                <span className="text-[14px] font-medium">
                  gem. {weekReport.avgPoints}/{weekReport.dailyBudget} pt
                  {weekReport.avgPoints <= weekReport.dailyBudget
                    ? <span className="text-primary ml-1">&#10003;</span>
                    : <span className="text-ios-destructive ml-1">&#10007;</span>}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[14px] text-ios-secondary">Binnen budget</span>
                <span className="text-[14px] font-medium">
                  {weekReport.daysWithinBudget} van {weekReport.totalDays} dagen
                  {weekReport.daysWithinBudget >= weekReport.totalDays - 1
                    ? <span className="text-primary ml-1">&#10003;</span>
                    : null}
                </span>
              </div>
              {weekReport.waterTotalDays > 0 && (
                <div className="flex items-center justify-between">
                  <span className="text-[14px] text-ios-secondary">Water</span>
                  <span className="text-[14px] font-medium">
                    {weekReport.waterDaysOnTarget} van {weekReport.waterTotalDays} dagen doel
                    {weekReport.waterDaysOnTarget >= weekReport.waterTotalDays - 1
                      ? <span className="text-blue-500 ml-1">&#10003;</span>
                      : null}
                  </span>
                </div>
              )}
              {weekReport.weightChange !== null && (
                <div className="flex items-center justify-between">
                  <span className="text-[14px] text-ios-secondary">Gewicht</span>
                  <span className={`text-[14px] font-medium flex items-center gap-1 ${weekReport.weightChange < 0 ? 'text-primary' : weekReport.weightChange > 0 ? 'text-ios-warning' : ''}`}>
                    {weekReport.weightChange < 0 ? <TrendingDown size={14} /> : weekReport.weightChange > 0 ? <TrendingUp size={14} /> : <Minus size={14} />}
                    {weekReport.weightChange > 0 ? '+' : ''}{weekReport.weightChange.toFixed(1)} kg
                  </span>
                </div>
              )}
              <div className="border-t border-ios-separator mt-1 pt-2 flex items-center justify-between">
                <span className="text-[14px] text-ios-secondary">Beste dag</span>
                <span className="text-[14px] font-medium">{weekReport.bestDay} ({weekReport.bestDayPoints} pt)</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[14px] text-ios-secondary">Weekpunten</span>
                <span className="text-[14px] font-medium">{weekReport.weeklyPointsUsed} van {weekReport.weeklyPointsBudget} gebruikt</span>
              </div>
            </div>
          )}
          {weekReportExpanded && !weekReport && (
            <div className="px-4 pb-4 text-center">
              <span className="text-[14px] text-ios-secondary">Geen data voor deze week</span>
            </div>
          )}
        </Card>

        {/* Points Ring + Streak */}
        <Card className="py-6 flex flex-col items-center gap-2">
          <PointsRing used={totalUsed} budget={profile.dailyPointsBudget} />
          {streak > 0 && (
            <div className="flex items-center gap-1.5 mt-1">
              <Flame size={16} className="text-orange-500" />
              <span className="text-[14px] font-medium text-ios-secondary">{streak} {streak === 1 ? 'dag' : 'dagen'} op rij</span>
            </div>
          )}
        </Card>

        {/* Streak milestone */}
        {(() => {
          const milestones = [7, 14, 30, 60, 100];
          const milestone = milestones.find(m => streak === m && !localStorage.getItem(`bb_streak_milestone_${m}`));
          if (!milestone) return null;
          const messages: Record<number, string> = {
            7: '1 week op rij binnen budget!',
            14: '2 weken op rij binnen budget!',
            30: '1 maand op rij! Ongelooflijk!',
            60: '2 maanden op rij! Wat een discipline!',
            100: '100 dagen! Je bent een kampioen!',
          };
          return (
            <Card className="bg-primary/10 border border-primary/20">
              <div className="px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-[16px]">&#127881;</span>
                  <span className="text-[14px] font-semibold text-primary">{messages[milestone]}</span>
                </div>
                <button
                  onClick={() => handleDismissStreakMilestone(milestone)}
                  className="w-6 h-6 rounded-full bg-transparent border-none cursor-pointer flex items-center justify-center"
                >
                  <X size={14} className="text-primary" />
                </button>
              </div>
            </Card>
          );
        })()}

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

        {/* Quick actions */}
        <div className="flex gap-2">
          {entries.length === 0 && (
            <button
              onClick={handleCopyPreviousDay}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-white rounded-xl border border-dashed border-ios-separator text-[13px] font-medium text-ios-secondary cursor-pointer active:bg-gray-50 transition-colors"
            >
              <Copy size={14} />
              Kopieer gisteren
            </button>
          )}
          {templates.length > 0 && (
            <button
              onClick={() => setShowTemplates(!showTemplates)}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-white rounded-xl border border-dashed border-ios-separator text-[13px] font-medium text-ios-blue cursor-pointer active:bg-gray-50 transition-colors"
            >
              <Bookmark size={14} />
              Templates ({templates.length})
            </button>
          )}
        </div>

        {/* Template list */}
        {showTemplates && (
          <Card>
            <div className="px-4 py-2.5 border-b border-ios-separator">
              <span className="text-[13px] font-semibold text-ios-secondary uppercase tracking-wide">Maaltijd templates</span>
            </div>
            {templates.map((t, i) => (
              <div key={i} className={`flex items-center justify-between px-4 py-2.5 ${i < templates.length - 1 ? 'border-b border-ios-separator' : ''}`}>
                <button
                  onClick={() => handleLoadTemplate(t)}
                  className="flex-1 text-left bg-transparent border-none cursor-pointer p-0"
                >
                  <div className="text-[15px] font-medium">{t.name}</div>
                  <div className="text-[12px] text-ios-secondary">
                    {t.items.length} items &middot; {t.items.reduce((s, item) => s + item.points, 0)} pt
                  </div>
                </button>
                <button
                  onClick={() => handleDeleteTemplate(i)}
                  className="text-[12px] text-ios-destructive bg-transparent border-none cursor-pointer px-2 py-1"
                >
                  Wis
                </button>
              </div>
            ))}
          </Card>
        )}

        {/* Meal sections */}
        {MEAL_TYPES.map((type) => (
          <MealSection
            key={type}
            mealType={type}
            entries={getEntriesByMealType(type)}
            totalPoints={getPointsByMealType(type)}
            onRemoveEntry={removeEntry}
            onEditEntry={setEditingEntry}
            onSaveTemplate={handleSaveTemplate}
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

      {/* Edit entry modal */}
      {editingEntry && (
        <EditEntryModal
          entry={editingEntry}
          onSave={(id, updates) => {
            updateEntry(id, updates);
            setEditingEntry(null);
            navigator.vibrate?.(10);
          }}
          onClose={() => setEditingEntry(null)}
        />
      )}
    </PageLayout>
  );
}
