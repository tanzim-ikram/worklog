-- ============================================
-- WorkLog Database Setup - Combined Migration
-- ============================================
-- Run this entire script in Supabase SQL Editor
-- This creates all tables, policies, and triggers needed

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- 1. CREATE TABLES
-- ============================================

-- Profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  timezone TEXT NOT NULL DEFAULT 'UTC',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Projects table (optional)
CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Work sessions table
CREATE TABLE IF NOT EXISTS work_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  local_date DATE NOT NULL,
  note TEXT,
  project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Work segments table
CREATE TABLE IF NOT EXISTS work_segments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES work_sessions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  start_at TIMESTAMPTZ NOT NULL,
  end_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 2. CREATE INDEXES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_work_segments_user_id_start_at ON work_segments(user_id, start_at);
CREATE INDEX IF NOT EXISTS idx_work_sessions_user_id_local_date ON work_sessions(user_id, local_date);
CREATE INDEX IF NOT EXISTS idx_projects_user_id ON projects(user_id);

-- Partial unique index to enforce at most one running segment per user
CREATE UNIQUE INDEX IF NOT EXISTS idx_work_segments_one_running_per_user 
ON work_segments(user_id) 
WHERE end_at IS NULL;

-- ============================================
-- 3. CREATE CONSTRAINTS
-- ============================================

-- Check constraint: end_at must be after start_at (if not null)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'check_end_after_start'
  ) THEN
    ALTER TABLE work_segments 
    ADD CONSTRAINT check_end_after_start 
    CHECK (end_at IS NULL OR end_at > start_at);
  END IF;
END $$;

-- ============================================
-- 4. CREATE FUNCTIONS
-- ============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to automatically create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  user_timezone TEXT;
BEGIN
  -- Try to get timezone from browser (default to UTC if not available)
  -- In practice, this will be set via the app, but we initialize with UTC
  user_timezone := COALESCE(current_setting('app.user_timezone', true), 'UTC');
  
  INSERT INTO public.profiles (id, timezone)
  VALUES (NEW.id, user_timezone)
  ON CONFLICT (id) DO NOTHING;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 5. CREATE TRIGGERS
-- ============================================

-- Triggers for updated_at
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_projects_updated_at ON projects;
CREATE TRIGGER update_projects_updated_at
  BEFORE UPDATE ON projects
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_work_sessions_updated_at ON work_sessions;
CREATE TRIGGER update_work_sessions_updated_at
  BEFORE UPDATE ON work_sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger to create profile when user signs up
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- 6. ENABLE ROW LEVEL SECURITY
-- ============================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE work_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE work_segments ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 7. CREATE RLS POLICIES
-- ============================================

-- Drop existing policies if they exist (for re-running)
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;

DROP POLICY IF EXISTS "Users can view own projects" ON projects;
DROP POLICY IF EXISTS "Users can insert own projects" ON projects;
DROP POLICY IF EXISTS "Users can update own projects" ON projects;
DROP POLICY IF EXISTS "Users can delete own projects" ON projects;

DROP POLICY IF EXISTS "Users can view own sessions" ON work_sessions;
DROP POLICY IF EXISTS "Users can insert own sessions" ON work_sessions;
DROP POLICY IF EXISTS "Users can update own sessions" ON work_sessions;
DROP POLICY IF EXISTS "Users can delete own sessions" ON work_sessions;

DROP POLICY IF EXISTS "Users can view own segments" ON work_segments;
DROP POLICY IF EXISTS "Users can insert own segments" ON work_segments;
DROP POLICY IF EXISTS "Users can update own segments" ON work_segments;
DROP POLICY IF EXISTS "Users can delete own segments" ON work_segments;

-- Profiles policies
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Projects policies
CREATE POLICY "Users can view own projects"
  ON projects FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own projects"
  ON projects FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own projects"
  ON projects FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own projects"
  ON projects FOR DELETE
  USING (auth.uid() = user_id);

-- Work sessions policies
CREATE POLICY "Users can view own sessions"
  ON work_sessions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own sessions"
  ON work_sessions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own sessions"
  ON work_sessions FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own sessions"
  ON work_sessions FOR DELETE
  USING (auth.uid() = user_id);

-- Work segments policies
CREATE POLICY "Users can view own segments"
  ON work_segments FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own segments"
  ON work_segments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own segments"
  ON work_segments FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own segments"
  ON work_segments FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- Setup Complete!
-- ============================================
-- You should now have:
-- - 4 tables: profiles, projects, work_sessions, work_segments
-- - All indexes and constraints
-- - RLS policies enabled
-- - Triggers for auto-creating profiles and updating timestamps

