import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Download, FileText, User, Mail, Phone, MapPin, Briefcase, GraduationCap } from 'lucide-react';

interface Profile {
  id: string;
  full_name: string;
  email: string;
  user_type: string;
  department?: string;
  year_of_study?: number;
  bio?: string;
}

interface Skill {
  name: string;
  proficiency_level: string;
  category: string;
}

interface ResumeData {
  personalInfo: {
    fullName: string;
    email: string;
    phone: string;
    location: string;
    bio: string;
  };
  education: {
    institution: string;
    degree: string;
    department: string;
    year: string;
    gpa?: string;
  };
  skills: Skill[];
  experience: Array<{
    title: string;
    company: string;
    duration: string;
    description: string;
  }>;
  achievements: Array<{
    title: string;
    description: string;
    date: string;
  }>;
}

interface ResumeGeneratorProps {
  profile: Profile | null;
}

export function ResumeGenerator({ profile }: ResumeGeneratorProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [achievements, setAchievements] = useState<any[]>([]);
  const [resumeData, setResumeData] = useState<ResumeData>({
    personalInfo: {
      fullName: '',
      email: '',
      phone: '',
      location: '',
      bio: ''
    },
    education: {
      institution: '',
      degree: '',
      department: '',
      year: '',
      gpa: ''
    },
    skills: [],
    experience: [],
    achievements: []
  });

  useEffect(() => {
    if (profile) {
      fetchUserData();
    }
  }, [profile]);

  const fetchUserData = async () => {
    if (!profile) return;

    try {
      // Fetch skills
      const { data: skillsData, error: skillsError } = await supabase
        .from('student_skills')
        .select(`
          proficiency_level,
          skills (name, category)
        `)
        .eq('student_id', profile.id);

      if (skillsError) throw skillsError;

      const formattedSkills = skillsData?.map(s => ({
        name: s.skills.name,
        proficiency_level: s.proficiency_level,
        category: s.skills.category
      })) || [];

      // Fetch achievements
      const { data: achievementsData, error: achievementsError } = await supabase
        .from('documents')
        .select('title, description, approved_at, points_awarded')
        .eq('student_id', profile.id)
        .eq('status', 'approved')
        .order('approved_at', { ascending: false });

      if (achievementsError) throw achievementsError;

      const formattedAchievements = achievementsData?.map(a => ({
        title: a.title,
        description: a.description || '',
        date: new Date(a.approved_at).toLocaleDateString()
      })) || [];

      setSkills(formattedSkills);
      setAchievements(formattedAchievements);

      // Pre-fill form with available data
      setResumeData(prev => ({
        ...prev,
        personalInfo: {
          ...prev.personalInfo,
          fullName: profile.full_name,
          email: profile.email,
          bio: profile.bio || ''
        },
        education: {
          ...prev.education,
          department: profile.department || '',
          year: profile.year_of_study?.toString() || ''
        },
        skills: formattedSkills,
        achievements: formattedAchievements
      }));
    } catch (error) {
      console.error('Error fetching user data:', error);
    }
  };

  const updatePersonalInfo = (field: string, value: string) => {
    setResumeData(prev => ({
      ...prev,
      personalInfo: {
        ...prev.personalInfo,
        [field]: value
      }
    }));
  };

  const updateEducation = (field: string, value: string) => {
    setResumeData(prev => ({
      ...prev,
      education: {
        ...prev.education,
        [field]: value
      }
    }));
  };

  const addExperience = () => {
    setResumeData(prev => ({
      ...prev,
      experience: [
        ...prev.experience,
        { title: '', company: '', duration: '', description: '' }
      ]
    }));
  };

  const updateExperience = (index: number, field: string, value: string) => {
    setResumeData(prev => ({
      ...prev,
      experience: prev.experience.map((exp, i) => 
        i === index ? { ...exp, [field]: value } : exp
      )
    }));
  };

  const removeExperience = (index: number) => {
    setResumeData(prev => ({
      ...prev,
      experience: prev.experience.filter((_, i) => i !== index)
    }));
  };

  const generateResume = () => {
    setLoading(true);
    
    const resumeHTML = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${resumeData.personalInfo.fullName} - Resume</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Arial', sans-serif; line-height: 1.6; color: #333; background: #f8f9fa; }
        .container { max-width: 800px; margin: 20px auto; background: white; box-shadow: 0 0 20px rgba(0,0,0,0.1); }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 40px; text-align: center; }
        .header h1 { font-size: 2.5em; margin-bottom: 10px; }
        .header p { font-size: 1.2em; opacity: 0.9; }
        .contact-info { display: flex; justify-content: center; gap: 20px; margin-top: 20px; flex-wrap: wrap; }
        .contact-item { display: flex; align-items: center; gap: 5px; }
        .section { padding: 30px; }
        .section-title { color: #667eea; font-size: 1.5em; margin-bottom: 20px; border-bottom: 2px solid #667eea; padding-bottom: 10px; }
        .bio { font-style: italic; text-align: center; margin: 20px 0; color: #666; }
        .education-item, .experience-item, .achievement-item { margin-bottom: 20px; padding: 15px; background: #f8f9fa; border-radius: 8px; }
        .education-item h3, .experience-item h3, .achievement-item h3 { color: #333; margin-bottom: 5px; }
        .meta { color: #666; font-size: 0.9em; margin-bottom: 10px; }
        .skills-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; }
        .skill-category { background: #f8f9fa; padding: 15px; border-radius: 8px; }
        .skill-category h4 { color: #667eea; margin-bottom: 10px; }
        .skill-item { display: flex; justify-content: space-between; margin-bottom: 5px; }
        .skill-level { font-size: 0.8em; padding: 2px 8px; background: #667eea; color: white; border-radius: 12px; }
        @media print { body { background: white; } .container { box-shadow: none; margin: 0; } }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>${resumeData.personalInfo.fullName}</h1>
            <p>${resumeData.education.department || 'Student'}</p>
            <div class="contact-info">
                ${resumeData.personalInfo.email ? `<div class="contact-item">✉ ${resumeData.personalInfo.email}</div>` : ''}
                ${resumeData.personalInfo.phone ? `<div class="contact-item">📞 ${resumeData.personalInfo.phone}</div>` : ''}
                ${resumeData.personalInfo.location ? `<div class="contact-item">📍 ${resumeData.personalInfo.location}</div>` : ''}
            </div>
        </div>

        ${resumeData.personalInfo.bio ? `
        <div class="section">
            <div class="bio">"${resumeData.personalInfo.bio}"</div>
        </div>
        ` : ''}

        <div class="section">
            <h2 class="section-title">Education</h2>
            <div class="education-item">
                <h3>${resumeData.education.degree || 'Bachelor\'s Degree'}</h3>
                <div class="meta">${resumeData.education.institution || 'University'} | ${resumeData.education.department || ''} | ${resumeData.education.year || 'Present'}</div>
                ${resumeData.education.gpa ? `<p>GPA: ${resumeData.education.gpa}</p>` : ''}
            </div>
        </div>

        ${resumeData.skills.length > 0 ? `
        <div class="section">
            <h2 class="section-title">Skills</h2>
            <div class="skills-grid">
                ${Object.entries(resumeData.skills.reduce((acc: Record<string, Skill[]>, skill) => {
                  const category = skill.category || 'Other';
                  if (!acc[category]) acc[category] = [];
                  acc[category].push(skill);
                  return acc;
                }, {})).map(([category, skills]) => `
                    <div class="skill-category">
                        <h4>${category}</h4>
                        ${(skills as Skill[]).map(skill => `
                            <div class="skill-item">
                                <span>${skill.name}</span>
                                <span class="skill-level">${skill.proficiency_level}</span>
                            </div>
                        `).join('')}
                    </div>
                `).join('')}
            </div>
        </div>
        ` : ''}

        ${resumeData.experience.length > 0 ? `
        <div class="section">
            <h2 class="section-title">Experience</h2>
            ${resumeData.experience.map(exp => `
                <div class="experience-item">
                    <h3>${exp.title}</h3>
                    <div class="meta">${exp.company} | ${exp.duration}</div>
                    <p>${exp.description}</p>
                </div>
            `).join('')}
        </div>
        ` : ''}

        ${resumeData.achievements.length > 0 ? `
        <div class="section">
            <h2 class="section-title">Achievements & Certifications</h2>
            ${resumeData.achievements.map(achievement => `
                <div class="achievement-item">
                    <h3>${achievement.title}</h3>
                    <div class="meta">${achievement.date}</div>
                    ${achievement.description ? `<p>${achievement.description}</p>` : ''}
                </div>
            `).join('')}
        </div>
        ` : ''}
    </div>
</body>
</html>`;

    // Create and download the HTML file
    const blob = new Blob([resumeHTML], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${resumeData.personalInfo.fullName.replace(/\s+/g, '_')}_Resume.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    setLoading(false);
    toast({
      title: "Resume Generated!",
      description: "Your resume has been downloaded as an HTML file. You can open it in any browser and print it as PDF.",
    });
  };

  if (!profile || profile.user_type !== 'student') {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <FileText className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">Resume Generator</h3>
          <p className="text-muted-foreground text-center">
            Resume generator is available for students only
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Resume Generator</h2>
          <p className="text-muted-foreground">Create a professional resume based on your profile and skills</p>
        </div>
        <Button onClick={generateResume} disabled={loading} className="gap-2">
          <Download className="h-4 w-4" />
          {loading ? 'Generating...' : 'Download Resume'}
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Personal Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Personal Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="fullName">Full Name</Label>
              <Input
                id="fullName"
                value={resumeData.personalInfo.fullName}
                onChange={(e) => updatePersonalInfo('fullName', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={resumeData.personalInfo.email}
                onChange={(e) => updatePersonalInfo('email', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                value={resumeData.personalInfo.phone}
                onChange={(e) => updatePersonalInfo('phone', e.target.value)}
                placeholder="+1 (555) 123-4567"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                value={resumeData.personalInfo.location}
                onChange={(e) => updatePersonalInfo('location', e.target.value)}
                placeholder="City, State"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="bio">Professional Summary</Label>
              <Textarea
                id="bio"
                value={resumeData.personalInfo.bio}
                onChange={(e) => updatePersonalInfo('bio', e.target.value)}
                placeholder="Brief summary of your professional goals and strengths"
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        {/* Education */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <GraduationCap className="h-5 w-5" />
              Education
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="institution">Institution</Label>
              <Input
                id="institution"
                value={resumeData.education.institution}
                onChange={(e) => updateEducation('institution', e.target.value)}
                placeholder="University Name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="degree">Degree</Label>
              <Input
                id="degree"
                value={resumeData.education.degree}
                onChange={(e) => updateEducation('degree', e.target.value)}
                placeholder="Bachelor of Science"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="department">Department/Major</Label>
              <Input
                id="department"
                value={resumeData.education.department}
                onChange={(e) => updateEducation('department', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="year">Graduation Year</Label>
              <Input
                id="year"
                value={resumeData.education.year}
                onChange={(e) => updateEducation('year', e.target.value)}
                placeholder="2024"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="gpa">GPA (Optional)</Label>
              <Input
                id="gpa"
                value={resumeData.education.gpa}
                onChange={(e) => updateEducation('gpa', e.target.value)}
                placeholder="3.8/4.0"
              />
            </div>
          </CardContent>
        </Card>

        {/* Skills Preview */}
        <Card>
          <CardHeader>
            <CardTitle>Skills from Profile</CardTitle>
            <CardDescription>These skills will be automatically included</CardDescription>
          </CardHeader>
          <CardContent>
            {skills.length === 0 ? (
              <p className="text-muted-foreground">No skills added to your profile yet</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {skills.map((skill, index) => (
                  <Badge key={index} variant="secondary">
                    {skill.name} ({skill.proficiency_level})
                  </Badge>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Experience */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Briefcase className="h-5 w-5" />
              Work Experience
            </CardTitle>
            <CardDescription>Add your work experience and internships</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {resumeData.experience.map((exp, index) => (
              <div key={index} className="p-4 border rounded-lg space-y-3">
                <div className="flex justify-between items-start">
                  <h4 className="font-medium">Experience {index + 1}</h4>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => removeExperience(index)}
                  >
                    Remove
                  </Button>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <Input
                    placeholder="Job Title"
                    value={exp.title}
                    onChange={(e) => updateExperience(index, 'title', e.target.value)}
                  />
                  <Input
                    placeholder="Company"
                    value={exp.company}
                    onChange={(e) => updateExperience(index, 'company', e.target.value)}
                  />
                </div>
                <Input
                  placeholder="Duration (e.g., Jan 2023 - Present)"
                  value={exp.duration}
                  onChange={(e) => updateExperience(index, 'duration', e.target.value)}
                />
                <Textarea
                  placeholder="Job description and achievements"
                  value={exp.description}
                  onChange={(e) => updateExperience(index, 'description', e.target.value)}
                  rows={2}
                />
              </div>
            ))}
            <Button onClick={addExperience} variant="outline" className="w-full">
              Add Experience
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Achievements Preview */}
      {achievements.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Achievements from Profile</CardTitle>
            <CardDescription>These will be automatically included in your resume</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {achievements.slice(0, 3).map((achievement, index) => (
                <div key={index} className="flex justify-between items-start p-3 bg-muted rounded-lg">
                  <div>
                    <p className="font-medium">{achievement.title}</p>
                    {achievement.description && (
                      <p className="text-sm text-muted-foreground">{achievement.description}</p>
                    )}
                  </div>
                  <span className="text-sm text-muted-foreground">{achievement.date}</span>
                </div>
              ))}
              {achievements.length > 3 && (
                <p className="text-sm text-muted-foreground">
                  +{achievements.length - 3} more achievements will be included
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}