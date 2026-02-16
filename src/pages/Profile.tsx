import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUserStore } from '../store/user-store';
import { PageLayout } from '../components/layout/PageLayout';
import { Card, CardHeader } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { InputField, SelectField } from '../components/ui/FormField';
import { calculateBudget } from '../lib/budget-calculator';
import { db } from '../db/database';
import { getAISettings, saveAISettings } from '../lib/ai-service';
import type { WeightEntry } from '../types/user';
import { ACTIVITY_LABELS, GOAL_LABELS } from '../types/user';
import type { Gender, ActivityLevel, Goal } from '../types/user';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip } from 'recharts';
import { format } from 'date-fns';
import { nl } from 'date-fns/locale';
import { Scale, TrendingDown, Target, Download, Upload, Bell, BellOff, Droplets, Key, Bot, Check, AlertCircle, Sun, Moon, Monitor, LogOut } from 'lucide-react';
import { useAuthStore } from '../store/auth-store';
import { pushWeight, pushAll } from '../lib/firestore-sync';
import { auth } from '../lib/firebase';

export function Profile() {
  const navigate = useNavigate();
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

  // AI settings
  const [apiKey, setApiKey] = useState('');
  const [apiUrl, setApiUrl] = useState('');
  const [aiSaved, setAiSaved] = useState(false);

  // Notifications (separate toggles, persisted in localStorage)
  const [mealReminder, setMealReminder] = useState(() => localStorage.getItem('bb_meal_reminder') === 'true');
  const [waterReminder, setWaterReminder] = useState(() => localStorage.getItem('bb_water_reminder') === 'true');
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>('default');

  // Theme
  const [theme, setTheme] = useState<'auto' | 'light' | 'dark'>(() => {
    return (localStorage.getItem('bb_theme') as 'auto' | 'light' | 'dark') || 'auto';
  });

  // Export/import
  const [exportStatus, setExportStatus] = useState<string | null>(null);
  const [importStatus, setImportStatus] = useState<string | null>(null);

  useEffect(() => {
    loadWeightEntries();
    loadAISettings();
    checkNotificationPermission();
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

    // Sync naar Firestore
    const uid = useAuthStore.getState().user?.uid;
    if (uid) pushWeight(uid, { date: today, weightKg: weight }).catch(() => {});
  };

  const loadAISettings = async () => {
    const settings = await getAISettings();
    if (settings) {
      setApiKey(settings.apiKey);
      setApiUrl(settings.apiUrl || '');
    }
  };

  const handleSaveAI = async () => {
    await saveAISettings(apiKey, apiUrl || undefined);
    setAiSaved(true);
    setTimeout(() => setAiSaved(false), 2000);
  };

  const checkNotificationPermission = () => {
    if ('Notification' in window) {
      setNotificationPermission(Notification.permission);
    }
  };

  const requestNotificationPermission = async (): Promise<boolean> => {
    if (!('Notification' in window)) return false;

    if (Notification.permission === 'granted') return true;

    if (Notification.permission === 'default') {
      const perm = await Notification.requestPermission();
      setNotificationPermission(perm);
      if (perm === 'granted') {
        new Notification('BodyBalance', {
          body: 'Notificaties zijn ingeschakeld!',
          icon: '/icons/icon-192.png',
        });
        return true;
      }
    }
    return false;
  };

  const handleToggleMealReminder = async () => {
    if (mealReminder) {
      setMealReminder(false);
      localStorage.setItem('bb_meal_reminder', 'false');
      return;
    }
    const granted = await requestNotificationPermission();
    if (granted) {
      setMealReminder(true);
      localStorage.setItem('bb_meal_reminder', 'true');
    }
  };

  const handleToggleWaterReminder = async () => {
    if (waterReminder) {
      setWaterReminder(false);
      localStorage.setItem('bb_water_reminder', 'false');
      return;
    }
    const granted = await requestNotificationPermission();
    if (granted) {
      setWaterReminder(true);
      localStorage.setItem('bb_water_reminder', 'true');
    }
  };

  const handleThemeChange = (newTheme: 'auto' | 'light' | 'dark') => {
    setTheme(newTheme);
    localStorage.setItem('bb_theme', newTheme);
    window.dispatchEvent(new Event('themechange'));
  };

  const handleExportData = async () => {
    try {
      setExportStatus('Exporteren...');
      const data = {
        version: 2,
        exportDate: new Date().toISOString(),
        userProfiles: (await db.userProfiles.toArray()).map((p) => {
          const { ...profile } = p as unknown as Record<string, unknown>;
          delete profile.anthropicApiKey;
          delete profile.anthropicApiUrl;
          return profile;
        }),
        foodItems: await db.foodItems.toArray(),
        mealEntries: await db.mealEntries.toArray(),
        dailyLogs: await db.dailyLogs.toArray(),
        weightEntries: await db.weightEntries.toArray(),
      };
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `bodybalance-backup-${format(new Date(), 'yyyy-MM-dd')}.json`;
      a.click();
      URL.revokeObjectURL(url);
      setExportStatus('Export gelukt!');
      setTimeout(() => setExportStatus(null), 3000);
    } catch {
      setExportStatus('Export mislukt');
      setTimeout(() => setExportStatus(null), 3000);
    }
  };

  const handleImportData = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      try {
        setImportStatus('Importeren...');
        const text = await file.text();
        const data = JSON.parse(text);

        if (!data.version || !data.userProfiles) {
          setImportStatus('Ongeldig bestand');
          setTimeout(() => setImportStatus(null), 3000);
          return;
        }

        // Wis bestaande data en importeer
        await db.transaction('rw', [db.userProfiles, db.foodItems, db.mealEntries, db.dailyLogs, db.weightEntries], async () => {
          await db.foodItems.clear();
          await db.mealEntries.clear();
          await db.dailyLogs.clear();
          await db.weightEntries.clear();
          await db.userProfiles.clear();

          if (data.userProfiles?.length) await db.userProfiles.bulkAdd(data.userProfiles);
          if (data.foodItems?.length) await db.foodItems.bulkAdd(data.foodItems);
          if (data.mealEntries?.length) await db.mealEntries.bulkAdd(data.mealEntries);
          if (data.dailyLogs?.length) await db.dailyLogs.bulkAdd(data.dailyLogs);
          if (data.weightEntries?.length) await db.weightEntries.bulkAdd(data.weightEntries);
        });

        // Push geïmporteerde data naar Firestore
        const uid = auth.currentUser?.uid;
        if (uid) {
          setImportStatus('Import gelukt! Synchroniseren...');
          await pushAll(uid);
        }

        setImportStatus('Import gelukt! Pagina herlaadt...');
        setTimeout(() => window.location.reload(), 1500);
      } catch {
        setImportStatus('Import mislukt - ongeldig bestand');
        setTimeout(() => setImportStatus(null), 3000);
      }
    };
    input.click();
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

        {/* AI Chat link */}
        <button
          onClick={() => navigate('/ai-chat')}
          className="flex items-center gap-3 w-full p-4 bg-white rounded-2xl shadow-sm border-none cursor-pointer active:bg-gray-50 text-left"
        >
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
            <Bot size={20} className="text-primary" />
          </div>
          <div className="flex-1">
            <div className="text-[15px] font-semibold">AI Voedingsassistent</div>
            <div className="text-[13px] text-ios-secondary">Stel vragen over punten en voeding</div>
          </div>
        </button>

        {/* AI Instellingen */}
        <Card>
          <CardHeader title="AI Instellingen" />
          <div className="p-4 flex flex-col gap-3">
            <div>
              <label className="text-[13px] font-medium text-ios-secondary uppercase tracking-wide block mb-1 px-1">
                Anthropic API-sleutel
              </label>
              <div className="relative">
                <Key size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ios-secondary" />
                <input
                  type="password"
                  placeholder="sk-ant-..."
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  className="bg-ios-bg rounded-xl pl-9 pr-4 py-3 text-[15px] w-full"
                />
              </div>
            </div>
            <div>
              <label className="text-[13px] font-medium text-ios-secondary uppercase tracking-wide block mb-1 px-1">
                API URL (optioneel)
              </label>
              <input
                type="url"
                placeholder="https://api.anthropic.com/v1/messages"
                value={apiUrl}
                onChange={(e) => setApiUrl(e.target.value)}
                className="bg-ios-bg rounded-xl px-4 py-3 text-[15px] w-full"
              />
            </div>
            <Button fullWidth onClick={handleSaveAI} disabled={!apiKey.trim()}>
              {aiSaved ? (
                <span className="flex items-center justify-center gap-2">
                  <Check size={16} /> Opgeslagen
                </span>
              ) : (
                'Opslaan'
              )}
            </Button>
            <p className="text-[12px] text-ios-secondary text-center">
              Nodig voor AI foto-herkenning en de voedingsassistent
            </p>
          </div>
        </Card>

        {/* Waterdoel */}
        <Card>
          <CardHeader title="Waterdoel" />
          <div className="px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Droplets size={20} className="text-blue-500" />
              <span className="text-[15px]">Dagelijks doel</span>
            </div>
            <div className="flex items-center gap-2">
              {[1500, 2000, 2500, 3000].map((ml) => (
                <button
                  key={ml}
                  onClick={async () => {
                    if (!profile?.id) return;
                    await db.userProfiles.update(profile.id, { waterGoalMl: ml, updatedAt: new Date() });
                    useUserStore.setState({ profile: { ...profile, waterGoalMl: ml } });
                  }}
                  className={`px-2.5 py-1 rounded-lg text-[13px] font-medium border-none cursor-pointer transition-colors ${
                    (profile?.waterGoalMl || 2000) === ml
                      ? 'bg-blue-500 text-white'
                      : 'bg-ios-bg text-ios-text active:bg-gray-200'
                  }`}
                >
                  {ml / 1000}L
                </button>
              ))}
            </div>
          </div>
        </Card>

        {/* Weergave */}
        <Card>
          <CardHeader title="Weergave" />
          <div className="px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              {theme === 'dark' ? (
                <Moon size={20} className="text-ios-blue" />
              ) : theme === 'light' ? (
                <Sun size={20} className="text-ios-warning" />
              ) : (
                <Monitor size={20} className="text-ios-secondary" />
              )}
              <span className="text-[15px]">Thema</span>
            </div>
            <div className="flex items-center gap-1">
              {([
                { key: 'auto', label: 'Auto' },
                { key: 'light', label: 'Licht' },
                { key: 'dark', label: 'Donker' },
              ] as const).map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => handleThemeChange(key)}
                  className={`px-3 py-1 rounded-lg text-[13px] font-medium border-none cursor-pointer transition-colors ${
                    theme === key
                      ? 'bg-ios-blue text-white'
                      : 'bg-ios-bg text-ios-text active:bg-gray-200'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </Card>

        {/* Notificaties */}
        <Card>
          <CardHeader title="Notificaties" />
          {/* Maaltijd herinnering */}
          <div className="px-4 py-3 flex items-center justify-between border-b border-ios-separator">
            <div className="flex items-center gap-3">
              {mealReminder ? (
                <Bell size={20} className="text-primary" />
              ) : (
                <BellOff size={20} className="text-ios-secondary" />
              )}
              <span className="text-[15px]">Maaltijd herinnering</span>
            </div>
            <button
              onClick={handleToggleMealReminder}
              className={`relative w-[51px] h-[31px] rounded-full border-none cursor-pointer transition-colors ${
                mealReminder ? 'bg-primary' : 'bg-ios-separator'
              }`}
            >
              <div
                className={`absolute top-0.5 w-[27px] h-[27px] rounded-full bg-white shadow-sm transition-transform ${
                  mealReminder ? 'translate-x-[22px]' : 'translate-x-0.5'
                }`}
              />
            </button>
          </div>
          {/* Water herinnering */}
          <div className="px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              {waterReminder ? (
                <Droplets size={20} className="text-blue-500" />
              ) : (
                <Droplets size={20} className="text-ios-secondary" />
              )}
              <span className="text-[15px]">Water herinnering</span>
            </div>
            <button
              onClick={handleToggleWaterReminder}
              className={`relative w-[51px] h-[31px] rounded-full border-none cursor-pointer transition-colors ${
                waterReminder ? 'bg-blue-500' : 'bg-ios-separator'
              }`}
            >
              <div
                className={`absolute top-0.5 w-[27px] h-[27px] rounded-full bg-white shadow-sm transition-transform ${
                  waterReminder ? 'translate-x-[22px]' : 'translate-x-0.5'
                }`}
              />
            </button>
          </div>
          {notificationPermission === 'denied' && (
            <div className="px-4 pb-3 flex items-start gap-2">
              <AlertCircle size={14} className="text-ios-destructive flex-shrink-0 mt-0.5" />
              <p className="text-[12px] text-ios-destructive">
                Notificaties zijn geblokkeerd. Ga naar je browserinstellingen om dit te wijzigen.
              </p>
            </div>
          )}
        </Card>

        {/* Data beheer */}
        <Card>
          <CardHeader title="Data beheer" />
          <div className="p-4 flex flex-col gap-3">
            <button
              onClick={handleExportData}
              className="flex items-center justify-center gap-2 py-3 bg-ios-bg rounded-xl text-[15px] font-medium text-ios-text border-none cursor-pointer active:bg-gray-200 transition-colors"
            >
              <Download size={18} />
              Data exporteren (JSON)
            </button>
            <button
              onClick={handleImportData}
              className="flex items-center justify-center gap-2 py-3 bg-ios-bg rounded-xl text-[15px] font-medium text-ios-text border-none cursor-pointer active:bg-gray-200 transition-colors"
            >
              <Upload size={18} />
              Data importeren
            </button>
            {(exportStatus || importStatus) && (
              <p className="text-[13px] text-center text-ios-secondary">
                {exportStatus || importStatus}
              </p>
            )}
            <p className="text-[12px] text-ios-secondary text-center">
              Maak een backup van al je data of herstel van een eerdere backup
            </p>
          </div>
        </Card>

        {/* Uitloggen */}
        <Button
          variant="ghost"
          fullWidth
          onClick={() => useAuthStore.getState().logout()}
          className="flex items-center justify-center gap-2 text-ios-destructive"
        >
          <LogOut size={18} />
          Uitloggen
        </Button>
      </div>
    </PageLayout>
  );
}
