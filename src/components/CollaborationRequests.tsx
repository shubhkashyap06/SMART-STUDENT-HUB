import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Users, Plus, Clock, CheckCircle, XCircle, Send } from 'lucide-react';

interface Profile {
  id: string;
  full_name: string;
  user_type: string;
  department?: string;
}

interface CollaborationRequest {
  id: string;
  project_title: string;
  project_description: string;
  skills_needed: string[];
  status: string;
  created_at: string;
  requester_profile?: Profile;
  requested_profile?: Profile;
}

interface CollaborationRequestsProps {
  profile: Profile | null;
}

export function CollaborationRequests({ profile }: CollaborationRequestsProps) {
  const { toast } = useToast();
  const [requests, setRequests] = useState<CollaborationRequest[]>([]);
  const [skills, setSkills] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [students, setStudents] = useState<Profile[]>([]);

  useEffect(() => {
    if (profile) {
      fetchRequests();
      fetchSkills();
      fetchStudents();
    }
  }, [profile]);

  const fetchRequests = async () => {
    if (!profile) return;

    try {
      // Debug: Check what profile data we have
      console.log('Fetching requests for profile:', profile);
      
      const { data, error } = await supabase
        .from('collaboration_requests')
        .select(`
          *,
          requester_profile:profiles!requester_id(id, full_name, user_type, department),
          requested_profile:profiles!requested_id(id, full_name, user_type, department)
        `)
        .or(`requester_id.eq.${profile.id},requested_id.eq.${profile.id}`)
        .order('created_at', { ascending: false });

      console.log('Collaboration requests query result:', { data, error });
      
      if (error) throw error;
      setRequests((data as any) || []);
    } catch (error) {
      console.error('Error fetching collaboration requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSkills = async () => {
    try {
      const { data, error } = await supabase
        .from('skills')
        .select('*')
        .order('name');

      if (error) throw error;
      setSkills(data || []);
    } catch (error) {
      console.error('Error fetching skills:', error);
    }
  };

  const fetchStudents = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, user_type, department')
        .eq('user_type', 'student')
        .neq('id', profile?.id);

      if (error) throw error;
      setStudents(data || []);
    } catch (error) {
      console.error('Error fetching students:', error);
    }
  };

  const createRequest = async (formData: FormData) => {
    if (!profile) return;

    const requestedId = formData.get('requestedId') as string;
    const projectTitle = formData.get('projectTitle') as string;
    const projectDescription = formData.get('projectDescription') as string;
    const selectedSkills = JSON.parse(formData.get('skills') as string || '[]');

    console.log('Creating collaboration request:', {
      requester_id: profile.id,
      requested_id: requestedId,
      project_title: projectTitle,
      project_description: projectDescription,
      skills_needed: selectedSkills
    });

    try {
      const { data, error } = await supabase
        .from('collaboration_requests')
        .insert({
          requester_id: profile.id,
          requested_id: requestedId,
          project_title: projectTitle,
          project_description: projectDescription,
          skills_needed: selectedSkills
        })
        .select();

      console.log('Insert result:', { data, error });

      if (error) throw error;

      toast({
        title: "Request sent",
        description: "Your collaboration request has been sent successfully.",
      });

      setShowCreateDialog(false);
      fetchRequests();
    } catch (error: any) {
      console.error('Error creating collaboration request:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    }
  };

  const updateRequestStatus = async (requestId: string, status: string) => {
    try {
      const { error } = await supabase
        .from('collaboration_requests')
        .update({ status })
        .eq('id', requestId);

      if (error) throw error;

      toast({
        title: "Request updated",
        description: `Request has been ${status}.`,
      });

      fetchRequests();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4" />;
      case 'accepted':
        return <CheckCircle className="h-4 w-4" />;
      case 'declined':
        return <XCircle className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'pending':
        return 'secondary';
      case 'accepted':
        return 'default';
      case 'declined':
        return 'destructive';
      default:
        return 'secondary';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Collaboration Requests</h2>
          <p className="text-muted-foreground">Connect and collaborate with other students</p>
        </div>
        
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Send Request
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Send Collaboration Request</DialogTitle>
              <DialogDescription>
                Invite a student to collaborate on your project
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              createRequest(formData);
            }} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="requestedId">Select Student</Label>
                <Select name="requestedId" required>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a student to invite" />
                  </SelectTrigger>
                  <SelectContent>
                    {students.map((student) => (
                      <SelectItem key={student.id} value={student.id}>
                        {student.full_name} {student.department && `(${student.department})`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="projectTitle">Project Title</Label>
                <Input name="projectTitle" placeholder="Enter project title" required />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="projectDescription">Project Description</Label>
                <Textarea 
                  name="projectDescription" 
                  placeholder="Describe your project and collaboration goals"
                  rows={3}
                />
              </div>
              
              <div className="space-y-2">
                <Label>Required Skills</Label>
                <Select name="skills">
                  <SelectTrigger>
                    <SelectValue placeholder="Select relevant skills" />
                  </SelectTrigger>
                  <SelectContent>
                    {skills.map((skill) => (
                      <SelectItem key={skill.id} value={JSON.stringify([skill.name])}>
                        {skill.name} ({skill.category})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <Button type="submit" className="w-full gap-2">
                <Send className="h-4 w-4" />
                Send Request
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4">
        {requests.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Users className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No collaboration requests</h3>
              <p className="text-muted-foreground text-center">
                Start collaborating by sending requests to other students
              </p>
            </CardContent>
          </Card>
        ) : (
          requests.map((request) => {
            const isRequestedByMe = request.requester_profile?.id === profile?.id;
            const otherProfile = isRequestedByMe ? request.requested_profile : request.requester_profile;
            
            return (
              <Card key={request.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg">{request.project_title}</CardTitle>
                      <CardDescription>
                        {isRequestedByMe ? 'Sent to' : 'Received from'}: {otherProfile?.full_name}
                        {otherProfile?.department && ` (${otherProfile.department})`}
                      </CardDescription>
                    </div>
                    <Badge variant={getStatusVariant(request.status)} className="gap-1">
                      {getStatusIcon(request.status)}
                      {request.status}
                    </Badge>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  {request.project_description && (
                    <p className="text-sm text-muted-foreground">
                      {request.project_description}
                    </p>
                  )}
                  
                  {request.skills_needed && request.skills_needed.length > 0 && (
                    <div>
                      <p className="text-sm font-medium mb-2">Required Skills:</p>
                      <div className="flex flex-wrap gap-2">
                        {request.skills_needed.map((skill, index) => (
                          <Badge key={index} variant="outline">
                            {skill}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  <p className="text-xs text-muted-foreground">
                    {new Date(request.created_at).toLocaleDateString()}
                  </p>
                  
                  {!isRequestedByMe && request.status === 'pending' && (
                    <div className="flex gap-2 pt-2">
                      <Button 
                        onClick={() => updateRequestStatus(request.id, 'accepted')}
                        size="sm"
                        className="gap-1"
                      >
                        <CheckCircle className="h-4 w-4" />
                        Accept
                      </Button>
                      <Button 
                        onClick={() => updateRequestStatus(request.id, 'declined')}
                        variant="outline"
                        size="sm"
                        className="gap-1"
                      >
                        <XCircle className="h-4 w-4" />
                        Decline
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}