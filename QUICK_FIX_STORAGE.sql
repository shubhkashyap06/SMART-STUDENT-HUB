-- QUICK FIX: Storage Bucket and RLS Issues
-- Run this in Supabase SQL Editor if you're getting bucket/RLS errors

-- 1. Create the storage bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public) VALUES ('documents', 'documents', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- 2. Drop all existing storage policies to start fresh
DROP POLICY IF EXISTS "Students can upload their own documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can view their own documents" ON storage.objects;
DROP POLICY IF EXISTS "Faculty can view all documents" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated uploads" ON storage.objects;
DROP POLICY IF EXISTS "Allow users to view own files" ON storage.objects;
DROP POLICY IF EXISTS "Allow faculty to view all files" ON storage.objects;
DROP POLICY IF EXISTS "Allow public downloads" ON storage.objects;

-- 3. Create simple, permissive storage policies
CREATE POLICY "Allow authenticated file uploads" ON storage.objects 
FOR INSERT WITH CHECK (
  bucket_id = 'documents' 
  AND auth.uid() IS NOT NULL
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Allow users to view own files" ON storage.objects 
FOR SELECT USING (
  bucket_id = 'documents'
  AND auth.uid() IS NOT NULL
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Allow public file downloads" ON storage.objects 
FOR SELECT USING (bucket_id = 'documents');

-- 4. Temporarily disable RLS on documents table for testing
ALTER TABLE public.documents DISABLE ROW LEVEL SECURITY;

-- 5. Re-enable RLS with simpler policies
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;

-- Drop existing document policies
DROP POLICY IF EXISTS "Students can view their own documents" ON public.documents;
DROP POLICY IF EXISTS "Faculty can view all documents" ON public.documents;
DROP POLICY IF EXISTS "Students can upload their own documents" ON public.documents;
DROP POLICY IF EXISTS "Faculty can update document status" ON public.documents;
DROP POLICY IF EXISTS "Allow users to view own documents" ON public.documents;
DROP POLICY IF EXISTS "Allow faculty to view all documents" ON public.documents;
DROP POLICY IF EXISTS "Allow users to insert own documents" ON public.documents;
DROP POLICY IF EXISTS "Allow faculty to update document status" ON public.documents;

-- Create very permissive document policies for testing
CREATE POLICY "Allow authenticated users to manage documents" ON public.documents 
FOR ALL USING (auth.uid() IS NOT NULL);

-- Verify the bucket exists
SELECT * FROM storage.buckets WHERE id = 'documents';