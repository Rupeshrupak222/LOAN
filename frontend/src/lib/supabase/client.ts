import { createBrowserClient } from '@supabase/ssr';

export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://kbwfydhyfjgnplmcrupq.supabase.co';
  const supabaseKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    'sb_publishable_rU-FweQxTdJeyH6hxXVzYQ_jt3E9WwM';

  return createBrowserClient(supabaseUrl, supabaseKey);
}

export const supabase = createClient();
