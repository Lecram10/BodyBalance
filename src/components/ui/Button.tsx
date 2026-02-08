import type { ReactNode, ButtonHTMLAttributes } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'destructive' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  children: ReactNode;
  fullWidth?: boolean;
}

const VARIANTS = {
  primary: 'bg-primary text-white active:bg-primary-dark',
  secondary: 'bg-ios-bg text-primary active:bg-gray-200',
  destructive: 'bg-ios-destructive text-white active:bg-red-700',
  ghost: 'bg-transparent text-primary active:bg-gray-100',
};

const SIZES = {
  sm: 'px-4 py-2 text-[14px]',
  md: 'px-5 py-3 text-[17px]',
  lg: 'px-6 py-4 text-[17px]',
};

export function Button({
  variant = 'primary',
  size = 'md',
  children,
  fullWidth = false,
  className = '',
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      className={`
        rounded-xl font-semibold border-none cursor-pointer
        transition-all duration-150 select-none
        ${VARIANTS[variant]}
        ${SIZES[size]}
        ${fullWidth ? 'w-full' : ''}
        ${disabled ? 'opacity-40 pointer-events-none' : ''}
        ${className}
      `}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
}
