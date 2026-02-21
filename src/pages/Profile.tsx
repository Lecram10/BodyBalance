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
import { ACTIVITY_LABELS, GOAL_LABELS } from '../types/user';
import type { Gender, ActivityLevel, Goal } from '../types/user';
import { format } from 'date-fns';
import { Download, Upload, Bell, BellOff, Droplets, Key, Check, AlertCircle, Sun, Moon, Monitor, LogOut, Shield, TrendingDown, Trophy } from 'lucide-react';
import { useAuthStore } from '../store/auth-store';
import { pushWeight, pushAll } from '../lib/firestore-sync';
import { auth } from '../lib/firebase';
import { isAdmin } from './Admin';

export function Profile() {
  const navigate = useNavigate();
  const { profile, saveProfile, updateWeight } = useUserStore();
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

  // Weight feedback
  const [weightFeedback, setWeightFeedback] = useState<{ message: string; type: 'success' | 'info' } | null>(null);

  // Export/import
  const [exportStatus, setExportStatus] = useState<string | null>(null);
  const [importStatus, setImportStatus] = useState<string | null>(null);

  useEffect(() => {
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

    const result = await updateWeight(weight);
    setNewWeight('');

    // Toon feedback als budget veranderd is of doel bereikt
    if (result) {
      if (result.goalReached) {
        setWeightFeedback({
          message: `Gefeliciteerd! Je hebt je streefgewicht bereikt! Je budget is verhoogd naar ${result.newDailyBudget} punten per dag.`,
          type: 'success',
        });
        setTimeout(() => setWeightFeedback(null), 8000);
      } else if (result.newDailyBudget !== result.oldDailyBudget) {
        setWeightFeedback({
          message: `Je budget is aangepast naar ${result.newDailyBudget} punten per dag (was ${result.oldDailyBudget}).`,
          type: 'info',
        });
        setTimeout(() => setWeightFeedback(null), 6000);
      }
    }

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

        // Push geïmporteerde data naar Firestore (achtergrond)
        const uid = auth.currentUser?.uid;
        if (uid) {
          pushAll(uid).catch(() => {});
        }

        setImportStatus('Import gelukt! Pagina herlaadt...');
        setTimeout(() => window.location.reload(), 500);
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

  return (
    <PageLayout title="Profiel">
      <div className="flex flex-col gap-4 pb-4">
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

        {/* Weight feedback */}
        {weightFeedback && (
          <Card className={weightFeedback.type === 'success' ? 'bg-primary/10 border border-primary/20' : 'bg-ios-blue/10 border border-ios-blue/20'}>
            <div className="px-4 py-3 flex items-start gap-3">
              {weightFeedback.type === 'success' ? (
                <Trophy size={20} className="text-primary flex-shrink-0 mt-0.5" />
              ) : (
                <TrendingDown size={20} className="text-ios-blue flex-shrink-0 mt-0.5" />
              )}
              <p className={`text-[14px] font-medium ${weightFeedback.type === 'success' ? 'text-primary' : 'text-ios-blue'}`}>
                {weightFeedback.message}
              </p>
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

        {/* Admin (alleen voor admin) */}
        {isAdmin() && (
          <button
            onClick={() => navigate('/admin')}
            className="flex items-center gap-3 w-full p-4 bg-white dark:bg-ios-card rounded-2xl shadow-sm border-none cursor-pointer active:bg-gray-50 text-left"
          >
            <div className="w-10 h-10 rounded-full bg-ios-blue/10 flex items-center justify-center">
              <Shield size={20} className="text-ios-blue" />
            </div>
            <div className="flex-1">
              <div className="text-[15px] font-semibold">Admin Panel</div>
              <div className="text-[13px] text-ios-secondary">Invite codes en gebruikersbeheer</div>
            </div>
          </button>
        )}

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
