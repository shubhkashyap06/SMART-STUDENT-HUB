import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { Search, User, Mail, GraduationCap, Building } from 'lucide-react';
import { StudentProfileCard } from "./StudentProfileCard";
import { StudentProfileModal } from "./StudentProfileModal";

interface Student {
  id: string;
  full_name: string;
  email: string;
  department?: string;
  college?: string;
  year_of_study?: number;
  bio?: string;
  achievement_points?: number;
  skills: Array<{
    skill_name: string;
    proficiency_level: string;
    category: string;
  }>;
}

export function StudentSearch() {
  const [students, setStudents] = useState<Student[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<Student[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState<string>('all');
  const [selectedCollege, setSelectedCollege] = useState<string>('all');
  const [selectedSkill, setSelectedSkill] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [departments, setDepartments] = useState<string[]>([]);
  const [colleges, setColleges] = useState<string[]>([]);
  const [skills, setSkills] = useState<string[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);

  useEffect(() => {
    fetchStudents();
  }, []);

  useEffect(() => {
    filterStudents();
  }, [searchTerm, selectedDepartment, selectedCollege, selectedSkill, students]);

  const fetchStudents = async () => {
    try {
      // Use the same approach as PlacementDashboard
      const { data, error } = await (supabase as any)
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

      if (error) throw error;

      // Get achievement points for each student
      const studentsWithPoints = await Promise.all(
        (data || []).map(async (student: any) => {
          const { data: pointsData } = await supabase
            .from('documents')
            .select('points_awarded')
            .eq('student_id', student.id)
            .eq('status', 'approved');

          const totalPoints = pointsData?.reduce((sum, doc) => sum + (doc.points_awarded || 0), 0) || 0;

          const skills = student.student_skills?.map((ss: any) => ({
            skill_name: ss.skills?.name || '',
            proficiency_level: ss.proficiency_level,
            category: ss.skills?.category || ''
          })) || [];

          return {
            ...student,
            skills,
            achievement_points: totalPoints
          };
        })
      );

      setStudents(studentsWithPoints);

      // Extract unique values for filters
      const uniqueDepartments = [...new Set(
        studentsWithPoints.map(s => s.department).filter(Boolean)
      )] as string[];
      
      const uniqueColleges = [...new Set(
        studentsWithPoints.map(s => s.college).filter(Boolean)
      )] as string[];
      
      const uniqueSkills = [...new Set(
        studentsWithPoints.flatMap(s => s.skills.map(skill => skill.skill_name).filter(Boolean))
      )] as string[];

      setDepartments(uniqueDepartments);
      setColleges(uniqueColleges);
      setSkills(uniqueSkills);
    } catch (error) {
      console.error('Error fetching students:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterStudents = () => {
    let filtered = students;

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(student =>
        student.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.bio?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.skills.some(skill => 
          skill.skill_name.toLowerCase().includes(searchTerm.toLowerCase())
        )
      );
    }

    // Filter by department
    if (selectedDepartment !== 'all') {
      filtered = filtered.filter(student => student.department === selectedDepartment);
    }

    // Filter by college
    if (selectedCollege !== 'all') {
      filtered = filtered.filter(student => student.college === selectedCollege);
    }

    // Filter by skill
    if (selectedSkill !== 'all') {
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

  if (loading) {
    return (
      <div className="text-center py-16">
        <div className="relative mx-auto w-16 h-16 mb-6">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-primary"></div>
          <div className="absolute inset-0 rounded-full h-16 w-16 border-r-4 border-accent animate-spin" style={{animationDirection: 'reverse', animationDuration: '1.5s'}}></div>
        </div>
        <p className="text-xl font-semibold gradient-text mb-2">Discovering students...</p>
        <p className="text-muted-foreground">Finding amazing talent for you</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Enhanced Search and Filters */}
      <div className="space-y-4">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground h-5 w-5" />
          <Input
            placeholder="Search by name, email, bio, or skills..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="h-14 pl-12 pr-4 text-lg border-2 focus:border-primary transition-colors bg-background/50 backdrop-blur-sm"
          />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
            <SelectTrigger className="h-12 border-2 focus:border-primary">
              <SelectValue placeholder="All Departments" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Departments</SelectItem>
              {departments.map(dept => (
                <SelectItem key={dept} value={dept}>{dept}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={selectedCollege} onValueChange={setSelectedCollege}>
            <SelectTrigger className="h-12 border-2 focus:border-primary">
              <SelectValue placeholder="All Colleges" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Colleges</SelectItem>
              {colleges.map(college => (
                <SelectItem key={college} value={college}>{college}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={selectedSkill} onValueChange={setSelectedSkill}>
            <SelectTrigger className="h-12 border-2 focus:border-primary">
              <SelectValue placeholder="All Skills" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Skills</SelectItem>
              {skills.map(skill => (
                <SelectItem key={skill} value={skill}>{skill}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button
            variant="outline"
            onClick={() => {
              setSearchTerm('');
              setSelectedDepartment('all');
              setSelectedCollege('all');
              setSelectedSkill('all');
            }}
            className="h-12 border-2 hover:bg-primary/5 transition-colors"
          >
            Clear Filters
          </Button>
        </div>
      </div>

      {/* Enhanced Results Section */}
      <div className="flex items-center justify-between py-4 border-y border-border/50">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-to-br from-primary to-accent rounded-lg flex items-center justify-center">
            <User className="h-4 w-4 text-white" />
          </div>
          <div>
            <p className="font-semibold text-lg">
              {filteredStudents.length} student{filteredStudents.length !== 1 ? 's' : ''} found
            </p>
            <p className="text-sm text-muted-foreground">
              {searchTerm || selectedDepartment !== 'all' || selectedCollege !== 'all' || selectedSkill !== 'all' 
                ? 'Filtered results' 
                : 'Showing all students'}
            </p>
          </div>
        </div>
      </div>

      {/* Enhanced Student Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredStudents.map((student, index) => (
          <div key={student.id} className="animate-fade-in" style={{animationDelay: `${index * 0.1}s`}}>
            <StudentProfileCard 
              student={student}
              onViewProfile={(s) => setSelectedStudent(s as Student)}
            />
          </div>
        ))}
      </div>

      {filteredStudents.length === 0 && !loading && (
        <div className="text-center py-16">
          <div className="mx-auto w-24 h-24 bg-gradient-to-br from-muted to-muted-foreground/20 rounded-full flex items-center justify-center mb-6">
            <User className="h-12 w-12 text-muted-foreground" />
          </div>
          <h3 className="text-xl font-semibold mb-2">No students found</h3>
          <p className="text-muted-foreground mb-6 max-w-md mx-auto">
            No students match your current search criteria. Try adjusting your filters or search terms.
          </p>
          <Button 
            onClick={() => {
              setSearchTerm('');
              setSelectedDepartment('all');
              setSelectedCollege('all');
              setSelectedSkill('all');
            }}
            variant="outline"
            className="btn-gradient"
          >
            Clear All Filters
          </Button>
        </div>
      )}

      <StudentProfileModal 
        student={selectedStudent}
        isOpen={!!selectedStudent}
        onClose={() => setSelectedStudent(null)}
      />
    </div>
  );
}