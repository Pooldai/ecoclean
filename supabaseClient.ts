import { createClient } from '@supabase/supabase-js';

// Access variables safely using Vite's environment variable system.
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://jhifxljmgtowbcdyqwmz.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_x-NLsWyIBBLENwcYpqufgQ_VduOLfJo';

const isConfigured = supabaseUrl && supabaseAnonKey && 
                     supabaseUrl.startsWith('http') && 
                     supabaseUrl !== 'your_supabase_url_here';

if (!isConfigured) {
  console.warn(
    "Supabase configuration is missing or invalid. " +
    "Please ensure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set correctly in your environment. " +
    "Database operations will fail until configured."
  );
}

/**
 * The supabase client instance.
 * If not configured, it returns a Proxy that throws a helpful error on any property access,
 * preventing the 'supabaseUrl is required' error during initialization while providing 
 * clear feedback when the database is actually used.
 */
export const supabase = isConfigured 
  ? createClient(supabaseUrl, supabaseAnonKey) 
  : new Proxy({} as any, {
      get: (_, prop) => {
        if (prop === 'from' || prop === 'auth') {
          return () => {
            throw new Error(
              "Supabase Client Error: The database is not configured. " +
              "Check your VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY environment variables."
            );
          };
        }
        return undefined;
      }
    });
