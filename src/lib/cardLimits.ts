import { Bank, Transaction } from '@/types';

export function isInvoicePaymentTransaction(transaction: Transaction, bankId?: string) {
  if (bankId && transaction.bankId !== bankId) return false;
  return transaction.description?.startsWith('invoice_payment:') ?? false;
}

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
  return transactions.reduce((sum, transaction) => {
    if (transaction.bankId !== bankId || transaction.type !== 'expense') return sum;
    if (isInvoicePaymentTransaction(transaction, bankId)) return sum - Math.abs(transaction.amount);
    if (transaction.accountId) return sum;

    const txDate = new Date(transaction.date + 'T00:00:00');
    if (
      txDate.getFullYear() !== baseDate.getFullYear() ||
      txDate.getMonth() !== baseDate.getMonth()
    ) {
      return sum;
    }

    return sum + Math.abs(transaction.amount);
  }, 0);
}
