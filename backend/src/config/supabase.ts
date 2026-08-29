import { createClient } from '@supabase/supabase-js';
import { env } from './env';

export const supabase = createClient(
  env.supabase.url,
  env.supabase.serviceRoleKey || env.supabase.anonKey,
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  }
);
