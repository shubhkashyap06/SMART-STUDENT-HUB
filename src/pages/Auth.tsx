import { useState, useEffect } from "react";
import { Navigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, GraduationCap, Building } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";

const Auth = () => {
  const { user, signIn, signUp, resetPassword, loading } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [searchParams] = useSearchParams();
  
  useEffect(() => {
    const mode = searchParams.get('mode');
    if (mode === 'reset') {
      setShowForgotPassword(true);
    }
  }, [searchParams]);

  // Redirect based on user type
  if (user) {
    // Check if this is a placement officer
    if (user.user_metadata?.user_type === 'placement_officer') {
      return <Navigate to="/placement-dashboard" replace />;
    }
    return <Navigate to="/dashboard" replace />;
  }

  const handleSignIn = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);

    const formData = new FormData(event.currentTarget);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    const { error } = await signIn(email, password);

    if (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }

    setIsLoading(false);
  };

  const handleSignUp = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);

    const formData = new FormData(event.currentTarget);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    const fullName = formData.get("fullName") as string;
    const userType = formData.get("userType") as string;
    const college = formData.get("college") as string;
    const organization = formData.get("organization") as string;

    const userData: any = {
      full_name: fullName,
      user_type: userType,
    };

    if (userType === 'student' && college) {
      userData.college = college;
    }

    if (userType === 'placement_officer' && organization) {
      userData.organization = organization;
    }

    const { error } = await signUp(email, password, userData);

    if (error) {
      console.error('Signup error details:', error);
      
      let errorMessage = error.message;
      
      // Provide helpful error messages
      if (error.message.includes('Email address not authorized')) {
        errorMessage = 'This email address is not authorized. Please use a team member email or contact support to set up custom SMTP.';
      } else if (error.message.includes('rate limit')) {
        errorMessage = 'Too many signup requests. Please try again later or contact support.';
      } else if (error.message.includes('Invalid email')) {
        errorMessage = 'Please enter a valid email address.';
      }
      
      toast({
        title: "Signup Error",
        description: errorMessage,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: "Account created successfully! Please check your email for verification.",
      });
    }

    setIsLoading(false);
  };

  const handleForgotPassword = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);

    const formData = new FormData(event.currentTarget);
    const email = formData.get("email") as string;

    const { error } = await resetPassword(email);

    if (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: "Password reset email sent! Please check your inbox.",
      });
      setShowForgotPassword(false);
    }

    setIsLoading(false);
  };

  if (showForgotPassword) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-accent/5 py-4 sm:py-6 lg:py-12 px-4 auth-container">
        <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
        
        {/* Theme Toggle - Fixed Position */}
        <div className="fixed top-4 right-4 z-50">
          <ThemeToggle />
        </div>
        
        <div className="max-w-md w-full space-y-4 sm:space-y-6 relative">
          <Card className="glass-effect border-2 card-hover animate-fade-in auth-card">
            <CardHeader className="pb-3 sm:pb-4">
              <div className="flex items-center gap-3 mb-2 sm:mb-3">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setShowForgotPassword(false)}
                  className="p-2 hover:bg-primary/10 transition-colors"
                >
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                <div className="p-2 bg-gradient-to-br from-primary to-accent rounded-xl">
                  <GraduationCap className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                </div>
              </div>
              <CardTitle className="text-lg sm:text-xl font-semibold">Reset Password</CardTitle>
              <CardDescription className="text-xs sm:text-sm">
                Enter your email address and we'll send you a link to reset your password.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleForgotPassword} className="space-y-3 sm:space-y-4 auth-form">
                <div className="space-y-1 sm:space-y-2">
                  <Label htmlFor="reset-email" className="text-xs sm:text-sm font-medium">Email</Label>
                  <Input 
                    id="reset-email" 
                    name="email" 
                    type="email" 
                    required 
                    className="h-9 sm:h-10 border-2 focus:border-primary transition-colors text-sm"
                  />
                </div>
                <Button 
                  type="submit" 
                  className="w-full h-9 sm:h-10 btn-gradient font-medium text-sm" 
                  disabled={isLoading}
                >
                  {isLoading ? "Sending..." : "Send Reset Link"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-accent/5 py-4 sm:py-6 lg:py-12 px-4 auth-container">
      <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
      
      {/* Theme Toggle - Fixed Position */}
      <div className="fixed top-4 right-4 z-50">
        <ThemeToggle />
      </div>
      
      <div className="max-w-md w-full space-y-4 sm:space-y-6 relative">
        <div className="text-center animate-fade-in auth-header">
          <div className="flex justify-center mb-3 sm:mb-4">
            <div className="p-3 bg-gradient-to-br from-primary to-accent rounded-2xl shadow-glow">
              <GraduationCap className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
            </div>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">
            <span className="gradient-text">Student Hub</span>
          </h2>
          <p className="mt-2 text-sm sm:text-base text-muted-foreground font-medium">
            Your academic collaboration platform
          </p>
        </div>

        <Card className="glass-effect border-2 card-hover animate-slide-up auth-card">
          <CardHeader className="text-center pb-3 sm:pb-4">
            <CardTitle className="text-lg sm:text-xl font-semibold">Welcome</CardTitle>
            <CardDescription className="text-xs sm:text-sm">
              Sign in to your account or create a new one to get started.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="signin" className="w-full">
              <TabsList className="grid w-full grid-cols-2 glass-effect border-2 p-1">
                <TabsTrigger value="signin" className="px-4 py-2 font-medium text-sm">Sign In</TabsTrigger>
                <TabsTrigger value="signup" className="px-4 py-2 font-medium text-sm">Sign Up</TabsTrigger>
              </TabsList>

              <TabsContent value="signin" className="space-y-3 sm:space-y-4 mt-3 sm:mt-4">
                <form onSubmit={handleSignIn} className="space-y-3 sm:space-y-4 auth-form">
                  <div className="space-y-1 sm:space-y-2">
                    <Label htmlFor="signin-email" className="text-xs sm:text-sm font-medium">Email</Label>
                    <Input 
                      id="signin-email" 
                      name="email" 
                      type="email" 
                      required 
                      className="h-9 sm:h-10 border-2 focus:border-primary transition-colors text-sm"
                    />
                  </div>
                  <div className="space-y-1 sm:space-y-2">
                    <Label htmlFor="signin-password" className="text-xs sm:text-sm font-medium">Password</Label>
                    <Input 
                      id="signin-password" 
                      name="password" 
                      type="password" 
                      required 
                      className="h-9 sm:h-10 border-2 focus:border-primary transition-colors text-sm"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Button
                      type="button"
                      variant="link"
                      className="px-0 text-xs hover:text-primary transition-colors"
                      onClick={() => setShowForgotPassword(true)}
                    >
                      Forgot password?
                    </Button>
                  </div>
                  <Button 
                    type="submit" 
                    className="w-full h-9 sm:h-10 btn-gradient font-medium text-sm" 
                    disabled={isLoading}
                  >
                    {isLoading ? "Signing in..." : "Sign In"}
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="signup" className="space-y-3 sm:space-y-4 mt-3 sm:mt-4">
                <form onSubmit={handleSignUp} className="space-y-2 sm:space-y-3 auth-form">
                  <div className="grid grid-cols-1 gap-2 sm:gap-3">
                    <div className="space-y-1 sm:space-y-2">
                      <Label htmlFor="signup-name" className="text-xs sm:text-sm font-medium">Full Name</Label>
                      <Input 
                        id="signup-name" 
                        name="fullName" 
                        type="text" 
                        required 
                        className="h-9 sm:h-10 border-2 focus:border-primary transition-colors text-sm"
                      />
                    </div>
                    <div className="space-y-1 sm:space-y-2">
                      <Label htmlFor="signup-email" className="text-xs sm:text-sm font-medium">Email</Label>
                      <Input 
                        id="signup-email" 
                        name="email" 
                        type="email" 
                        required 
                        className="h-9 sm:h-10 border-2 focus:border-primary transition-colors text-sm"
                      />
                    </div>
                    <div className="space-y-1 sm:space-y-2">
                      <Label htmlFor="signup-password" className="text-xs sm:text-sm font-medium">Password</Label>
                      <Input 
                        id="signup-password" 
                        name="password" 
                        type="password" 
                        required 
                        className="h-9 sm:h-10 border-2 focus:border-primary transition-colors text-sm"
                      />
                    </div>
                    <div className="space-y-1 sm:space-y-2">
                      <Label htmlFor="userType" className="text-xs sm:text-sm font-medium">Account Type</Label>
                      <Select name="userType" required>
                        <SelectTrigger className="h-9 sm:h-10 border-2 focus:border-primary">
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="student">
                            <div className="flex items-center gap-2">
                              <GraduationCap className="h-3 w-3 sm:h-4 sm:w-4" />
                              <span className="text-sm">Student</span>
                            </div>
                          </SelectItem>
                          <SelectItem value="faculty">
                            <div className="flex items-center gap-2">
                              <Building className="h-3 w-3 sm:h-4 sm:w-4" />
                              <span className="text-sm">Faculty</span>
                            </div>
                          </SelectItem>
                          <SelectItem value="placement_officer">
                            <div className="flex items-center gap-2">
                              <Building className="h-3 w-3 sm:h-4 sm:w-4" />
                              <span className="text-sm">Placement Officer</span>
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1 sm:space-y-2">
                      <Label htmlFor="college" className="text-xs sm:text-sm font-medium">College/Institution</Label>
                      <Input 
                        id="college" 
                        name="college" 
                        type="text" 
                        placeholder="Enter college name"
                        className="h-9 sm:h-10 border-2 focus:border-primary transition-colors text-sm"
                      />
                    </div>
                    <div className="space-y-1 sm:space-y-2">
                      <Label htmlFor="organization" className="text-xs sm:text-sm font-medium">Organization (Optional)</Label>
                      <Input 
                        id="organization" 
                        name="organization" 
                        type="text" 
                        placeholder="For placement officers"
                        className="h-9 sm:h-10 border-2 focus:border-primary transition-colors text-sm"
                      />
                    </div>
                  </div>

                  <Button 
                    type="submit" 
                    className="w-full h-9 sm:h-10 btn-gradient font-medium mt-3 sm:mt-4 text-sm" 
                    disabled={isLoading}
                  >
                    {isLoading ? "Creating..." : "Create Account"}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Auth;