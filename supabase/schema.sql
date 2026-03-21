-- ============================================================
-- Desafio Controle Financeiro - Supabase Schema
-- ⚠️  ATENÇÃO: Este arquivo APAGA TODOS OS DADOS e recria o banco do zero.
--     Use APENAS para criar um novo ambiente (dev/staging).
--     Para atualizar um banco existente, use os arquivos em migrations/
-- ============================================================

-- Drop existing tables (clean slate)
drop table if exists transactions cascade;
drop table if exists banks cascade;
drop table if exists accounts cascade;
drop table if exists budgets cascade;
drop table if exists goals cascade;
drop table if exists custom_categories cascade;
drop table if exists users cascade;

-- Tables
create table users (
  id              uuid primary key default gen_random_uuid(),
  auth_user_id    uuid unique,
  full_name       text not null,
  email           text not null,
  cpf             text not null unique,
  status          smallint not null default 1,
  source          text not null default 'manual',
  kiwify_order_id text,
  kiwify_payload  jsonb,
  plan            text not null default 'free' check (plan in ('free', 'basic', 'premium')),
  plan_expires_at timestamptz,
  registered_at   timestamptz,
  updated_at      timestamptz,
  created_at      timestamptz default now()
);

create table accounts (
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

create table banks (
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
  account_id          text references accounts(id) on delete set null,
  created_at          timestamptz default now()
);

create table transactions (
  id          text primary key,
  user_id     text not null,
  label       text not null,
  amount      numeric not null,
  date        text not null,
  category    text not null,
  type        text not null,
  icon        text not null,
  color       text not null,
  bank_id      text references banks(id) on delete cascade,
  account_id   text references accounts(id) on delete set null,
  description  text,
  payment_type text check (payment_type in ('pix', 'debit', 'credit')),
  created_at   timestamptz default now()
);

create table budgets (
  id           text primary key,
  user_id      text not null,
  category     text not null,
  limit_amount numeric not null,
  color        text not null,
  created_at   timestamptz default now()
);

create table custom_categories (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references users(id) on delete cascade,
  name       text not null,
  icon       text not null default 'tag',
  color      text not null default '#6b7280',
  updated_at timestamptz,
  created_at timestamptz default now()
);

create table goals (
  id          text primary key,
  user_id     text not null,
  name        text not null,
  current     numeric not null default 0,
  target      numeric not null,
  icon        text not null,
  color       text not null,
  description text not null,
  history     jsonb not null default '[]'::jsonb,
  created_at  timestamptz default now()
);

-- updated_at trigger function
create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger set_users_updated_at
  before update on users
  for each row execute function set_updated_at();

create trigger set_custom_categories_updated_at
  before update on custom_categories
  for each row execute function set_updated_at();

create or replace function public.hard_delete_auth_user(target_user_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public, auth
as $$
begin
  delete from auth.users where id = target_user_id;
  return found;
end;
$$;

revoke all on function public.hard_delete_auth_user(uuid) from public, anon, authenticated;
grant execute on function public.hard_delete_auth_user(uuid) to service_role;

-- Indexes
create index users_auth_user_id_idx on users(auth_user_id);
create index users_status_idx on users(status);
create index accounts_user_id_idx on accounts(user_id);
create index banks_user_id_idx on banks(user_id);
create index transactions_user_id_idx on transactions(user_id);
create index transactions_bank_id_idx on transactions(bank_id);
create index transactions_account_id_idx on transactions(account_id);
create index budgets_user_id_idx on budgets(user_id);
create index goals_user_id_idx on goals(user_id);
create index custom_categories_user_id_idx on custom_categories(user_id);

-- Row Level Security
alter table users enable row level security;
alter table accounts enable row level security;
alter table banks enable row level security;
alter table transactions enable row level security;
alter table budgets enable row level security;
alter table goals enable row level security;
alter table custom_categories enable row level security;

-- Each user can only see and manage their own data
create policy "users: own data"
  on users for select
  using (auth.uid() = auth_user_id);

create policy "accounts: own data"
  on accounts for all
  using (auth.uid()::text = user_id);

create policy "banks: own data"
  on banks for all
  using (auth.uid()::text = user_id);

create policy "transactions: own data"
  on transactions for all
  using (auth.uid()::text = user_id);

create policy "budgets: own data"
  on budgets for all
  using (auth.uid()::text = user_id);

create policy "goals: own data"
  on goals for all
  using (auth.uid()::text = user_id);

create policy "custom_categories: own data"
  on custom_categories for all
  using (
    user_id = (select id from users where auth_user_id = auth.uid())
  )
  with check (
    user_id = (select id from users where auth_user_id = auth.uid())
  );
