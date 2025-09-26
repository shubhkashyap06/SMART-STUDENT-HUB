import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Plus, X } from 'lucide-react';

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

interface Skill {
  id: string;
  name: string;
  category: string;
}

interface StudentSkill {
  id: string;
  skill_id: string;
  proficiency_level: string;
  skills: Skill;
}

interface ProfileEditorProps {
  profile: Profile | null;
  onUpdate: (profile: Profile) => void;
}

export function ProfileEditor({ profile, onUpdate }: ProfileEditorProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [studentSkills, setStudentSkills] = useState<StudentSkill[]>([]);
  const [selectedSkill, setSelectedSkill] = useState('');
  const [proficiencyLevel, setProficiencyLevel] = useState('');

  useEffect(() => {
    fetchSkills();
    if (profile?.user_type === 'student') {
      fetchStudentSkills();
    }
  }, [profile]);

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

  const fetchStudentSkills = async () => {
    if (!profile) return;

    try {
      const { data, error } = await supabase
        .from('student_skills')
        .select(`
          id,
          skill_id,
          proficiency_level,
          skills (id, name, category)
        `)
        .eq('student_id', profile.id);

      if (error) throw error;
      setStudentSkills(data || []);
    } catch (error) {
      console.error('Error fetching student skills:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!profile) return;

    setLoading(true);
    const formData = new FormData(e.currentTarget);

    try {
      const { data, error } = await supabase
        .from('profiles')
        .update({
          full_name: formData.get('fullName') as string,
          department: formData.get('department') as string,
          year_of_study: formData.get('yearOfStudy') ? parseInt(formData.get('yearOfStudy') as string) : null,
          bio: formData.get('bio') as string,
        })
        .eq('id', profile.id)
        .select()
        .single();

      if (error) throw error;
      
      onUpdate(data);
      toast({
        title: "Profile updated",
        description: "Your profile has been successfully updated.",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error updating profile",
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const addSkill = async () => {
    if (!selectedSkill || !proficiencyLevel || !profile) return;

    try {
      const { error } = await supabase
        .from('student_skills')
        .insert({
          student_id: profile.id,
          skill_id: selectedSkill,
          proficiency_level: proficiencyLevel,
        });

      if (error) throw error;

      toast({
        title: "Skill added",
        description: "Skill has been added to your profile.",
      });

      setSelectedSkill('');
      setProficiencyLevel('');
      fetchStudentSkills();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error adding skill",
        description: error.message,
      });
    }
  };

  const removeSkill = async (skillId: string) => {
    try {
      const { error } = await supabase
        .from('student_skills')
        .delete()
        .eq('id', skillId);

      if (error) throw error;

      toast({
        title: "Skill removed",
        description: "Skill has been removed from your profile.",
      });

      fetchStudentSkills();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error removing skill",
        description: error.message,
      });
    }
  };

  if (!profile) return null;

  return (
    <div className="space-y-8">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-3">
            <Label htmlFor="fullName" className="text-base font-medium">Full Name</Label>
            <Input
              id="fullName"
              name="fullName"
              defaultValue={profile.full_name}
              required
              className="h-12 border-2 focus:border-primary transition-colors"
            />
          </div>
          <div className="space-y-3">
            <Label htmlFor="email" className="text-base font-medium">Email</Label>
            <Input
              id="email"
              value={profile.email}
              disabled
              className="h-12 bg-muted/50 border-2 text-muted-foreground"
            />
          </div>
          <div className="space-y-3">
            <Label htmlFor="department" className="text-base font-medium">Department</Label>
            <Input
              id="department"
              name="department"
              defaultValue={profile.department || ''}
              className="h-12 border-2 focus:border-primary transition-colors"
            />
          </div>
          {profile.user_type === 'student' && (
            <div className="space-y-3">
              <Label htmlFor="yearOfStudy" className="text-base font-medium">Year of Study</Label>
              <Select name="yearOfStudy" defaultValue={profile.year_of_study?.toString()}>
                <SelectTrigger className="h-12 border-2 focus:border-primary">
                  <SelectValue placeholder="Select year" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1st Year</SelectItem>
                  <SelectItem value="2">2nd Year</SelectItem>
                  <SelectItem value="3">3rd Year</SelectItem>
                  <SelectItem value="4">4th Year</SelectItem>
                  <SelectItem value="5">5th Year</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
        <div className="space-y-3">
          <Label htmlFor="bio" className="text-base font-medium">Bio</Label>
          <Textarea
            id="bio"
            name="bio"
            placeholder="Tell us about yourself, your interests, and goals..."
            defaultValue={profile.bio || ''}
            rows={4}
            className="border-2 focus:border-primary transition-colors resize-none"
          />
        </div>
        <Button 
          type="submit" 
          disabled={loading} 
          className="btn-gradient h-12 px-8 font-medium"
        >
          {loading ? 'Updating Profile...' : 'Update Profile'}
        </Button>
      </form>

      {profile.user_type === 'student' && (
        <Card className="glass-effect border-2">
          <CardHeader className="pb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-violet-600 rounded-lg flex items-center justify-center">
                <Plus className="h-5 w-5 text-white" />
              </div>
              <div>
                <CardTitle className="text-xl gradient-text">Skills & Expertise</CardTitle>
                <CardDescription className="text-base">
                  Showcase your skills to help others discover your talents
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex flex-wrap gap-3">
              {studentSkills.map((studentSkill) => (
                <Badge 
                  key={studentSkill.id} 
                  variant="secondary" 
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-gradient-to-r from-primary/10 to-accent/10 border-2 border-primary/20 hover:border-primary/40 transition-all duration-300"
                >
                  <span>{studentSkill.skills.name}</span>
                  <span className="text-xs px-2 py-1 bg-white/20 rounded-full">
                    {studentSkill.proficiency_level}
                  </span>
                  <button
                    onClick={() => removeSkill(studentSkill.id)}
                    className="hover:text-destructive transition-colors ml-1"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
              {studentSkills.length === 0 && (
                <p className="text-muted-foreground italic">No skills added yet. Add your first skill below!</p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Select value={selectedSkill} onValueChange={setSelectedSkill}>
                <SelectTrigger className="h-12 border-2 focus:border-primary">
                  <SelectValue placeholder="Select a skill" />
                </SelectTrigger>
                <SelectContent>
                  {skills.map((skill) => (
                    <SelectItem key={skill.id} value={skill.id}>
                      <div className="flex items-center justify-between w-full">
                        <span>{skill.name}</span>
                        <span className="text-xs text-muted-foreground ml-2">({skill.category})</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={proficiencyLevel} onValueChange={setProficiencyLevel}>
                <SelectTrigger className="h-12 border-2 focus:border-primary">
                  <SelectValue placeholder="Proficiency level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="beginner">🌱 Beginner</SelectItem>
                  <SelectItem value="intermediate">⚡ Intermediate</SelectItem>
                  <SelectItem value="advanced">🚀 Advanced</SelectItem>
                </SelectContent>
              </Select>

              <Button
                onClick={addSkill}
                disabled={!selectedSkill || !proficiencyLevel}
                className="h-12 btn-gradient font-medium"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Skill
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}