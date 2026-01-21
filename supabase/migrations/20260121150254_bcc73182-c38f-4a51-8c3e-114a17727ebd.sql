-- Create enum for roles
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

-- Create admin_users table for role-based access
CREATE TABLE public.admin_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL DEFAULT 'user',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  UNIQUE (user_id, role)
);

-- Enable RLS
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

-- Security definer function to check roles (prevents infinite recursion)
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.admin_users
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- RLS: Only admins can view admin_users table
CREATE POLICY "Only admins can view admin_users"
ON public.admin_users
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- RLS: Only admins can manage admin_users
CREATE POLICY "Only admins can manage admin_users"
ON public.admin_users
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Update folders RLS: Only admins can manage
DROP POLICY IF EXISTS "Authenticated users can manage folders" ON public.folders;
CREATE POLICY "Admins can manage folders"
ON public.folders
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Update tracks RLS: Only admins can manage
DROP POLICY IF EXISTS "Authenticated users can manage tracks" ON public.tracks;
CREATE POLICY "Admins can manage tracks"
ON public.tracks
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Update leads RLS: Only admins can view leads
DROP POLICY IF EXISTS "Only authenticated users can view leads" ON public.leads;
CREATE POLICY "Only admins can view leads"
ON public.leads
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));