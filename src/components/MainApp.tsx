import { useState } from "react";
import { Routes, Route, Link } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import Landing from "./Landing";
import InputForm from "./InputForm";
import ReportResultView from "./ReportResultView";
import ProfileModal from "./ProfileModal";
import InfoModal from "./InfoModal";
import ChoiceModal from "./ChoiceModal";
import PolicyView from "./PolicyView";
import PricingView from "./PricingView";
import { HeaderActions } from "./HeaderActions";
import { LoadingView } from "./LoadingView";
import { translations } from "../lib/translations";
import { useAuth } from "../lib/AuthContext";
import { useLanguage } from "../hooks/useLanguage";
import { useProfiles } from "../hooks/useProfiles";
import { useReportFlow } from "../hooks/useReportFlow";

export type AppState = "LANDING" | "INPUT" | "LOADING" | "CHOICE" | "RESULT" | "POLICY";

export default function MainApp() {
  const { lang, toggleLang } = useLanguage();
  const { profiles, saveProfile, deleteProfile } = useProfiles();
  const { user, login, markAsPaid } = useAuth();
  
  const {
    state,
    setState,
    userData,
    setUserData,
    report,
    preFilledData,
    loginAndPersist,
    handleChoice,
    handleReset,
    handleStart,
    handleSelectProfile,
    handleBack,
    handlePurchase
  } = useReportFlow(lang, user, login, markAsPaid);

  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isInfoModalOpen, setIsInfoModalOpen] = useState(false);
  const [isChoiceModalOpen, setIsChoiceModalOpen] = useState(false);

  const t = translations[lang];

  const handleSubmit = (data: any) => {
    setUserData(data);
    saveProfile(data);
    setIsChoiceModalOpen(true);
  };

  const onSelectProfileUpdate = (profile: any) => {
    handleSelectProfile(profile);
    setIsProfileModalOpen(false);
  };

  const onHandleChoice = (choice: 'simple' | 'detailed') => {
    setIsChoiceModalOpen(false);
    handleChoice(choice);
  };

  return (
    <div className="min-h-screen relative overflow-hidden flex flex-col items-center justify-center">
      <div className="fixed inset-0 mythic-gradient -z-10" />

      <HeaderActions 
        lang={lang} 
        toggleLang={toggleLang} 
        setIsInfoModalOpen={setIsInfoModalOpen} 
      />

      <Routes>
        <Route path="/policies" element={
          <motion.div key="policy" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="w-full h-full flex flex-col items-center overflow-y-auto">
            <PolicyView onBack={handleBack} lang={lang} />
          </motion.div>
        } />
        <Route path="/pricing" element={
          <motion.div key="pricing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="w-full h-full flex flex-col items-center overflow-y-auto">
            <PricingView onBack={handleBack} onPurchase={handlePurchase} lang={lang} />
          </motion.div>
        } />
        <Route path="*" element={
          <AnimatePresence mode="wait">
            {state === "LANDING" && (
              <div key="landing" className="w-full h-full flex flex-col items-center">
                <Landing 
                  onStart={handleStart} 
                  onOpenProfiles={() => setIsProfileModalOpen(true)} 
                  hasProfiles={profiles.length > 0} 
                  lang={lang} 
                />
                <Link 
                  to="/policies"
                  className="mt-8 mb-12 text-[10px] uppercase tracking-[0.5em] font-black pointer-events-auto hover:text-white transition-colors text-white/10 italic font-sans"
                >
                  {t.policy}
                </Link>
              </div>
            )}

            {state === "INPUT" && (
              <motion.div key="input" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="w-full max-w-7xl px-4 py-20">
                <InputForm onSubmit={handleSubmit} initialData={preFilledData} lang={lang} />
              </motion.div>
            )}

            {state === "LOADING" && <LoadingView lang={lang} />}

            {state === "RESULT" && report && (
              <motion.div key="result" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="w-full h-full py-12">
                <ReportResultView 
                  report={report} 
                  onReset={handleReset} 
                  onOpenPolicy={() => setState("POLICY" as any)} 
                  onLogin={loginAndPersist}
                  userData={userData} 
                  lang={lang} 
                />
              </motion.div>
            )}
          </AnimatePresence>
        } />
      </Routes>

      <ProfileModal 
        isOpen={isProfileModalOpen} 
        onClose={() => setIsProfileModalOpen(false)} 
        onSelect={onSelectProfileUpdate} 
        profiles={profiles} 
        onDelete={deleteProfile} 
        lang={lang} 
      />
      
      <InfoModal 
        isOpen={isInfoModalOpen} 
        onClose={() => setIsInfoModalOpen(false)} 
        onOpenReport={() => { window.location.href = "mailto:patiencendiligence@gmail.com"; }} 
        lang={lang} 
      />
      
      <ChoiceModal 
        isOpen={isChoiceModalOpen} 
        onClose={() => setIsChoiceModalOpen(false)} 
        onChoose={onHandleChoice} 
        lang={lang} 
      />
      
      {/* Decorative Ornaments */}
      <div className="fixed top-0 left-0 p-8 pointer-events-none opacity-20 hidden md:block">
        <div className="writing-mode-vertical-rl text-xs tracking-widest text-mythic-gold uppercase font-serif">
          {t.title} · {t.subtitle}
        </div>
      </div>
    </div>
  );
}
