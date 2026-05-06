import React, { createContext, useContext, useEffect, useState } from "react";
import { User } from "@supabase/supabase-js";
import axios from "axios";
import { supabase, signInWithGoogle, signOut, getPaymentStatus, updatePaymentStatus, getSupabase } from "./supabase";

interface UserProfile {
  uid: string;
  email: string;
  isPremium: boolean;
}

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  login: () => Promise<void>;
  logout: () => Promise<void>;
  markAsPaid: (reportHash?: string, checkoutId?: string) => Promise<void>;
  checkPaymentStatus: (reportHash: string) => Promise<boolean>;
  isConfigured: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const isConfigured = !!getSupabase();

  useEffect(() => {
    const client = getSupabase();
    if (!client) {
      setLoading(false);
      return;
    }

    // Get initial session
    client.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setUser(session.user);
        fetchProfile(session.user);
        
        // 1. Cleanup hash fragments
        if (window.location.hash && (window.location.hash.includes('access_token') || window.location.hash.includes('type=recovery'))) {
           window.history.replaceState(null, "", window.location.pathname + window.location.search);
        }

        // 2. Check for Payment Verification (Query Param)
        const urlParams = new URLSearchParams(window.location.search);
        const orderId = urlParams.get("order_id") || urlParams.get("sale_id");
        if (orderId && session.user) {
          const reportHash = sessionStorage.getItem("yongshin_pending_pay_hash");
          // Re-fetch profile to see if webhook already processed it
          fetchProfile(session.user).then(() => {
            // Clean up URL
            urlParams.delete("order_id");
            urlParams.delete("sale_id");
            const newSearch = urlParams.toString();
            window.history.replaceState(null, "", window.location.pathname + (newSearch ? `?${newSearch}` : ""));
            sessionStorage.removeItem("yongshin_pending_pay_hash");
          });
        }
      }
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = client.auth.onAuthStateChange(async (event, session) => {
      const u = session?.user || null;
      setUser(u);
      if (u) {
        await fetchProfile(u);
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchProfile = async (u: User) => {
    try {
      // Global premium status check (optional fallback)
      const isPaidOnServer = await getPaymentStatus(u.id);
      const isPremium = isPaidOnServer || u.email === 'patiencendiligence@gmail.com';
      setProfile({
        uid: u.id,
        email: u.email || "",
        isPremium
      });
    } catch (error) {
      console.error("Error fetching profile:", error);
    }
  };

  const checkPaymentStatus = async (reportHash: string) => {
    console.log("[AuthContext] checkPaymentStatus starting...", reportHash);
    if (!user) {
      console.log("[AuthContext] No user, returning false");
      return false;
    }
    if (user.email === 'patiencendiligence@gmail.com') {
      console.log("[AuthContext] Admin user detected, returning true");
      return true;
    }
    
    try {
      console.log("[AuthContext] Querying getPaymentStatus...");
      const result = await getPaymentStatus(user.id, reportHash);
      console.log("[AuthContext] getPaymentStatus result:", result);
      return result;
    } catch (error: any) {
      console.error("[AuthContext] Error in checkPaymentStatus:", error);
      return false;
    }
  };

  const login = async () => {
    try {
      const client = getSupabase();
      if (!client) {
        alert("Supabase 설정이 누락되었습니다.\n\n환경 변수(VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY)가 Vercel 프로젝트 설정에 올바르게 등록되어 있는지 확인해 주세요.");
        return;
      }
      await signInWithGoogle();
    } catch (error: any) {
      console.error("Login Error:", error);
      const is403 = error.status === 403 || error.message?.includes("403") || JSON.stringify(error).includes("403");
      if (is403) {
        alert("구글 로그인 403 오류가 발생했습니다.\n\n1. Google Cloud Console 'OAuth 동의 화면'에서 [앱 게시] 버튼을 눌러 상태를 '프로덕션'으로 변경하거나,\n2. 본인의 이메일을 '테스트 사용자'에 등록해 주세요.\n3. Supabase Auth 설정에서 Google 프로바이더의 Client ID와 Secret이 정확한지 확인해 주세요.");
      } else {
        alert(`로그인 실패: ${error.message || "알 수 없는 오류"}. Supabase Auth 설정에서 Google 프로바이더를 확인해 주세요.`);
      }
    }
  };

  const logout = async () => {
    try {
      // Clear local state first to provide immediate feedback
      setUser(null);
      setProfile(null);
      
      // Clear app-specific storage before redirect
      localStorage.removeItem("yongshin_profiles");
      localStorage.removeItem("yongshin_lang");
      localStorage.removeItem("yongshin_report_cache");
      sessionStorage.clear();
      
      const client = getSupabase();
      if (client) {
        await client.auth.signOut();
      }
      
      // Full refresh to ensure clean state and clear all session data
      window.location.href = window.location.origin + window.location.pathname;
    } catch (error) {
      console.error("Logout Error:", error);
      // Fallback: direct reload
      window.location.reload();
    }
  };

  const markAsPaid = async (reportHash?: string, checkoutId?: string) => {
    if (!user) return;
    try {
      await updatePaymentStatus(user.id, true, reportHash, checkoutId);
      // Update local profile if it was a general premium update or we want to reflect it
      setProfile(prev => prev ? { ...prev, isPremium: true } : null);
    } catch (error: any) {
      console.error("Payment update error:", error);
      if (error.code === "42501" || error.status === 403) {
        alert("DB 쓰기 권한이 없습니다 (403 Forbidden).\n\nSupabase SQL Editor에서 다음 명령을 실행해 주세요:\n\nALTER TABLE payments ENABLE ROW LEVEL SECURITY;\nCREATE POLICY \"Users can manage their own payments\" ON payments FOR ALL USING (auth.uid() = user_id);");
      }
    }
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, login, logout, markAsPaid, checkPaymentStatus, isConfigured }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
