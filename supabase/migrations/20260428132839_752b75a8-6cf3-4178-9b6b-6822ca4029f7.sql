
-- Roles enum and table
CREATE TYPE public.app_role AS ENUM ('admin', 'karyakar');

CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, role)
);

-- Security definer to check role without RLS recursion
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

-- Auto-create profile + default karyakar role on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, name, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    NEW.email
  );
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'karyakar');
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Family entries
CREATE SEQUENCE public.family_number_seq START 1001;

CREATE TABLE public.family_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  karyakar_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  visit_date DATE NOT NULL,
  family_number BIGINT NOT NULL UNIQUE DEFAULT nextval('public.family_number_seq'),
  child_name TEXT NOT NULL,
  father_name TEXT NOT NULL,
  mother_name TEXT NOT NULL,
  surname TEXT NOT NULL,
  standard TEXT,
  date_of_birth DATE,
  school_name TEXT,
  home_address TEXT,
  father_mobile TEXT,
  mother_mobile TEXT,
  category TEXT NOT NULL CHECK (category IN ('Satsangi', 'Non-Satsangi')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_family_entries_karyakar ON public.family_entries(karyakar_id);
CREATE INDEX idx_family_entries_visit_date ON public.family_entries(visit_date);

CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

CREATE TRIGGER family_entries_updated_at
  BEFORE UPDATE ON public.family_entries
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.family_entries ENABLE ROW LEVEL SECURITY;

-- profiles
CREATE POLICY "Users view own profile" ON public.profiles FOR SELECT
  USING (auth.uid() = id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Users update own profile" ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- user_roles
CREATE POLICY "Users view own roles" ON public.user_roles FOR SELECT
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins manage roles" ON public.user_roles FOR ALL
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- family_entries
CREATE POLICY "Karyakars view own entries, admins view all" ON public.family_entries FOR SELECT
  USING (auth.uid() = karyakar_id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Karyakars insert own entries" ON public.family_entries FOR INSERT
  WITH CHECK (auth.uid() = karyakar_id);
CREATE POLICY "Karyakars update own, admins update all" ON public.family_entries FOR UPDATE
  USING (auth.uid() = karyakar_id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Karyakars delete own, admins delete all" ON public.family_entries FOR DELETE
  USING (auth.uid() = karyakar_id OR public.has_role(auth.uid(), 'admin'));
