
-- Make karyakar_id optional and add a free-text name column
ALTER TABLE public.family_entries ALTER COLUMN karyakar_id DROP NOT NULL;
ALTER TABLE public.family_entries ADD COLUMN IF NOT EXISTS karyakar_name text;

-- Drop existing auth-based policies
DROP POLICY IF EXISTS "Karyakars view own entries, admins view all" ON public.family_entries;
DROP POLICY IF EXISTS "Karyakars insert own entries" ON public.family_entries;
DROP POLICY IF EXISTS "Karyakars update own, admins update all" ON public.family_entries;
DROP POLICY IF EXISTS "Karyakars delete own, admins delete all" ON public.family_entries;

-- Open public access policies
CREATE POLICY "Public can view entries" ON public.family_entries FOR SELECT USING (true);
CREATE POLICY "Public can insert entries" ON public.family_entries FOR INSERT WITH CHECK (true);
CREATE POLICY "Public can update entries" ON public.family_entries FOR UPDATE USING (true);
CREATE POLICY "Public can delete entries" ON public.family_entries FOR DELETE USING (true);
