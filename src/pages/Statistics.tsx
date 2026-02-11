import { useState, useEffect } from 'react';
import { PageLayout } from '../components/layout/PageLayout';
import { Card, CardHeader } from '../components/ui/Card';
import { useUserStore } from '../store/user-store';
import { db } from '../db/database';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip, ReferenceLine, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { format, startOfWeek, addDays, subWeeks } from 'date-fns';
import { nl } from 'date-fns/locale';
import type { MealEntry } from '../types/food';
import type { WeightEntry } from '../types/user';

export function Statistics() {
  const profile = useUserStore((s) => s.profile);
  const [weekData, setWeekData] = useState<{ dag: string; punten: number; budget: number }[]>([]);
  const [waterWeekData, setWaterWeekData] = useState<{ dag: string; water: number; doel: number }[]>([]);
  const [mealDistribution, setMealDistribution] = useState<{ name: string; value: number }[]>([]);
  const [weightData, setWeightData] = useState<{ date: string; gewicht: number }[]>([]);
  const [weekOffset, setWeekOffset] = useState(0);

  useEffect(() => {
    if (profile) loadData();
  }, [profile, weekOffset]);

  const loadData = async () => {
    if (!profile) return;

    // Week data
    const now = new Date();
    const targetWeek = subWeeks(now, weekOffset);
    const monday = startOfWeek(targetWeek, { weekStartsOn: 1 });
    const days: { dag: string; punten: number; budget: number }[] = [];
    const waterDays: { dag: string; water: number; doel: number }[] = [];
    const waterGoal = profile.waterGoalMl || 2000;

    for (let i = 0; i < 7; i++) {
      const d = addDays(monday, i);
      const dateStr = format(d, 'yyyy-MM-dd');
      const log = await db.dailyLogs.where('date').equals(dateStr).first();
      days.push({
        dag: format(d, 'EEE', { locale: nl }),
        punten: log?.totalPointsUsed ?? 0,
        budget: profile.dailyPointsBudget,
      });
      waterDays.push({
        dag: format(d, 'EEE', { locale: nl }),
        water: log?.waterMl ?? 0,
        doel: waterGoal,
      });
    }
    setWeekData(days);
    setWaterWeekData(waterDays);

    // Maaltijd verdeling (deze week)
    const mealTotals: Record<string, number> = { Ontbijt: 0, Lunch: 0, Diner: 0, Snacks: 0 };
    const mealTypeMap: Record<string, string> = { breakfast: 'Ontbijt', lunch: 'Lunch', dinner: 'Diner', snack: 'Snacks' };

    for (let i = 0; i < 7; i++) {
      const d = addDays(monday, i);
      const dateStr = format(d, 'yyyy-MM-dd');
      const log = await db.dailyLogs.where('date').equals(dateStr).first();
      if (log?.id) {
        const entries: MealEntry[] = await db.mealEntries.where('dailyLogId').equals(log.id).toArray();
        for (const entry of entries) {
          const label = mealTypeMap[entry.mealType] || 'Snacks';
          mealTotals[label] += entry.points;
        }
      }
    }
    setMealDistribution(
      Object.entries(mealTotals)
        .filter(([, v]) => v > 0)
        .map(([name, value]) => ({ name, value }))
    );

    // Gewicht trend (laatste 30 entries)
    const weights: WeightEntry[] = await db.weightEntries.orderBy('date').reverse().limit(30).toArray();
    setWeightData(
      weights.reverse().map((w) => ({
        date: format(new Date(w.date), 'd MMM', { locale: nl }),
        gewicht: w.weightKg,
      }))
    );
  };

  if (!profile) return null;

  const weekLabel = (() => {
    const targetWeek = subWeeks(new Date(), weekOffset);
    const monday = startOfWeek(targetWeek, { weekStartsOn: 1 });
    const sunday = addDays(monday, 6);
    return `${format(monday, 'd MMM', { locale: nl })} - ${format(sunday, 'd MMM', { locale: nl })}`;
  })();

  const totalWeekPoints = weekData.reduce((s, d) => s + d.punten, 0);
  const avgPoints = weekData.filter((d) => d.punten > 0).length > 0
    ? Math.round(totalWeekPoints / weekData.filter((d) => d.punten > 0).length)
    : 0;

  const COLORS = ['#FF9500', '#34C759', '#007AFF', '#FF3B30'];

  return (
    <PageLayout title="Statistieken">
      <div className="flex flex-col gap-4 pb-4">
        {/* Week navigator */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => setWeekOffset((o) => o + 1)}
            className="px-3 py-1.5 rounded-lg bg-white text-[13px] font-medium border-none cursor-pointer shadow-sm active:bg-gray-100"
          >
            &larr; Vorige
          </button>
          <span className="text-[15px] font-semibold">{weekLabel}</span>
          <button
            onClick={() => setWeekOffset((o) => Math.max(0, o - 1))}
            disabled={weekOffset === 0}
            className={`px-3 py-1.5 rounded-lg bg-white text-[13px] font-medium border-none cursor-pointer shadow-sm ${weekOffset === 0 ? 'opacity-30' : 'active:bg-gray-100'}`}
          >
            Volgende &rarr;
          </button>
        </div>

        {/* Week overview */}
        <Card>
          <CardHeader title="Punten per dag" />
          <div className="px-2 pb-4">
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={weekData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E5EA" />
                <XAxis dataKey="dag" tick={{ fontSize: 12, fill: '#8E8E93' }} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#8E8E93' }} tickLine={false} />
                <Tooltip />
                <ReferenceLine y={profile.dailyPointsBudget} stroke="#FF3B30" strokeDasharray="5 5" label={{ value: 'Budget', fontSize: 11, fill: '#FF3B30' }} />
                <Bar dataKey="punten" fill="#34C759" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Week summary */}
        <div className="grid grid-cols-2 gap-3">
          <Card className="p-3 text-center">
            <div className="text-[22px] font-bold text-primary">{totalWeekPoints}</div>
            <div className="text-[12px] text-ios-secondary">Totaal deze week</div>
          </Card>
          <Card className="p-3 text-center">
            <div className="text-[22px] font-bold text-ios-blue">{avgPoints}</div>
            <div className="text-[12px] text-ios-secondary">Gemiddeld per dag</div>
          </Card>
        </div>

        {/* Water per dag */}
        <Card>
          <CardHeader title="Water per dag" />
          <div className="px-2 pb-4">
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={waterWeekData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E5EA" />
                <XAxis dataKey="dag" tick={{ fontSize: 12, fill: '#8E8E93' }} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#8E8E93' }} tickLine={false} tickFormatter={(v) => `${v / 1000}L`} />
                <Tooltip formatter={(value) => [`${value} ml`, 'Water']} />
                <ReferenceLine y={profile.waterGoalMl || 2000} stroke="#3B82F6" strokeDasharray="5 5" label={{ value: 'Doel', fontSize: 11, fill: '#3B82F6' }} />
                <Bar dataKey="water" fill="#3B82F6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Meal distribution */}
        {mealDistribution.length > 0 && (
          <Card>
            <CardHeader title="Verdeling per maaltijd" />
            <div className="flex items-center px-4 pb-4">
              <div className="w-32 h-32">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={mealDistribution} dataKey="value" cx="50%" cy="50%" outerRadius={55} innerRadius={30}>
                      {mealDistribution.map((_, i) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex-1 flex flex-col gap-2 ml-4">
                {mealDistribution.map((item, i) => (
                  <div key={item.name} className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                    <span className="text-[13px] flex-1">{item.name}</span>
                    <span className="text-[13px] font-medium">{item.value} pt</span>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        )}

        {/* Weight trend */}
        {weightData.length > 1 && (
          <Card>
            <CardHeader title="Gewichtstrend" />
            <div className="p-4">
              <ResponsiveContainer width="100%" height={180}>
                <LineChart data={weightData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E5EA" />
                  <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#8E8E93' }} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#8E8E93' }} tickLine={false} domain={['dataMin - 1', 'dataMax + 1']} />
                  <Tooltip />
                  <Line type="monotone" dataKey="gewicht" stroke="#007AFF" strokeWidth={2.5} dot={{ fill: '#007AFF', r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Card>
        )}
      </div>
    </PageLayout>
  );
}
