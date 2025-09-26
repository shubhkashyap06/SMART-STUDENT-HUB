-- Add points and collaboration features
-- Add points to documents table for achievements
ALTER TABLE public.documents ADD COLUMN points_awarded integer DEFAULT 0;

-- Create collaboration_requests table
CREATE TABLE public.collaboration_requests (
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

-- Enable RLS
ALTER TABLE public.collaboration_requests ENABLE ROW LEVEL SECURITY;

-- RLS policies for collaboration requests
CREATE POLICY "Users can view their own collaboration requests" 
ON public.collaboration_requests 
FOR SELECT 
USING (auth.uid() IN (
  SELECT user_id FROM profiles WHERE id = collaboration_requests.requester_id
  UNION
  SELECT user_id FROM profiles WHERE id = collaboration_requests.requested_id
));

CREATE POLICY "Users can create collaboration requests" 
ON public.collaboration_requests 
FOR INSERT 
WITH CHECK (EXISTS (
  SELECT 1 FROM profiles 
  WHERE id = collaboration_requests.requester_id 
  AND user_id = auth.uid()
));

CREATE POLICY "Users can update their received requests" 
ON public.collaboration_requests 
FOR UPDATE 
USING (EXISTS (
  SELECT 1 FROM profiles 
  WHERE id = collaboration_requests.requested_id 
  AND user_id = auth.uid()
));

-- Add trigger for collaboration requests timestamps
CREATE TRIGGER update_collaboration_requests_updated_at
BEFORE UPDATE ON public.collaboration_requests
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to calculate total achievement points
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