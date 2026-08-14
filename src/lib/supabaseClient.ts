import { createClient, SupabaseClient } from '@supabase/supabase-js';

let supabaseClient: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient {
  if (supabaseClient) return supabaseClient;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string;

  if (!url || !anonKey) {
    throw new Error(
      'Supabase client is not configured yet. Please configure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.'
    );
  }

  if (url.includes('PROJECT') || anonKey.includes('publishable_KEY')) {
    throw new Error('Supabase is not configured yet.');
  }

  supabaseClient = createClient(url, anonKey);
  return supabaseClient;
}

