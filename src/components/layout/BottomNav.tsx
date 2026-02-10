import { useLocation, useNavigate } from 'react-router-dom';
import { Home, Search, ScanBarcode, BarChart3, User } from 'lucide-react';

const NAV_ITEMS = [
  { path: '/', icon: Home, label: 'Home' },
  { path: '/search', icon: Search, label: 'Zoeken' },
  { path: '/scan', icon: ScanBarcode, label: 'Scan' },
  { path: '/statistics', icon: BarChart3, label: 'Stats' },
  { path: '/profile', icon: User, label: 'Profiel' },
] as const;

export function BottomNav() {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-xl border-t border-ios-separator z-50"
      style={{ paddingBottom: 'var(--safe-area-bottom)' }}
    >
      <div className="flex justify-around items-center h-[50px] max-w-lg mx-auto">
        {NAV_ITEMS.map(({ path, icon: Icon, label }) => {
          const isActive = location.pathname === path;
          return (
            <button
              key={path}
              onClick={() => navigate(path)}
              className={`flex flex-col items-center justify-center gap-0.5 w-full h-full border-none bg-transparent cursor-pointer transition-colors ${
                isActive ? 'text-primary' : 'text-ios-secondary'
              }`}
            >
              <Icon size={24} strokeWidth={isActive ? 2.2 : 1.5} />
              <span className="text-[10px] font-medium">{label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
