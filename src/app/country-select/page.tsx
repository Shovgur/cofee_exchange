'use client';

import { useRouter } from 'next/navigation';
import { Globe } from 'lucide-react';
import { useCountry } from '@/contexts/CountryContext';
import Button from '@/components/ui/Button';

export default function CountrySelectPage() {
  const router = useRouter();
  const { countries, setCountry } = useCountry();

  function handleSelect(countryId: string) {
    setCountry(countryId);
    router.replace('/feed');
  }

  return (
    <div className="flex flex-col min-h-lvh bg-bg max-w-lg mx-auto px-6 pt-[calc(env(safe-area-inset-top,0px)+1.5rem)] pb-[calc(1.5rem+env(safe-area-inset-bottom,0px))]">
      <div className="flex-1 flex flex-col justify-center">
        <div className="w-16 h-16 rounded-2xl bg-orange/20 flex items-center justify-center mb-6">
          <Globe size={28} className="text-orange" />
        </div>
        <h1 className="text-2xl font-bold mb-2">Выберите страну</h1>
        <p className="text-sm text-muted mb-8">
          Меню, цены и кофейни отличаются в зависимости от страны.
          Вы сможете изменить выбор в профиле.
        </p>

        <div className="space-y-3">
          {countries.map((c) => (
            <button
              key={c.id}
              onClick={() => handleSelect(c.id)}
              className="w-full flex items-center gap-4 bg-surface rounded-2xl p-4 hover:bg-surface-el transition-colors active:scale-[0.98]"
            >
              <span className="text-4xl">{c.flag}</span>
              <div className="text-left">
                <div className="font-semibold">{c.name}</div>
                <div className="text-sm text-muted">{c.currency} · {c.currencySymbol}</div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
