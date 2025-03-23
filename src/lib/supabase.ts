// src/lib/supabase.ts
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});

// Add this debugging function to help troubleshoot
export async function testSupabaseConnection() {
  try {
    // Use the correct table name - 'participant' (singular)
    const { data, error } = await supabase
      .from('participant')
      .select('count(*)');
    
    console.log('Supabase connection test:', { data, error });
    return { success: !error, data, error };
  } catch (err) {
    console.error('Supabase connection test failed:', err);
    return { success: false, error: err };
  }
}