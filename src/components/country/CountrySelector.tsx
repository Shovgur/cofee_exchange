'use client';

import Modal from '@/components/ui/Modal';
import { useCountry } from '@/contexts/CountryContext';
import { Check } from 'lucide-react';

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function CountrySelector({ open, onClose }: Props) {
  const { country, countries, setCountry } = useCountry();

  return (
    <Modal open={open} onClose={onClose} title="Выберите страну">
      <div className="space-y-2">
        {countries.map((c) => (
          <button
            key={c.id}
            onClick={() => {
              setCountry(c.id);
              onClose();
            }}
            className="w-full flex items-center justify-between p-4 rounded-xl bg-surface-el hover:bg-surface-ov transition-colors"
          >
            <div className="flex items-center gap-3">
              <span className="text-2xl">{c.flag}</span>
              <div className="text-left">
                <div className="font-medium">{c.name}</div>
                <div className="text-xs text-muted">{c.currency}</div>
              </div>
            </div>
            {country.id === c.id && (
              <Check size={18} className="text-orange" />
            )}
          </button>
        ))}
      </div>
    </Modal>
  );
}
