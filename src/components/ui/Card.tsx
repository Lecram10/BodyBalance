import type { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
}

export function Card({ children, className = '', onClick }: CardProps) {
  return (
    <div
      className={`bg-white rounded-2xl shadow-sm ${onClick ? 'active:bg-gray-50 cursor-pointer transition-colors' : ''} ${className}`}
      onClick={onClick}
    >
      {children}
    </div>
  );
}

interface CardHeaderProps {
  title: string;
  rightContent?: ReactNode;
}

export function CardHeader({ title, rightContent }: CardHeaderProps) {
  return (
    <div className="flex items-center justify-between px-4 py-3 border-b border-ios-separator">
      <h3 className="text-[15px] font-semibold text-ios-secondary uppercase tracking-wide">
        {title}
      </h3>
      {rightContent}
    </div>
  );
}
