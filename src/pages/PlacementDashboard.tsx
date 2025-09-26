import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Search, LogOut, Users, Award, GraduationCap, MapPin, BookOpen, Filter } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { StudentProfileModal } from "@/components/StudentProfileModal";

interface PlacementOfficer {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
  organization?: string;
}

interface Student {
  id: string;
  full_name: string;
  email?: string;
  department?: string;
  college?: string;
  year_of_study?: number;
  bio?: string;
  user_type: string;
  skills: Array<{
    skill_name: string;
    proficiency_level: string;
    category: string;
  }>;
  achievement_points?: number;
}

const PlacementDashboard = () => {
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const [profile, setProfile] = useState<PlacementOfficer | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCollege, setSelectedCollege] = useState<string>("");
  const [selectedDepartment, setSelectedDepartment] = useState<string>("");
  const [selectedSkill, setSelectedSkill] = useState<string>("");
  const [colleges, setColleges] = useState<string[]>([]);
  const [departments, setDepartments] = useState<string[]>([]);
  const [skills, setSkills] = useState<string[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);

  useEffect(() => {
    if (user) {
      fetchProfile();
    }
  }, [user]);

  useEffect(() => {
    if (profile) {
      fetchStudents();
    }
  }, [profile]);

  useEffect(() => {
    filterStudents();
  }, [students, searchTerm, selectedCollege, selectedDepartment, selectedSkill]);

  const fetchProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('placement_officers')
        .select('*')
        .eq('user_id', user?.id)
        .single();

      if (error) throw error;
      setProfile(data);
    } catch (error) {
      console.error('Error fetching profile:', error);
      toast({
        title: "Error",
        description: "Failed to load profile. Please try again.",
        variant: "destructive",
      });
    }
  };

  const fetchStudents = async () => {
    try {
      setLoading(true);
      
      // Fetch students with their skills and achievement points
      const { data: studentsData, error: studentsError } = await supabase
        .from('profiles')
        .select(`
          *,
          student_skills(
            skills(name, category),
            proficiency_level
          )
        `)
        .eq('user_type', 'student')
        .eq('privacy_settings->profile_visible', 'true');

      if (studentsError) throw studentsError;

      // Get achievement points for each student
      const studentsWithPoints = await Promise.all(
        (studentsData || []).map(async (student) => {
          const { data: pointsData } = await supabase
            .rpc('get_student_achievement_points', { student_profile_id: student.id });

          const skills = student.student_skills?.map((ss: any) => ({
            skill_name: ss.skills.name,
            proficiency_level: ss.proficiency_level,
            category: ss.skills.category
          })) || [];

          return {
            ...student,
            skills,
            achievement_points: pointsData || 0
          };
        })
      );

      // Extract unique values for filters
      const uniqueColleges = [...new Set(studentsWithPoints.map(s => s.college).filter(Boolean))];
      const uniqueDepartments = [...new Set(studentsWithPoints.map(s => s.department).filter(Boolean))];
      const uniqueSkills = [...new Set(studentsWithPoints.flatMap(s => s.skills.map(skill => skill.skill_name)))];

      setStudents(studentsWithPoints);
      setColleges(uniqueColleges);
      setDepartments(uniqueDepartments);
      setSkills(uniqueSkills);
    } catch (error) {
      console.error('Error fetching students:', error);
      toast({
        title: "Error",
        description: "Failed to load students. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filterStudents = () => {
    let filtered = students;

    if (searchTerm) {
      filtered = filtered.filter(student =>
        student.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.bio?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.skills.some(skill => 
          skill.skill_name.toLowerCase().includes(searchTerm.toLowerCase())
        )
      );
    }

    if (selectedCollege) {
      filtered = filtered.filter(student => student.college === selectedCollege);
    }

    if (selectedDepartment) {
      filtered = filtered.filter(student => student.department === selectedDepartment);
    }

    if (selectedSkill) {
      filtered = filtered.filter(student =>
        student.skills.some(skill => skill.skill_name === selectedSkill)
      );
    }

    // Sort by achievement points (descending) and then by name
    filtered.sort((a, b) => {
      if (b.achievement_points !== a.achievement_points) {
        return (b.achievement_points || 0) - (a.achievement_points || 0);
      }
      return a.full_name.localeCompare(b.full_name);
    });

    setFilteredStudents(filtered);
  };

  const clearFilters = () => {
    setSearchTerm("");
    setSelectedCollege("");
    setSelectedDepartment("");
    setSelectedSkill("");
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <GraduationCap className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground">Placement Portal</h1>
                <p className="text-sm text-muted-foreground">
                  Welcome, {profile?.full_name}
                </p>
              </div>
            </div>
            <Button onClick={signOut} variant="outline" size="sm">
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6 space-y-6">
        {/* Search and Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5" />
              Search & Filter Students
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-4 flex-wrap">
              <div className="flex-1 min-w-[200px]">
                <Input
                  placeholder="Search by name, email, or skills..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full"
                />
              </div>
              
              <Select value={selectedCollege} onValueChange={setSelectedCollege}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Select College" />
                </SelectTrigger>
                <SelectContent>
                  {colleges.map(college => (
                    <SelectItem key={college} value={college}>{college}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Select Department" />
                </SelectTrigger>
                <SelectContent>
                  {departments.map(dept => (
                    <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={selectedSkill} onValueChange={setSelectedSkill}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Select Skill" />
                </SelectTrigger>
                <SelectContent>
                  {skills.map(skill => (
                    <SelectItem key={skill} value={skill}>{skill}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Button onClick={clearFilters} variant="outline">
                <Filter className="h-4 w-4 mr-2" />
                Clear
              </Button>
            </div>
            
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Users className="h-4 w-4" />
              <span>{filteredStudents.length} students found</span>
            </div>
          </CardContent>
        </Card>

        {/* Students Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredStudents.map((student) => (
            <Card 
              key={student.id} 
              className="group hover:shadow-lg transition-all duration-300 cursor-pointer border-border/50 hover:border-primary/20 bg-card/50 backdrop-blur-sm"
              onClick={() => setSelectedStudent(student)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start gap-3">
                  <Avatar className="h-12 w-12 border border-border">
                    <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                      {getInitials(student.full_name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-foreground truncate group-hover:text-primary transition-colors">
                      {student.full_name}
                    </h3>
                    <div className="space-y-1">
                      {student.department && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <BookOpen className="h-3 w-3" />
                          <span className="truncate">{student.department}</span>
                        </div>
                      )}
                      {student.college && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <MapPin className="h-3 w-3" />
                          <span className="truncate">{student.college}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    {student.year_of_study && (
                      <Badge variant="secondary" className="text-xs">
                        Y{student.year_of_study}
                      </Badge>
                    )}
                    <div className="flex items-center gap-1">
                      <Award className="h-3 w-3 text-amber-500" />
                      <span className="text-xs font-medium text-amber-600">
                        {student.achievement_points || 0}
                      </span>
                    </div>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="pt-0">
                {student.bio && (
                  <p className="text-xs text-muted-foreground line-clamp-2 mb-3">
                    {student.bio}
                  </p>
                )}
                
                {student.skills.length > 0 && (
                  <div className="space-y-2">
                    <div className="flex flex-wrap gap-1">
                      {student.skills.slice(0, 2).map((skill, index) => (
                        <Badge 
                          key={index} 
                          variant="outline" 
                          className="text-xs py-0 px-1 bg-primary/5 border-primary/20"
                        >
                          {skill.skill_name}
                        </Badge>
                      ))}
                      {student.skills.length > 2 && (
                        <Badge variant="outline" className="text-xs py-0 px-1 bg-muted">
                          +{student.skills.length - 2}
                        </Badge>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredStudents.length === 0 && (
          <Card>
            <CardContent className="py-12 text-center">
              <Users className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">No students found</h3>
              <p className="text-muted-foreground">
                Try adjusting your search criteria or filters.
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      <StudentProfileModal 
        student={selectedStudent}
        isOpen={!!selectedStudent}
        onClose={() => setSelectedStudent(null)}
      />
    </div>
  );
};

export default PlacementDashboard;