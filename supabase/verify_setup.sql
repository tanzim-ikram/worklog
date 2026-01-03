-- ============================================
-- WorkLog Database Setup Verification
-- ============================================
-- Run this script to verify all tables, policies, and triggers are set up correctly

-- Check if tables exist
SELECT 
  'Tables' as check_type,
  table_name,
  CASE 
    WHEN table_name IN ('profiles', 'projects', 'work_sessions', 'work_segments') 
    THEN '✓ EXISTS' 
    ELSE '✗ MISSING' 
  END as status
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('profiles', 'projects', 'work_sessions', 'work_segments')
ORDER BY table_name;

-- Check if RLS is enabled
SELECT 
  'RLS Status' as check_type,
  tablename as table_name,
  CASE 
    WHEN rowsecurity THEN '✓ ENABLED' 
    ELSE '✗ DISABLED' 
  END as status
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN ('profiles', 'projects', 'work_sessions', 'work_segments')
ORDER BY tablename;

-- Check if policies exist
SELECT 
  'Policies' as check_type,
  tablename as table_name,
  policyname as policy_name,
  '✓ EXISTS' as status
FROM pg_policies 
WHERE schemaname = 'public' 
  AND tablename IN ('profiles', 'projects', 'work_sessions', 'work_segments')
ORDER BY tablename, policyname;

-- Check if triggers exist
SELECT 
  'Triggers' as check_type,
  event_object_table as table_name,
  trigger_name,
  '✓ EXISTS' as status
FROM information_schema.triggers 
WHERE trigger_schema = 'public'
  AND (event_object_table IN ('profiles', 'projects', 'work_sessions') 
       OR trigger_name = 'on_auth_user_created')
ORDER BY event_object_table, trigger_name;

-- Check if functions exist
SELECT 
  'Functions' as check_type,
  routine_name as function_name,
  '✓ EXISTS' as status
FROM information_schema.routines 
WHERE routine_schema = 'public' 
  AND routine_name IN ('update_updated_at_column', 'handle_new_user')
ORDER BY routine_name;

-- Summary
SELECT 
  'SUMMARY' as check_type,
  'Expected: 4 tables, RLS enabled on all, 16 policies, 4 triggers, 2 functions' as expected,
  'If any are missing, run supabase/migrations/000_combined_setup.sql' as action;

