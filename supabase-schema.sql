-- Supabase Schema for LabLend

-- Se você já havia criado as tabelas antigas, os comandos abaixo as apagarão (cuidado, isso apaga os dados existentes!):
DROP TABLE IF EXISTS public.loans;
DROP TABLE IF EXISTS public.equipments;
DROP TABLE IF EXISTS public.users;

-- 1. Create Users Table
CREATE TABLE public.users (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  document_id text,
  email text,
  role text DEFAULT 'user'::text NOT NULL CHECK (role IN ('admin', 'user')),
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Helper function to check se user é admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own data or admins view all" 
ON public.users FOR SELECT TO authenticated 
USING (id = auth.uid() OR public.is_admin());

CREATE POLICY "Users can update own data or admins update all" 
ON public.users FOR UPDATE TO authenticated 
USING (id = auth.uid() OR public.is_admin());

CREATE POLICY "Admins can insert users" 
ON public.users FOR INSERT TO authenticated 
WITH CHECK (public.is_admin());

CREATE POLICY "Admins can delete users" 
ON public.users FOR DELETE TO authenticated 
USING (public.is_admin());

-- 2. Create Equipments Table
CREATE TABLE public.equipments (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  asset_tag text NOT NULL UNIQUE,
  equipment_type text NOT NULL CHECK (equipment_type IN ('notebook', 'celular', 'tablet')),
  model text NOT NULL,
  status text DEFAULT 'available'::text NOT NULL CHECK (status IN ('available', 'in_use', 'maintenance')),
  condition text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.equipments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view equipments" 
ON public.equipments FOR SELECT TO authenticated 
USING (true);

CREATE POLICY "Admins can insert equipments" 
ON public.equipments FOR INSERT TO authenticated 
WITH CHECK (public.is_admin());

CREATE POLICY "Admins can update equipments" 
ON public.equipments FOR UPDATE TO authenticated 
USING (public.is_admin());

CREATE POLICY "Admins can delete equipments" 
ON public.equipments FOR DELETE TO authenticated 
USING (public.is_admin());

-- 3. Create Loans Table
CREATE TABLE public.loans (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  equipment_id uuid NOT NULL REFERENCES public.equipments(id) ON DELETE CASCADE,
  borrowed_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  expected_return_at timestamp with time zone NOT NULL,
  returned_at timestamp with time zone,
  status text DEFAULT 'active'::text NOT NULL CHECK (status IN ('active', 'returned', 'overdue'))
);

ALTER TABLE public.loans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own loans, admins view all" 
ON public.loans FOR SELECT TO authenticated 
USING (user_id = auth.uid() OR public.is_admin());

CREATE POLICY "Admins can insert loans" 
ON public.loans FOR INSERT TO authenticated 
WITH CHECK (public.is_admin());

CREATE POLICY "Admins can update loans" 
ON public.loans FOR UPDATE TO authenticated 
USING (public.is_admin());

CREATE POLICY "Admins can delete loans" 
ON public.loans FOR DELETE TO authenticated 
USING (public.is_admin());

-- 4. Função e Trigger para sincronizar auth.users com public.users automaticamente
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
  is_first_user boolean;
BEGIN
  -- O primeiro usuário a se registrar recebe o cargo de 'admin'
  SELECT NOT EXISTS (SELECT 1 FROM public.users) INTO is_first_user;

  INSERT INTO public.users (id, name, email, role)
  VALUES (
    new.id, 
    COALESCE(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)), 
    new.email,
    CASE WHEN is_first_user THEN 'admin' ELSE 'user' END
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();