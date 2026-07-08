import { motion } from "motion/react";
import { HelpCircle, LogOut, Sun, Moon, Languages } from "lucide-react";
import { useAuth } from "../lib/AuthContext";
import { translations, Language } from "../lib/translations";
import { useTheme } from "../lib/ThemeContext";

interface HeaderActionsProps {
  lang: Language;
  toggleLang: () => void;
  setIsInfoModalOpen: (open: boolean) => void;
  onOpenProfiles?: () => void;
}

export function HeaderActions({ lang, toggleLang, setIsInfoModalOpen, onOpenProfiles }: HeaderActionsProps) {
  const { user, login, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const t = translations[lang];

  return (
    <div className="absolute top-3 right-3 min-[400px]:top-4 min-[400px]:right-4 z-50 flex items-center">
      <div className="flex items-center bg-[#f9f7f0]/95 dark:bg-[#07080d]/95 border border-ink-black/10 dark:border-white/10 shadow-[0_4px_20px_rgba(0,0,0,0.05)] dark:shadow-[0_4px_30px_rgba(0,0,0,0.3)] backdrop-blur-md rounded-none overflow-hidden h-[34px] min-[400px]:h-[40px]">
        {/* DATA Link */}
        <a 
          href="/basic/what-is-saju" 
          className="h-full px-2.5 min-[400px]:px-4 flex items-center justify-center font-sans font-black text-[8px] min-[400px]:text-[10px] uppercase tracking-[0.15em] text-ink-black/60 dark:text-white/60 hover:text-ink-black dark:hover:text-white hover:bg-ink-black/10 dark:hover:bg-white/10 transition-all duration-200"
        >
          Saju Info
        </a>
        
        <div className="w-[1px] h-3 min-[400px]:h-4 bg-ink-black/10 dark:bg-white/10" />

        {/* INSIGHTS or LOGIN */}
        {user ? (
          <div className="h-full flex items-center">
            <button
              onClick={onOpenProfiles || logout}
              className="h-full px-2.5 min-[400px]:px-4 flex items-center justify-center font-sans font-black text-[8px] min-[400px]:text-[10px] uppercase tracking-[0.15em] text-purple-600 dark:text-holo-cyan hover:bg-ink-black/10 dark:hover:bg-white/10 transition-all duration-200 relative border-x border-transparent"
              title={`Logged in as ${user.email}. Click to view profiles.`}
            >
              {t.storedProfiles}
            </button>
            <button 
              onClick={logout}
              className="h-full px-1.5 min-[400px]:px-2.5 flex items-center justify-center text-red-500 hover:bg-ink-black/10 dark:hover:bg-white/10 transition-colors"
              title="Logout"
            >
              <LogOut className="w-3 h-3 min-[400px]:w-3.5 min-[400px]:h-3.5" />
            </button>
          </div>
        ) : (
          <button
            onClick={login}
            className="h-full px-2.5 min-[400px]:px-4 flex items-center justify-center font-sans font-black text-[8px] min-[400px]:text-[10px] uppercase tracking-[0.15em] text-ink-black/80 dark:text-white/80 hover:bg-ink-black/10 dark:hover:bg-white/10 transition-all duration-200"
          >
            LOGIN
          </button>
        )}

        <div className="w-[1px] h-3 min-[400px]:h-4 bg-ink-black/10 dark:bg-white/10" />

        {/* Info button (?) */}
        <button
          onClick={() => setIsInfoModalOpen(true)}
          className="h-full px-2.5 min-[400px]:px-3.5 flex items-center justify-center text-ink-black/50 dark:text-white/50 hover:text-ink-black dark:hover:text-white hover:bg-ink-black/10 dark:hover:bg-white/10 transition-all duration-200"
        >
          <HelpCircle className="w-3.5 h-3.5 min-[400px]:w-4 min-[400px]:h-4 opacity-75" />
        </button>

        <div className="w-[1px] h-3 min-[400px]:h-4 bg-ink-black/10 dark:bg-white/10" />

        {/* Language switcher */}
        <button
          onClick={toggleLang}
          className="h-full px-2 min-[400px]:px-3 flex items-center justify-center gap-1 min-[400px]:gap-1.5 font-sans font-black text-[8px] min-[400px]:text-[10px] uppercase tracking-[0.05em] text-ink-black/60 dark:text-white/60 hover:text-ink-black dark:hover:text-white hover:bg-ink-black/10 dark:hover:bg-white/10 transition-all duration-200"
        >
          <Languages className="w-3 h-3 min-[400px]:w-3.5 min-[400px]:h-3.5 opacity-70" />
          <span>{lang === "ko" ? "ENG" : "KOR"}</span>
        </button>

        <div className="w-[1px] h-3 min-[400px]:h-4 bg-ink-black/10 dark:bg-white/10" />

        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          className="h-full px-2.5 min-[400px]:px-3.5 flex items-center justify-center text-ink-black/50 dark:text-white/50 hover:text-ink-black dark:hover:text-white hover:bg-ink-black/10 dark:hover:bg-white/10 transition-all duration-200"
        >
          {theme === 'dark' ? (
            <Sun className="w-3.5 h-3.5 min-[400px]:w-4 min-[400px]:h-4 text-amber-400" />
          ) : (
            <Moon className="w-3.5 h-3.5 min-[400px]:w-4 min-[400px]:h-4 text-indigo-600" />
          )}
        </button>
      </div>
    </div>
  );
}
