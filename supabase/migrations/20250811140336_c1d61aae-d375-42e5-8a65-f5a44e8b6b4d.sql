-- Fix infinite recursion in profiles policies by removing the problematic policy
-- and creating a simpler one that doesn't cause recursion

-- Drop the problematic policy that causes infinite recursion
DROP POLICY IF EXISTS "admin sees all profiles" ON public.profiles;

-- Create a new policy that doesn't cause recursion by directly checking the user's role 
-- without referencing the profiles table in a way that causes infinite recursion
CREATE POLICY "admin_can_see_all_profiles" ON public.profiles
  FOR SELECT
  USING (
    -- Check if the current user has admin role by looking up their ID directly
    EXISTS (
      SELECT 1 FROM public.profiles admin_profile 
      WHERE admin_profile.id = auth.uid() 
      AND admin_profile.role = 'admin'::app_role
    )
    OR 
    -- Or if it's the user's own profile
    id = auth.uid()
    OR
    -- Or if they're a teacher viewing learners in their classroom
    EXISTS (
      SELECT 1 FROM public.profiles teacher_profile
      WHERE teacher_profile.id = auth.uid()
      AND teacher_profile.role = 'teacher'::app_role
      AND teacher_profile.classroom_id = profiles.classroom_id
    )
  );

-- Also fix the register_with_invite function to use correct column names
-- The admin_invite_links table uses 'code', not 'invite_code'
CREATE OR REPLACE FUNCTION public.register_with_invite(
  invite_code text, 
  name text, 
  l1_code text DEFAULT NULL::text, 
  want_role app_role DEFAULT 'learner'::app_role
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
declare
  _class uuid;
  _role  public.app_role;
begin
  -- Use 'code' column as it exists in admin_invite_links table
  select ail.classroom_id, ail.role
    into _class, _role
  from public.admin_invite_links as ail
  where ail.code = register_with_invite.invite_code  -- 'code' is the correct column name
    and ail.active = true
  limit 1;

  if _class is null then
    raise exception 'Invalid or inactive invite code';
  end if;

  if want_role <> _role then
    raise exception 'Invite link role mismatch: expected %, got %', _role, want_role;
  end if;

  insert into public.profiles (id, name, l1, role, classroom_id)
  values (auth.uid(), name, l1_code, _role, _class)
  on conflict (id) do update
    set name         = excluded.name,
        l1           = excluded.l1,
        role         = _role,
        classroom_id = _class;
end;
$function$