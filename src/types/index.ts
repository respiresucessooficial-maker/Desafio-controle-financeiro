export type CardNetwork = 'visa' | 'mastercard' | 'elo' | 'visa-master' | 'visa-elo';

export type AccountType = 'corrente' | 'poupanca' | 'digital' | 'investimento' | 'salario';

export interface Account {
  id: string;
  institutionId?: string;
  name: string;
  type: AccountType;
  balance: number;
  agency?: string;
  accountNumber?: string;
  color: string;
  textColor: string;
  accentColor: string;
  logo?: string;
  brand: string;
  code: string;
}

export interface Bank {
  id: string;
  name: string;
  brand: string;
  code: string;
  balance: number;
  number: string;
  color: string;
  textColor: string;
  accentColor: string;
  logo?: string;
  network?: CardNetwork;
  creditLimit?: number;
  creditUsed?: number;
  closingDay?: number;
  dueDay?: number;
  invoiceStatus?: 'paid' | 'open' | 'overdue';
  lastInvoiceAmount?: number;
  accountId?: string;
}

export interface Transaction {
  id: string;
  label: string;
  amount: number;
  date: string;
  category: string;
  type: 'income' | 'expense';
  icon: string;
  color: string;
  bankId?: string;
  accountId?: string;
  description?: string;
}

export interface Budget {
  id: string;
  category: string;
  limit: number;
  color: string;
}

export interface GoalContribution {
  id: string;
  amount: number;
  createdAt: string;
}

export interface Goal {
  id: string;
  name: string;
  current: number;
  target: number;
  icon: string;
  color: string;
  description: string;
  history?: GoalContribution[];
}

export interface MonthlyData {
  month: string;
  income: number;
  expenses: number;
}

export interface CategoryData {
  name: string;
  value: number;
  color: string;
}

export type AlertSeverity = 'info' | 'warning' | 'error';
export type AlertType = 'budget-exceeded' | 'budget-warning' | 'goal-milestone' | 'txn-reminder';

export interface Alert {
  id: string;
  type: AlertType;
  title: string;
  message: string;
  severity: AlertSeverity;
}

export interface WidgetConfig {
  id: string;
  label: string;
  visible: boolean;
}
