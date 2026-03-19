import type { AccountType } from '@/types';

export const ACCOUNT_TYPES: { value: AccountType; label: string }[] = [
  { value: 'corrente',     label: 'Corrente' },
  { value: 'poupanca',     label: 'Poupança' },
  { value: 'digital',      label: 'Digital' },
  { value: 'investimento', label: 'Investimento' },
  { value: 'salario',      label: 'Salário' },
];

/** Lookup map: AccountType → display label */
export const ACCOUNT_TYPE_LABELS: Record<string, string> = Object.fromEntries(
  ACCOUNT_TYPES.map((t) => [t.value, t.label])
);
