'use client';

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useRef,
} from 'react';
import { Transaction, Budget, Bank, Goal, Account, GoalContribution } from '@/types';
import { getCategoryDef, CATEGORIES, CategoryDef } from '@/data/categories';
import { INSTITUTIONS } from '@/data/institutions';
import { supabase } from '@/lib/supabase';

// ── Hydration helpers ─────────────────────────────────────────────────────────
function hydrateNetworks(banks: Bank[]): Bank[] {
  return banks.map((bank) => {
    if (bank.network) return bank;
    const inst = INSTITUTIONS.find((i) => i.code === bank.code && i.code !== '000');
    return inst ? { ...bank, network: inst.network } : bank;
  });
}

function normalizeBudgetCategory(category: string) {
  return category.trim().toLowerCase();
}

function dedupeBudgetsByCategory(items: Budget[]): Budget[] {
  const map = new Map<string, Budget>();
  items.forEach((budget) => {
    map.set(normalizeBudgetCategory(budget.category), budget);
  });
  return Array.from(map.values());
}

function goalHistoryStorageKey(uid: string) {
  return `goal-history:${uid}`;
}

function readGoalHistory(uid: string) {
  if (typeof window === 'undefined' || !uid) return {} as Record<string, GoalContribution[]>;
  try {
    const raw = window.localStorage.getItem(goalHistoryStorageKey(uid));
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Record<string, GoalContribution[]>;
    return parsed ?? {};
  } catch {
    return {};
  }
}

function writeGoalHistory(uid: string, goalId: string, history: GoalContribution[]) {
  if (typeof window === 'undefined' || !uid) return;
  const current = readGoalHistory(uid);
  current[goalId] = history;
  window.localStorage.setItem(goalHistoryStorageKey(uid), JSON.stringify(current));
}

function removeGoalHistory(uid: string, goalId: string) {
  if (typeof window === 'undefined' || !uid) return;
  const current = readGoalHistory(uid);
  delete current[goalId];
  window.localStorage.setItem(goalHistoryStorageKey(uid), JSON.stringify(current));
}

// ── Custom categories ─────────────────────────────────────────────────────────
export interface CustomCategory {
  name: string;
  icon: string;
  color: string;
  type: 'expense' | 'income';
  isCustom: true;
}

function customCategoriesKey(uid: string) {
  return `custom-categories:${uid}`;
}

function readCustomCategories(uid: string): CustomCategory[] {
  if (typeof window === 'undefined' || !uid) return [];
  try {
    const raw = window.localStorage.getItem(customCategoriesKey(uid));
    if (!raw) return [];
    return (JSON.parse(raw) as CustomCategory[]) ?? [];
  } catch {
    return [];
  }
}

function saveCustomCategories(uid: string, cats: CustomCategory[]) {
  if (typeof window === 'undefined' || !uid) return;
  window.localStorage.setItem(customCategoriesKey(uid), JSON.stringify(cats));
}

// ── ID generation ─────────────────────────────────────────────────────────────
function genId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

// ── DB ↔ TS row mappers ───────────────────────────────────────────────────────
/* eslint-disable @typescript-eslint/no-explicit-any */
function rowToAccount(r: any): Account {
  return {
    id: r.id,
    institutionId: r.institution_id ?? undefined,
    name: r.name, type: r.type, balance: Number(r.balance),
    agency: r.agency ?? undefined,
    accountNumber: r.account_number ?? undefined,
    color: r.color, textColor: r.text_color, accentColor: r.accent_color,
    logo: r.logo ?? undefined, brand: r.brand, code: r.code,
  };
}
function accountToRow(a: Account, userId: string) {
  return {
    id: a.id, user_id: userId,
    institution_id: a.institutionId ?? null,
    name: a.name, type: a.type, balance: a.balance,
    agency: a.agency ?? null, account_number: a.accountNumber ?? null,
    color: a.color, text_color: a.textColor, accent_color: a.accentColor,
    logo: a.logo ?? null, brand: a.brand, code: a.code,
  };
}

function rowToBank(r: any): Bank {
  return {
    id: r.id, name: r.name, brand: r.brand, code: r.code,
    balance: Number(r.balance), number: r.number,
    color: r.color, textColor: r.text_color, accentColor: r.accent_color,
    logo: r.logo ?? undefined, network: r.network ?? undefined,
    creditLimit: r.credit_limit != null ? Number(r.credit_limit) : undefined,
    creditUsed: r.credit_used != null ? Number(r.credit_used) : undefined,
    closingDay: r.closing_day ?? undefined, dueDay: r.due_day ?? undefined,
    invoiceStatus: r.invoice_status ?? undefined,
    lastInvoiceAmount: r.last_invoice_amount != null ? Number(r.last_invoice_amount) : undefined,
    accountId: r.account_id ?? undefined,
  };
}
function bankToRow(b: Bank, userId: string) {
  return {
    id: b.id, user_id: userId,
    name: b.name, brand: b.brand, code: b.code,
    balance: b.balance, number: b.number,
    color: b.color, text_color: b.textColor, accent_color: b.accentColor,
    logo: b.logo ?? null, network: b.network ?? null,
    credit_limit: b.creditLimit ?? null, credit_used: b.creditUsed ?? null,
    closing_day: b.closingDay ?? null, due_day: b.dueDay ?? null,
    invoice_status: b.invoiceStatus ?? null,
    last_invoice_amount: b.lastInvoiceAmount ?? null,
    account_id: b.accountId ?? null,
  };
}

function rowToTransaction(r: any): Transaction {
  return {
    id: r.id, label: r.label, amount: Number(r.amount),
    date: r.date, category: r.category, type: r.type,
    icon: r.icon, color: r.color,
    bankId: r.bank_id ?? undefined,
    accountId: r.account_id ?? undefined,
    description: r.description ?? undefined,
  };
}
function transactionToRow(t: Transaction, userId: string) {
  return {
    id: t.id, user_id: userId,
    label: t.label, amount: t.amount, date: t.date,
    category: t.category, type: t.type, icon: t.icon, color: t.color,
    bank_id: t.bankId ?? null,
    account_id: t.accountId ?? null,
    description: t.description ?? null,
  };
}

function rowToBudget(r: any): Budget {
  return { id: r.id, category: r.category, limit: Number(r.limit_amount), color: r.color };
}
function budgetToRow(b: Budget, userId: string) {
  return { id: b.id, user_id: userId, category: b.category, limit_amount: b.limit, color: b.color };
}

function rowToGoal(r: any): Goal {
  return {
    id: r.id, name: r.name, current: Number(r.current), target: Number(r.target),
    icon: r.icon, color: r.color, description: r.description,
    history: Array.isArray(r.history)
      ? r.history.map((entry: any): GoalContribution => ({
          id: entry.id,
          amount: Number(entry.amount),
          createdAt: entry.createdAt,
        }))
      : [],
  };
}
function goalToRow(g: Goal, userId: string) {
  return {
    id: g.id, user_id: userId, name: g.name, current: g.current, target: g.target,
    icon: g.icon, color: g.color, description: g.description,
  };
}
/* eslint-enable @typescript-eslint/no-explicit-any */

// ── Context interface ─────────────────────────────────────────────────────────
interface AppDataContextValue {
  transactions: Transaction[];
  budgets: Budget[];
  banks: Bank[];
  goals: Goal[];
  accounts: Account[];
  loaded: boolean;
  categories: CategoryDef[];
  addTransaction: (t: Omit<Transaction, 'id'>, opts?: { skipBalanceUpdate?: boolean }) => Transaction;
  updateTransaction: (id: string, data: Partial<Omit<Transaction, 'id'>>) => void;
  deleteTransaction: (id: string) => void;
  setBudget: (b: Omit<Budget, 'id'>) => void;
  deleteBudget: (category: string) => void;
  addBank: (b: Omit<Bank, 'id'>) => void;
  updateBank: (id: string, data: Partial<Omit<Bank, 'id'>>) => void;
  deleteBank: (id: string) => void;
  addGoal: (g: Omit<Goal, 'id'>) => void;
  updateGoal: (id: string, data: Partial<Omit<Goal, 'id'>>) => void;
  deleteGoal: (id: string) => void;
  addAccount: (a: Omit<Account, 'id'>) => Account;
  updateAccount: (id: string, data: Partial<Omit<Account, 'id'>>) => void;
  deleteAccount: (id: string) => void;
  addCategory: (c: Omit<CustomCategory, 'isCustom'>) => void;
  updateCategory: (name: string, data: Partial<Pick<CustomCategory, 'name' | 'icon' | 'color'>>) => void;
  deleteCategory: (name: string) => void;
}

const AppDataContext = createContext<AppDataContextValue>({
  transactions: [], budgets: [], banks: [], goals: [], accounts: [], loaded: false,
  categories: CATEGORIES,
  addTransaction: () => ({ id: '', label: '', amount: 0, date: '', category: '', type: 'income', icon: '', color: '' }),
  updateTransaction: () => {}, deleteTransaction: () => {},
  setBudget: () => {}, deleteBudget: () => {},
  addBank: () => {}, updateBank: () => {}, deleteBank: () => {},
  addGoal: () => {}, updateGoal: () => {}, deleteGoal: () => {},
  addAccount: () => ({ id: '', name: '', type: 'corrente', balance: 0, color: '', textColor: '', accentColor: '', brand: '', code: '' }),
  updateAccount: () => {}, deleteAccount: () => {},
  addCategory: () => {}, updateCategory: () => {}, deleteCategory: () => {},
});

// ── Provider ──────────────────────────────────────────────────────────────────
export function AppDataProvider({ children }: { children: React.ReactNode }) {
  const [transactions, setTransactions]       = useState<Transaction[]>([]);
  const [budgets, setBudgets]                 = useState<Budget[]>([]);
  const [banks, setBanks]                     = useState<Bank[]>([]);
  const [goals, setGoals]                     = useState<Goal[]>([]);
  const [accounts, setAccounts]               = useState<Account[]>([]);
  const [loaded, setLoaded]                   = useState(false);
  const [customCategories, setCustomCategories] = useState<CustomCategory[]>([]);
  const userId = useRef<string>('');
  const categoriesRef = useRef<CategoryDef[]>(CATEGORIES);

  const categories: CategoryDef[] = [...CATEGORIES, ...customCategories];

  useEffect(() => {
    categoriesRef.current = categories;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [customCategories]);

  async function loadForUser(uid: string) {
    userId.current = uid;
    const [
      { data: txData,     error: txErr     },
      { data: budgetData, error: budgetErr },
      { data: bankData,   error: bankErr   },
      { data: goalData,   error: goalErr   },
      { data: accData,    error: accErr    },
    ] = await Promise.all([
      supabase.from('transactions').select('*').eq('user_id', uid).order('created_at', { ascending: false }),
      supabase.from('budgets').select('*').eq('user_id', uid),
      supabase.from('banks').select('*').eq('user_id', uid),
      supabase.from('goals').select('*').eq('user_id', uid),
      supabase.from('accounts').select('*').eq('user_id', uid),
    ]);
    if (txErr)     console.error('[loadForUser] transactions:', txErr);
    if (budgetErr) console.error('[loadForUser] budgets:',      budgetErr);
    if (bankErr)   console.error('[loadForUser] banks:',        bankErr);
    if (goalErr)   console.error('[loadForUser] goals:',        goalErr);
    if (accErr)    console.error('[loadForUser] accounts:',     accErr);
    setTransactions((txData ?? []).map(rowToTransaction));
    setBudgets(dedupeBudgetsByCategory((budgetData ?? []).map(rowToBudget)));
    setBanks(hydrateNetworks((bankData ?? []).map(rowToBank)));
    const localGoalHistory = readGoalHistory(uid);
    setGoals(
      (goalData ?? []).map(rowToGoal).map((goal) => ({
        ...goal,
        history: localGoalHistory[goal.id] ?? goal.history ?? [],
      })),
    );
    setAccounts((accData ?? []).map(rowToAccount));
    setCustomCategories(readCustomCategories(uid));
    setLoaded(true);
  }

  // ── Listen to auth changes ─────────────────────────────────────────────────
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if ((event === 'INITIAL_SESSION' || event === 'SIGNED_IN') && session?.user) {
        if (userId.current !== session.user.id) loadForUser(session.user.id);
      } else if (event === 'INITIAL_SESSION' && !session?.user) {
        setLoaded(true);
      } else if (event === 'SIGNED_OUT') {
        userId.current = '';
        setTransactions([]); setBudgets([]); setBanks([]);
        setGoals([]); setAccounts([]); setCustomCategories([]); setLoaded(true);
      }
    });

    return () => subscription.unsubscribe();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Transactions ───────────────────────────────────────────────────────────
  const addTransaction = useCallback((t: Omit<Transaction, 'id'>, opts?: { skipBalanceUpdate?: boolean }): Transaction => {
    const catDef = categoriesRef.current.find((c) => c.name === t.category) ?? getCategoryDef(t.category);
    const newT: Transaction = { ...t, id: genId(), icon: t.icon || catDef.icon, color: t.color || catDef.color };
    setTransactions((prev) => [newT, ...prev]);
    if (newT.accountId && !opts?.skipBalanceUpdate) {
      setAccounts((prev) => prev.map((a) => {
        if (a.id !== newT.accountId) return a;
        const newBalance = a.balance + newT.amount;
        supabase.from('accounts').update({ balance: newBalance })
          .eq('id', a.id).eq('user_id', userId.current)
          .then(({ error }) => { if (error) console.error('[addTransaction:balance]', error); });
        return { ...a, balance: newBalance };
      }));
    }
    supabase.from('transactions').insert(transactionToRow(newT, userId.current))
      .then(({ error }) => { if (error) console.error('[addTransaction]', error); });
    return newT;
  }, []);

  const updateTransaction = useCallback((id: string, data: Partial<Omit<Transaction, 'id'>>) => {
    setTransactions((prev) => {
      const old = prev.find((t) => t.id === id);
      if (old?.accountId && 'amount' in data && data.amount !== old.amount) {
        const delta = data.amount! - old.amount;
        setAccounts((accounts) => accounts.map((a) => {
          if (a.id !== old.accountId) return a;
          const newBalance = a.balance + delta;
          supabase.from('accounts').update({ balance: newBalance })
            .eq('id', a.id).eq('user_id', userId.current)
            .then(({ error }) => { if (error) console.error('[updateTransaction:balance]', error); });
          return { ...a, balance: newBalance };
        }));
      }
      return prev.map((t) => (t.id === id ? { ...t, ...data } : t));
    });
    const row: Record<string, unknown> = {};
    if ('label'       in data) row.label       = data.label;
    if ('amount'      in data) row.amount       = data.amount;
    if ('date'        in data) row.date         = data.date;
    if ('category'    in data) row.category     = data.category;
    if ('type'        in data) row.type         = data.type;
    if ('icon'        in data) row.icon         = data.icon;
    if ('color'       in data) row.color        = data.color;
    if ('bankId'      in data) row.bank_id      = data.bankId ?? null;
    if ('description' in data) row.description  = data.description ?? null;
    if (Object.keys(row).length > 0)
      supabase.from('transactions').update(row).eq('id', id).eq('user_id', userId.current)
        .then(({ error }) => { if (error) console.error('[updateTransaction]', error); });
  }, []);

  const deleteTransaction = useCallback((id: string) => {
    setTransactions((prev) => {
      const t = prev.find((tx) => tx.id === id);
      if (t?.accountId) {
        setAccounts((accounts) => accounts.map((a) => {
          if (a.id !== t.accountId) return a;
          const newBalance = a.balance - t.amount;
          supabase.from('accounts').update({ balance: newBalance })
            .eq('id', a.id).eq('user_id', userId.current)
            .then(({ error }) => { if (error) console.error('[deleteTransaction:balance]', error); });
          return { ...a, balance: newBalance };
        }));
      }
      return prev.filter((tx) => tx.id !== id);
    });
    supabase.from('transactions').delete().eq('id', id).eq('user_id', userId.current)
      .then(({ error }) => { if (error) console.error('[deleteTransaction]', error); });
  }, []);

  // ── Budgets ────────────────────────────────────────────────────────────────
  const setBudget = useCallback((b: Omit<Budget, 'id'>) => {
    setBudgets((prev) => {
      const normalized = normalizeBudgetCategory(b.category);
      const exists = prev.find((x) => normalizeBudgetCategory(x.category) === normalized);
      if (exists) {
        supabase.from('budgets').update({ limit_amount: b.limit, color: b.color })
          .eq('id', exists.id).eq('user_id', userId.current)
          .then(({ error }) => { if (error) console.error('[updateBudget]', error); });
        return dedupeBudgetsByCategory(
          prev.map((x) => (
            normalizeBudgetCategory(x.category) === normalized ? { ...x, ...b } : x
          )),
        );
      }
      const newB = { ...b, id: genId() };
      supabase.from('budgets').insert(budgetToRow(newB, userId.current))
        .then(({ error }) => { if (error) console.error('[addBudget]', error); });
      return dedupeBudgetsByCategory([...prev, newB]);
    });
  }, []);

  const deleteBudget = useCallback((category: string) => {
    setBudgets((prev) => {
      const normalized = normalizeBudgetCategory(category);
      const target = prev.find((b) => normalizeBudgetCategory(b.category) === normalized);
      if (target) supabase.from('budgets').delete().eq('id', target.id).eq('user_id', userId.current)
        .then(({ error }) => { if (error) console.error('[deleteBudget]', error); });
      return prev.filter((b) => normalizeBudgetCategory(b.category) !== normalized);
    });
  }, []);

  // ── Banks (cards) ──────────────────────────────────────────────────────────
  const addBank = useCallback((b: Omit<Bank, 'id'>) => {
    const newB: Bank = { ...b, id: genId() };
    setBanks((prev) => [...prev, newB]);
    supabase.from('banks').insert(bankToRow(newB, userId.current))
      .then(({ error }) => { if (error) console.error('[addBank]', error); });
  }, []);

  const updateBank = useCallback((id: string, data: Partial<Omit<Bank, 'id'>>) => {
    setBanks((prev) => prev.map((b) => (b.id === id ? { ...b, ...data } : b)));
    const row: Record<string, unknown> = {};
    if ('name'              in data) row.name                = data.name;
    if ('brand'             in data) row.brand               = data.brand;
    if ('code'              in data) row.code                = data.code;
    if ('balance'           in data) row.balance             = data.balance;
    if ('number'            in data) row.number              = data.number;
    if ('color'             in data) row.color               = data.color;
    if ('textColor'         in data) row.text_color          = data.textColor;
    if ('accentColor'       in data) row.accent_color        = data.accentColor;
    if ('logo'              in data) row.logo                = data.logo ?? null;
    if ('network'           in data) row.network             = data.network ?? null;
    if ('creditLimit'       in data) row.credit_limit        = data.creditLimit ?? null;
    if ('creditUsed'        in data) row.credit_used         = data.creditUsed ?? null;
    if ('closingDay'        in data) row.closing_day         = data.closingDay ?? null;
    if ('dueDay'            in data) row.due_day             = data.dueDay ?? null;
    if ('invoiceStatus'     in data) row.invoice_status      = data.invoiceStatus ?? null;
    if ('lastInvoiceAmount' in data) row.last_invoice_amount = data.lastInvoiceAmount ?? null;
    if ('accountId'         in data) row.account_id          = data.accountId ?? null;
    if (Object.keys(row).length > 0)
      supabase.from('banks').update(row).eq('id', id).eq('user_id', userId.current)
        .then(({ error }) => { if (error) console.error('[updateBank]', error); });
  }, []);

  const deleteBank = useCallback((id: string) => {
    setBanks((prev) => prev.filter((b) => b.id !== id));
    supabase.from('banks').delete().eq('id', id).eq('user_id', userId.current)
      .then(({ error }) => { if (error) console.error('[deleteBank]', error); });
  }, []);

  // ── Goals ──────────────────────────────────────────────────────────────────
  const addGoal = useCallback((g: Omit<Goal, 'id'>) => {
    const newG: Goal = { ...g, id: genId(), history: g.history ?? [] };
    setGoals((prev) => [...prev, newG]);
    writeGoalHistory(userId.current, newG.id, newG.history ?? []);
    supabase.from('goals').insert(goalToRow(newG, userId.current))
      .then(({ error }) => { if (error) console.error('[addGoal]', error); });
  }, []);

  const updateGoal = useCallback((id: string, data: Partial<Omit<Goal, 'id'>>) => {
    setGoals((prev) => prev.map((g) => (g.id === id ? { ...g, ...data } : g)));
    const row: Record<string, unknown> = {};
    if ('name'        in data) row.name        = data.name;
    if ('current'     in data) row.current     = data.current;
    if ('target'      in data) row.target      = data.target;
    if ('icon'        in data) row.icon        = data.icon;
    if ('color'       in data) row.color       = data.color;
    if ('description' in data) row.description = data.description;
    if ('history'     in data) writeGoalHistory(userId.current, id, data.history ?? []);
    if (Object.keys(row).length > 0)
      supabase.from('goals').update(row).eq('id', id).eq('user_id', userId.current)
        .then(({ error }) => { if (error) console.error('[updateGoal]', error); });
  }, []);

  const deleteGoal = useCallback((id: string) => {
    setGoals((prev) => prev.filter((g) => g.id !== id));
    removeGoalHistory(userId.current, id);
    supabase.from('goals').delete().eq('id', id).eq('user_id', userId.current)
      .then(({ error }) => { if (error) console.error('[deleteGoal]', error); });
  }, []);

  // ── Accounts ───────────────────────────────────────────────────────────────
  const addAccount = useCallback((a: Omit<Account, 'id'>): Account => {
    const newA: Account = { ...a, id: genId() };
    setAccounts((prev) => [...prev, newA]);
    supabase.from('accounts').insert(accountToRow(newA, userId.current))
      .then(({ error }) => { if (error) console.error('[addAccount]', error); });
    return newA;
  }, []);

  const updateAccount = useCallback((id: string, data: Partial<Omit<Account, 'id'>>) => {
    setAccounts((prev) => prev.map((a) => (a.id === id ? { ...a, ...data } : a)));
    const row: Record<string, unknown> = {};
    if ('institutionId' in data) row.institution_id = data.institutionId ?? null;
    if ('name'          in data) row.name           = data.name;
    if ('type'          in data) row.type           = data.type;
    if ('balance'       in data) row.balance        = data.balance;
    if ('agency'        in data) row.agency         = data.agency ?? null;
    if ('accountNumber' in data) row.account_number = data.accountNumber ?? null;
    if ('color'         in data) row.color          = data.color;
    if ('textColor'     in data) row.text_color     = data.textColor;
    if ('accentColor'   in data) row.accent_color   = data.accentColor;
    if ('logo'          in data) row.logo           = data.logo ?? null;
    if ('brand'         in data) row.brand          = data.brand;
    if ('code'          in data) row.code           = data.code;
    if (Object.keys(row).length > 0)
      supabase.from('accounts').update(row).eq('id', id).eq('user_id', userId.current)
        .then(({ error }) => { if (error) console.error('[updateAccount]', error); });
  }, []);

  const deleteAccount = useCallback((id: string) => {
    setAccounts((prev) => prev.filter((a) => a.id !== id));
    supabase.from('accounts').delete().eq('id', id).eq('user_id', userId.current)
      .then(({ error }) => { if (error) console.error('[deleteAccount]', error); });
  }, []);

  // ── Custom categories ───────────────────────────────────────────────────────
  const addCategory = useCallback((c: Omit<CustomCategory, 'isCustom'>) => {
    setCustomCategories((prev) => {
      const next = [...prev, { ...c, isCustom: true as const }];
      saveCustomCategories(userId.current, next);
      return next;
    });
  }, []);

  const updateCategory = useCallback((name: string, data: Partial<Pick<CustomCategory, 'name' | 'icon' | 'color'>>) => {
    setCustomCategories((prev) => {
      const next = prev.map((c) => (c.name === name ? { ...c, ...data } : c));
      saveCustomCategories(userId.current, next);
      return next;
    });
  }, []);

  const deleteCategory = useCallback((name: string) => {
    setCustomCategories((prev) => {
      const next = prev.filter((c) => c.name !== name);
      saveCustomCategories(userId.current, next);
      return next;
    });
  }, []);

  return (
    <AppDataContext.Provider value={{
      transactions, budgets, banks, goals, accounts, loaded,
      categories,
      addTransaction, updateTransaction, deleteTransaction,
      setBudget, deleteBudget,
      addBank, updateBank, deleteBank,
      addGoal, updateGoal, deleteGoal,
      addAccount, updateAccount, deleteAccount,
      addCategory, updateCategory, deleteCategory,
    }}>
      {children}
    </AppDataContext.Provider>
  );
}

export const useAppData = () => useContext(AppDataContext);
