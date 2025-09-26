import { useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

export const DebugInfo = () => {
  const { user, session } = useAuth();

  useEffect(() => {
    console.log('🔍 Debug Info:');
    console.log('User:', user);
    console.log('Session:', session);
    console.log('Supabase URL:', import.meta.env.VITE_SUPABASE_URL);
    
    // Test database connection
    const testConnection = async () => {
      try {
        const { data, error } = await supabase.from('profiles').select('count').single();
        console.log('✅ Database connection test:', { data, error });
      } catch (err) {
        console.error('❌ Database connection failed:', err);
      }
      
      // Test storage connection
      try {
        const { data, error } = await supabase.storage.listBuckets();
        console.log('📁 Storage buckets:', { data, error });
      } catch (err) {
        console.error('❌ Storage connection failed:', err);
      }
    };
    
    if (user) {
      testConnection();
    }
  }, [user, session]);

  return null;
};

// Add to window for console debugging
if (typeof window !== 'undefined') {
  (window as any).debugSupabase = async () => {
    console.log('🔍 Manual Supabase Debug:');
    
    // Test auth
    const { data: authData, error: authError } = await supabase.auth.getUser();
    console.log('Auth:', { authData, authError });
    
    // Test profiles table
    const { data: profilesData, error: profilesError } = await supabase
      .from('profiles')
      .select('*')
      .limit(1);
    console.log('Profiles:', { profilesData, profilesError });
    
    // Test storage
    const { data: storageData, error: storageError } = await supabase.storage.listBuckets();
    console.log('Storage:', { storageData, storageError });
  };
  
  console.log('🚀 Debug function loaded! Use: debugSupabase()');
}