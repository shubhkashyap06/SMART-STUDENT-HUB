-- Complete Database Setup Script for Student Hub MVP
-- Run this in your Supabase SQL Editor: https://supabase.com/dashboard/project/qfnakcrjzzchrjifdnaz/sql

-- =====================================
-- STEP 1: Create Tables
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
  requester_id uuid NOT NULL,
  requested_id uuid NOT NULL, 
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
  user_id UUID NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  organization TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- =====================================
-- STEP 2: Enable Row Level Security
-- =====================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collaboration_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.placement_officers ENABLE ROW LEVEL SECURITY;

-- =====================================
-- STEP 3: Create RLS Policies
-- =====================================

-- Profiles policies
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can view limited public profile data" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;

CREATE POLICY "Users can view their own profile" ON public.profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can view limited public profile data" ON public.profiles FOR SELECT USING (
  privacy_settings->>'profile_visible' = 'true' 
  AND auth.uid() IS NOT NULL
  AND auth.uid() != user_id
);
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Skills policies
DROP POLICY IF EXISTS "Anyone can view skills" ON public.skills;
DROP POLICY IF EXISTS "Faculty can manage skills" ON public.skills;

CREATE POLICY "Anyone can view skills" ON public.skills FOR SELECT USING (true);
CREATE POLICY "Faculty can manage skills" ON public.skills FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND user_type = 'faculty')
);

-- Student skills policies
DROP POLICY IF EXISTS "Students can view their own skills" ON public.student_skills;
DROP POLICY IF EXISTS "Others can view skills if privacy allows" ON public.student_skills;
DROP POLICY IF EXISTS "Students can manage their own skills" ON public.student_skills;

CREATE POLICY "Students can view their own skills" ON public.student_skills FOR SELECT USING (
  EXISTS (SELECT 1 FROM profiles WHERE profiles.id = student_skills.student_id AND profiles.user_id = auth.uid())
);
CREATE POLICY "Others can view skills if privacy allows" ON public.student_skills FOR SELECT USING (
  auth.uid() IS NOT NULL
  AND EXISTS (SELECT 1 FROM profiles WHERE profiles.id = student_skills.student_id AND profiles.privacy_settings->>'skills_visible' = 'true')
);
CREATE POLICY "Students can manage their own skills" ON public.student_skills FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = student_id AND user_id = auth.uid())
);

-- Documents policies
DROP POLICY IF EXISTS "Students can view their own documents" ON public.documents;
DROP POLICY IF EXISTS "Faculty can view all documents" ON public.documents;
DROP POLICY IF EXISTS "Students can upload their own documents" ON public.documents;
DROP POLICY IF EXISTS "Faculty can update document status" ON public.documents;

-- More permissive policies to prevent RLS violations
CREATE POLICY "Allow users to view own documents" ON public.documents 
FOR SELECT USING (
  auth.uid() IS NOT NULL AND
  EXISTS (SELECT 1 FROM public.profiles WHERE id = student_id AND user_id = auth.uid())
);

CREATE POLICY "Allow faculty to view all documents" ON public.documents 
FOR SELECT USING (
  auth.uid() IS NOT NULL AND
  EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND user_type = 'faculty')
);

CREATE POLICY "Allow users to insert own documents" ON public.documents 
FOR INSERT WITH CHECK (
  auth.uid() IS NOT NULL AND
  EXISTS (SELECT 1 FROM public.profiles WHERE id = student_id AND user_id = auth.uid())
);

CREATE POLICY "Allow faculty to update document status" ON public.documents 
FOR UPDATE USING (
  auth.uid() IS NOT NULL AND
  EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND user_type = 'faculty')
);

-- Collaboration requests policies
DROP POLICY IF EXISTS "Users can view their own collaboration requests" ON public.collaboration_requests;
DROP POLICY IF EXISTS "Users can create collaboration requests" ON public.collaboration_requests;
DROP POLICY IF EXISTS "Users can update their received requests" ON public.collaboration_requests;

CREATE POLICY "Users can view their own collaboration requests" ON public.collaboration_requests FOR SELECT USING (auth.uid() IN (
  SELECT user_id FROM profiles WHERE id = collaboration_requests.requester_id
  UNION
  SELECT user_id FROM profiles WHERE id = collaboration_requests.requested_id
));
CREATE POLICY "Users can create collaboration requests" ON public.collaboration_requests FOR INSERT WITH CHECK (EXISTS (
  SELECT 1 FROM profiles WHERE id = collaboration_requests.requester_id AND user_id = auth.uid()
));
CREATE POLICY "Users can update their received requests" ON public.collaboration_requests FOR UPDATE USING (EXISTS (
  SELECT 1 FROM profiles WHERE id = collaboration_requests.requested_id AND user_id = auth.uid()
));

-- Placement officers policies
DROP POLICY IF EXISTS "Placement officers can view their own profile" ON public.placement_officers;
DROP POLICY IF EXISTS "Placement officers can update their own profile" ON public.placement_officers;
DROP POLICY IF EXISTS "Placement officers can insert their own profile" ON public.placement_officers;

CREATE POLICY "Placement officers can view their own profile" ON public.placement_officers FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Placement officers can update their own profile" ON public.placement_officers FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Placement officers can insert their own profile" ON public.placement_officers FOR INSERT WITH CHECK (auth.uid() = user_id);

-- =====================================
-- STEP 4: Create Storage Bucket & Policies
-- =====================================

-- Create documents storage bucket (ignore error if exists)
INSERT INTO storage.buckets (id, name, public) VALUES ('documents', 'documents', false)
ON CONFLICT (id) DO NOTHING;

-- Make sure the bucket is publicly accessible for file downloads
UPDATE storage.buckets SET public = true WHERE id = 'documents';

-- Create storage policies (drop existing ones first)
DROP POLICY IF EXISTS "Students can upload their own documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can view their own documents" ON storage.objects;
DROP POLICY IF EXISTS "Faculty can view all documents" ON storage.objects;
DROP POLICY IF EXISTS "Public Access" ON storage.objects;

-- Allow authenticated users to upload files to their own folder
CREATE POLICY "Allow authenticated uploads" ON storage.objects 
FOR INSERT WITH CHECK (
  bucket_id = 'documents' 
  AND auth.uid() IS NOT NULL
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow users to view their own files
CREATE POLICY "Allow users to view own files" ON storage.objects 
FOR SELECT USING (
  bucket_id = 'documents' 
  AND auth.uid() IS NOT NULL
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow faculty to view all files
CREATE POLICY "Allow faculty to view all files" ON storage.objects 
FOR SELECT USING (
  bucket_id = 'documents' 
  AND auth.uid() IS NOT NULL
  AND EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND user_type = 'faculty')
);

-- Allow public access to files (for downloads)
CREATE POLICY "Allow public downloads" ON storage.objects 
FOR SELECT USING (bucket_id = 'documents');

-- =====================================
-- STEP 5: Create Functions
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
$$ LANGUAGE plpgsql SET search_path = public;

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

-- =====================================
-- STEP 6: Create Triggers
-- =====================================

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
-- STEP 7: Insert Sample Data
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
  ('Leadership', 'Soft Skills')
ON CONFLICT (name) DO NOTHING;

-- =====================================
-- VERIFICATION QUERIES
-- =====================================

-- Run these to verify setup:
-- SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';
-- SELECT * FROM public.skills LIMIT 5;
-- SELECT bucket_id, name FROM storage.buckets WHERE id = 'documents';