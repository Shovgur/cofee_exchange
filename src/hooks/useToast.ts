import { useCallback, useState } from 'react';

export interface Toast {
  msg: string;
  ok: boolean;
}

export function useToast(durationMs = 3000) {
  const [toast, setToast] = useState<Toast | null>(null);

  const show = useCallback((msg: string, ok: boolean) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), durationMs);
  }, [durationMs]);

  return { toast, show };
}
