import type { ApiLoyaltyTransactionType } from '@/lib/api/loyalty/types';

const LABELS: Record<ApiLoyaltyTransactionType, string> = {
  accrual: 'Начисление',
  spend: 'Списание',
  expire: 'Сгорание',
  refund: 'Возврат',
  clawback: 'Отзыв начисления',
};

export function transactionLabel(type: ApiLoyaltyTransactionType): string {
  return LABELS[type] ?? type;
}

/** Направление операции определяется знаком суммы: возврат тоже пополняет баланс. */
export function isCredit(amount: number): boolean {
  return amount > 0;
}

export function formatSignedBeans(amount: number): string {
  return `${amount > 0 ? '+' : '−'}${Math.abs(amount)}`;
}
