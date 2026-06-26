import { AlertTriangle, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Toast as ToastData } from '@/hooks/useToast';

export default function Toast({ toast }: { toast: ToastData | null }) {
  if (!toast) return null;
  return (
    <div
      className={cn(
        'fixed bottom-6 left-1/2 -translate-x-1/2 z-[9999]',
        'flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-medium shadow-lg',
        'animate-in fade-in slide-in-from-bottom-2 duration-200',
        toast.ok ? 'bg-green-500 text-white' : 'bg-danger text-white',
      )}
    >
      {toast.ok ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
      {toast.msg}
    </div>
  );
}
