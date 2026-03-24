import { Account, Transaction } from '@/types';

function roundCurrency(value: number) {
  return Math.round(value * 100) / 100;
}

function isNonCreditTransaction(transaction: Transaction) {
  return transaction.paymentType !== 'credit';
}

function getImplicitAccountTransactions(accounts: Account[], transactions: Transaction[]) {
  if (accounts.length !== 1) return [] as Transaction[];

  return transactions.filter(
    (transaction) => !transaction.accountId && isNonCreditTransaction(transaction),
  );
}

export function getInferredAccountIncome(accounts: Account[], transactions: Transaction[]) {
  return roundCurrency(
    accounts.reduce((sum, account) => {
      const linkedIncomeTransactions = transactions.filter(
        (transaction) => transaction.accountId === account.id && transaction.type === 'income',
      );

      if (linkedIncomeTransactions.length > 0) {
        return sum;
      }

      const linkedNet = transactions
        .filter((transaction) => transaction.accountId === account.id)
        .reduce((accountSum, transaction) => accountSum + transaction.amount, 0);

      const inferredIncome = roundCurrency(account.balance - linkedNet);
      if (inferredIncome <= 0) return sum;

      return sum + inferredIncome;
    }, 0),
  );
}

export function getAccountLifetimeFlowTotals(accounts: Account[], transactions: Transaction[]) {
  const accountTransactions = [
    ...transactions.filter((transaction) => !!transaction.accountId),
    ...getImplicitAccountTransactions(accounts, transactions),
  ];

  const trackedIncome = accountTransactions
    .filter((transaction) => transaction.type === 'income')
    .reduce((sum, transaction) => sum + transaction.amount, 0);

  const trackedExpenses = accountTransactions
    .filter((transaction) => transaction.type === 'expense')
    .reduce((sum, transaction) => sum + Math.abs(transaction.amount), 0);

  const inferredIncome = getInferredAccountIncome(accounts, transactions);

  return {
    income: roundCurrency(trackedIncome + inferredIncome),
    expenses: roundCurrency(trackedExpenses),
  };
}

export function getEffectiveAccountBalances(accounts: Account[], transactions: Transaction[]) {
  const balances = new Map(accounts.map((account) => [account.id, account.balance]));

  if (accounts.length !== 1) return balances;

  const [onlyAccount] = accounts;
  const implicitDelta = getImplicitAccountTransactions(accounts, transactions)
    .reduce((sum, transaction) => sum + transaction.amount, 0);

  balances.set(onlyAccount.id, roundCurrency((balances.get(onlyAccount.id) ?? 0) + implicitDelta));
  return balances;
}

export function getEffectiveTotalAccountBalance(accounts: Account[], transactions: Transaction[]) {
  return roundCurrency(
    Array.from(getEffectiveAccountBalances(accounts, transactions).values())
      .reduce((sum, balance) => sum + balance, 0),
  );
}

export function getMonthlyAccountFlowTotals(accounts: Account[], transactions: Transaction[], monthKey: string) {
  const implicitTransactions = getImplicitAccountTransactions(accounts, transactions)
    .filter((transaction) => transaction.date.startsWith(monthKey));

  const explicitTransactions = transactions.filter(
    (transaction) => !!transaction.accountId && transaction.date.startsWith(monthKey),
  );

  const monthTransactions = [...explicitTransactions, ...implicitTransactions];

  return {
    income: roundCurrency(
      monthTransactions
        .filter((transaction) => transaction.type === 'income')
        .reduce((sum, transaction) => sum + transaction.amount, 0),
    ),
    expenses: roundCurrency(
      monthTransactions
        .filter((transaction) => transaction.type === 'expense')
        .reduce((sum, transaction) => sum + Math.abs(transaction.amount), 0),
    ),
  };
}

export function getAccountScopedTransactions(account: Account, accounts: Account[], banks: { accountId?: string; id: string }[], transactions: Transaction[]) {
  const accountCardIds = new Set(banks.filter((bank) => bank.accountId === account.id).map((bank) => bank.id));

  const explicitTransactions = transactions.filter(
    (transaction) => transaction.accountId === account.id || (transaction.bankId && accountCardIds.has(transaction.bankId)),
  );

  if (accounts.length !== 1) return explicitTransactions;

  const implicitTransactions = transactions.filter(
    (transaction) => !transaction.accountId && isNonCreditTransaction(transaction),
  );

  return [...explicitTransactions, ...implicitTransactions];
}
