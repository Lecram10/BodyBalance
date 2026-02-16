import { useEffect, useState, useRef } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useUserStore } from './store/user-store';
import { useAuthStore } from './store/auth-store';
import { pullAll, pushAll } from './lib/firestore-sync';
import { BottomNav } from './components/layout/BottomNav';
import { Login } from './pages/Login';
import { Onboarding } from './pages/Onboarding';
import { Dashboard } from './pages/Dashboard';
import { Search } from './pages/Search';
import { Scan } from './pages/Scan';
import { Statistics } from './pages/Statistics';
import { AIChat } from './pages/AIChat';
import { Profile } from './pages/Profile';
import { WifiOff, RefreshCw } from 'lucide-react';
import { useRegisterSW } from 'virtual:pwa-register/react';

function AppContent() {
  const { user, isAuthLoading } = useAuthStore();
  const { profile, isLoading, loadProfile } = useUserStore();
  const syncDone = useRef(false);

  useEffect(() => {
    if (!user) {
      syncDone.current = false;
      return;
    }

    // Bij login: profiel direct laden, sync op achtergrond
    const doSync = async () => {
      // Laad profiel eerst → UI toont meteen
      await loadProfile();

      if (!syncDone.current) {
        syncDone.current = true;
        // Sync op achtergrond (niet blokkerend)
        try {
          const hasRemoteData = await pullAll(user.uid);
          if (hasRemoteData) {
            // Remote data gemerged → profiel opnieuw laden
            await loadProfile();
          } else {
            // Geen remote data → push lokale data naar Firestore
            pushAll(user.uid).catch((err) =>
              console.warn('[Sync] Push all failed:', err)
            );
          }
        } catch (err) {
          console.warn('[Sync] Initial sync failed:', err);
        }
      }
    };

    doSync();
  }, [user, loadProfile]);

  // Wacht op auth state
  if (isAuthLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="w-12 h-12 rounded-full border-4 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  // Niet ingelogd → login scherm
  if (!user) {
    return <Login />;
  }

  // Profiel laden
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="w-12 h-12 rounded-full border-4 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  // Geen profiel → onboarding
  if (!profile?.onboardingComplete) {
    return <Onboarding />;
  }

  return (
    <>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/search" element={<Search />} />
        <Route path="/scan" element={<Scan />} />
        <Route path="/statistics" element={<Statistics />} />
        <Route path="/ai-chat" element={<AIChat />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <BottomNav />
    </>
  );
}

function OfflineBanner() {
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  useEffect(() => {
    const goOffline = () => setIsOffline(true);
    const goOnline = () => setIsOffline(false);
    window.addEventListener('offline', goOffline);
    window.addEventListener('online', goOnline);
    return () => {
      window.removeEventListener('offline', goOffline);
      window.removeEventListener('online', goOnline);
    };
  }, []);

  if (!isOffline) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[100] bg-ios-warning text-white text-center py-1.5 text-[13px] font-medium flex items-center justify-center gap-1.5" style={{ paddingTop: 'calc(6px + var(--safe-area-top))' }}>
      <WifiOff size={14} />
      Geen internetverbinding — zoeken werkt offline niet
    </div>
  );
}

function UpdatePrompt() {
  const {
    needRefresh: [needRefresh],
    updateServiceWorker,
  } = useRegisterSW();

  if (!needRefresh) return null;

  return (
    <div className="fixed bottom-[70px] left-4 right-4 z-[100] bg-ios-blue text-white rounded-2xl px-4 py-3 flex items-center justify-between shadow-lg animate-slide-up" style={{ marginBottom: 'var(--safe-area-bottom)' }}>
      <div className="flex items-center gap-2">
        <RefreshCw size={16} />
        <span className="text-[14px] font-medium">Update beschikbaar</span>
      </div>
      <button
        onClick={() => updateServiceWorker(true)}
        className="bg-white text-ios-blue px-3 py-1.5 rounded-lg text-[13px] font-semibold border-none cursor-pointer"
      >
        Bijwerken
      </button>
    </div>
  );
}

// Notification scheduler
const MEAL_TIMES = [
  { hour: 8, minute: 0, label: 'Tijd om je ontbijt te loggen!' },
  { hour: 12, minute: 30, label: 'Tijd om je lunch te loggen!' },
  { hour: 18, minute: 0, label: 'Tijd om je avondeten te loggen!' },
];
const WATER_HOURS = [8, 10, 12, 14, 16, 18, 20, 22];

function sendNotification(title: string, body: string) {
  if ('Notification' in window && Notification.permission === 'granted') {
    new Notification(title, { body, icon: '/icons/icon-192x192.png' });
  }
}

function useNotificationScheduler() {
  useEffect(() => {
    const check = () => {
      const now = new Date();
      const h = now.getHours();
      const m = now.getMinutes();
      const todayKey = `${now.getFullYear()}-${now.getMonth()}-${now.getDate()}`;

      // Meal reminders - fire if we're in the same hour and past the scheduled minute
      if (localStorage.getItem('bb_meal_reminder') === 'true') {
        for (const mt of MEAL_TIMES) {
          if (h === mt.hour && m >= mt.minute) {
            const sentKey = `bb_notif_meal_${mt.hour}_${todayKey}`;
            if (!localStorage.getItem(sentKey)) {
              sendNotification('BodyBalance', mt.label);
              localStorage.setItem(sentKey, '1');
            }
          }
        }
      }

      // Water reminders - fire anytime during the scheduled hour
      if (localStorage.getItem('bb_water_reminder') === 'true') {
        if (WATER_HOURS.includes(h)) {
          const sentKey = `bb_notif_water_${h}_${todayKey}`;
          if (!localStorage.getItem(sentKey)) {
            sendNotification('BodyBalance', 'Vergeet niet water te drinken!');
            localStorage.setItem(sentKey, '1');
          }
        }
      }

      // Cleanup old sent keys (keep only today)
      for (let i = localStorage.length - 1; i >= 0; i--) {
        const key = localStorage.key(i);
        if (key?.startsWith('bb_notif_') && !key.endsWith(todayKey)) {
          localStorage.removeItem(key);
        }
      }
    };

    check();
    const interval = setInterval(check, 60_000); // Check every minute
    return () => clearInterval(interval);
  }, []);
}

function applyTheme() {
  const stored = localStorage.getItem('bb_theme') || 'auto';
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const shouldBeDark = stored === 'dark' || (stored === 'auto' && prefersDark);
  document.documentElement.classList.toggle('dark', shouldBeDark);
}

function useThemeWatcher() {
  useEffect(() => {
    applyTheme();
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = () => applyTheme();
    mq.addEventListener('change', handler);
    // Also listen for storage changes (from Profile toggle)
    window.addEventListener('storage', handler);
    window.addEventListener('themechange', handler);
    return () => {
      mq.removeEventListener('change', handler);
      window.removeEventListener('storage', handler);
      window.removeEventListener('themechange', handler);
    };
  }, []);
}

function App() {
  useThemeWatcher();
  useNotificationScheduler();

  return (
    <BrowserRouter>
      <OfflineBanner />
      <UpdatePrompt />
      <AppContent />
    </BrowserRouter>
  );
}

export default App;
