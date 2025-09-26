import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Trophy, TrendingUp, Award, FileCheck, Target, Star } from 'lucide-react';

interface Profile {
  id: string;
  full_name: string;
  user_type: string;
  department?: string;
}

interface Achievement {
  id: string;
  title: string;
  description: string;
  points_awarded: number;
  approved_at: string;
  file_type: string;
}

interface AnalyticsDashboardProps {
  profile: Profile | null;
}

export function AnalyticsDashboard({ profile }: AnalyticsDashboardProps) {
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [totalPoints, setTotalPoints] = useState(0);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalDocuments: 0,
    approvedDocuments: 0,
    pendingDocuments: 0,
    rejectedDocuments: 0
  });

  useEffect(() => {
    if (profile && profile.user_type === 'student') {
      fetchAchievements();
      fetchStats();
      fetchTotalPoints();
    }
  }, [profile]);

  const fetchAchievements = async () => {
    if (!profile) return;

    try {
      const { data, error } = await supabase
        .from('documents')
        .select('id, title, description, points_awarded, approved_at, file_type')
        .eq('student_id', profile.id)
        .eq('status', 'approved')
        .gt('points_awarded', 0)
        .order('approved_at', { ascending: false });

      if (error) throw error;
      setAchievements(data || []);
    } catch (error) {
      console.error('Error fetching achievements:', error);
    }
  };

  const fetchStats = async () => {
    if (!profile) return;

    try {
      const { data, error } = await supabase
        .from('documents')
        .select('status')
        .eq('student_id', profile.id);

      if (error) throw error;

      const stats = {
        totalDocuments: data?.length || 0,
        approvedDocuments: data?.filter(d => d.status === 'approved').length || 0,
        pendingDocuments: data?.filter(d => d.status === 'pending').length || 0,
        rejectedDocuments: data?.filter(d => d.status === 'rejected').length || 0
      };

      setStats(stats);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const fetchTotalPoints = async () => {
    if (!profile) return;

    try {
      const { data, error } = await supabase
        .rpc('get_student_achievement_points', { student_profile_id: profile.id });

      if (error) throw error;
      setTotalPoints(data || 0);
    } catch (error) {
      console.error('Error fetching total points:', error);
    } finally {
      setLoading(false);
    }
  };

  const getAchievementIcon = (fileType: string) => {
    switch (fileType.toLowerCase()) {
      case 'certificate':
        return <Award className="h-5 w-5 text-yellow-500" />;
      case 'project':
        return <Target className="h-5 w-5 text-blue-500" />;
      case 'competition':
        return <Trophy className="h-5 w-5 text-purple-500" />;
      default:
        return <Star className="h-5 w-5 text-green-500" />;
    }
  };

  const getPointsLevel = (points: number) => {
    if (points >= 1000) return { level: 'Expert', color: 'text-purple-600', progress: 100 };
    if (points >= 500) return { level: 'Advanced', color: 'text-blue-600', progress: (points / 1000) * 100 };
    if (points >= 200) return { level: 'Intermediate', color: 'text-green-600', progress: (points / 500) * 100 };
    if (points >= 50) return { level: 'Beginner', color: 'text-yellow-600', progress: (points / 200) * 100 };
    return { level: 'Newcomer', color: 'text-gray-600', progress: (points / 50) * 100 };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (profile?.user_type !== 'student') {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Trophy className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">Analytics Dashboard</h3>
          <p className="text-muted-foreground text-center">
            Analytics dashboard is available for students only
          </p>
        </CardContent>
      </Card>
    );
  }

  const level = getPointsLevel(totalPoints);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Achievement Analytics</h2>
        <p className="text-muted-foreground">Track your academic progress and achievements</p>
      </div>

      {/* Overview Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Points</CardTitle>
            <Trophy className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-700">{totalPoints}</div>
            <p className="text-xs text-blue-600 mt-1">
              Level: <span className={`font-semibold ${level.color}`}>{level.level}</span>
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Approved Documents</CardTitle>
            <FileCheck className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-700">{stats.approvedDocuments}</div>
            <p className="text-xs text-green-600 mt-1">
              {stats.totalDocuments > 0 ? Math.round((stats.approvedDocuments / stats.totalDocuments) * 100) : 0}% approval rate
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Achievements</CardTitle>
            <Award className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-700">{achievements.length}</div>
            <p className="text-xs text-purple-600 mt-1">Point-worthy accomplishments</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Progress</CardTitle>
            <TrendingUp className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-700">
              {Math.round(level.progress)}%
            </div>
            <p className="text-xs text-orange-600 mt-1">To next level</p>
          </CardContent>
        </Card>
      </div>

      {/* Progress Bar */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Level Progress
          </CardTitle>
          <CardDescription>
            Your current level: <span className={`font-semibold ${level.color}`}>{level.level}</span>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Progress to next level</span>
              <span>{Math.round(level.progress)}%</span>
            </div>
            <Progress value={level.progress} className="h-3" />
            <div className="grid grid-cols-5 gap-2 text-xs text-muted-foreground mt-4">
              <div className="text-center">
                <div className="font-medium">Newcomer</div>
                <div>0-49 pts</div>
              </div>
              <div className="text-center">
                <div className="font-medium">Beginner</div>
                <div>50-199 pts</div>
              </div>
              <div className="text-center">
                <div className="font-medium">Intermediate</div>
                <div>200-499 pts</div>
              </div>
              <div className="text-center">
                <div className="font-medium">Advanced</div>
                <div>500-999 pts</div>
              </div>
              <div className="text-center">
                <div className="font-medium">Expert</div>
                <div>1000+ pts</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Achievements */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="h-5 w-5" />
            Recent Achievements
          </CardTitle>
          <CardDescription>Your latest point-earning accomplishments</CardDescription>
        </CardHeader>
        <CardContent>
          {achievements.length === 0 ? (
            <div className="text-center py-8">
              <Trophy className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No achievements yet</p>
              <p className="text-sm text-muted-foreground">Upload documents to start earning points!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {achievements.slice(0, 5).map((achievement) => (
                <div key={achievement.id} className="flex items-center justify-between p-4 rounded-lg border bg-gradient-to-r from-background to-muted/20">
                  <div className="flex items-center gap-3">
                    {getAchievementIcon(achievement.file_type)}
                    <div>
                      <p className="font-medium">{achievement.title}</p>
                      {achievement.description && (
                        <p className="text-sm text-muted-foreground">{achievement.description}</p>
                      )}
                      <p className="text-xs text-muted-foreground">
                        {new Date(achievement.approved_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <Badge variant="secondary" className="font-semibold">
                    +{achievement.points_awarded} pts
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}