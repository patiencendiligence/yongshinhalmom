import React, { createContext, useContext, useEffect, useState } from "react";
import { User } from "@supabase/supabase-js";
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
  markAsPaid: () => Promise<void>;
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
      const isPremium = await getPaymentStatus(u.id);
      setProfile({
        uid: u.id,
        email: u.email || "",
        isPremium
      });
    } catch (error) {
      console.error("Error fetching profile:", error);
    }
  };

  const login = async () => {
    try {
      const client = getSupabase();
      if (!client) {
        alert("Supabase 설정이 누락되었습니다.\n\n환경 변수(VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY)가 올바르게 설정되었는지 확인해 주세요. GitHub Pages 배포 시에는 'Repository Secrets'에 등록해야 합니다.");
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
      await signOut();
    } catch (error) {
      console.error("Logout Error:", error);
    }
  };

  const markAsPaid = async () => {
    if (!user) return;
    try {
      await updatePaymentStatus(user.id, true);
      setProfile(prev => prev ? { ...prev, isPremium: true } : null);
    } catch (error: any) {
      console.error("Payment update error:", error);
      if (error.code === "42501" || error.status === 403) {
        alert("DB 쓰기 권한이 없습니다 (403 Forbidden).\n\nSupabase SQL Editor에서 다음 명령을 실행해 주세요:\n\nALTER TABLE payments ENABLE ROW LEVEL SECURITY;\nCREATE POLICY \"Users can manage their own payments\" ON payments FOR ALL USING (auth.uid() = user_id);");
      }
    }
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, login, logout, markAsPaid, isConfigured }}>
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
