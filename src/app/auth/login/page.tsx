'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, ChevronDown } from 'lucide-react';
import Button from '@/components/ui/Button';
import {
  DIAL_OPTIONS,
  formatNationalLoose,
  isValidNationalDigits,
} from '@/lib/phone-codes';
import { cn } from '@/lib/utils';
import { useAuth, createDemoUser } from '@/contexts/AuthContext';
import { useCountry } from '@/contexts/CountryContext';

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const { login } = useAuth();
  const { country } = useCountry();
  const isRegister = params.get('mode') === 'register';

  const [dialCode, setDialCode] = useState(DIAL_OPTIONS[0].code);
  const [national, setNational] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [dialOpen, setDialOpen] = useState(false);

  const dial = DIAL_OPTIONS.find((d) => d.code === dialCode) ?? DIAL_OPTIONS[0];
  const nationalDigits = formatNationalLoose(national);

  function handleNationalChange(e: React.ChangeEvent<HTMLInputElement>) {
    setNational(formatNationalLoose(e.target.value));
    setError('');
  }

  function handleSubmit() {
    if (!isValidNationalDigits(nationalDigits)) {
      setError('Введите номер без кода страны (8–15 цифр)');
      return;
    }
    if (isRegister && !name.trim()) {
      setError('Введите ваше имя');
      return;
    }
    const fullPhone = `${dialCode.replace(/\s/g, '')}${nationalDigits}`;
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      router.push(
        `/auth/verify?phone=${encodeURIComponent(fullPhone)}&name=${encodeURIComponent(name.trim())}`,
      );
    }, 800);
  }

  function handleDemoLogin() {
    login(createDemoUser(country.id));
    router.replace('/feed');
  }

  return (
    <div className="flex flex-col min-h-lvh bg-bg max-w-lg mx-auto">
      <div className="flex items-center px-4 pt-[calc(env(safe-area-inset-top,0px)+2.5rem)] pb-4">
        <button
          type="button"
          onClick={() => router.back()}
          className="p-2 -ml-2 rounded-xl hover:bg-surface-el transition-colors"
        >
          <ArrowLeft size={20} />
        </button>
      </div>

      <div className="flex-1 px-6 pt-4">
        <div className="w-16 h-16 rounded-2xl bg-orange/20 flex items-center justify-center mb-6">
          <span className="text-3xl">☕</span>
        </div>

        <h1 className="text-2xl font-bold mb-1">
          {isRegister ? 'Регистрация' : 'Вход в аккаунт'}
        </h1>
        <p className="text-sm text-muted mb-8">
          {isRegister
            ? 'Введите номер телефона — пришлём SMS с кодом'
            : 'Введите номер телефона для входа'}
        </p>

        <div className="space-y-4">
          {isRegister && (
            <div>
              <label className="text-xs text-muted font-medium block mb-1.5">Ваше имя</label>
              <input
                type="text"
                value={name}
                onChange={(e) => { setName(e.target.value); setError(''); }}
                placeholder="Алексей"
                className="w-full bg-surface border border-border rounded-2xl px-4 h-14 text-base outline-none focus:border-orange transition-colors"
              />
            </div>
          )}

          <div>
            <label className="text-xs text-muted font-medium block mb-1.5">Номер телефона</label>
            <div className="flex gap-2">
              <div className="relative flex-shrink-0">
                <button
                  type="button"
                  onClick={() => setDialOpen((v) => !v)}
                  className="flex items-center gap-1.5 bg-surface border border-border rounded-2xl px-3 h-14 min-w-[7.5rem] hover:border-orange/50 transition-colors"
                >
                  <span className="text-lg">{dial.flag}</span>
                  <span className="font-medium text-sm">{dial.code}</span>
                  <ChevronDown size={14} className="text-muted ml-auto" />
                </button>
                {dialOpen && (
                  <>
                    <button
                      type="button"
                      className="fixed inset-0 z-40"
                      aria-label="Закрыть"
                      onClick={() => setDialOpen(false)}
                    />
                    <div className="absolute z-50 top-full left-0 mt-1 max-h-56 w-72 overflow-y-auto bg-surface border border-border rounded-2xl shadow-2xl py-1">
                      {DIAL_OPTIONS.map((opt) => (
                        <button
                          key={opt.code + opt.label}
                          type="button"
                          onClick={() => {
                            setDialCode(opt.code);
                            setDialOpen(false);
                          }}
                          className={cn(
                            'w-full flex items-center gap-2 px-3 py-2.5 text-left text-sm hover:bg-surface-el transition-colors',
                            dialCode === opt.code && 'bg-orange/10 text-orange',
                          )}
                        >
                          <span>{opt.flag}</span>
                          <span className="font-medium">{opt.code}</span>
                          <span className="text-muted truncate text-xs">{opt.label}</span>
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
              <input
                type="tel"
                inputMode="tel"
                autoComplete="tel-national"
                value={national}
                onChange={handleNationalChange}
                placeholder={dial.placeholder}
                className="flex-1 min-w-0 bg-surface border border-border rounded-2xl px-4 h-14 text-base outline-none focus:border-orange transition-colors"
              />
            </div>
            <p className="text-[11px] text-muted mt-1.5">
              Код страны выберите слева, затем номер без «+» (только цифры, 8–15 знаков)
            </p>
          </div>

          {error && <p className="text-sm text-danger">{error}</p>}

          <Button
            fullWidth
            size="lg"
            onClick={handleSubmit}
            loading={loading}
            disabled={!isValidNationalDigits(nationalDigits)}
          >
            {loading ? 'Отправляем SMS…' : 'Получить код'}
          </Button>

          <div className="relative py-6">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs uppercase tracking-wide">
              <span className="bg-bg px-3 text-muted">или</span>
            </div>
          </div>

          <div className="space-y-2">
            <Button
              fullWidth
              size="lg"
              variant="secondary"
              type="button"
              onClick={handleDemoLogin}
            >
              Войти в демо (без SMS)
            </Button>
            <p className="text-[11px] text-muted text-center leading-relaxed">
              Реальных SMS нет — для просмотра приложения нажмите кнопку выше. Меню и цены зависят от выбранной страны в профиле или на ленте.
            </p>
          </div>
        </div>

        <div className="mt-8 text-center">
          {isRegister ? (
            <p className="text-sm text-muted">
              Уже есть аккаунт?{' '}
              <button type="button" onClick={() => router.push('/auth/login')} className="text-orange font-medium">
                Войти
              </button>
            </p>
          ) : (
            <p className="text-sm text-muted">
              Нет аккаунта?{' '}
              <button type="button" onClick={() => router.push('/auth/login?mode=register')} className="text-orange font-medium">
                Зарегистрироваться
              </button>
            </p>
          )}
        </div>
      </div>

      <div className="px-6 pb-[calc(3rem+env(safe-area-inset-bottom,0px))]">
        <p className="text-xs text-muted text-center">
          Продолжая, вы соглашаетесь с условиями использования
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}
