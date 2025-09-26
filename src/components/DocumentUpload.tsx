import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { Upload, File, Clock, CheckCircle, XCircle, Download, Trash2 } from 'lucide-react';

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
}

interface Profile {
  id: string;
  user_type: string;
}

interface DocumentUploadProps {
  profile: Profile | null;
}

export function DocumentUpload({ profile }: DocumentUploadProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    if (profile) {
      fetchDocuments();
    }
  }, [profile]);

  const fetchDocuments = async () => {
    if (!profile) {
      console.log('⚠️ No profile available for document fetch');
      return;
    }

    console.log('🔍 Fetching documents for profile:', profile.id);
    try {
      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .eq('student_id', profile.id)
        .order('uploaded_at', { ascending: false });

      console.log('📊 Documents fetch result:', { data, error });
      if (error) throw error;
      setDocuments((data || []) as Document[]);
    } catch (error) {
      console.error('❌ Error fetching documents:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!profile) {
      console.log('⚠️ DocumentUpload: No profile available for file upload');
      toast({
        variant: "destructive",
        title: "Profile not found",
        description: "Please refresh the page and try again.",
      });
      return;
    }

    console.log('🔍 DocumentUpload: Starting file upload for profile:', profile.id);
    setUploading(true);
    const formData = new FormData(e.currentTarget);
    const file = formData.get('file') as File;
    const title = formData.get('title') as string;
    const description = formData.get('description') as string;

    if (!file) {
      toast({
        variant: "destructive",
        title: "No file selected",
        description: "Please select a file to upload.",
      });
      setUploading(false);
      return;
    }

    try {
      // Upload file to Supabase Storage - use user.id for storage path
      const fileExt = file.name.split('.').pop();
      const fileName = `${user?.id}/${Date.now()}.${fileExt}`;
      
      console.log('📤 Uploading to storage with filename:', fileName);
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('documents')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        console.error('❌ Storage upload error:', uploadError);
        throw uploadError;
      }

      console.log('✅ File uploaded successfully:', uploadData);

      // Get the public URL
      const { data: { publicUrl } } = supabase.storage
        .from('documents')
        .getPublicUrl(fileName);

      console.log('🔗 Generated public URL:', publicUrl);

      // Save document metadata to database
      const documentData = {
        student_id: profile.id,
        title,
        description,
        file_url: publicUrl,
        file_type: file.type,
        file_size: file.size,
      };
      
      console.log('💾 Saving document metadata:', documentData);
      const { data: dbData, error: dbError } = await supabase
        .from('documents')
        .insert(documentData)
        .select();

      if (dbError) {
        console.error('❌ Database insert error:', dbError);
        // If DB insert fails, try to clean up the uploaded file
        await supabase.storage.from('documents').remove([fileName]);
        throw dbError;
      }

      console.log('✅ Document record created:', dbData);

      toast({
        title: "Document uploaded",
        description: "Your document has been uploaded and is pending approval.",
      });

      // Clear form
      (e.target as HTMLFormElement).reset();
      fetchDocuments();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Upload failed",
        description: error.message,
      });
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteDocument = async (documentId: string, fileUrl: string) => {
    if (!confirm('Are you sure you want to delete this document? This action cannot be undone.')) {
      return;
    }

    setDeleting(documentId);
    
    try {
      // Extract the file path from the URL for storage deletion
      const url = new URL(fileUrl);
      const pathParts = url.pathname.split('/');
      const filePath = pathParts.slice(-2).join('/'); // Get user_id/filename
      
      console.log('🗑️ Deleting document:', { documentId, filePath });
      
      // Delete from database first
      const { error: dbError } = await supabase
        .from('documents')
        .delete()
        .eq('id', documentId);
        
      if (dbError) {
        console.error('❌ Database delete error:', dbError);
        throw dbError;
      }
      
      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from('documents')
        .remove([filePath]);
        
      if (storageError) {
        console.warn('⚠️ Storage delete error (file may not exist):', storageError);
        // Don't throw here as the database record is already deleted
      }
      
      toast({
        title: "Document deleted",
        description: "Your document has been successfully deleted.",
      });
      
      // Refresh the documents list
      fetchDocuments();
    } catch (error: any) {
      console.error('❌ Delete operation failed:', error);
      toast({
        variant: "destructive",
        title: "Delete failed",
        description: error.message || "Failed to delete the document.",
      });
    } finally {
      setDeleting(null);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'rejected':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-yellow-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge className="bg-green-100 text-green-800">Approved</Badge>;
      case 'rejected':
        return <Badge variant="destructive">Rejected</Badge>;
      default:
        return <Badge variant="secondary">Pending</Badge>;
    }
  };

  if (!profile) return null;

  return (
    <div className="space-y-6">
      {/* Upload Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Upload New Document
          </CardTitle>
          <CardDescription>
            Upload documents for faculty review and approval
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleFileUpload} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Document Title</Label>
              <Input
                id="title"
                name="title"
                placeholder="e.g., Research Project Proposal"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description (Optional)</Label>
              <Textarea
                id="description"
                name="description"
                placeholder="Brief description of the document..."
                rows={2}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="file">Select File</Label>
              <Input
                id="file"
                name="file"
                type="file"
                accept=".pdf,.doc,.docx,.txt,.png,.jpg,.jpeg"
                required
              />
              <p className="text-xs text-muted-foreground">
                Supported formats: PDF, Word documents, text files, images
              </p>
            </div>
            <Button type="submit" disabled={uploading}>
              {uploading ? 'Uploading...' : 'Upload Document'}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Documents List */}
      <Card>
        <CardHeader>
          <CardTitle>Your Documents</CardTitle>
          <CardDescription>
            View and manage your uploaded documents
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-4">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto"></div>
              <p className="mt-2 text-sm text-muted-foreground">Loading documents...</p>
            </div>
          ) : documents.length === 0 ? (
            <p className="text-center text-muted-foreground py-4">
              No documents uploaded yet.
            </p>
          ) : (
            <div className="space-y-4">
              {documents.map((doc) => (
                <div key={doc.id} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <File className="h-5 w-5 text-muted-foreground mt-1" />
                      <div className="flex-1">
                        <h4 className="font-medium">{doc.title}</h4>
                        {doc.description && (
                          <p className="text-sm text-muted-foreground mt-1">
                            {doc.description}
                          </p>
                        )}
                        <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                          <span>Size: {formatFileSize(doc.file_size)}</span>
                          <span>Uploaded: {new Date(doc.uploaded_at).toLocaleDateString()}</span>
                        </div>
                        {doc.status === 'rejected' && doc.rejection_reason && (
                          <p className="text-sm text-red-600 mt-2">
                            Rejection reason: {doc.rejection_reason}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusBadge(doc.status)}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(doc.file_url, '_blank')}
                        title="Download document"
                      >
                        <Download className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteDocument(doc.id, doc.file_url)}
                        disabled={deleting === doc.id}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        title="Delete document"
                      >
                        {deleting === doc.id ? (
                          <div className="h-3 w-3 animate-spin rounded-full border-2 border-red-600 border-t-transparent" />
                        ) : (
                          <Trash2 className="h-3 w-3" />
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}