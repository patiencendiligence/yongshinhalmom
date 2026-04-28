/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from "react";
import { HashRouter, Routes, Route, Link, useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import { Languages, HelpCircle, LogIn, LogOut } from "lucide-react";
import Landing from "./components/Landing";
import InputForm from "./components/InputForm";
import ReportResultView from "./components/ReportResultView";
import ProfileModal from "./components/ProfileModal";
import InfoModal from "./components/InfoModal";
import ChoiceModal from "./components/ChoiceModal";
import PolicyView from "./components/PolicyView";
import PricingView from "./components/PricingView";
import { getReport, ReportResult } from "./services/geminiService";
import { storageService, UserProfile } from "./services/storageService";
import { Language, translations } from "./lib/translations";
import { AuthProvider, useAuth } from "./lib/AuthContext";

export type AppState = "LANDING" | "INPUT" | "LOADING" | "CHOICE" | "RESULT" | "POLICY";

function HeaderActions({ lang, toggleLang, setIsInfoModalOpen }: any) {
  const { user, profile, login, logout } = useAuth();
  const t = translations[lang];

  return (
    <div className="fixed top-8 right-8 z-50 flex items-center gap-4">
      {/* Auth State */}
      <div className="hidden md:flex items-center gap-2 mr-2">
        {user ? (
          <div className="flex items-center gap-3">
            <div className="flex flex-col items-end">
              <span className="text-[9px] font-black tracking-widest text-white/40 uppercase leading-none mb-1">Authenticated</span>
              <span className="text-[10px] text-white/60 font-serif italic whitespace-nowrap overflow-hidden text-ellipsis max-w-[100px] text-right">{user.email}</span>
            </div>
            {profile?.isPremium && (
              <span className="px-2 py-0.5 bg-white/5 border border-white/20 rounded-none text-[8px] font-black text-white uppercase tracking-tighter italic">PREMIUM</span>
            )}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={logout}
              className="p-3 bg-white/5 border border-white/10 rounded-none hover:bg-white/10 transition-all text-white/60"
            >
              <LogOut className="w-5 h-5" />
            </motion.button>
          </div>
        ) : (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={login}
            className="holo-button flex items-center gap-2 px-6 py-3 text-white font-sans font-black text-[10px] uppercase tracking-[0.4em]"
          >
            <LogIn className="w-4 h-4" />
            {t.login}
          </motion.button>
        )}
      </div>

      {/* Info Toggle */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsInfoModalOpen(true)}
        className="p-3 bg-white/5 border border-white/10 rounded-none hover:bg-white/10 transition-all backdrop-blur-md text-white/40"
      >
        <HelpCircle className="w-5 h-5" />
      </motion.button>

      {/* Language Toggle */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={toggleLang}
        className="flex items-center gap-3 px-5 py-3 bg-white/5 border border-white/10 rounded-none hover:bg-white/10 transition-all backdrop-blur-md"
      >
        <Languages className="w-5 h-5 text-white/40" />
        <span className="text-[10px] font-black uppercase tracking-widest text-white/80">
          {lang === "ko" ? "ENG" : "KOR"}
        </span>
      </motion.button>
    </div>
  );
}

function MainApp() {
  const [state, setState] = useState<AppState>("LANDING");
  const [userData, setUserData] = useState<any>(null);
  const [report, setReport] = useState<ReportResult | null>(null);
  const [profiles, setProfiles] = useState<UserProfile[]>([]);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isInfoModalOpen, setIsInfoModalOpen] = useState(false);
  const [isChoiceModalOpen, setIsChoiceModalOpen] = useState(false);
  const [preFilledData, setPreFilledData] = useState<any>(null);
  const [lang, setLang] = useState<Language>(() => {
    const saved = localStorage.getItem("yongshin_lang");
    return (saved as Language) || "ko";
  });

  const navigate = useNavigate();
  const location = useLocation();

  const { user, profile, login, markAsPaid } = useAuth();
  const t = translations[lang];

  // Restore state after redirect
  useEffect(() => {
    const savedState = sessionStorage.getItem("yongshin_pending_state");
    if (savedState) {
      try {
        const { state: s, userData: ud, report: r } = JSON.parse(savedState);
        if (s) setState(s);
        if (ud) setUserData(ud);
        if (r) setReport(r);
        sessionStorage.removeItem("yongshin_pending_state");
      } catch (e) {
        console.error("Failed to restore state", e);
      }
    }
  }, []);

  // Persistent storage for redirect
  const loginAndPersist = async () => {
    sessionStorage.setItem("yongshin_pending_state", JSON.stringify({
      state,
      userData,
      report
    }));
    await login();
  };

  useEffect(() => {
    // Handle payment success redirect
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('payment') === 'success' && user) {
      const checkoutId = urlParams.get('checkout_id');
      const savedHash = sessionStorage.getItem("yongshin_pending_pay_hash");
      
      if (savedHash) {
        markAsPaid(savedHash, checkoutId || undefined);
        storageService.setPaidHash(savedHash);
        sessionStorage.removeItem("yongshin_pending_pay_hash");
      } else {
        // Fallback to global if hash missing (shouldn't happen)
        markAsPaid();
      }

      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [user, markAsPaid]);

  useEffect(() => {
    setProfiles(storageService.getProfiles());
  }, []);

  useEffect(() => {
    localStorage.setItem("yongshin_lang", lang);
  }, [lang]);

  const toggleLang = () => {
    setLang(prev => prev === "ko" ? "en" : "ko");
  };

  const handleStart = () => {
    setPreFilledData(null);
    setState("INPUT");
  };

  const handleOpenProfiles = () => setIsProfileModalOpen(true);

  const handleSelectProfile = (profile: UserProfile) => {
    setPreFilledData(profile);
    setIsProfileModalOpen(false);
    setState("INPUT");
  };

  const handleDeleteProfile = (id: string) => {
    storageService.deleteProfile(id);
    setProfiles(storageService.getProfiles());
  };

  const handleSubmit = (data: any) => {
    setUserData(data);
    storageService.saveProfile(data);
    setProfiles(storageService.getProfiles());
    setIsChoiceModalOpen(true);
  };

  const handleChoice = async (level: 'simple' | 'detailed') => {
    setIsChoiceModalOpen(false);
    
    if (level === 'detailed' && !user) {
      await loginAndPersist();
      return; // Login happens, choice will be handled after or just stay simple until pay
    }

    setState("LOADING");
    try {
      const year = userData.targetYear;
      const cached = storageService.findCachedReport(userData, year);
      
      let result;
      if (cached) {
        result = cached;
      } else {
        result = await getReport(userData, lang);
        storageService.setReportCache({
          inputHash: JSON.stringify({
            name: userData.name,
            birthDate: userData.birthDate,
            birthTime: userData.birthTime,
            isLunar: userData.isLunar,
            gender: userData.gender
          }),
          year: year,
          date: new Date().toISOString().split('T')[0],
          result: result
        });
      }

      setReport(result);
      setState("RESULT");
    } catch (error: any) {
      console.error(error);
      const isQuota = error?.message?.includes("429") || error?.status === 429 || JSON.stringify(error).includes("429");
      const msg = isQuota ? (translations[lang] as any).quotaExceeded : t.errorMessage;
      alert(msg);
      setState("INPUT");
    }
  };

  const handleReset = () => {
    setReport(null);
    setUserData(null);
    setPreFilledData(null);
    setState("LANDING");
  };

  const handleOpenPolicy = () => {
    navigate("/policies");
  };

  const handlePolicyBack = () => {
    navigate(-1);
  };

  const handlePurchase = () => {
    if (report) {
      setState("RESULT");
    } else {
      setState("LANDING");
    }
    navigate("/");
  };

  return (
    <div className="min-h-screen relative overflow-hidden flex flex-col items-center justify-center">
      <div className="fixed inset-0 mythic-gradient -z-10" />

      <HeaderActions lang={lang} toggleLang={toggleLang} setIsInfoModalOpen={setIsInfoModalOpen} />

      <Routes>
        <Route path="/policies" element={
          <motion.div key="policy" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="w-full h-full flex flex-col items-center overflow-y-auto">
            <PolicyView onBack={handlePolicyBack} lang={lang} />
          </motion.div>
        } />
        <Route path="/pricing" element={
          <motion.div key="pricing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="w-full h-full flex flex-col items-center overflow-y-auto">
            <PricingView onBack={() => navigate(-1)} onPurchase={handlePurchase} lang={lang} />
          </motion.div>
        } />
        <Route path="*" element={
          <AnimatePresence mode="wait">
            {state === "LANDING" && (
              <motion.div key="landing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="w-full h-full flex flex-col items-center">
                <Landing onStart={handleStart} onOpenProfiles={handleOpenProfiles} hasProfiles={profiles.length > 0} lang={lang} />
                <Link 
                  to="/policies"
                  className="mt-8 mb-12 text-[10px] uppercase tracking-[0.5em] font-black pointer-events-auto hover:text-white transition-colors text-white/10 italic font-sans"
                >
                  {t.policy}
                </Link>
              </motion.div>
            )}

            {state === "INPUT" && (
              <motion.div key="input" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="w-full max-w-7xl px-4 py-20">
                <InputForm onSubmit={handleSubmit} initialData={preFilledData} lang={lang} />
              </motion.div>
            )}

            {state === "LOADING" && (
              <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center gap-16">
                <div className="relative w-72 h-72 flex items-center justify-center border border-white/5 shadow-[0_0_100px_rgba(255,255,255,0.03)] dragon-pattern">
                  <div className="absolute inset-0 border-[0.5px] border-white/10 animate-[spin_20s_linear_infinite]" />
                  <div className="absolute inset-8 border-[0.5px] border-white/5 animate-[spin_30s_linear_infinite_reverse]" />
                  <div className="text-8xl font-serif font-black italic text-white/10 animate-pulse tracking-tighter">Halmom</div>
                </div>
                <div className="flex flex-col items-center gap-6 text-center max-w-sm">
                  <h2 className="text-3xl md:text-5xl font-serif font-black italic text-white leading-none tracking-tighter">{t.loadingSummary}</h2>
                  <div className="w-16 h-0.5 bg-white/10" />
                  <p className="text-white/20 font-sans uppercase tracking-[0.8em] text-[9px] font-black italic">{lang === 'ko' ? "명운의 실타래를 읽는 중" : "READING THE THREADS OF DESTINY"}</p>
                </div>
              </motion.div>
            )}

            {state === "RESULT" && report && (
              <motion.div key="result" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="w-full h-full py-12">
                <ReportResultView 
                  report={report} 
                  onReset={handleReset} 
                  onOpenPolicy={handleOpenPolicy} 
                  onLogin={loginAndPersist}
                  userData={userData} 
                  lang={lang} 
                />
              </motion.div>
            )}
          </AnimatePresence>
        } />
      </Routes>

      <ProfileModal isOpen={isProfileModalOpen} onClose={() => setIsProfileModalOpen(false)} onSelect={handleSelectProfile} profiles={profiles} onDelete={handleDeleteProfile} lang={lang} />
      <InfoModal isOpen={isInfoModalOpen} onClose={() => setIsInfoModalOpen(false)} onOpenReport={() => { window.location.href = "mailto:patiencendiligence@gmail.com"; }} lang={lang} />
      <ChoiceModal isOpen={isChoiceModalOpen} onClose={() => setIsChoiceModalOpen(false)} onChoose={handleChoice} lang={lang} />
      
      {/* Decorative Ornaments */}
      <div className="fixed top-0 left-0 p-8 pointer-events-none opacity-20 hidden md:block">
        <div className="writing-mode-vertical-rl text-xs tracking-widest text-mythic-gold uppercase font-serif">{t.title} · {t.subtitle}</div>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <HashRouter>
      <AuthProvider>
        <MainApp />
      </AuthProvider>
    </HashRouter>
  );
}
