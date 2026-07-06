import { useState } from "react";
import { Routes, Route, Link } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import Landing from "./Landing";
import InputForm from "./InputForm";
import ReportResultView from "./ReportResultView";
import ProfileModal from "./ProfileModal";
import InfoModal from "./InfoModal";
import PolicyView from "./PolicyView";
import PricingView from "./PricingView";
import SuccessView from "./SuccessView";
import SeoPage from "../pages/SeoPage";
import { HeaderActions } from "./HeaderActions";
import { LoadingView } from "./LoadingView";
import { translations } from "../lib/translations";
import { useAuth } from "../lib/AuthContext";
import { useLanguage } from "../hooks/useLanguage";
import { useProfiles } from "../hooks/useProfiles";
import { useReportFlow } from "../hooks/useReportFlow";
import { getReportHash } from "../lib/hashUtils";

export type AppState = "LANDING" | "INPUT" | "LOADING" | "CHOICE" | "RESULT" | "POLICY";

export default function MainApp() {
  const { lang, toggleLang } = useLanguage();
  const { profiles, saveProfile, deleteProfile } = useProfiles();
  const { user, profile, login, markAsPaid, checkPaymentStatus } = useAuth();
  
  const {
    state,
    setState,
    userData,
    setUserData,
    report,
    isUpgradingDetail,
    preFilledData,
    loginAndPersist,
    handleChoice,
    handleReset,
    handleStart,
    handleSelectProfile,
    handleBack,
    handlePurchase,
    triggerPayment
  } = useReportFlow(lang, user, profile, login, markAsPaid, checkPaymentStatus);

  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isInfoModalOpen, setIsInfoModalOpen] = useState(false);
  const [viewMode, setViewMode] = useState<"today" | "full">("full");

  const t = translations[lang];

  const handleSubmit = (data: any) => {
    setViewMode("full");
    setUserData(data);
    saveProfile(data);
    handleChoice('simple', data);
  };

  const onSelectProfileUpdate = (profile: any, selectedViewMode: "today" | "full") => {
    setViewMode(selectedViewMode);
    handleSelectProfile(profile);
    setIsProfileModalOpen(false);
  };

  const handleResetWithViewMode = () => {
    setViewMode("full");
    handleReset();
  };

  return (
    <div className="min-h-screen w-full relative overflow-hidden flex items-center justify-center bg-[#f3efe0] dark:bg-[#030407] transition-colors duration-300 p-0 sm:p-4">
     
      {/* Decorative Blur Background on the sides */}
      <div className="absolute inset-0 bg-gradient-to-tr from-purple-500/5 via-transparent to-cyan-500/5 dark:from-purple-950/10 dark:to-cyan-950/10 pointer-events-none" />

     

      {/* Main Content Area */}
      <div className="flex-1 w-full h-full relative overflow-y-auto overflow-x-hidden flex flex-col">
        <HeaderActions 
          lang={lang} 
          toggleLang={toggleLang} 
          setIsInfoModalOpen={setIsInfoModalOpen} 
          onOpenProfiles={() => setIsProfileModalOpen(true)}
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
          <Route path="/:category/:slug" element={<SeoPage onBack={handleBack} lang={lang} />}/>
          <Route path="/success" element={<SuccessView lang={lang} />} />
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
                  <InputForm onSubmit={handleSubmit} initialData={userData || preFilledData} lang={lang} />
                </motion.div>
              )}

              {state === "LOADING" && <LoadingView lang={lang} />}

              {state === "RESULT" && report && (
                <motion.div key="result" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="w-full h-full py-12">
                  {viewMode === "today" && <div className="yongshin-circle mx-auto"></div>}
                  <ReportResultView 
                      report={report} 
                      viewMode={viewMode}
                      setViewMode={setViewMode}
                      onReset={handleResetWithViewMode} 
                      onUpgrade={() => handleChoice('detailed')}
                      onOpenPolicy={() => setState("POLICY" as any)} 
                      onLogin={loginAndPersist}
                      triggerPayment={triggerPayment}
                      userData={userData} 
                      lang={lang} 
                      isUpgradingDetail={isUpgradingDetail}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          } />
          
        </Routes>
      </div>


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
