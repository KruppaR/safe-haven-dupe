-- Plaid items (bank connection per elder)
CREATE TABLE public.plaid_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  elder_id UUID NOT NULL REFERENCES public.elders(id) ON DELETE CASCADE,
  caregiver_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plaid_item_id TEXT NOT NULL UNIQUE,
  plaid_access_token TEXT,
  institution_name TEXT,
  institution_id TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.plaid_items TO authenticated;
GRANT ALL ON public.plaid_items TO service_role;
ALTER TABLE public.plaid_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Caregiver manages own plaid_items" ON public.plaid_items FOR ALL TO authenticated
  USING (auth.uid() = caregiver_id)
  WITH CHECK (auth.uid() = caregiver_id);

-- Bank accounts
CREATE TABLE public.accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plaid_item_id UUID NOT NULL REFERENCES public.plaid_items(id) ON DELETE CASCADE,
  elder_id UUID NOT NULL REFERENCES public.elders(id) ON DELETE CASCADE,
  plaid_account_id TEXT NOT NULL,
  name TEXT NOT NULL,
  official_name TEXT,
  subtype TEXT,
  mask TEXT,
  current_balance NUMERIC(12,2),
  available_balance NUMERIC(12,2),
  currency TEXT DEFAULT 'USD',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (plaid_item_id, plaid_account_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.accounts TO authenticated;
GRANT ALL ON public.accounts TO service_role;
ALTER TABLE public.accounts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Caregiver manages own accounts" ON public.accounts FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.elders e WHERE e.id = elder_id AND e.caregiver_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.elders e WHERE e.id = elder_id AND e.caregiver_id = auth.uid()));

-- Transactions
CREATE TABLE public.transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
  elder_id UUID NOT NULL REFERENCES public.elders(id) ON DELETE CASCADE,
  plaid_transaction_id TEXT NOT NULL UNIQUE,
  amount NUMERIC(12,2) NOT NULL,
  name TEXT NOT NULL,
  merchant_name TEXT,
  category JSONB,
  payment_channel TEXT,
  pending BOOLEAN NOT NULL DEFAULT false,
  iso_currency_code TEXT DEFAULT 'USD',
  date DATE NOT NULL,
  location JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.transactions TO authenticated;
GRANT ALL ON public.transactions TO service_role;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Caregiver manages own transactions" ON public.transactions FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.elders e WHERE e.id = elder_id AND e.caregiver_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.elders e WHERE e.id = elder_id AND e.caregiver_id = auth.uid()));
CREATE INDEX transactions_elder_date_idx ON public.transactions (elder_id, date DESC);
CREATE INDEX transactions_account_idx ON public.transactions (account_id, date DESC);

-- Known payees for new-payee detection
CREATE TABLE public.known_payees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  elder_id UUID NOT NULL REFERENCES public.elders(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  normalized_name TEXT NOT NULL,
  first_seen DATE NOT NULL,
  last_seen DATE NOT NULL,
  transaction_count INT NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (elder_id, normalized_name)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.known_payees TO authenticated;
GRANT ALL ON public.known_payees TO service_role;
ALTER TABLE public.known_payees ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Caregiver manages own known_payees" ON public.known_payees FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.elders e WHERE e.id = elder_id AND e.caregiver_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.elders e WHERE e.id = elder_id AND e.caregiver_id = auth.uid()));
