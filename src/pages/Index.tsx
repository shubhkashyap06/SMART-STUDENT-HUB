import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';
import { GraduationCap, Users, Upload, CheckSquare, ArrowRight, Sparkles, Shield, Zap } from 'lucide-react';
import { ThemeToggle } from '@/components/ThemeToggle';

const Index = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && user) {
      navigate('/dashboard');
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-accent/5">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground animate-pulse">Loading your experience...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5">
      {/* Theme Toggle - Fixed Position */}
      <div className="fixed top-4 right-4 z-50">
        <ThemeToggle />
      </div>
      
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
        <div className="container mx-auto px-4 py-20 relative">
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary mb-6 animate-fade-in">
              <Sparkles className="h-4 w-4" />
              <span className="text-sm font-medium">Welcome to the Future of Student Management</span>
            </div>
            
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold mb-6 animate-slide-up">
              <span className="gradient-text">Student Hub</span>
            </h1>
            
            <p className="text-xl md:text-2xl text-muted-foreground mb-8 max-w-3xl mx-auto leading-relaxed animate-fade-in">
              A comprehensive platform that revolutionizes student management, document workflows, 
              and academic collaboration with cutting-edge technology.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center animate-slide-up">
              <Button 
                onClick={() => navigate('/auth')} 
                size="lg" 
                className="btn-gradient px-8 py-6 text-lg group"
              >
                Get Started Today
                <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
              </Button>
              <Button 
                variant="outline" 
                size="lg" 
                className="px-8 py-6 text-lg border-2 hover:bg-primary/5"
                onClick={() => navigate('/auth')}
              >
                Learn More
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="container mx-auto px-4 py-20">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 gradient-text">Powerful Features</h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Everything you need to manage your academic journey efficiently
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          <Card className="group card-hover glass-effect border-2">
            <CardHeader className="text-center pb-4">
              <div className="mx-auto w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                <Users className="h-8 w-8 text-white" />
              </div>
              <CardTitle className="text-xl group-hover:text-primary transition-colors">
                Smart Profiles
              </CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <CardDescription className="text-base leading-relaxed">
                Create comprehensive profiles with skills, achievements, and academic information that showcase your potential.
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="group card-hover glass-effect border-2">
            <CardHeader className="text-center pb-4">
              <div className="mx-auto w-16 h-16 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                <Upload className="h-8 w-8 text-white" />
              </div>
              <CardTitle className="text-xl group-hover:text-primary transition-colors">
                Secure Documents
              </CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <CardDescription className="text-base leading-relaxed">
                Upload and manage your documents with enterprise-grade security and seamless organization.
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="group card-hover glass-effect border-2">
            <CardHeader className="text-center pb-4">
              <div className="mx-auto w-16 h-16 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                <GraduationCap className="h-8 w-8 text-white" />
              </div>
              <CardTitle className="text-xl group-hover:text-primary transition-colors">
                Advanced Search
              </CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <CardDescription className="text-base leading-relaxed">
                Discover students and opportunities through intelligent search powered by skills and interests.
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="group card-hover glass-effect border-2">
            <CardHeader className="text-center pb-4">
              <div className="mx-auto w-16 h-16 bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                <CheckSquare className="h-8 w-8 text-white" />
              </div>
              <CardTitle className="text-xl group-hover:text-primary transition-colors">
                Faculty Approval
              </CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <CardDescription className="text-base leading-relaxed">
                Streamlined approval workflows that save time and ensure academic integrity.
              </CardDescription>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Benefits Section */}
      <div className="bg-gradient-to-r from-primary/10 via-accent/5 to-primary/10 py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Why Choose Student Hub?</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Built for the modern academic environment
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <div className="text-center space-y-4">
              <div className="mx-auto w-16 h-16 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-full flex items-center justify-center">
                <Zap className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-2xl font-semibold">Lightning Fast</h3>
              <p className="text-muted-foreground leading-relaxed">
                Experience blazing-fast performance with our optimized platform designed for efficiency.
              </p>
            </div>

            <div className="text-center space-y-4">
              <div className="mx-auto w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
                <Shield className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-2xl font-semibold">Secure & Private</h3>
              <p className="text-muted-foreground leading-relaxed">
                Your data is protected with industry-leading security measures and privacy controls.
              </p>
            </div>

            <div className="text-center space-y-4">
              <div className="mx-auto w-16 h-16 bg-gradient-to-br from-violet-500 to-violet-600 rounded-full flex items-center justify-center">
                <Sparkles className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-2xl font-semibold">Intuitive Design</h3>
              <p className="text-muted-foreground leading-relaxed">
                Beautiful, user-friendly interface that makes complex tasks simple and enjoyable.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="container mx-auto px-4 py-20">
        <div className="text-center">
          <Card className="max-w-2xl mx-auto glass-effect border-2 card-hover">
            <CardHeader className="pb-6">
              <CardTitle className="text-3xl md:text-4xl gradient-text mb-4">
                Ready to Transform Your Academic Journey?
              </CardTitle>
              <CardDescription className="text-lg">
                Join thousands of students and faculty who trust Student Hub for their academic needs.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button 
                  onClick={() => navigate('/auth')} 
                  className="btn-gradient px-8 py-6 text-lg group"
                >
                  Start Your Journey
                  <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
                </Button>
                <Button 
                  variant="outline" 
                  className="px-8 py-6 text-lg border-2 hover:bg-primary/5"
                  onClick={() => navigate('/auth')}
                >
                  Contact Sales
                </Button>
              </div>
              <p className="text-sm text-muted-foreground">
                No credit card required • Free 30-day trial • Cancel anytime
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Index;
