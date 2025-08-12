-- Fix infinite recursion in profiles table policies
-- Drop all existing policies on profiles table that cause recursion
DROP POLICY IF EXISTS "admin_can_see_all_profiles" ON public.profiles;
DROP POLICY IF EXISTS "profiles self read" ON public.profiles;
DROP POLICY IF EXISTS "profiles self write" ON public.profiles;
DROP POLICY IF EXISTS "teacher sees class learners" ON public.profiles;

-- Create simple, non-recursive policies for profiles table
-- Users can always read and update their own profile
CREATE POLICY "users_can_read_own_profile" ON public.profiles
  FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "users_can_update_own_profile" ON public.profiles
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Teachers can see learners in their classroom (using a security definer function to avoid recursion)
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS text
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = 'public'
AS $$
  SELECT role::text FROM public.profiles WHERE id = auth.uid();
$$;

CREATE OR REPLACE FUNCTION public.get_current_user_classroom()
RETURNS uuid
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = 'public'
AS $$
  SELECT classroom_id FROM public.profiles WHERE id = auth.uid();
$$;

-- Now create policies using these functions
CREATE POLICY "teachers_can_see_classroom_profiles" ON public.profiles
  FOR SELECT
  USING (
    -- User can see their own profile
    auth.uid() = id 
    OR 
    -- Admin can see all profiles
    public.get_current_user_role() = 'admin'
    OR
    -- Teachers can see profiles in their classroom
    (public.get_current_user_role() = 'teacher' AND classroom_id = public.get_current_user_classroom())
  );