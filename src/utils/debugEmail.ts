import { supabase } from '@/integrations/supabase/client';

// Get configuration from environment or defaults
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || "https://qfnakcrjzzchrjifdnaz.supabase.co";
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFmbmFrY3JqenpjaHJqaWZkbmF6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg4OTg0NTcsImV4cCI6MjA3NDQ3NDQ1N30.FXWq0WGGlbn3_Rx4qkwTWiPjqpS8fvQ_OzKFiIltzgs";

// Debug utility for testing email signup
export const debugEmailSignup = async (email: string, password = 'TestPass123!') => {
  console.log('🔍 Debug: Testing email signup...');
  console.log('📧 Email:', email);
  console.log('🔗 Supabase URL:', SUPABASE_URL);
  
  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: window.location.hostname !== 'localhost' ? window.location.origin + '/' : `${window.location.origin}/`,
        data: {
          full_name: 'Test User',
          user_type: 'student'
        }
      }
    });

    if (error) {
      console.error('❌ Signup Error:', error);
      console.error('Error Code:', error.message);
      
      // Common error messages and solutions
      if (error.message.includes('Email address not authorized')) {
        console.log('💡 Solution: This email needs to be added to your Supabase project team, or you need to set up custom SMTP');
        console.log('🔧 Quick fix: Go to Supabase Dashboard → Settings → Team → Add this email');
      }
      
      if (error.message.includes('rate limit')) {
        console.log('💡 Solution: Rate limit exceeded. Set up custom SMTP or wait for rate limit reset');
      }
      
      return { success: false, error };
    }

    console.log('✅ Signup Success!');
    console.log('👤 User:', data.user?.email);
    console.log('📨 Confirmation email sent:', !data.user?.email_confirmed_at);
    
    if (data.user && !data.user.email_confirmed_at) {
      console.log('📬 Please check your email for confirmation link');
      console.log('📁 Don\'t forget to check spam folder');
    }
    
    return { success: true, data };
    
  } catch (err) {
    console.error('💥 Unexpected error:', err);
    return { success: false, error: err };
  }
};

// Test with console commands
if (typeof window !== 'undefined') {
  (window as any).debugEmailSignup = debugEmailSignup;
  console.log('🚀 Debug utility loaded! Use: debugEmailSignup("your-email@gmail.com")');
}

// Check current Supabase configuration
export const checkSupabaseConfig = () => {
  console.log('🔍 Current Supabase Configuration:');
  console.log('URL:', SUPABASE_URL);
  console.log('Key:', SUPABASE_KEY.substring(0, 20) + '...');
  
  // Test connection
  supabase.auth.getSession().then(({ data, error }) => {
    if (error) {
      console.error('❌ Connection Error:', error);
    } else {
      console.log('✅ Connection successful');
      console.log('Current session:', data.session ? 'Logged in' : 'Not logged in');
    }
  });
};

if (typeof window !== 'undefined') {
  (window as any).checkSupabaseConfig = checkSupabaseConfig;
  console.log('🔧 Config checker loaded! Use: checkSupabaseConfig()');
}