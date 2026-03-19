-- ============================================================
-- Desafio Controle Financeiro — Supabase Schema
-- Run this in the Supabase SQL Editor
-- ============================================================

create table if not exists accounts (
  id             text primary key,
  user_id        text not null,
  institution_id text,
  name           text not null,
  type           text not null,
  balance        numeric not null default 0,
  agency         text,
  account_number text,
  color          text not null,
  text_color     text not null,
  accent_color   text not null,
  logo           text,
  brand          text not null,
  code           text not null,
  created_at     timestamptz default now()
);

create table if not exists banks (
  id                  text primary key,
  user_id             text not null,
  name                text not null,
  brand               text not null,
  code                text not null,
  balance             numeric not null default 0,
  number              text not null,
  color               text not null,
  text_color          text not null,
  accent_color        text not null,
  logo                text,
  network             text,
  credit_limit        numeric,
  credit_used         numeric,
  closing_day         integer,
  due_day             integer,
  invoice_status      text,
  last_invoice_amount numeric,
  account_id          text,
  created_at          timestamptz default now()
);

create table if not exists transactions (
  id          text primary key,
  user_id     text not null,
  label       text not null,
  amount      numeric not null,
  date        text not null,
  category    text not null,
  type        text not null,
  icon        text not null,
  color       text not null,
  bank_id     text,
  description text,
  created_at  timestamptz default now()
);

create table if not exists budgets (
  id           text primary key,
  user_id      text not null,
  category     text not null,
  limit_amount numeric not null,
  color        text not null,
  created_at   timestamptz default now()
);

create table if not exists goals (
  id          text primary key,
  user_id     text not null,
  name        text not null,
  current     numeric not null default 0,
  target      numeric not null,
  icon        text not null,
  color       text not null,
  description text not null,
  created_at  timestamptz default now()
);

-- ── Indexes ──────────────────────────────────────────────────────────────────
create index if not exists accounts_user_id_idx     on accounts(user_id);
create index if not exists banks_user_id_idx        on banks(user_id);
create index if not exists transactions_user_id_idx on transactions(user_id);
create index if not exists budgets_user_id_idx      on budgets(user_id);
create index if not exists goals_user_id_idx        on goals(user_id);

-- ── Row Level Security ────────────────────────────────────────────────────────
alter table accounts     enable row level security;
alter table banks        enable row level security;
alter table transactions enable row level security;
alter table budgets      enable row level security;
alter table goals        enable row level security;

-- Each user can only see and manage their own data
create policy "accounts: own data"     on accounts     for all using (auth.uid()::text = user_id);
create policy "banks: own data"        on banks        for all using (auth.uid()::text = user_id);
create policy "transactions: own data" on transactions for all using (auth.uid()::text = user_id);
create policy "budgets: own data"      on budgets      for all using (auth.uid()::text = user_id);
create policy "goals: own data"        on goals        for all using (auth.uid()::text = user_id);
