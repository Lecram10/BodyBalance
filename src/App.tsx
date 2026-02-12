import { useEffect, useState } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useUserStore } from './store/user-store';
import { BottomNav } from './components/layout/BottomNav';
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
  const { profile, isLoading, loadProfile } = useUserStore();

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="w-12 h-12 rounded-full border-4 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

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

  return (
    <HashRouter>
      <OfflineBanner />
      <UpdatePrompt />
      <AppContent />
    </HashRouter>
  );
}

export default App;
