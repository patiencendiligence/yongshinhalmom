import { createClient, SupabaseClient } from '@supabase/supabase-js';

let supabaseInstance: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient | null {
  if (supabaseInstance) return supabaseInstance;

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return null;
  }

  try {
    supabaseInstance = createClient(supabaseUrl, supabaseAnonKey);
    return supabaseInstance;
  } catch (error) {
    console.error("Failed to initialize Supabase:", error);
    return null;
  }
}

export const supabase = new Proxy({} as SupabaseClient, {
  get: (target, prop) => {
    const client = getSupabase();
    if (!client) {
      if (typeof prop === 'string' && ['auth', 'from', 'storage'].includes(prop)) {
         console.warn(`Supabase ${prop} accessed but client is not configured.`);
      }
      // Return a dummy object to prevent immediate crash, 
      // but methods will likely fail if called.
      return (target as any)[prop];
    }
    return (client as any)[prop];
  }
});

export async function signInWithGoogle() {
  const client = getSupabase();
  if (!client) {
    throw new Error("Supabase is not configured. 배포 환경(예: GitHub Secrets)에 VITE_SUPABASE_URL과 VITE_SUPABASE_ANON_KEY가 설정되어 있는지 확인해 주세요.");
  }
  
  // Use current URL minus the hash to return exactly where we were
  const redirectUrl = window.location.origin + window.location.pathname;
  
  const { data, error } = await client.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: redirectUrl,
      queryParams: {
        prompt: 'select_account'
      }
    }
  });
  if (error) throw error;
  return data;
}

export async function signOut() {
  const client = getSupabase();
  if (!client) return;
  
  const { error } = await client.auth.signOut();
  if (error) throw error;
}

export async function getPaymentStatus(userId: string) {
  if (!userId) return false;
  const client = getSupabase();
  if (!client) return false;

  const { data, error } = await client
    .from('payments')
    .select('is_premium')
    .eq('user_id', userId)
    .limit(1);
  
  if (error) {
    console.error("Error fetching payment status:", error);
  }
  return data?.[0]?.is_premium || false;
}

export async function updatePaymentStatus(userId: string, isPremium: boolean) {
  const client = getSupabase();
  if (!client) throw new Error("Supabase is not configured.");

  /* 
    Security Note: 403 Forbidden errors are often caused by missing RLS (Row Level Security) policies.
    Ensure 'payments' table has policies:
    - SELECT: allow users to select their own data (user_id = auth.uid())
    - ALL (INSERT/UPDATE): allow users to upsert their own data
    
    SQL command to run in Supabase SQL Editor:
    ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
    CREATE POLICY "Allow users to manage their own payments" ON public.payments FOR ALL USING (auth.uid() = user_id);
  */
  const { error } = await client
    .from('payments')
    .upsert({ user_id: userId, is_premium: isPremium, updated_at: new Date().toISOString() });
  
  if (error) throw error;
}
