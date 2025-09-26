import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { CheckCircle, XCircle, Eye, File, Download, Award } from 'lucide-react';

interface Document {
  id: string;
  title: string;
  description?: string;
  file_url: string;
  file_type: string;
  file_size: number;
  status: 'pending' | 'approved' | 'rejected';
  uploaded_at: string;
  rejection_reason?: string;
  student: {
    full_name: string;
    email: string;
    department?: string;
  };
}

export function DocumentApproval() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [facultyProfile, setFacultyProfile] = useState<any>(null);

  useEffect(() => {
    if (user) {
      fetchFacultyProfile();
      fetchPendingDocuments();
    }
  }, [user]);

  const fetchFacultyProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, user_type')
        .eq('user_id', user?.id)
        .single();

      if (error) throw error;
      setFacultyProfile(data);
    } catch (error) {
      console.error('Error fetching faculty profile:', error);
    }
  };

  const fetchPendingDocuments = async () => {
    try {
      const { data, error } = await supabase
        .from('documents')
        .select(`
          *,
          student:profiles!documents_student_id_fkey (
            full_name,
            email,
            department
          )
        `)
        .eq('status', 'pending')
        .order('uploaded_at', { ascending: true });

      if (error) throw error;
      setDocuments((data || []) as Document[]);
    } catch (error) {
      console.error('Error fetching documents:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApproval = async (documentId: string, approved: boolean, reason?: string, points?: number) => {
    setActionLoading(documentId);

    try {
      // Ensure we have the faculty profile ID
      if (!facultyProfile?.id) {
        throw new Error('Faculty profile not found. Please refresh the page.');
      }

      const { error } = await supabase
        .from('documents')
        .update({
          status: approved ? 'approved' : 'rejected',
          approved_by: facultyProfile.id, // Use profile ID instead of user ID
          approved_at: new Date().toISOString(),
          ...(reason && { rejection_reason: reason }),
          ...(approved && points && { points_awarded: points }),
        })
        .eq('id', documentId);

      if (error) throw error;

      toast({
        title: approved ? "Document approved" : "Document rejected",
        description: `The document has been ${approved ? 'approved' : 'rejected'}${approved && points ? ` with ${points} achievement points` : ''}.`,
      });

      fetchPendingDocuments();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error processing document",
        description: error.message,
      });
    } finally {
      setActionLoading(null);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  if (loading || !facultyProfile) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
        <p className="mt-2 text-muted-foreground">
          {loading ? 'Loading pending documents...' : 'Loading faculty profile...'}
        </p>
      </div>
    );
  }

  if (documents.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">No documents pending approval.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {documents.map((doc) => (
        <Card key={doc.id}>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <File className="h-5 w-5" />
                  {doc.title}
                </CardTitle>
                <CardDescription>
                  Submitted by {doc.student.full_name} ({doc.student.email})
                  {doc.student.department && ` - ${doc.student.department}`}
                </CardDescription>
              </div>
              <Badge variant="secondary">Pending</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {doc.description && (
              <p className="text-sm text-muted-foreground">{doc.description}</p>
            )}
            
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <span>Size: {formatFileSize(doc.file_size)}</span>
              <span>Type: {doc.file_type}</span>
              <span>Uploaded: {new Date(doc.uploaded_at).toLocaleDateString()}</span>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open(doc.file_url, '_blank')}
              >
                <Eye className="h-3 w-3 mr-1" />
                View Document
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open(doc.file_url, '_blank')}
              >
                <Download className="h-3 w-3 mr-1" />
                Download
              </Button>

              <Dialog>
                <DialogTrigger asChild>
                  <Button
                    size="sm"
                    disabled={actionLoading === doc.id}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Approve
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Approve Document</DialogTitle>
                    <DialogDescription>
                      Approve this document and optionally award achievement points.
                    </DialogDescription>
                  </DialogHeader>
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      const formData = new FormData(e.currentTarget);
                      const points = parseInt(formData.get('points') as string) || 0;
                      handleApproval(doc.id, true, undefined, points);
                    }}
                    className="space-y-4"
                  >
                    <div className="space-y-2">
                      <Label htmlFor="points">Achievement Points (Optional)</Label>
                      <Input
                        id="points"
                        name="points"
                        type="number"
                        min="0"
                        max="100"
                        placeholder="Enter points (0-100)"
                      />
                      <p className="text-sm text-muted-foreground">
                        Award points based on document significance:
                        <br />• Certificates: 10-25 points
                        <br />• Projects: 15-40 points  
                        <br />• Competitions: 20-50 points
                        <br />• Major achievements: 30-100 points
                      </p>
                    </div>
                    <div className="flex justify-end gap-2">
                      <DialogTrigger asChild>
                        <Button variant="outline">Cancel</Button>
                      </DialogTrigger>
                      <Button type="submit" className="gap-1">
                        <Award className="h-4 w-4" />
                        Approve Document
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>

              <Dialog>
                <DialogTrigger asChild>
                  <Button
                    variant="destructive"
                    size="sm"
                    disabled={actionLoading === doc.id}
                  >
                    <XCircle className="h-3 w-3 mr-1" />
                    Reject
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Reject Document</DialogTitle>
                    <DialogDescription>
                      Please provide a reason for rejecting this document.
                    </DialogDescription>
                  </DialogHeader>
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      const formData = new FormData(e.currentTarget);
                      const reason = formData.get('reason') as string;
                      handleApproval(doc.id, false, reason);
                    }}
                    className="space-y-4"
                  >
                    <Textarea
                      name="reason"
                      placeholder="Explain why this document is being rejected..."
                      required
                      rows={3}
                    />
                    <div className="flex justify-end gap-2">
                      <DialogTrigger asChild>
                        <Button variant="outline">Cancel</Button>
                      </DialogTrigger>
                      <Button type="submit" variant="destructive">
                        Reject Document
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}