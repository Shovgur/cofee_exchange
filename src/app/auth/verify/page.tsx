'use client';

import { Suspense, useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, MessageSquare, CheckCircle } from 'lucide-react';
import Button from '@/components/ui/Button';
import { useAuth } from '@/contexts/AuthContext';
import { useCountry } from '@/contexts/CountryContext';
import {
  getPhoneSession,
  isPhoneSessionCacheEnabled,
  markSmsRequested,
  savePhoneSession,
} from '@/lib/auth/phone-session-cache';
import { LoyaltyApiError, loyaltyErrorMessage, requestSmsCode, verifySmsCode } from '@/lib/api/loyalty';
import { cn } from '@/lib/utils';

const CODE_LENGTH = 6;
const RESEND_DELAY = 60;

function VerifyForm() {
  const router = useRouter();
  const params = useSearchParams();
  const { loginWithTokens } = useAuth();
  const { country } = useCountry();

  const phone = params.get('phone') ?? '+7';
  const cachedFlow = params.get('cached') === '1';

  const [digits, setDigits] = useState<string[]>(() => {
    if (!isPhoneSessionCacheEnabled()) return Array(CODE_LENGTH).fill('');
    const lastCode = getPhoneSession(phone)?.lastCode;
    if (!lastCode || lastCode.length !== CODE_LENGTH) return Array(CODE_LENGTH).fill('');
    return lastCode.split('');
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [resendTimer, setResendTimer] = useState(cachedFlow ? 0 : RESEND_DELAY);
  const [tryingCache, setTryingCache] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const cacheAttempted = useRef(false);

  useEffect(() => {
    if (!isPhoneSessionCacheEnabled() || cacheAttempted.current) return;
    cacheAttempted.current = true;

    async function tryCacheLogin() {
      const session = getPhoneSession(phone);
      if (!session?.tokens.refresh_token) return;
      setTryingCache(true);
      try {
        await loginWithTokens(session.tokens, country.id, phone);
        setSuccess(true);
        setTimeout(() => {
          router.replace(session.tokens.is_new ? '/profile' : '/feed');
        }, 800);
      } catch {
        /* нужен код из SMS */
      } finally {
        setTryingCache(false);
      }
    }

    void tryCacheLogin();
  }, [phone, country.id, loginWithTokens, router]);

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
      setTimeout(() => void handleVerify(next), 100);
    }
  }

  function handleKeyDown(index: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  }

  async function handleVerify(code = digits) {
    const fullCode = code.join('');
    if (fullCode.length < CODE_LENGTH) return;

    setLoading(true);
    setError('');

    try {
      const tokens = await verifySmsCode(phone, fullCode);
      if (isPhoneSessionCacheEnabled()) {
        savePhoneSession(phone, tokens, fullCode);
      }
      await loginWithTokens(tokens, country.id, phone);
      setSuccess(true);
      setTimeout(() => {
        router.replace(tokens.is_new ? '/profile' : '/feed');
      }, 1200);
    } catch (err) {
      setError(loyaltyErrorMessage(err, 'Не удалось подтвердить код'));
      setDigits(Array(CODE_LENGTH).fill(''));
      inputRefs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  }

  async function handleResend() {
    if (resendTimer > 0) return;
    setDigits(Array(CODE_LENGTH).fill(''));
    inputRefs.current[0]?.focus();
    try {
      await requestSmsCode(phone);
      if (isPhoneSessionCacheEnabled()) {
        markSmsRequested(phone);
      }
      setResendTimer(RESEND_DELAY);
      setError('');
    } catch (err) {
      setError(loyaltyErrorMessage(err, 'Не удалось отправить код повторно'));
      if (err instanceof LoyaltyApiError && err.retryAfterSeconds) {
        setResendTimer(err.retryAfterSeconds);
      } else {
        setResendTimer(RESEND_DELAY);
      }
    }
  }

  if (success || tryingCache) {
    return (
      <div className="flex flex-col items-center justify-center min-h-lvh gap-5 bg-bg max-w-lg mx-auto px-6 pt-[env(safe-area-inset-top,0px)] pb-[env(safe-area-inset-bottom,0px)]">
        <div className="w-20 h-20 rounded-full bg-success/20 flex items-center justify-center">
          <CheckCircle size={40} className="text-success" />
        </div>
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-1">
            {tryingCache ? 'Входим…' : 'Добро пожаловать!'}
          </h2>
          <p className="text-muted text-sm">
            {tryingCache ? 'Проверяем сохранённую сессию' : 'Вход выполнен успешно'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-lvh bg-bg max-w-lg mx-auto pb-[calc(1.5rem+env(safe-area-inset-bottom,0px))]">
      <div className="flex items-center px-4 pt-[calc(env(safe-area-inset-top,0px)+2.5rem)] pb-4">
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
        <p className="text-sm text-muted mb-8">
          {cachedFlow
            ? 'Повторная SMS не отправлялась — введите код из прошлого сообщения или запросите новый.'
            : 'Отправили SMS на номер'}{' '}
          {!cachedFlow && (
            <>
              <span className="text-foreground font-medium">{phone}</span>
            </>
          )}
          {cachedFlow && (
            <span className="text-foreground font-medium block mt-1">{phone}</span>
          )}
        </p>

        <div className="flex gap-2 justify-center mb-6">
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
                'w-11 h-14 rounded-2xl text-center text-xl font-bold bg-surface border-2 outline-none transition-colors',
                digits[i] ? 'border-orange text-foreground' : 'border-border text-muted',
                error && 'border-danger',
              )}
            />
          ))}
        </div>

        {error && <p className="text-sm text-danger text-center mb-4">{error}</p>}

        <Button
          fullWidth
          size="lg"
          onClick={() => void handleVerify()}
          loading={loading}
          disabled={digits.filter(Boolean).length < CODE_LENGTH}
        >
          Подтвердить
        </Button>

        <div className="mt-6 text-center">
          {resendTimer > 0 ? (
            <p className="text-sm text-muted">
              Повторно через <span className="text-foreground font-medium">{resendTimer}с</span>
            </p>
          ) : (
            <button onClick={() => void handleResend()} className="text-sm text-orange font-medium">
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
