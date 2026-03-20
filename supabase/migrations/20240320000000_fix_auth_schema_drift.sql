-- Fix: Supabase Auth 500 "Database error querying schema" and stabilize logout
-- 1. Ensure token columns do not contain NULL to avoid GoTrue scan errors (Go version mismatch bug)
UPDATE auth.users 
SET 
  confirmation_token = COALESCE(confirmation_token, ''),
  recovery_token = COALESCE(recovery_token, ''),
  email_change_token_new = COALESCE(email_change_token_new, ''),
  is_super_admin = COALESCE(is_super_admin, false)
WHERE 
  confirmation_token IS NULL OR 
  recovery_token IS NULL OR 
  email_change_token_new IS NULL OR 
  is_super_admin IS NULL;

-- 2. Fixed custom RPC admin_reset_password to use '' instead of NULL for tokens
CREATE OR REPLACE FUNCTION public.admin_reset_password(target_user_id UUID, new_password TEXT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    caller_role TEXT;
    hashed_password TEXT;
BEGIN
    SELECT role INTO caller_role FROM public.profiles WHERE id = auth.uid();
    IF caller_role != 'admin' THEN
        RAISE EXCEPTION 'Acesso negado.';
    END IF;

    hashed_password := extensions.crypt(new_password, extensions.gen_salt('bf', 10));

    DELETE FROM auth.refresh_tokens WHERE session_id IN (SELECT id FROM auth.sessions WHERE user_id = target_user_id);
    DELETE FROM auth.sessions WHERE user_id = target_user_id;

    UPDATE auth.users
    SET 
        encrypted_password = hashed_password,
        recovery_token = '',
        confirmation_token = '',
        email_change_token_new = '',
        last_sign_in_at = NULL,
        updated_at = NOW()
    WHERE id = target_user_id;
END;
$$;
