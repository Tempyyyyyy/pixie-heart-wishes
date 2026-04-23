CREATE TABLE public.minecraft_accounts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  username TEXT NOT NULL,
  account_type TEXT NOT NULL DEFAULT 'offline',
  uuid TEXT,
  is_active BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (account_type IN ('offline', 'microsoft')),
  CHECK (username ~ '^[A-Za-z0-9_]{1,16}$')
);

CREATE INDEX idx_mc_accounts_user ON public.minecraft_accounts(user_id);
CREATE UNIQUE INDEX idx_mc_accounts_one_active
  ON public.minecraft_accounts(user_id) WHERE is_active = true;

ALTER TABLE public.minecraft_accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own mc accounts"
  ON public.minecraft_accounts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users insert own mc accounts"
  ON public.minecraft_accounts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own mc accounts"
  ON public.minecraft_accounts FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users delete own mc accounts"
  ON public.minecraft_accounts FOR DELETE
  USING (auth.uid() = user_id);

CREATE TRIGGER mc_accounts_updated_at
  BEFORE UPDATE ON public.minecraft_accounts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();