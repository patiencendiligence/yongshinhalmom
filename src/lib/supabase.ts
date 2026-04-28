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

export async function getPaymentStatus(userId: string, reportHash?: string) {
  if (!userId) return false;
  const client = getSupabase();
  if (!client) return false;

  let query = client
    .from('payments')
    .select('is_premium')
    .eq('user_id', userId);
    
  if (reportHash) {
    query = query.eq('report_hash', reportHash);
  }

  const { data, error } = await query.limit(1);
  
  if (error) {
    console.error("Error fetching payment status:", error);
  }
  return data?.[0]?.is_premium || false;
}

export async function updatePaymentStatus(userId: string, isPremium: boolean, reportHash?: string, checkoutId?: string) {
  const client = getSupabase();
  if (!client) throw new Error("Supabase is not configured.");

  const payload: any = { 
    user_id: userId, 
    is_premium: isPremium, 
    updated_at: new Date().toISOString() 
  };

  if (reportHash) payload.report_hash = reportHash;
  if (checkoutId) payload.checkout_id = checkoutId;

  const { error } = await client
    .from('payments')
    .upsert(payload, { onConflict: 'user_id,report_hash' });
  
  if (error) throw error;
}
