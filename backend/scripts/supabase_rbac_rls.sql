-- ==============================================================================
-- AquaVane Supabase Role-Based Access Control (RBAC) & Row-Level Security (RLS)
-- ==============================================================================
-- Run this migration in the Supabase SQL Editor to enforce database-level RBAC
-- for Google OAuth and email-authenticated users.
-- ==============================================================================

-- 1. Ensure extensions and tables exist
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Ensure profiles table has proper schema
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    display_name VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'viewer',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Index on role for fast permission lookups
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);

-- Ensure saved_plans table has created_by column
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'saved_plans' AND column_name = 'created_by'
    ) THEN
        ALTER TABLE public.saved_plans ADD COLUMN created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_saved_plans_created_by ON public.saved_plans(created_by);

-- ------------------------------------------------------------------------------
-- 2. Helper Functions for RBAC checks in SQL Policies
-- ------------------------------------------------------------------------------

-- Function: Get current authenticated user's role from profiles table
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS VARCHAR AS $$
    SELECT role FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- Function: Check if current user is an Admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() AND role = 'admin'
    );
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- Function: Check if current user is a Planner or Admin
CREATE OR REPLACE FUNCTION public.is_planner_or_admin()
RETURNS BOOLEAN AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() AND role IN ('admin', 'planner', 'officer')
    );
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- ------------------------------------------------------------------------------
-- 3. Automatic Profile Creation Trigger on Google OAuth Sign-in
-- ------------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    user_count INTEGER;
    initial_role VARCHAR(50);
    full_name VARCHAR(255);
BEGIN
    -- Check how many profiles currently exist
    SELECT count(*) INTO user_count FROM public.profiles;
    
    -- The very first user registering on AquaVane becomes the super 'admin'
    -- Subsequent users default to 'planner' (or 'viewer')
    IF user_count = 0 THEN
        initial_role := 'admin';
    ELSE
        initial_role := COALESCE(NEW.raw_user_meta_data->>'role', 'planner');
    END IF;

    -- Extract full name from Google metadata or email
    full_name := COALESCE(
        NEW.raw_user_meta_data->>'full_name',
        NEW.raw_user_meta_data->>'name',
        split_part(NEW.email, '@', 1),
        'Watershed User'
    );

    INSERT INTO public.profiles (id, display_name, role, created_at, updated_at)
    VALUES (
        NEW.id,
        full_name,
        initial_role,
        timezone('utc'::text, now()),
        timezone('utc'::text, now())
    )
    ON CONFLICT (id) DO UPDATE
    SET 
        display_name = EXCLUDED.display_name,
        updated_at = timezone('utc'::text, now());

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Bind trigger to auth.users table
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ------------------------------------------------------------------------------
-- 4. Enable Row Level Security (RLS)
-- ------------------------------------------------------------------------------

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saved_plans ENABLE ROW LEVEL SECURITY;

-- ------------------------------------------------------------------------------
-- 5. RLS Policies: public.profiles
-- ------------------------------------------------------------------------------

-- Policy: Anyone authenticated can read user profiles
DROP POLICY IF EXISTS "Allow authenticated read on profiles" ON public.profiles;
CREATE POLICY "Allow authenticated read on profiles"
    ON public.profiles FOR SELECT
    TO authenticated
    USING (true);

-- Policy: User can update their own display name (but cannot elevate their own role)
DROP POLICY IF EXISTS "Users can update own display name" ON public.profiles;
CREATE POLICY "Users can update own display name"
    ON public.profiles FOR UPDATE
    TO authenticated
    USING (auth.uid() = id)
    WITH CHECK (
        auth.uid() = id AND 
        (role = (SELECT role FROM public.profiles WHERE id = auth.uid()) OR public.is_admin())
    );

-- Policy: Admins can update any user's profile and elevate roles
DROP POLICY IF EXISTS "Admins can update any profile" ON public.profiles;
CREATE POLICY "Admins can update any profile"
    ON public.profiles FOR UPDATE
    TO authenticated
    USING (public.is_admin());

-- Policy: Admins can delete user profiles
DROP POLICY IF EXISTS "Admins can delete profiles" ON public.profiles;
CREATE POLICY "Admins can delete profiles"
    ON public.profiles FOR DELETE
    TO authenticated
    USING (public.is_admin());

-- ------------------------------------------------------------------------------
-- 6. RLS Policies: public.saved_plans
-- ------------------------------------------------------------------------------

-- Policy: Anyone (authenticated or public) can view saved plans & DPR proposals
DROP POLICY IF EXISTS "Allow reading saved plans" ON public.saved_plans;
CREATE POLICY "Allow reading saved plans"
    ON public.saved_plans FOR SELECT
    USING (true);

-- Policy: Only Planners and Admins can create saved restoration plans
DROP POLICY IF EXISTS "Planners and Admins can insert saved plans" ON public.saved_plans;
CREATE POLICY "Planners and Admins can insert saved plans"
    ON public.saved_plans FOR INSERT
    TO authenticated
    WITH CHECK (public.is_planner_or_admin());

-- Policy: Planners can update their own plans; Admins can update any
DROP POLICY IF EXISTS "Users can update own plans or admin" ON public.saved_plans;
CREATE POLICY "Users can update own plans or admin"
    ON public.saved_plans FOR UPDATE
    TO authenticated
    USING (created_by = auth.uid() OR public.is_admin())
    WITH CHECK (created_by = auth.uid() OR public.is_admin());

-- Policy: Only Admins can delete saved restoration plans
DROP POLICY IF EXISTS "Admins can delete saved plans" ON public.saved_plans;
CREATE POLICY "Admins can delete saved plans"
    ON public.saved_plans FOR DELETE
    TO authenticated
    USING (public.is_admin());

-- ==============================================================================
-- End of RBAC & RLS Configuration
-- ==============================================================================

