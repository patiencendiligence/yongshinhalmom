import { motion } from "motion/react";
import { Languages, HelpCircle, LogIn, LogOut, Sun, Moon } from "lucide-react";
import { useAuth } from "../lib/AuthContext";
import { translations, Language } from "../lib/translations";
import { useTheme } from "../lib/ThemeContext";

interface HeaderActionsProps {
  lang: Language;
  toggleLang: () => void;
  setIsInfoModalOpen: (open: boolean) => void;
}

export function HeaderActions({ lang, toggleLang, setIsInfoModalOpen }: HeaderActionsProps) {
  const { user, profile, login, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const t = translations[lang];

  return (
    <div className="fixed top-2 right-2 min-[400px]:top-4 min-[400px]:right-4 z-50 flex flex-row items-center gap-2 min-[400px]:gap-4">
      {/* Auth State */}
      <div className="md:flex items-center gap-2">
        {user ? (
          <div className="flex items-center gap-1.5 min-[400px]:gap-3">
            <div className="hidden md:flex flex-col items-end">
              <span className="text-[9px] font-black tracking-widest text-ink-black/40 dark:text-white/40 uppercase leading-none mb-1">Authenticated</span>
              <span className="text-[10px] text-ink-black/60 dark:text-white/60 font-serif italic whitespace-nowrap overflow-hidden text-ellipsis max-w-[100px] text-right">{user.email}</span>
            </div>
            {profile?.isPremium && (
              <span className="hidden md:flex px-2 py-0.5 bg-ink-black/5 dark:bg-white/5 border border-ink-black/20 dark:border-white/20 rounded-none text-[8px] font-black text-ink-black dark:text-white uppercase tracking-tighter italic">PREMIUM</span>
            )}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={logout}
              className="h-[24px] w-[24px] min-[400px]:h-[44px] min-[400px]:w-[44px] flex items-center justify-center bg-ink-black/5 dark:bg-white/5 border border-ink-black/10 dark:border-white/10 rounded-none hover:bg-ink-black/10 dark:hover:bg-white/10 transition-all text-ink-black/60 dark:text-white/60"
            >
              <LogOut className="w-3.5 h-3.5 min-[400px]:w-5 min-[400px]:h-5" />
            </motion.button>
          </div>
        ) : (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={login}
            className="holo-button h-[24px] min-[400px]:h-[44px] flex items-center gap-1.5 min-[400px]:gap-2 px-3 min-[400px]:px-6 bg-ink-black text-white dark:bg-transparent dark:text-white font-sans font-black text-[8px] min-[400px]:text-[10px] uppercase tracking-[0.2em] min-[400px]:tracking-[0.4em]"
          >
            <LogIn className="w-3.5 h-3.5 min-[400px]:w-4 min-[400px]:h-4" />
            {t.login}
          </motion.button>
        )}
      </div>

      {/* Info Toggle */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsInfoModalOpen(true)}
        className="h-[24px] w-[24px] min-[400px]:h-[44px] min-[400px]:w-[44px] flex items-center justify-center bg-ink-black/5 dark:bg-white/5 border border-ink-black/10 dark:border-white/10 rounded-none hover:bg-ink-black/10 dark:hover:bg-white/10 transition-all backdrop-blur-md text-ink-black/40 dark:text-white/40"
      >
        <HelpCircle className="w-3.5 h-3.5 min-[400px]:w-5 min-[400px]:h-5" />
      </motion.button>
      {/* Language / Theme Toggles */}
      <div className="flex items-center gap-1.5 min-[400px]:gap-2">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={toggleLang}
          className="h-[24px] min-[400px]:h-[44px] flex items-center gap-1.5 min-[400px]:gap-3 px-2 min-[400px]:px-5 bg-ink-black/5 dark:bg-white/5 border border-ink-black/10 dark:border-white/10 rounded-none hover:bg-ink-black/10 dark:hover:bg-white/10 transition-all backdrop-blur-md"
        >
          <Languages className="w-3.5 h-3.5 min-[400px]:w-5 min-[400px]:h-5 text-ink-black/40 dark:text-white/40" />
          <span className="text-[8px] min-[400px]:text-[10px] font-black uppercase tracking-widest text-ink-black/80 dark:text-white/80">
            {lang === "ko" ? "ENG" : "KOR"}
          </span>
        </motion.button>

        {/* Theme Toggle */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={toggleTheme}
          className="h-[24px] w-[24px] min-[400px]:h-[44px] min-[400px]:w-[44px] flex items-center justify-center bg-ink-black/5 dark:bg-white/5 border border-ink-black/10 dark:border-white/10 rounded-none hover:bg-ink-black/10 dark:hover:bg-white/10 transition-all backdrop-blur-md text-ink-black/60 dark:text-white/60"
        >
          {theme === 'dark' ? <Sun className="w-3.5 h-3.5 min-[400px]:w-5 min-[400px]:h-5" /> : <Moon className="w-3.5 h-3.5 min-[400px]:w-5 min-[400px]:h-5" />}
        </motion.button>
      </div>
    </div>
  );
}
