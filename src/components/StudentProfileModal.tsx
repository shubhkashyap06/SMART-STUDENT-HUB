import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { MapPin, BookOpen, User, Mail, Calendar, Award } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface StudentProfile {
  id: string;
  full_name: string;
  email?: string;
  department?: string;
  college?: string;
  year_of_study?: number;
  bio?: string;
  skills: Array<{
    skill_name: string;
    proficiency_level: string;
    category: string;
  }>;
}

interface StudentProfileModalProps {
  student: StudentProfile | null;
  isOpen: boolean;
  onClose: () => void;
}

export const StudentProfileModal = ({ student, isOpen, onClose }: StudentProfileModalProps) => {
  if (!student) return null;

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  const getProficiencyColor = (level: string) => {
    switch (level?.toLowerCase()) {
      case 'expert': return 'bg-emerald-500 text-white';
      case 'advanced': return 'bg-blue-500 text-white';
      case 'intermediate': return 'bg-amber-500 text-white';
      case 'beginner': return 'bg-gray-500 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  const skillsByCategory = student.skills.reduce((acc, skill) => {
    const category = skill.category || 'Other';
    if (!acc[category]) acc[category] = [];
    acc[category].push(skill);
    return acc;
  }, {} as Record<string, typeof student.skills>);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="sr-only">Student Profile</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Header Section */}
          <div className="flex items-start gap-4 pb-4 border-b">
            <Avatar className="h-16 w-16 border border-border">
              <AvatarFallback className="bg-primary text-primary-foreground text-lg font-bold">
                {getInitials(student.full_name)}
              </AvatarFallback>
            </Avatar>
            
            <div className="flex-1 space-y-2">
              <h2 className="text-2xl font-bold text-foreground">{student.full_name}</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                {student.email && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Mail className="h-4 w-4" />
                    <span>{student.email}</span>
                  </div>
                )}
                
                {student.department && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <BookOpen className="h-4 w-4" />
                    <span>{student.department}</span>
                  </div>
                )}
                
                {student.college && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <MapPin className="h-4 w-4" />
                    <span>{student.college}</span>
                  </div>
                )}
                
                {student.year_of_study && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    <span>Year {student.year_of_study}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Bio Section */}
          {student.bio && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  About
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground leading-relaxed">{student.bio}</p>
              </CardContent>
            </Card>
          )}

          {/* Skills Section */}
          {student.skills.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="h-5 w-5" />
                  Skills & Expertise
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {Object.entries(skillsByCategory).map(([category, skills]) => (
                  <div key={category}>
                    <h4 className="font-medium text-foreground mb-2">{category}</h4>
                    <div className="flex flex-wrap gap-2">
                      {skills.map((skill, index) => (
                        <div key={index} className="flex items-center gap-1">
                          <Badge variant="outline" className="bg-card">
                            {skill.skill_name}
                          </Badge>
                          <Badge 
                            className={`text-xs ${getProficiencyColor(skill.proficiency_level)}`}
                          >
                            {skill.proficiency_level}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};