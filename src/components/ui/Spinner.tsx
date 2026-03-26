import { cn } from '@/lib/utils';

interface Props {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizeMap = { sm: 'h-5 w-5', md: 'h-8 w-8', lg: 'h-12 w-12' };

export default function Spinner({ size = 'md', className }: Props) {
  return (
    <span
      className={cn(
        'border-2 border-white/10 border-t-orange rounded-full animate-spin inline-block',
        sizeMap[size],
        className,
      )}
    />
  );
}
