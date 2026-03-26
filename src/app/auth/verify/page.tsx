'use client';

import { Suspense, useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, MessageSquare, CheckCircle } from 'lucide-react';
import Button from '@/components/ui/Button';
import { useAuth, buildMockUser } from '@/contexts/AuthContext';
import { useCountry } from '@/contexts/CountryContext';
import { cn } from '@/lib/utils';

const CODE_LENGTH = 4;
const RESEND_DELAY = 30;

function VerifyForm() {
  const router = useRouter();
  const params = useSearchParams();
  const { login } = useAuth();
  const { country } = useCountry();

  const phone = params.get('phone') ?? '+7';
  const name = params.get('name') ?? '';

  const [digits, setDigits] = useState<string[]>(Array(CODE_LENGTH).fill(''));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [resendTimer, setResendTimer] = useState(RESEND_DELAY);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  useEffect(() => {
    if (resendTimer <= 0) return;
    const t = setTimeout(() => setResendTimer((v) => v - 1), 1000);
    return () => clearTimeout(t);
  }, [resendTimer]);

  function handleDigit(index: number, value: string) {
    const char = value.replace(/\D/g, '').slice(-1);
    const next = [...digits];
    next[index] = char;
    setDigits(next);
    setError('');

    if (char && index < CODE_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }

    if (char && next.filter(Boolean).length === CODE_LENGTH) {
      setTimeout(() => handleVerify(next), 100);
    }
  }

  function handleKeyDown(index: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  }

  function handleVerify(code = digits) {
    const fullCode = code.join('');
    if (fullCode.length < CODE_LENGTH) return;

    setLoading(true);
    setTimeout(() => {
      if (fullCode === '0000') {
        setLoading(false);
        setError('Неверный код. Попробуйте снова.');
        setDigits(Array(CODE_LENGTH).fill(''));
        inputRefs.current[0]?.focus();
        return;
      }

      const user = buildMockUser(phone, name || 'Пользователь', country.id);
      login(user);
      setLoading(false);
      setSuccess(true);

      setTimeout(() => {
        router.replace('/feed');
      }, 1200);
    }, 1000);
  }

  function handleResend() {
    if (resendTimer > 0) return;
    setResendTimer(RESEND_DELAY);
    setDigits(Array(CODE_LENGTH).fill(''));
    inputRefs.current[0]?.focus();
  }

  if (success) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[100dvh] gap-5 bg-bg max-w-lg mx-auto px-6">
        <div className="w-20 h-20 rounded-full bg-success/20 flex items-center justify-center">
          <CheckCircle size={40} className="text-success" />
        </div>
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-1">Добро пожаловать!</h2>
          <p className="text-muted text-sm">Вход выполнен успешно</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-[100dvh] bg-bg max-w-lg mx-auto">
      <div className="flex items-center px-4 pt-12 pb-4">
        <button
          onClick={() => router.back()}
          className="p-2 -ml-2 rounded-xl hover:bg-surface-el transition-colors"
        >
          <ArrowLeft size={20} />
        </button>
      </div>

      <div className="flex-1 px-6 pt-4">
        <div className="w-16 h-16 rounded-2xl bg-orange/20 flex items-center justify-center mb-6">
          <MessageSquare size={28} className="text-orange" />
        </div>

        <h1 className="text-2xl font-bold mb-1">Введите код</h1>
        <p className="text-sm text-muted mb-2">
          Отправили SMS на номер{' '}
          <span className="text-white font-medium">{phone}</span>
        </p>
        <p className="text-xs text-muted mb-8">
          Реального SMS нет — это демо. Введите любые 4 цифры, кроме 0000
        </p>

        <div className="flex gap-3 justify-center mb-6">
          {Array(CODE_LENGTH).fill(null).map((_, i) => (
            <input
              key={i}
              ref={(el) => { inputRefs.current[i] = el; }}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digits[i]}
              onChange={(e) => handleDigit(i, e.target.value)}
              onKeyDown={(e) => handleKeyDown(i, e)}
              className={cn(
                'w-16 h-16 rounded-2xl text-center text-2xl font-bold bg-surface border-2 outline-none transition-colors',
                digits[i] ? 'border-orange text-white' : 'border-border text-muted',
                error && 'border-danger',
              )}
            />
          ))}
        </div>

        {error && <p className="text-sm text-danger text-center mb-4">{error}</p>}

        <Button
          fullWidth
          size="lg"
          onClick={() => handleVerify()}
          loading={loading}
          disabled={digits.filter(Boolean).length < CODE_LENGTH}
        >
          Подтвердить
        </Button>

        <div className="mt-6 text-center">
          {resendTimer > 0 ? (
            <p className="text-sm text-muted">
              Повторно через <span className="text-white font-medium">{resendTimer}с</span>
            </p>
          ) : (
            <button onClick={handleResend} className="text-sm text-orange font-medium">
              Отправить код повторно
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default function VerifyPage() {
  return (
    <Suspense fallback={null}>
      <VerifyForm />
    </Suspense>
  );
}
