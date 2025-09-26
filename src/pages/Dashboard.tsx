import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { StudentSearch } from '@/components/StudentSearch';
import { ProfileEditor } from '@/components/ProfileEditor';
import { DocumentUpload } from '@/components/DocumentUpload';
import { DocumentApproval } from '@/components/DocumentApproval';
import { CollaborationRequests } from '@/components/CollaborationRequests';
import { AnalyticsDashboard } from '@/components/AnalyticsDashboard';
import { ResumeGenerator } from '@/components/ResumeGenerator';
import { DebugInfo } from '@/components/DebugInfo';
import { LogOut, User, Upload, Search, CheckSquare, Users, TrendingUp, FileText } from 'lucide-react';
import { ThemeToggle } from '@/components/ThemeToggle';

interface Profile {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
  user_type: string;
  department?: string;
  year_of_study?: number;
  bio?: string;
}

export default function Dashboard() {
  const { user, signOut } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchProfile();
    }
  }, [user]);

  const fetchProfile = async () => {
    try {
      console.log('🔍 Fetching profile for user:', user?.id);
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user?.id)
        .single();

      console.log('📊 Profile fetch result:', { data, error });
      
      if (error && error.code === 'PGRST116') {
        // Profile doesn't exist, create one
        console.log('🔧 Profile not found, creating new profile...');
        const { data: newProfile, error: createError } = await supabase
          .from('profiles')
          .insert({
            user_id: user!.id,
            full_name: user!.user_metadata?.full_name || user!.email?.split('@')[0] || 'New User',
            email: user!.email!,
            user_type: user!.user_metadata?.user_type || 'student',
            college: user!.user_metadata?.college || '',
          })
          .select()
          .single();
          
        if (createError) {
          console.error('❌ Error creating profile:', createError);
          throw createError;
        }
        
        console.log('✅ Profile created successfully:', newProfile);
        setProfile(newProfile);
      } else if (error) {
        throw error;
      } else {
        setProfile(data);
      }
    } catch (error) {
      console.error('❌ Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5 flex items-center justify-center">
        <div className="text-center space-y-6">
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-primary mx-auto"></div>
            <div className="absolute inset-0 rounded-full h-16 w-16 border-r-4 border-accent animate-spin" style={{animationDirection: 'reverse', animationDuration: '1.5s'}}></div>
          </div>
          <div className="space-y-2">
            <p className="text-xl font-semibold gradient-text">Loading your dashboard...</p>
            <p className="text-muted-foreground animate-pulse">Preparing your personalized experience</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5">
      <DebugInfo />
      <header className="glass-effect border-b backdrop-blur-xl">
        <div className="container mx-auto px-4 py-6 flex justify-between items-center">
          <div className="space-y-1">
            <h1 className="text-3xl font-bold tracking-tight">
              <span className="gradient-text">Student Hub</span>
            </h1>
            <p className="text-muted-foreground font-medium">
              Welcome back, <span className="text-foreground">{profile?.full_name || user.email}</span>
            </p>
          </div>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Button 
              variant="outline" 
              onClick={signOut} 
              className="hover:bg-destructive hover:text-destructive-foreground transition-all duration-300 border-2 hover:scale-105"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <Tabs defaultValue="profile" className="w-full">
          <TabsList className="grid w-full grid-cols-6 lg:grid-cols-7 glass-effect border-2 p-2 h-auto">
            <TabsTrigger value="profile" className="flex items-center gap-2 px-4 py-3 rounded-lg transition-all duration-300">
              <User className="h-4 w-4" />
              <span className="hidden sm:inline font-medium">Profile</span>
            </TabsTrigger>
            <TabsTrigger value="documents" className="flex items-center gap-2 px-4 py-3 rounded-lg transition-all duration-300">
              <Upload className="h-4 w-4" />
              <span className="hidden sm:inline font-medium">Documents</span>
            </TabsTrigger>
            <TabsTrigger value="search" className="flex items-center gap-2 px-4 py-3 rounded-lg transition-all duration-300">
              <Search className="h-4 w-4" />
              <span className="hidden sm:inline font-medium">Search</span>
            </TabsTrigger>
            <TabsTrigger value="collaboration" className="flex items-center gap-2 px-4 py-3 rounded-lg transition-all duration-300">
              <Users className="h-4 w-4" />
              <span className="hidden sm:inline font-medium">Collaborate</span>
            </TabsTrigger>
            {profile?.user_type === 'student' && (
              <>
                <TabsTrigger value="analytics" className="flex items-center gap-2 px-4 py-3 rounded-lg transition-all duration-300">
                  <TrendingUp className="h-4 w-4" />
                  <span className="hidden sm:inline font-medium">Analytics</span>
                </TabsTrigger>
                <TabsTrigger value="resume" className="flex items-center gap-2 px-4 py-3 rounded-lg transition-all duration-300">
                  <FileText className="h-4 w-4" />
                  <span className="hidden sm:inline font-medium">Resume</span>
                </TabsTrigger>
              </>
            )}
            {profile?.user_type === 'faculty' && (
              <TabsTrigger value="approvals" className="flex items-center gap-2 px-4 py-3 rounded-lg transition-all duration-300">
                <CheckSquare className="h-4 w-4" />
                <span className="hidden sm:inline font-medium">Approvals</span>
              </TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="profile" className="mt-8 animate-fade-in">
            <Card className="glass-effect border-2 card-hover">
              <CardHeader className="pb-6">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-primary to-accent rounded-xl flex items-center justify-center">
                    <User className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-2xl gradient-text">Your Profile</CardTitle>
                    <CardDescription className="text-base">
                      Manage your personal information and showcase your skills
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <ProfileEditor profile={profile} onUpdate={setProfile} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="documents" className="mt-8 animate-fade-in">
            <Card className="glass-effect border-2 card-hover">
              <CardHeader className="pb-6">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center">
                    <Upload className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-2xl gradient-text">Document Management</CardTitle>
                    <CardDescription className="text-base">
                      Upload, organize, and manage your academic documents
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <DocumentUpload profile={profile} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="search" className="mt-8 animate-fade-in">
            <Card className="glass-effect border-2 card-hover">
              <CardHeader className="pb-6">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-violet-600 rounded-xl flex items-center justify-center">
                    <Search className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-2xl gradient-text">Student Directory</CardTitle>
                    <CardDescription className="text-base">
                      Discover and connect with students across departments and skills
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <StudentSearch />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="collaboration" className="mt-8 animate-fade-in">
            <CollaborationRequests profile={profile} />
          </TabsContent>

          {profile?.user_type === 'student' && (
            <>
              <TabsContent value="analytics" className="mt-8 animate-fade-in">
                <AnalyticsDashboard profile={profile} />
              </TabsContent>

              <TabsContent value="resume" className="mt-8 animate-fade-in">
                <ResumeGenerator profile={profile} />
              </TabsContent>
            </>
          )}

          {profile?.user_type === 'faculty' && (
            <TabsContent value="approvals" className="mt-8 animate-fade-in">
              <Card className="glass-effect border-2 card-hover">
                <CardHeader className="pb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-red-600 rounded-xl flex items-center justify-center">
                      <CheckSquare className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-2xl gradient-text">Document Approvals</CardTitle>
                      <CardDescription className="text-base">
                        Review and approve student document submissions efficiently
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <DocumentApproval />
                </CardContent>
              </Card>
            </TabsContent>
          )}
        </Tabs>
      </main>
    </div>
  );
}