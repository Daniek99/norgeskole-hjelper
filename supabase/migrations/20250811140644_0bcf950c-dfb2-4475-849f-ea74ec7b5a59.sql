-- Check if the issue is with RLS policies - allow unauthenticated users to read active invite codes
-- since users need to check invite codes before they can authenticate

-- Drop the restrictive policy that requires authentication
DROP POLICY IF EXISTS "any auth can read invites" ON public.admin_invite_links;

-- Create a new policy that allows anyone (including unauthenticated users) to read active invite codes
CREATE POLICY "anyone_can_read_active_invites" ON public.admin_invite_links
  FOR SELECT
  USING (active = true);

-- Keep the admin policy for full management
-- The "active invites readable" policy is redundant now, so we can drop it
DROP POLICY IF EXISTS "active invites readable" ON public.admin_invite_links;