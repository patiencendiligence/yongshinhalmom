import { motion } from "motion/react";
import { Languages, HelpCircle, LogIn, LogOut } from "lucide-react";
import { useAuth } from "../lib/AuthContext";
import { translations, Language } from "../lib/translations";

interface HeaderActionsProps {
  lang: Language;
  toggleLang: () => void;
  setIsInfoModalOpen: (open: boolean) => void;
}

export function HeaderActions({ lang, toggleLang, setIsInfoModalOpen }: HeaderActionsProps) {
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
