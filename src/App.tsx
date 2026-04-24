/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Languages, HelpCircle, LogIn, LogOut } from "lucide-react";
import Landing from "./components/Landing";
import InputForm from "./components/InputForm";
import ReportResultView from "./components/ReportResultView";
import ProfileModal from "./components/ProfileModal";
import InfoModal from "./components/InfoModal";
import ChoiceModal from "./components/ChoiceModal";
import PolicyView from "./components/PolicyView";
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
              <span className="text-[10px] text-mythic-gold font-serif italic whitespace-nowrap overflow-hidden text-ellipsis max-w-[100px] text-right">{user.email}</span>
            </div>
            {profile?.isPremium && (
              <span className="px-2 py-0.5 bg-mythic-gold/20 border border-mythic-gold/30 rounded text-[8px] font-black text-mythic-gold uppercase tracking-tighter">Premium</span>
            )}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={logout}
              className="p-3 bg-white/5 border border-white/10 rounded-full hover:bg-white/10 transition-all text-white/60"
            >
              <LogOut className="w-5 h-5" />
            </motion.button>
          </div>
        ) : (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={login}
            className="flex items-center gap-2 px-5 py-3 bg-mythic-gold text-black rounded-full shadow-lg shadow-mythic-gold/20 hover:scale-105 active:scale-95 transition-all text-[10px] font-black uppercase tracking-widest"
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
        className="p-3 bg-white/5 border border-white/10 rounded-full hover:bg-white/10 transition-all backdrop-blur-md text-mythic-gold"
      >
        <HelpCircle className="w-5 h-5" />
      </motion.button>

      {/* Language Toggle */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={toggleLang}
        className="flex items-center gap-3 px-5 py-3 bg-white/5 border border-white/10 rounded-full hover:bg-white/10 transition-all backdrop-blur-md"
      >
        <Languages className="w-5 h-5 text-mythic-gold" />
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

  const { user, profile, login, markAsPaid } = useAuth();
  const t = translations[lang];

  useEffect(() => {
    // Handle payment success redirect
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('payment') === 'success' && user) {
      markAsPaid();
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
      await login();
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

  return (
    <div className="min-h-screen relative overflow-hidden flex flex-col items-center justify-center">
      <div className="fixed inset-0 mythic-gradient -z-10" />
      <div className="fixed inset-0 bg-[url('https://www.transparenttextures.com/patterns/rice-paper-2.png')] opacity-10 pointer-events-none -z-10" />

      <HeaderActions lang={lang} toggleLang={toggleLang} setIsInfoModalOpen={setIsInfoModalOpen} />

      <AnimatePresence mode="wait">
        {state === "LANDING" && (
          <motion.div key="landing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="w-full h-full flex flex-col items-center">
            <Landing onStart={handleStart} onOpenProfiles={handleOpenProfiles} hasProfiles={profiles.length > 0} lang={lang} />
            <button 
              onClick={() => setState("POLICY")}
              className="mt-8 mb-12 text-[10px] uppercase tracking-[0.4em] font-black pointer-events-auto hover:text-mythic-gold transition-colors text-white/20"
            >
              {t.policy}
            </button>
          </motion.div>
        )}

        {state === "POLICY" && (
           <motion.div key="policy" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="w-full h-full flex flex-col items-center overflow-y-auto">
             <PolicyView onBack={() => setState("LANDING")} lang={lang} />
           </motion.div>
        )}

        {state === "INPUT" && (
          <motion.div key="input" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="w-full max-w-2xl px-4">
            <InputForm onSubmit={handleSubmit} initialData={preFilledData} lang={lang} />
          </motion.div>
        )}

        {state === "LOADING" && (
          <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center gap-8">
            <div className="relative w-48 h-48">
              <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 4, ease: "linear" }} className="absolute inset-0 border-4 border-dashed border-mythic-gold/30 rounded-full" />
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="font-serif text-2xl text-mythic-gold animate-pulse">{t.loadingSummary}</span>
              </div>
            </div>
            <p className="text-white/60 font-serif italic text-lg text-center max-w-xs">{t.loadingDetail}</p>
          </motion.div>
        )}

        {state === "RESULT" && report && (
          <motion.div key="result" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="w-full h-full py-12">
            <ReportResultView report={report} onReset={handleReset} userData={userData} lang={lang} />
          </motion.div>
        )}
      </AnimatePresence>

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
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}
