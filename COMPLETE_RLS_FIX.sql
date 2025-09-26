-- =====================================
-- COMPLETE STUDENT HUB DATABASE SETUP
-- This script sets up ALL tables, policies, and features
-- Run this in Supabase SQL Editor for complete setup
-- =====================================

-- 1. ENSURE STORAGE BUCKET EXISTS
INSERT INTO storage.buckets (id, name, public) VALUES ('documents', 'documents', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- =====================================
-- 2. CREATE ALL TABLES
-- =====================================

-- Create user profiles table
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  user_type TEXT NOT NULL CHECK (user_type IN ('student', 'faculty')),
  department TEXT,
  year_of_study INTEGER,
  bio TEXT,
  avatar_url TEXT,
  privacy_settings JSONB DEFAULT '{"profile_visible": true, "skills_visible": true, "contact_visible": false}'::jsonb,
  college TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create skills table
CREATE TABLE IF NOT EXISTS public.skills (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  category TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create student_skills junction table
CREATE TABLE IF NOT EXISTS public.student_skills (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  skill_id UUID NOT NULL REFERENCES public.skills(id) ON DELETE CASCADE,
  proficiency_level TEXT CHECK (proficiency_level IN ('beginner', 'intermediate', 'advanced')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(student_id, skill_id)
);

-- Create documents table
CREATE TABLE IF NOT EXISTS public.documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  file_url TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size INTEGER,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  uploaded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  approved_by UUID REFERENCES public.profiles(id),
  approved_at TIMESTAMP WITH TIME ZONE,
  rejection_reason TEXT,
  points_awarded integer DEFAULT 0
);

-- Create collaboration_requests table
CREATE TABLE IF NOT EXISTS public.collaboration_requests (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  requester_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  requested_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE, 
  project_title text NOT NULL,
  project_description text,
  skills_needed text[],
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined')),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create placement_officers table
CREATE TABLE IF NOT EXISTS public.placement_officers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  organization TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- =====================================
-- 3. ENABLE ROW LEVEL SECURITY
-- =====================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collaboration_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.placement_officers ENABLE ROW LEVEL SECURITY;

-- =====================================
-- 4. DROP ALL EXISTING POLICIES
-- =====================================

-- Drop ALL document policies
DROP POLICY IF EXISTS "Allow users to view own documents" ON public.documents;
DROP POLICY IF EXISTS "Allow faculty to view all documents" ON public.documents;
DROP POLICY IF EXISTS "Allow users to insert own documents" ON public.documents;
DROP POLICY IF EXISTS "Allow faculty to update document status" ON public.documents;
DROP POLICY IF EXISTS "Students can view their own documents" ON public.documents;
DROP POLICY IF EXISTS "Faculty can view all documents" ON public.documents;
DROP POLICY IF EXISTS "Students can upload their own documents" ON public.documents;
DROP POLICY IF EXISTS "Faculty can update document status" ON public.documents;
DROP POLICY IF EXISTS "Users can view their own documents" ON public.documents;
DROP POLICY IF EXISTS "Users can upload documents" ON public.documents;
DROP POLICY IF EXISTS "Faculty can update documents" ON public.documents;
DROP POLICY IF EXISTS "Users can delete their own documents" ON public.documents;

-- Drop ALL profile policies
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can view limited public profile data" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;

-- Drop ALL skills policies
DROP POLICY IF EXISTS "Anyone can view skills" ON public.skills;
DROP POLICY IF EXISTS "Faculty can manage skills" ON public.skills;

-- Drop ALL student_skills policies
DROP POLICY IF EXISTS "Students can view their own skills" ON public.student_skills;
DROP POLICY IF EXISTS "Others can view skills if privacy allows" ON public.student_skills;
DROP POLICY IF EXISTS "Students can manage their own skills" ON public.student_skills;
DROP POLICY IF EXISTS "Anyone can view student skills" ON public.student_skills;

-- Drop ALL collaboration_requests policies
DROP POLICY IF EXISTS "Users can view their own collaboration requests" ON public.collaboration_requests;
DROP POLICY IF EXISTS "Users can create collaboration requests" ON public.collaboration_requests;
DROP POLICY IF EXISTS "Users can update their received requests" ON public.collaboration_requests;

-- Drop ALL placement_officers policies
DROP POLICY IF EXISTS "Placement officers can view their own profile" ON public.placement_officers;
DROP POLICY IF EXISTS "Placement officers can update their own profile" ON public.placement_officers;
DROP POLICY IF EXISTS "Placement officers can insert their own profile" ON public.placement_officers;

-- Drop ALL storage policies
DROP POLICY IF EXISTS "Allow authenticated uploads" ON storage.objects;
DROP POLICY IF EXISTS "Allow users to view own files" ON storage.objects;
DROP POLICY IF EXISTS "Allow faculty to view all files" ON storage.objects;
DROP POLICY IF EXISTS "Allow public downloads" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can view files" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own files" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own files" ON storage.objects;
DROP POLICY IF EXISTS "Students can upload their own documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can view their own documents" ON storage.objects;
DROP POLICY IF EXISTS "Faculty can view all documents" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload to own folder" ON storage.objects;
DROP POLICY IF EXISTS "Users can view own files" ON storage.objects;
DROP POLICY IF EXISTS "Public file downloads" ON storage.objects;

-- =====================================
-- 5. CREATE COMPREHENSIVE RLS POLICIES
-- =====================================

-- PROFILES POLICIES
CREATE POLICY "Users can view their own profile" ON public.profiles 
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can view public profiles" ON public.profiles 
FOR SELECT USING (
  privacy_settings->>'profile_visible' = 'true' 
  AND auth.uid() IS NOT NULL
  AND auth.uid() != user_id
);

CREATE POLICY "Users can update their own profile" ON public.profiles 
FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile" ON public.profiles 
FOR INSERT WITH CHECK (auth.uid() = user_id);

-- SKILLS POLICIES
CREATE POLICY "Anyone can view skills" ON public.skills 
FOR SELECT USING (true);

CREATE POLICY "Faculty can manage skills" ON public.skills 
FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND user_type = 'faculty')
);

-- STUDENT SKILLS POLICIES
CREATE POLICY "Students can view their own skills" ON public.student_skills 
FOR SELECT USING (
  EXISTS (SELECT 1 FROM profiles WHERE profiles.id = student_skills.student_id AND profiles.user_id = auth.uid())
);

CREATE POLICY "Others can view skills if privacy allows" ON public.student_skills 
FOR SELECT USING (
  auth.uid() IS NOT NULL
  AND EXISTS (SELECT 1 FROM profiles WHERE profiles.id = student_skills.student_id AND profiles.privacy_settings->>'skills_visible' = 'true')
);

CREATE POLICY "Students can manage their own skills" ON public.student_skills 
FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = student_id AND user_id = auth.uid())
);

-- DOCUMENTS POLICIES
CREATE POLICY "Users can view their own documents" ON public.documents 
FOR SELECT USING (
  auth.uid() IS NOT NULL AND
  (
    student_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
    OR
    EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND user_type = 'faculty')
  )
);

CREATE POLICY "Users can upload documents" ON public.documents 
FOR INSERT WITH CHECK (
  auth.uid() IS NOT NULL AND
  student_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
);

CREATE POLICY "Faculty can update documents" ON public.documents 
FOR UPDATE USING (
  auth.uid() IS NOT NULL AND
  EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND user_type = 'faculty')
);

CREATE POLICY "Users can delete their own documents" ON public.documents 
FOR DELETE USING (
  auth.uid() IS NOT NULL AND
  student_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
);

-- COLLABORATION REQUESTS POLICIES
CREATE POLICY "Users can view their collaboration requests" ON public.collaboration_requests 
FOR SELECT USING (
  auth.uid() IS NOT NULL AND
  (
    requester_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
    OR
    requested_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
  )
);

CREATE POLICY "Users can create collaboration requests" ON public.collaboration_requests 
FOR INSERT WITH CHECK (
  auth.uid() IS NOT NULL AND
  requester_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
);

CREATE POLICY "Users can update received requests" ON public.collaboration_requests 
FOR UPDATE USING (
  auth.uid() IS NOT NULL AND
  requested_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
);

CREATE POLICY "Users can delete their own requests" ON public.collaboration_requests 
FOR DELETE USING (
  auth.uid() IS NOT NULL AND
  requester_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
);

-- PLACEMENT OFFICERS POLICIES
CREATE POLICY "Placement officers can view their own profile" ON public.placement_officers 
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Placement officers can update their own profile" ON public.placement_officers 
FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Placement officers can insert their own profile" ON public.placement_officers 
FOR INSERT WITH CHECK (auth.uid() = user_id);

-- =====================================
-- 6. CREATE STORAGE POLICIES
-- =====================================

-- Allow authenticated users to upload files to their folder
CREATE POLICY "Authenticated users can upload to own folder" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'documents' AND
  auth.uid() IS NOT NULL AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow users to view their own files
CREATE POLICY "Users can view own files" 
ON storage.objects 
FOR SELECT 
USING (
  bucket_id = 'documents' AND
  auth.uid() IS NOT NULL AND
  (
    (storage.foldername(name))[1] = auth.uid()::text
    OR
    -- Faculty can view all files
    EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND user_type = 'faculty')
  )
);

-- Allow public downloads (for file access via URLs)
CREATE POLICY "Public file downloads" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'documents');

-- Allow users to update their own files
CREATE POLICY "Users can update own files" 
ON storage.objects 
FOR UPDATE 
USING (
  bucket_id = 'documents' AND
  auth.uid() IS NOT NULL AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow users to delete their own files
CREATE POLICY "Users can delete own files" 
ON storage.objects 
FOR DELETE 
USING (
  bucket_id = 'documents' AND
  auth.uid() IS NOT NULL AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- =====================================
-- 7. CREATE FUNCTIONS AND TRIGGERS
-- =====================================

-- Function to handle new user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Check if this is a placement officer signup
  IF NEW.raw_user_meta_data->>'user_type' = 'placement_officer' THEN
    INSERT INTO public.placement_officers (user_id, full_name, email, organization)
    VALUES (
      NEW.id,
      COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
      NEW.email,
      COALESCE(NEW.raw_user_meta_data->>'organization', '')
    );
  ELSE
    INSERT INTO public.profiles (user_id, full_name, email, user_type, college)
    VALUES (
      NEW.id,
      COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
      NEW.email,
      COALESCE(NEW.raw_user_meta_data->>'user_type', 'student'),
      COALESCE(NEW.raw_user_meta_data->>'college', '')
    );
  END IF;
  RETURN NEW;
END;
$$;

-- Function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to calculate achievement points
CREATE OR REPLACE FUNCTION public.get_student_achievement_points(student_profile_id uuid)
RETURNS integer
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(SUM(points_awarded), 0)
  FROM documents 
  WHERE student_id = student_profile_id 
  AND status = 'approved'
  AND points_awarded > 0;
$$;

-- Drop existing triggers
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
DROP TRIGGER IF EXISTS update_collaboration_requests_updated_at ON public.collaboration_requests;
DROP TRIGGER IF EXISTS update_placement_officers_updated_at ON public.placement_officers;

-- Create triggers
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE TRIGGER update_profiles_updated_at 
  BEFORE UPDATE ON public.profiles 
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_collaboration_requests_updated_at
  BEFORE UPDATE ON public.collaboration_requests
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_placement_officers_updated_at
  BEFORE UPDATE ON public.placement_officers
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =====================================
-- 8. INSERT SAMPLE DATA
-- =====================================

-- Insert sample skills (ignore duplicates)
INSERT INTO public.skills (name, category) VALUES
  ('JavaScript', 'Programming'),
  ('Python', 'Programming'),
  ('React', 'Web Development'),
  ('Node.js', 'Backend'),
  ('Machine Learning', 'AI/ML'),
  ('Data Analysis', 'Data Science'),
  ('UI/UX Design', 'Design'),
  ('Project Management', 'Management'),
  ('Communication', 'Soft Skills'),
  ('Leadership', 'Soft Skills'),
  ('Java', 'Programming'),
  ('C++', 'Programming'),
  ('SQL', 'Database'),
  ('MongoDB', 'Database'),
  ('Docker', 'DevOps'),
  ('AWS', 'Cloud'),
  ('Git', 'Version Control'),
  ('Agile', 'Methodology'),
  ('Scrum', 'Methodology'),
  ('Testing', 'Quality Assurance')
ON CONFLICT (name) DO NOTHING;

-- =====================================
-- 9. VERIFICATION & DEBUG TOOLS
-- =====================================

-- Check if storage bucket exists
SELECT * FROM storage.buckets WHERE id = 'documents';

-- Create a comprehensive debug function
CREATE OR REPLACE FUNCTION public.debug_complete_setup()
RETURNS TABLE (
  current_user_id uuid,
  has_profile boolean,
  profile_id uuid,
  user_type text,
  profile_email text,
  bucket_exists boolean,
  total_skills integer,
  total_documents integer,
  total_collaborations integer
)
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT 
    auth.uid() as current_user_id,
    EXISTS(SELECT 1 FROM public.profiles WHERE user_id = auth.uid()) as has_profile,
    (SELECT id FROM public.profiles WHERE user_id = auth.uid() LIMIT 1) as profile_id,
    (SELECT user_type FROM public.profiles WHERE user_id = auth.uid() LIMIT 1) as user_type,
    (SELECT email FROM public.profiles WHERE user_id = auth.uid() LIMIT 1) as profile_email,
    EXISTS(SELECT 1 FROM storage.buckets WHERE id = 'documents') as bucket_exists,
    (SELECT COUNT(*) FROM public.skills)::integer as total_skills,
    (SELECT COUNT(*) FROM public.documents WHERE student_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid()))::integer as total_documents,
    (SELECT COUNT(*) FROM public.collaboration_requests WHERE requester_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid()) OR requested_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid()))::integer as total_collaborations;
$$;

-- =====================================
-- 10. HELPFUL VERIFICATION QUERIES
-- =====================================

-- Uncomment these to run manually for verification:

-- Check your complete user setup
-- SELECT * FROM public.debug_complete_setup();

-- View your profile
-- SELECT * FROM public.profiles WHERE user_id = auth.uid();

-- Check all skills available
-- SELECT * FROM public.skills ORDER BY category, name;

-- View all tables and their row counts
-- SELECT 
--   'profiles' as table_name, COUNT(*) as row_count FROM public.profiles
-- UNION ALL
-- SELECT 
--   'skills' as table_name, COUNT(*) as row_count FROM public.skills
-- UNION ALL
-- SELECT 
--   'documents' as table_name, COUNT(*) as row_count FROM public.documents
-- UNION ALL
-- SELECT 
--   'collaboration_requests' as table_name, COUNT(*) as row_count FROM public.collaboration_requests
-- UNION ALL
-- SELECT 
--   'placement_officers' as table_name, COUNT(*) as row_count FROM public.placement_officers;

-- List all document policies
-- SELECT policyname, cmd, roles FROM pg_policies 
-- WHERE tablename = 'documents' AND schemaname = 'public'
-- ORDER BY policyname;

-- List all storage policies
-- SELECT policyname, cmd, roles FROM pg_policies 
-- WHERE tablename = 'objects' AND schemaname = 'storage'
-- ORDER BY policyname;

-- List all profile policies
-- SELECT policyname, cmd, roles FROM pg_policies 
-- WHERE tablename = 'profiles' AND schemaname = 'public'
-- ORDER BY policyname;

-- List all collaboration policies
-- SELECT policyname, cmd, roles FROM pg_policies 
-- WHERE tablename = 'collaboration_requests' AND schemaname = 'public'
-- ORDER BY policyname;

-- =====================================
-- 11. SUCCESS MESSAGE
-- =====================================

-- If this script runs without errors, your complete Student Hub database is set up!
-- Features included:
-- ✅ User Profiles (students, faculty, placement officers)
-- ✅ Skills Management
-- ✅ Document Upload & Approval System
-- ✅ Collaboration Requests
-- ✅ Storage with proper RLS policies
-- ✅ Automatic profile creation on signup
-- ✅ Achievement points system
-- ✅ Privacy settings
-- ✅ Comprehensive debugging tools

-- To verify everything is working:
-- 1. Run: SELECT * FROM public.debug_complete_setup();
-- 2. Try uploading a document
-- 3. Test collaboration requests
-- 4. Check skills management
-- 5. Test profile editing

-- All Student Hub MVP features should now be fully functional!