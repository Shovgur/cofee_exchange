import { cn } from '@/lib/utils';
import type { ButtonHTMLAttributes, ReactNode } from 'react';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';
type Size = 'sm' | 'md' | 'lg';

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  fullWidth?: boolean;
  children: ReactNode;
}

const variantClasses: Record<Variant, string> = {
  primary: 'bg-orange text-white hover:bg-orange-dark active:scale-[0.97]',
  secondary: 'bg-surface-el text-white hover:bg-surface-ov active:scale-[0.97]',
  ghost: 'bg-transparent text-white hover:bg-white/5 active:scale-[0.97]',
  danger: 'bg-danger/10 text-danger hover:bg-danger/20 active:scale-[0.97]',
};

const sizeClasses: Record<Size, string> = {
  sm: 'h-9 px-4 text-sm rounded-xl',
  md: 'h-11 px-5 text-sm rounded-2xl',
  lg: 'h-14 px-6 text-base rounded-2xl',
};

export default function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  fullWidth = false,
  className,
  disabled,
  children,
  ...props
}: Props) {
  return (
    <button
      {...props}
      disabled={disabled || loading}
      className={cn(
        'inline-flex items-center justify-center gap-2 font-medium transition-all duration-150',
        'disabled:opacity-40 disabled:pointer-events-none',
        variantClasses[variant],
        sizeClasses[size],
        fullWidth && 'w-full',
        className,
      )}
    >
      {loading && (
        <span className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
      )}
      {children}
    </button>
  );
}
