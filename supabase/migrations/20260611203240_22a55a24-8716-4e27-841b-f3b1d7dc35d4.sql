
-- Profiles
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Caregiver reads own profile" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "Caregiver updates own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id);
CREATE POLICY "Caregiver inserts own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email));
  RETURN NEW;
END; $$;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Elders
CREATE TABLE public.elders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  caregiver_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL,
  relationship TEXT NOT NULL,
  phone TEXT,
  consent_acknowledged_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.elders TO authenticated;
GRANT ALL ON public.elders TO service_role;
ALTER TABLE public.elders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Caregiver manages own elders" ON public.elders FOR ALL TO authenticated
  USING (auth.uid() = caregiver_id) WITH CHECK (auth.uid() = caregiver_id);

-- Monitors
CREATE TYPE public.monitor_kind AS ENUM ('calls_sms','financial','identity');
CREATE TYPE public.monitor_status AS ENUM ('active','setup_needed','paused');
CREATE TABLE public.monitors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  elder_id UUID NOT NULL REFERENCES public.elders(id) ON DELETE CASCADE,
  kind public.monitor_kind NOT NULL,
  enabled BOOLEAN NOT NULL DEFAULT true,
  status public.monitor_status NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (elder_id, kind)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.monitors TO authenticated;
GRANT ALL ON public.monitors TO service_role;
ALTER TABLE public.monitors ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Caregiver manages own monitors" ON public.monitors FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.elders e WHERE e.id = elder_id AND e.caregiver_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.elders e WHERE e.id = elder_id AND e.caregiver_id = auth.uid()));

-- Alerts
CREATE TYPE public.alert_severity AS ENUM ('info','watch','urgent');
CREATE TYPE public.alert_category AS ENUM ('scam_call','suspicious_transaction','identity','forwarded_message');
CREATE TABLE public.alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  elder_id UUID NOT NULL REFERENCES public.elders(id) ON DELETE CASCADE,
  severity public.alert_severity NOT NULL,
  category public.alert_category NOT NULL,
  title TEXT NOT NULL,
  detail TEXT NOT NULL,
  source_excerpt TEXT,
  suggested_action TEXT,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.alerts TO authenticated;
GRANT ALL ON public.alerts TO service_role;
ALTER TABLE public.alerts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Caregiver manages own alerts" ON public.alerts FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.elders e WHERE e.id = elder_id AND e.caregiver_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.elders e WHERE e.id = elder_id AND e.caregiver_id = auth.uid()));
CREATE INDEX alerts_elder_created_idx ON public.alerts (elder_id, created_at DESC);

-- Triage checks (caregiver-initiated message scans)
CREATE TYPE public.triage_verdict AS ENUM ('safe','suspicious','scam');
CREATE TABLE public.triage_checks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  caregiver_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  elder_id UUID REFERENCES public.elders(id) ON DELETE SET NULL,
  input_text TEXT NOT NULL,
  verdict public.triage_verdict NOT NULL,
  confidence INT NOT NULL,
  signals JSONB NOT NULL DEFAULT '[]'::jsonb,
  recommendation TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.triage_checks TO authenticated;
GRANT ALL ON public.triage_checks TO service_role;
ALTER TABLE public.triage_checks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Caregiver manages own triage" ON public.triage_checks FOR ALL TO authenticated
  USING (auth.uid() = caregiver_id) WITH CHECK (auth.uid() = caregiver_id);
