-- ============================================================
-- Migration: Scaling improvements for commercialization
-- Date: 2026-03-21
-- ============================================================

-- ------------------------------------------------------------
-- 1. custom_categories table
--    Stores per-user custom transaction categories (migrated
--    from localStorage).
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS custom_categories (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name        text NOT NULL,
  icon        text NOT NULL DEFAULT 'tag',
  color       text NOT NULL DEFAULT '#6b7280',
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS custom_categories_user_id_idx
  ON custom_categories (user_id);

-- RLS
ALTER TABLE custom_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own custom categories"
  ON custom_categories
  FOR ALL
  USING (
    user_id = (
      SELECT id FROM users WHERE auth_user_id = auth.uid()
    )
  )
  WITH CHECK (
    user_id = (
      SELECT id FROM users WHERE auth_user_id = auth.uid()
    )
  );


-- ------------------------------------------------------------
-- 2. transactions.payment_type
--    Explicit payment method: 'pix' | 'debit' | 'credit'
--    Previously inferred from (bankId + accountId) presence.
-- ------------------------------------------------------------
ALTER TABLE transactions
  ADD COLUMN IF NOT EXISTS payment_type text
    CHECK (payment_type IN ('pix', 'debit', 'credit'));

-- Backfill existing rows using the implicit logic:
--   bankId + accountId → debit
--   bankId only        → credit
--   neither            → pix
UPDATE transactions
SET payment_type = CASE
  WHEN bank_id IS NOT NULL AND account_id IS NOT NULL THEN 'debit'
  WHEN bank_id IS NOT NULL AND account_id IS NULL      THEN 'credit'
  ELSE                                                      'pix'
END
WHERE payment_type IS NULL;


-- ------------------------------------------------------------
-- 3. users.plan + users.plan_expires_at
--    Subscription plan tracking for SaaS commercialization.
--    plan: 'free' | 'basic' | 'premium'
--    plan_expires_at: NULL = never expires (lifetime / internal)
-- ------------------------------------------------------------
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS plan text NOT NULL DEFAULT 'free'
    CHECK (plan IN ('free', 'basic', 'premium'));

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS plan_expires_at timestamptz;

-- Ensure all existing users default to 'free'
UPDATE users
SET plan = 'free'
WHERE plan IS NULL;


-- ------------------------------------------------------------
-- 4. updated_at triggers (optional but useful for auditing)
-- ------------------------------------------------------------

-- Helper function (idempotent)
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- custom_categories already has updated_at column above
DROP TRIGGER IF EXISTS set_custom_categories_updated_at ON custom_categories;
CREATE TRIGGER set_custom_categories_updated_at
  BEFORE UPDATE ON custom_categories
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- users table: add updated_at if not present
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS updated_at timestamptz;

UPDATE users SET updated_at = now() WHERE updated_at IS NULL;

DROP TRIGGER IF EXISTS set_users_updated_at ON users;
CREATE TRIGGER set_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
