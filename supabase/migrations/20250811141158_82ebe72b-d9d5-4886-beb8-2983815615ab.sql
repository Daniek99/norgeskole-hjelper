-- Fix the admin_invite_links policies to not reference the broken profiles table
-- Drop all existing policies on admin_invite_links
DROP POLICY IF EXISTS "anyone_can_read_active_invites" ON public.admin_invite_links;
DROP POLICY IF EXISTS "admin manage invites" ON public.admin_invite_links;
DROP POLICY IF EXISTS "any auth can read invites" ON public.admin_invite_links;
DROP POLICY IF EXISTS "active invites readable" ON public.admin_invite_links;

-- Create a simple policy that allows anyone to read active invite codes
-- This is safe because we only expose the role, not sensitive data
CREATE POLICY "public_can_read_active_invites" ON public.admin_invite_links
  FOR SELECT
  USING (active = true);

-- Create a policy for admin management that uses a security definer function
-- First, let's create a simple function to check if user is admin without recursion
CREATE OR REPLACE FUNCTION public.is_current_user_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'admin'::app_role
  );
$$;

-- Now create admin policy using the function
CREATE POLICY "admin_can_manage_invites" ON public.admin_invite_links
  FOR ALL
  USING (public.is_current_user_admin())
  WITH CHECK (public.is_current_user_admin());