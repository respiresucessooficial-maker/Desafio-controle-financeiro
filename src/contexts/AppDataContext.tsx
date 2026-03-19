'use client';

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useRef,
} from 'react';
import { Transaction, Budget, Bank, Goal, Account } from '@/types';
import { getCategoryDef } from '@/data/categories';
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
    bankId: r.bank_id ?? undefined, description: r.description ?? undefined,
  };
}
function transactionToRow(t: Transaction, userId: string) {
  return {
    id: t.id, user_id: userId,
    label: t.label, amount: t.amount, date: t.date,
    category: t.category, type: t.type, icon: t.icon, color: t.color,
    bank_id: t.bankId ?? null, description: t.description ?? null,
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
  addTransaction: (t: Omit<Transaction, 'id'>) => void;
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
  addAccount: (a: Omit<Account, 'id'>) => void;
  updateAccount: (id: string, data: Partial<Omit<Account, 'id'>>) => void;
  deleteAccount: (id: string) => void;
}

const AppDataContext = createContext<AppDataContextValue>({
  transactions: [], budgets: [], banks: [], goals: [], accounts: [], loaded: false,
  addTransaction: () => {}, updateTransaction: () => {}, deleteTransaction: () => {},
  setBudget: () => {}, deleteBudget: () => {},
  addBank: () => {}, updateBank: () => {}, deleteBank: () => {},
  addGoal: () => {}, updateGoal: () => {}, deleteGoal: () => {},
  addAccount: () => {}, updateAccount: () => {}, deleteAccount: () => {},
});

// ── Provider ──────────────────────────────────────────────────────────────────
export function AppDataProvider({ children }: { children: React.ReactNode }) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [budgets, setBudgets]           = useState<Budget[]>([]);
  const [banks, setBanks]               = useState<Bank[]>([]);
  const [goals, setGoals]               = useState<Goal[]>([]);
  const [accounts, setAccounts]         = useState<Account[]>([]);
  const [loaded, setLoaded]             = useState(false);
  const userId = useRef<string>('');

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
    setBudgets((budgetData ?? []).map(rowToBudget));
    setBanks(hydrateNetworks((bankData ?? []).map(rowToBank)));
    setGoals((goalData ?? []).map(rowToGoal));
    setAccounts((accData ?? []).map(rowToAccount));
    setLoaded(true);
  }

  // ── Listen to auth changes ─────────────────────────────────────────────────
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        loadForUser(session.user.id);
      } else {
        setLoaded(true);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        loadForUser(session.user.id);
      } else if (event === 'SIGNED_OUT') {
        userId.current = '';
        setTransactions([]); setBudgets([]); setBanks([]);
        setGoals([]); setAccounts([]); setLoaded(true);
      }
    });

    return () => subscription.unsubscribe();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Transactions ───────────────────────────────────────────────────────────
  const addTransaction = useCallback((t: Omit<Transaction, 'id'>) => {
    const catDef = getCategoryDef(t.category);
    const newT: Transaction = { ...t, id: genId(), icon: t.icon || catDef.icon, color: t.color || catDef.color };
    setTransactions((prev) => [newT, ...prev]);
    supabase.from('transactions').insert(transactionToRow(newT, userId.current))
      .then(({ error }) => { if (error) console.error('[addTransaction]', error); });
  }, []);

  const updateTransaction = useCallback((id: string, data: Partial<Omit<Transaction, 'id'>>) => {
    setTransactions((prev) => prev.map((t) => (t.id === id ? { ...t, ...data } : t)));
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
    setTransactions((prev) => prev.filter((t) => t.id !== id));
    supabase.from('transactions').delete().eq('id', id).eq('user_id', userId.current)
      .then(({ error }) => { if (error) console.error('[deleteTransaction]', error); });
  }, []);

  // ── Budgets ────────────────────────────────────────────────────────────────
  const setBudget = useCallback((b: Omit<Budget, 'id'>) => {
    setBudgets((prev) => {
      const exists = prev.find((x) => x.category === b.category);
      if (exists) {
        supabase.from('budgets').update({ limit_amount: b.limit, color: b.color })
          .eq('id', exists.id).eq('user_id', userId.current)
          .then(({ error }) => { if (error) console.error('[updateBudget]', error); });
        return prev.map((x) => (x.category === b.category ? { ...x, ...b } : x));
      }
      const newB = { ...b, id: genId() };
      supabase.from('budgets').insert(budgetToRow(newB, userId.current))
        .then(({ error }) => { if (error) console.error('[addBudget]', error); });
      return [...prev, newB];
    });
  }, []);

  const deleteBudget = useCallback((category: string) => {
    setBudgets((prev) => {
      const target = prev.find((b) => b.category === category);
      if (target) supabase.from('budgets').delete().eq('id', target.id).eq('user_id', userId.current)
        .then(({ error }) => { if (error) console.error('[deleteBudget]', error); });
      return prev.filter((b) => b.category !== category);
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
    const newG: Goal = { ...g, id: genId() };
    setGoals((prev) => [...prev, newG]);
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
    if (Object.keys(row).length > 0)
      supabase.from('goals').update(row).eq('id', id).eq('user_id', userId.current)
        .then(({ error }) => { if (error) console.error('[updateGoal]', error); });
  }, []);

  const deleteGoal = useCallback((id: string) => {
    setGoals((prev) => prev.filter((g) => g.id !== id));
    supabase.from('goals').delete().eq('id', id).eq('user_id', userId.current)
      .then(({ error }) => { if (error) console.error('[deleteGoal]', error); });
  }, []);

  // ── Accounts ───────────────────────────────────────────────────────────────
  const addAccount = useCallback((a: Omit<Account, 'id'>) => {
    const newA: Account = { ...a, id: genId() };
    setAccounts((prev) => [...prev, newA]);
    supabase.from('accounts').insert(accountToRow(newA, userId.current))
      .then(({ error }) => { if (error) console.error('[addAccount]', error); });
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

  return (
    <AppDataContext.Provider value={{
      transactions, budgets, banks, goals, accounts, loaded,
      addTransaction, updateTransaction, deleteTransaction,
      setBudget, deleteBudget,
      addBank, updateBank, deleteBank,
      addGoal, updateGoal, deleteGoal,
      addAccount, updateAccount, deleteAccount,
    }}>
      {children}
    </AppDataContext.Provider>
  );
}

export const useAppData = () => useContext(AppDataContext);
