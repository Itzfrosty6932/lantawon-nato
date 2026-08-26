-- ============================================================================
-- MIGRATION 13: ADD ROLE COLUMN TO PROFILES TABLE
-- ============================================================================
-- Fix: RLS policies reference profiles.role but column doesn't exist
-- This migration adds the role column needed for admin authorization

-- Add role column to profiles table
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'user'
CHECK (role IN ('guest', 'user', 'moderator', 'editor', 'analyst', 'admin', 'super_admin'));

-- Create index for faster admin role lookups
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);

-- Update existing profiles to have 'user' role (if any exist)
UPDATE public.profiles SET role = 'user' WHERE role IS NULL;

-- Make role NOT NULL after setting defaults
ALTER TABLE public.profiles ALTER COLUMN role SET NOT NULL;

-- Create admin user helper function (optional - for manual admin creation)
CREATE OR REPLACE FUNCTION public.make_user_admin(user_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.profiles
  SET role = 'admin'
  WHERE id = user_id;
END;
$$;

-- Comment
COMMENT ON COLUMN public.profiles.role IS 'User role for authorization: guest, user, moderator, editor, analyst, admin, super_admin';
COMMENT ON FUNCTION public.make_user_admin IS 'Elevate a user to admin role - use carefully, requires SECURITY DEFINER';

-- ============================================================================
-- USAGE EXAMPLE (for reference only - do not execute in migration)
-- ============================================================================
-- To make a user an admin:
-- SELECT public.make_user_admin('user-uuid-here');
--
-- To check admin role:
-- SELECT id, display_name, role FROM public.profiles WHERE role = 'admin';
