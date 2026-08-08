'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle2, Coffee, Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useCountry } from '@/contexts/CountryContext';
import { fetchRules, patchCurrentUser } from '@/lib/api/loyalty';
import { cn } from '@/lib/utils';
import Button from '@/components/ui/Button';
import GenderSelect, { type Gender } from '@/components/ui/GenderSelect';

type Step = 'profile' | 'rules' | 'done';

export default function OnboardingPage() {
  const { user, refreshUserData } = useAuth();
  const { country } = useCountry();
  const router = useRouter();

  const [step, setStep] = useState<Step>('profile');

  // Profile fields
  const [form, setForm] = useState({
    first_name: '',
    last_name: '',
    middle_name: '',
    birth_date: '',
    email: '',
  });
  const [gender, setGender] = useState<Gender | null>(null);

  // Rules
  const [rulesText, setRulesText] = useState<string | null>(null);
  const [rulesVersion, setRulesVersion] = useState<string | null>(null);
  const [rulesLoading, setRulesLoading] = useState(false);
  const [agreed, setAgreed] = useState(false);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Redirect if profile already completed
  useEffect(() => {
    if (user?.profileCompleted) {
      router.replace('/feed');
    }
  }, [user, router]);

  const loadRules = useCallback(async () => {
    setRulesLoading(true);
    try {
      const r = await fetchRules(country.id);
      setRulesText(r.text);
      setRulesVersion(String(r.version));
    } catch {
      setRulesText('Не удалось загрузить правила программы.');
    } finally {
      setRulesLoading(false);
    }
  }, [country.id]);

  const handleSkipProfile = async () => {
    await loadRules();
    setStep('rules');
  };

  const handleProfileNext = async () => {
    setSaving(true);
    setError(null);
    try {
      await patchCurrentUser({
        first_name: form.first_name.trim() || undefined,
        last_name: form.last_name.trim() || undefined,
        middle_name: form.middle_name.trim() || null,
        birth_date: form.birth_date || undefined,
        email: form.email.trim() || undefined,
        gender: gender ?? undefined,
      });
      await loadRules();
      setStep('rules');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Ошибка сохранения');
    } finally {
      setSaving(false);
    }
  };

  const handleAgree = async () => {
    if (!agreed) return;
    setSaving(true);
    setError(null);
    try {
      await patchCurrentUser({ consent_version: rulesVersion ?? '1' });
      await refreshUserData();
      setStep('done');
      setTimeout(() => router.replace('/feed'), 1400);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Ошибка при сохранении согласия');
    } finally {
      setSaving(false);
    }
  };

  const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  // ── Done ────────────────────────────────────────────────────────────────
  if (step === 'done') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[80dvh] gap-6 px-6">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-success/20">
          <CheckCircle2 size={44} className="text-success" />
        </div>
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Профиль заполнен!</h2>
          <p className="text-sm text-muted">Добро пожаловать в программу лояльности</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg px-4 pb-safe pt-6">
      {/* Header */}
      <div className="mb-8 flex items-center gap-4">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-orange/20 text-orange">
          <Coffee size={28} />
        </div>
        <div>
          <h1 className="text-xl font-bold leading-tight">
            {step === 'profile' ? 'Заполните профиль' : 'Правила программы'}
          </h1>
          <p className="text-sm text-muted">
            {step === 'profile' ? 'Шаг 1 из 2' : 'Шаг 2 из 2'}
          </p>
        </div>
      </div>

      {/* Progress */}
      <div className="mb-8 flex gap-1.5">
        {(['profile', 'rules'] as Step[]).map((s, i) => (
          <div
            key={s}
            className={cn(
              'h-1 flex-1 rounded-full transition-colors',
              i === 0 || step === 'rules' ? 'bg-orange' : 'bg-border',
            )}
          />
        ))}
      </div>

      {/* ── Step 1: Profile ────────────────────────────────────────────── */}
      {step === 'profile' && (
        <div className="space-y-5">
          <p className="text-sm text-muted">
            Эти данные помогут нам персонализировать ваш опыт. Все поля необязательны — можно заполнить позже в профиле.
          </p>

          {error && (
            <div className="rounded-xl bg-danger/10 px-4 py-3 text-sm text-danger">{error}</div>
          )}

          {([
            { key: 'last_name', label: 'Фамилия', type: 'text', placeholder: 'Иванов' },
            { key: 'first_name', label: 'Имя', type: 'text', placeholder: 'Иван' },
            { key: 'middle_name', label: 'Отчество', type: 'text', placeholder: 'Иванович (необязательно)' },
            { key: 'birth_date', label: 'Дата рождения', type: 'date', placeholder: '' },
            { key: 'email', label: 'Email', type: 'email', placeholder: 'ivan@example.com' },
          ] as const).map(({ key, label, type, placeholder }) => (
            <div key={key}>
              <label className="block text-xs font-medium text-muted mb-1.5">{label}</label>
              <input
                type={type}
                value={form[key]}
                onChange={set(key)}
                placeholder={placeholder}
                className="w-full rounded-xl border border-border bg-surface px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange/40"
              />
            </div>
          ))}

          <div>
            <label className="block text-xs font-medium text-muted mb-1.5">Пол</label>
            <GenderSelect value={gender} onChange={setGender} disabled={saving} />
          </div>

          <div className="flex gap-3 pt-2">
            <Button
              variant="secondary"
              fullWidth
              onClick={() => { void handleSkipProfile(); }}
              disabled={saving}
            >
              Пропустить
            </Button>
            <Button
              fullWidth
              loading={saving}
              onClick={() => void handleProfileNext()}
            >
              Далее
            </Button>
          </div>
        </div>
      )}

      {/* ── Step 2: Rules / consent ────────────────────────────────────── */}
      {step === 'rules' && (
        <div className="space-y-5">
          <p className="text-sm text-muted">
            Для участия в программе лояльности необходимо принять правила.
          </p>

          {error && (
            <div className="rounded-xl bg-danger/10 px-4 py-3 text-sm text-danger">{error}</div>
          )}

          <div className="max-h-64 overflow-y-auto rounded-2xl border border-border bg-surface p-4">
            {rulesLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 size={22} className="animate-spin text-muted" />
              </div>
            ) : (
              <pre className="text-xs text-muted leading-relaxed whitespace-pre-wrap font-sans">
                {rulesText}
              </pre>
            )}
          </div>

          <label className="flex items-start gap-3 cursor-pointer">
            <div className="relative mt-0.5">
              <input
                type="checkbox"
                className="sr-only"
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
              />
              <div className={cn(
                'flex h-5 w-5 items-center justify-center rounded-md border-2 transition-colors',
                agreed ? 'border-orange bg-orange' : 'border-border bg-surface',
              )}>
                {agreed && <CheckCircle2 size={12} className="text-white" strokeWidth={3} />}
              </div>
            </div>
            <span className="text-sm leading-relaxed">
              Я прочитал(-а) и принимаю правила программы лояльности Coffee Exchange
            </span>
          </label>

          <Button
            fullWidth
            disabled={!agreed}
            loading={saving}
            onClick={() => void handleAgree()}
          >
            Принять и продолжить
          </Button>
        </div>
      )}
    </div>
  );
}
