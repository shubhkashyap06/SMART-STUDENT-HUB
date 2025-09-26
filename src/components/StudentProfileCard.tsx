import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { MapPin, BookOpen, User, Eye, GraduationCap, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";

interface StudentProfile {
  id: string;
  full_name: string;
  email?: string;
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

interface StudentProfileCardProps {
  student: StudentProfile;
  onViewProfile: (student: StudentProfile) => void;
}

export const StudentProfileCard = ({ student, onViewProfile }: StudentProfileCardProps) => {
  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  const getProficiencyColor = (level: string) => {
    switch (level.toLowerCase()) {
      case 'beginner': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'intermediate': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'advanced': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <Card className="group glass-effect border-2 card-hover overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
      
      <CardHeader className="pb-4 relative">
        <div className="flex items-start gap-4">
          <div className="relative">
            <Avatar className="h-14 w-14 border-2 border-primary/20 shadow-lg group-hover:border-primary/40 transition-colors">
              <AvatarFallback className="bg-gradient-to-br from-primary to-accent text-white font-bold text-lg">
                {getInitials(student.full_name)}
              </AvatarFallback>
            </Avatar>
            {student.year_of_study && (
              <div className="absolute -top-1 -right-1 w-6 h-6 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-full flex items-center justify-center">
                <span className="text-xs font-bold text-white">{student.year_of_study}</span>
              </div>
            )}
          </div>
          
          <div className="flex-1 min-w-0 space-y-1">
            <div className="flex items-center justify-between gap-2">
              <h3 className="font-bold text-lg text-foreground truncate group-hover:text-primary transition-colors duration-300">
                {student.full_name}
              </h3>
              {typeof student.achievement_points === 'number' && (
                <div className="flex items-center gap-1 px-2 py-1 bg-gradient-to-r from-yellow-100 to-orange-100 dark:from-yellow-900/30 dark:to-orange-900/30 rounded-full border border-yellow-200 dark:border-yellow-700">
                  <Trophy className="h-3 w-3 text-yellow-600 dark:text-yellow-400" />
                  <span className="text-xs font-bold text-yellow-700 dark:text-yellow-300">
                    {student.achievement_points}
                  </span>
                </div>
              )}
            </div>
            
            {student.department && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <BookOpen className="h-4 w-4 text-primary/60" />
                <span className="truncate font-medium">{student.department}</span>
              </div>
            )}
            
            {student.college && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <MapPin className="h-4 w-4 text-accent/60" />
                <span className="truncate">{student.college}</span>
              </div>
            )}
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0 space-y-4 relative">
        {student.bio && (
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
              {student.bio}
            </p>
          </div>
        )}
        
        {student.skills.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
              <GraduationCap className="h-4 w-4 text-primary/60" />
              <span>Top Skills</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {student.skills.slice(0, 3).map((skill, index) => (
                <Badge 
                  key={index} 
                  variant="outline" 
                  className={`text-xs px-3 py-1 font-medium border-2 transition-all duration-300 ${getProficiencyColor(skill.proficiency_level)} group-hover:shadow-md`}
                >
                  {skill.skill_name}
                </Badge>
              ))}
              {student.skills.length > 3 && (
                <Badge 
                  variant="outline" 
                  className="text-xs px-3 py-1 font-medium bg-gradient-to-r from-primary/10 to-accent/10 border-primary/30 text-primary"
                >
                  +{student.skills.length - 3} more
                </Badge>
              )}
            </div>
          </div>
        )}
        
        <Button 
          onClick={() => onViewProfile(student)}
          className="w-full mt-6 h-10 btn-gradient group-hover:scale-105 transition-all duration-300 font-medium"
        >
          <Eye className="h-4 w-4 mr-2" />
          View Profile
        </Button>
      </CardContent>
    </Card>
  );
};