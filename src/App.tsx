/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Languages, HelpCircle } from "lucide-react";
import Landing from "./components/Landing";
import InputForm from "./components/InputForm";
import FortuneResultView from "./components/FortuneResultView";
import ProfileModal from "./components/ProfileModal";
import InfoModal from "./components/InfoModal";
import { getFortune, FortuneResult } from "./services/geminiService";
import { storageService, UserProfile } from "./services/storageService";
import { Language, translations } from "./lib/translations";

export type AppState = "LANDING" | "INPUT" | "LOADING" | "RESULT";

export default function App() {
  const [state, setState] = useState<AppState>("LANDING");
  const [userData, setUserData] = useState<any>(null);
  const [fortune, setFortune] = useState<FortuneResult | null>(null);
  const [profiles, setProfiles] = useState<UserProfile[]>([]);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isInfoModalOpen, setIsInfoModalOpen] = useState(false);
  const [preFilledData, setPreFilledData] = useState<any>(null);
  const [lang, setLang] = useState<Language>(() => {
    const saved = localStorage.getItem("yongshin_lang");
    return (saved as Language) || "ko";
  });

  const t = translations[lang];

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

  const handleSubmit = async (data: any) => {
    setUserData(data);
    storageService.saveProfile(data);
    setProfiles(storageService.getProfiles());
    setState("LOADING");
    try {
      const result = await getFortune(data, lang);
      setFortune(result);
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
    setFortune(null);
    setUserData(null);
    setPreFilledData(null);
    setState("LANDING");
  };

  return (
    <div className="min-h-screen relative overflow-hidden flex flex-col items-center justify-center">
      {/* Background Atmosphere */}
      <div className="fixed inset-0 mythic-gradient -z-10" />
      <div className="fixed inset-0 bg-[url('https://www.transparenttextures.com/patterns/rice-paper-2.png')] opacity-10 pointer-events-none -z-10" />

      {/* Header Actions */}
      <div className="fixed top-8 right-8 z-50 flex items-center gap-4">
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

      <AnimatePresence mode="wait">
        {state === "LANDING" && (
          <motion.div
            key="landing"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.05 }}
            transition={{ duration: 0.6 }}
            className="w-full h-full"
          >
            <Landing 
              onStart={handleStart} 
              onOpenProfiles={handleOpenProfiles}
              hasProfiles={profiles.length > 0}
              lang={lang}
            />
          </motion.div>
        )}

        {state === "INPUT" && (
          <motion.div
            key="input"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="w-full max-w-2xl px-4"
          >
            <InputForm onSubmit={handleSubmit} initialData={preFilledData} lang={lang} />
          </motion.div>
        )}

        {state === "LOADING" && (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center gap-8"
          >
            <div className="relative w-48 h-48">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 4, ease: "linear" }}
                className="absolute inset-0 border-4 border-dashed border-mythic-gold/30 rounded-full"
              />
              <motion.div
                animate={{ rotate: -360 }}
                transition={{ repeat: Infinity, duration: 8, ease: "linear" }}
                className="absolute inset-4 border-2 border-mythic-red/20 rounded-full"
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="font-serif text-2xl text-mythic-gold animate-pulse">
                  {t.loadingSummary}
                </span>
              </div>
            </div>
            <p className="text-white/60 font-serif italic text-lg text-center max-w-xs">
              {t.loadingDetail}
            </p>
          </motion.div>
        )}

        {state === "RESULT" && fortune && (
          <motion.div
            key="result"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="w-full h-full py-12"
          >
            <FortuneResultView 
              fortune={fortune} 
              onReset={handleReset}
              userData={userData}
              lang={lang}
            />
          </motion.div>
        )}
      </AnimatePresence>

      <ProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        onSelect={handleSelectProfile}
        profiles={profiles}
        onDelete={handleDeleteProfile}
        lang={lang}
      />

      <InfoModal 
        isOpen={isInfoModalOpen}
        onClose={() => setIsInfoModalOpen(false)}
        onOpenReport={() => {
          window.location.href = "mailto:patiencendiligence@gmail.com";
        }}
        lang={lang}
      />

      {/* Decorative Ornaments */}
      <div className="fixed top-0 left-0 p-8 pointer-events-none opacity-20 hidden md:block">
        <div className="writing-mode-vertical-rl text-xs tracking-widest text-mythic-gold uppercase font-serif">
          용신할멈 · 신점사주
        </div>
      </div>
      <div className="fixed bottom-0 right-0 p-8 pointer-events-none opacity-20 hidden md:block">
        <div className="writing-mode-vertical-rl text-xs tracking-widest text-mythic-gold uppercase font-serif transform rotate-180">
          용신할멈의 지혜
        </div>
      </div>
    </div>
  );
}

