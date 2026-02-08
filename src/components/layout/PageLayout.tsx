import type { ReactNode } from 'react';

interface PageLayoutProps {
  title: string;
  children: ReactNode;
  rightAction?: ReactNode;
  noPadding?: boolean;
}

export function PageLayout({ title, children, rightAction, noPadding }: PageLayoutProps) {
  return (
    <div className="flex flex-col h-full">
      {/* iOS-style header */}
      <header
        className="bg-white/80 backdrop-blur-xl border-b border-ios-separator flex-shrink-0"
        style={{ paddingTop: 'var(--safe-area-top)' }}
      >
        <div className="flex items-center justify-between px-4 h-[44px]">
          <h1 className="text-[17px] font-semibold text-ios-text">{title}</h1>
          {rightAction && <div>{rightAction}</div>}
        </div>
      </header>

      {/* Scrollable content */}
      <main
        className={`flex-1 overflow-y-auto overscroll-contain ${noPadding ? '' : 'px-4 py-4'}`}
        style={{ paddingBottom: 'calc(60px + var(--safe-area-bottom))' }}
      >
        {children}
      </main>
    </div>
  );
}
