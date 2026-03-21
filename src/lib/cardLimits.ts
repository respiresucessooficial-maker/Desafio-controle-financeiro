import { Bank, Transaction } from '@/types';

export function getCardInvoiceAmount(bank: Bank) {
  return bank.creditUsed ?? 0;
}

export function getCardConfiguredAvailableLimit(bank: Bank) {
  return bank.balance ?? 0;
}

export function getCardRemainingAvailableLimit(bank: Bank) {
  return Math.max(0, getCardConfiguredAvailableLimit(bank) - getCardInvoiceAmount(bank));
}

export function getCardCurrentInvoiceFromTransactions(
  transactions: Transaction[],
  bankId: string,
  baseDate = new Date(),
) {
  return transactions.reduce((sum, tx) => {
    if (tx.bankId !== bankId || tx.type !== 'expense') return sum;
    const txDate = new Date(tx.date + 'T00:00:00');
    if (
      txDate.getFullYear() !== baseDate.getFullYear() ||
      txDate.getMonth() !== baseDate.getMonth()
    ) {
      return sum;
    }
    return sum + Math.abs(tx.amount);
  }, 0);
}
