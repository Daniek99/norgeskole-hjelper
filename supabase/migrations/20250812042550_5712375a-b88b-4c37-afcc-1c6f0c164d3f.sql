-- Fix all remaining functions without proper search_path
CREATE OR REPLACE FUNCTION public.register_with_invite(code text, name text, l1_code text, want_role text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
DECLARE
  _class uuid;
  _role  public.app_role;
BEGIN
  SELECT ail.classroom_id, ail.role
    INTO _class, _role
  FROM public.admin_invite_links AS ail
  WHERE ail.code = register_with_invite.code
    AND ail.active = true
  LIMIT 1;

  IF _class IS NULL THEN
    RAISE EXCEPTION 'Invalid or inactive invite code';
  END IF;

  -- Cast want_role to public.app_role for comparison
  IF (want_role::public.app_role) <> _role THEN
    RAISE EXCEPTION 'Invite link role mismatch: expected %, got %', _role, want_role;
  END IF;

  INSERT INTO public.profiles (id, name, l1, role, classroom_id)
  VALUES (auth.uid(), name, l1_code, _role, _class)
  ON CONFLICT (id) DO UPDATE
    SET name         = EXCLUDED.name,
        l1           = EXCLUDED.l1,
        role         = _role,
        classroom_id = _class;
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_invite_role(code text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
DECLARE
  role_text text;
BEGIN
  SELECT ail.role INTO role_text
  FROM public.admin_invite_links AS ail
  WHERE ail.code = get_invite_role.code
  AND ail.active = true;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Invalid or inactive invite code';
  END IF;
  
  RETURN role_text;
END;
$function$;

CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = 'public'
AS $function$
begin
  new.updated_at = now();
  return new;
end 
$function$;