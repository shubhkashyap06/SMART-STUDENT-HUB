-- Fix critical security vulnerabilities

-- Add privacy settings to profiles table
ALTER TABLE public.profiles 
ADD COLUMN privacy_settings JSONB DEFAULT '{"profile_visible": true, "skills_visible": true, "contact_visible": false}'::jsonb,
ADD COLUMN college TEXT;

-- Create security definer function for safe profile access
CREATE OR REPLACE FUNCTION public.get_public_profile_data(profile_user_id uuid)
RETURNS TABLE (
  id uuid,
  full_name text,
  department text,
  year_of_study integer,
  college text,
  bio text,
  user_type text
) 
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    p.id,
    p.full_name,
    p.department,
    p.year_of_study,
    p.college,
    CASE 
      WHEN p.privacy_settings->>'profile_visible' = 'true' THEN p.bio
      ELSE NULL
    END as bio,
    p.user_type
  FROM profiles p
  WHERE p.user_id = profile_user_id
    AND p.privacy_settings->>'profile_visible' = 'true';
$$;

-- Create function to check if skills should be visible
CREATE OR REPLACE FUNCTION public.are_skills_visible(profile_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT privacy_settings->>'skills_visible' = 'true' 
     FROM profiles 
     WHERE user_id = profile_user_id), 
    false
  );
$$;

-- Drop the overly permissive policies
DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Anyone can view student skills" ON public.student_skills;

-- Create new privacy-respecting policies for profiles
CREATE POLICY "Users can view their own profile" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can view limited public profile data" 
ON public.profiles 
FOR SELECT 
USING (
  privacy_settings->>'profile_visible' = 'true' 
  AND auth.uid() IS NOT NULL
  AND auth.uid() != user_id
);

-- Create new privacy-respecting policies for student skills
CREATE POLICY "Students can view their own skills" 
ON public.student_skills 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = student_skills.student_id 
    AND profiles.user_id = auth.uid()
  )
);

CREATE POLICY "Others can view skills if privacy allows" 
ON public.student_skills 
FOR SELECT 
USING (
  auth.uid() IS NOT NULL
  AND EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = student_skills.student_id 
    AND profiles.privacy_settings->>'skills_visible' = 'true'
  )
);

-- Create placement_officers table for new portal
CREATE TABLE public.placement_officers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  organization TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on placement_officers
ALTER TABLE public.placement_officers ENABLE ROW LEVEL SECURITY;

-- Create policies for placement officers
CREATE POLICY "Placement officers can view their own profile" 
ON public.placement_officers 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Placement officers can update their own profile" 
ON public.placement_officers 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Placement officers can insert their own profile" 
ON public.placement_officers 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Create trigger for placement officers updated_at
CREATE TRIGGER update_placement_officers_updated_at
BEFORE UPDATE ON public.placement_officers
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Update the handle_new_user function to support placement officers
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