import { useState, useEffect } from 'react';
import { useUserStore } from '../store/user-store';
import { PageLayout } from '../components/layout/PageLayout';
import { Card, CardHeader } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { InputField, SelectField } from '../components/ui/FormField';
import { calculateBudget } from '../lib/budget-calculator';
import { db } from '../db/database';
import type { WeightEntry } from '../types/user';
import { ACTIVITY_LABELS, GOAL_LABELS } from '../types/user';
import type { Gender, ActivityLevel, Goal } from '../types/user';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip } from 'recharts';
import { format } from 'date-fns';
import { nl } from 'date-fns/locale';
import { Scale, TrendingDown, Target } from 'lucide-react';

export function Profile() {
  const { profile, saveProfile, updateWeight } = useUserStore();
  const [weightEntries, setWeightEntries] = useState<WeightEntry[]>([]);
  const [newWeight, setNewWeight] = useState('');
  const [isEditing, setIsEditing] = useState(false);

  // Edit state
  const [editName, setEditName] = useState('');
  const [editGender, setEditGender] = useState<Gender>('male');
  const [editDob, setEditDob] = useState('');
  const [editHeight, setEditHeight] = useState(0);
  const [editGoalWeight, setEditGoalWeight] = useState(0);
  const [editActivity, setEditActivity] = useState<ActivityLevel>('light');
  const [editGoal, setEditGoal] = useState<Goal>('lose');

  useEffect(() => {
    loadWeightEntries();
  }, []);

  useEffect(() => {
    if (profile) {
      setEditName(profile.name);
      setEditGender(profile.gender);
      setEditDob(profile.dateOfBirth);
      setEditHeight(profile.heightCm);
      setEditGoalWeight(profile.goalWeightKg);
      setEditActivity(profile.activityLevel);
      setEditGoal(profile.goal);
    }
  }, [profile]);

  const loadWeightEntries = async () => {
    const entries = await db.weightEntries.orderBy('date').toArray();
    setWeightEntries(entries);
  };

  const handleLogWeight = async () => {
    const weight = parseFloat(newWeight);
    if (isNaN(weight) || weight < 30 || weight > 300) return;

    const today = format(new Date(), 'yyyy-MM-dd');

    // Update or add weight entry
    const existing = await db.weightEntries.where('date').equals(today).first();
    if (existing?.id) {
      await db.weightEntries.update(existing.id, { weightKg: weight });
    } else {
      await db.weightEntries.add({ date: today, weightKg: weight });
    }

    await updateWeight(weight);
    setNewWeight('');
    loadWeightEntries();
  };

  const handleSaveProfile = async () => {
    if (!profile) return;

    const budget = calculateBudget(
      profile.currentWeightKg,
      editHeight,
      editDob,
      editGender,
      editActivity,
      editGoal
    );

    await saveProfile({
      name: editName,
      gender: editGender,
      dateOfBirth: editDob,
      heightCm: editHeight,
      currentWeightKg: profile.currentWeightKg,
      goalWeightKg: editGoalWeight,
      activityLevel: editActivity,
      goal: editGoal,
      dailyPointsBudget: budget.dailyPoints,
      weeklyPointsBudget: budget.weeklyPoints,
      onboardingComplete: true,
    });

    setIsEditing(false);
  };

  if (!profile) return null;

  const weightDiff = profile.currentWeightKg - profile.goalWeightKg;
  const chartData = weightEntries.map((e) => ({
    date: format(new Date(e.date), 'd MMM', { locale: nl }),
    gewicht: e.weightKg,
  }));

  return (
    <PageLayout title="Profiel">
      <div className="flex flex-col gap-4 pb-4">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          <Card className="p-3 text-center">
            <Scale size={20} className="text-primary mx-auto mb-1" />
            <div className="text-[20px] font-bold">{profile.currentWeightKg}</div>
            <div className="text-[11px] text-ios-secondary">kg nu</div>
          </Card>
          <Card className="p-3 text-center">
            <Target size={20} className="text-ios-blue mx-auto mb-1" />
            <div className="text-[20px] font-bold">{profile.goalWeightKg}</div>
            <div className="text-[11px] text-ios-secondary">kg doel</div>
          </Card>
          <Card className="p-3 text-center">
            <TrendingDown size={20} className="text-ios-warning mx-auto mb-1" />
            <div className="text-[20px] font-bold">{weightDiff > 0 ? weightDiff.toFixed(1) : '0'}</div>
            <div className="text-[11px] text-ios-secondary">kg te gaan</div>
          </Card>
        </div>

        {/* Weight logger */}
        <Card>
          <CardHeader title="Gewicht loggen" />
          <div className="p-4 flex gap-3">
            <div className="relative flex-1">
              <input
                type="number"
                placeholder={String(profile.currentWeightKg)}
                value={newWeight}
                onChange={(e) => setNewWeight(e.target.value)}
                step="0.1"
                min="30"
                max="300"
                className="bg-ios-bg rounded-xl px-4 py-3 text-[17px] w-full"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-ios-secondary text-[15px]">
                kg
              </span>
            </div>
            <Button onClick={handleLogWeight} disabled={!newWeight}>
              Log
            </Button>
          </div>
        </Card>

        {/* Weight chart */}
        {chartData.length > 1 && (
          <Card>
            <CardHeader title="Gewichtsverloop" />
            <div className="p-4">
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E5EA" />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 11, fill: '#8E8E93' }}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: '#8E8E93' }}
                    tickLine={false}
                    domain={['dataMin - 1', 'dataMax + 1']}
                  />
                  <Tooltip />
                  <Line
                    type="monotone"
                    dataKey="gewicht"
                    stroke="#34C759"
                    strokeWidth={2.5}
                    dot={{ fill: '#34C759', r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Card>
        )}

        {/* Budget info */}
        <Card>
          <CardHeader title="Puntenbudget" />
          <div className="px-4 py-3 flex justify-between items-center border-b border-ios-separator">
            <span className="text-[15px]">Dagelijks budget</span>
            <span className="text-[17px] font-bold text-primary">{profile.dailyPointsBudget} pt</span>
          </div>
          <div className="px-4 py-3 flex justify-between items-center">
            <span className="text-[15px]">Weekpunten</span>
            <span className="text-[17px] font-bold text-ios-blue">{profile.weeklyPointsBudget} pt</span>
          </div>
        </Card>

        {/* Profile editor */}
        <Card>
          <CardHeader
            title="Gegevens"
            rightContent={
              <button
                onClick={() => setIsEditing(!isEditing)}
                className="text-[15px] text-primary font-medium border-none bg-transparent cursor-pointer"
              >
                {isEditing ? 'Annuleer' : 'Wijzig'}
              </button>
            }
          />

          {!isEditing ? (
            <div>
              {[
                ['Naam', profile.name],
                ['Geslacht', profile.gender === 'male' ? 'Man' : 'Vrouw'],
                ['Lengte', `${profile.heightCm} cm`],
                ['Activiteit', ACTIVITY_LABELS[profile.activityLevel]],
                ['Doel', GOAL_LABELS[profile.goal]],
              ].map(([label, value], i, arr) => (
                <div
                  key={label}
                  className={`px-4 py-3 flex justify-between ${
                    i < arr.length - 1 ? 'border-b border-ios-separator' : ''
                  }`}
                >
                  <span className="text-[15px] text-ios-secondary">{label}</span>
                  <span className="text-[15px]">{value}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-4 flex flex-col gap-3">
              <InputField label="Naam" value={editName} onChange={(e) => setEditName(e.currentTarget.value)} />
              <SelectField
                label="Geslacht"
                value={editGender}
                onChange={(e) => setEditGender(e.currentTarget.value as Gender)}
                options={[
                  { value: 'male', label: 'Man' },
                  { value: 'female', label: 'Vrouw' },
                ]}
              />
              <InputField
                label="Lengte"
                type="number"
                suffix="cm"
                value={editHeight}
                onChange={(e) => setEditHeight(Number(e.currentTarget.value))}
              />
              <InputField
                label="Streefgewicht"
                type="number"
                suffix="kg"
                value={editGoalWeight}
                onChange={(e) => setEditGoalWeight(Number(e.currentTarget.value))}
              />
              <SelectField
                label="Activiteitsniveau"
                value={editActivity}
                onChange={(e) => setEditActivity(e.currentTarget.value as ActivityLevel)}
                options={Object.entries(ACTIVITY_LABELS).map(([v, l]) => ({ value: v, label: l }))}
              />
              <SelectField
                label="Doel"
                value={editGoal}
                onChange={(e) => setEditGoal(e.currentTarget.value as Goal)}
                options={Object.entries(GOAL_LABELS).map(([v, l]) => ({ value: v, label: l }))}
              />
              <Button fullWidth onClick={handleSaveProfile} className="mt-2">
                Opslaan
              </Button>
            </div>
          )}
        </Card>
      </div>
    </PageLayout>
  );
}
