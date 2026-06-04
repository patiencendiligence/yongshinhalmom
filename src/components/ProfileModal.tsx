import { motion, AnimatePresence } from "motion/react";
import { UserProfile, storageService } from "../services/storageService";
import { Trash2, User, Calendar, MapPin, X } from "lucide-react";
import { Language, translations } from "../lib/translations";

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (profile: UserProfile, viewMode: "today" | "full") => void;
  profiles: UserProfile[];
  onDelete: (id: string) => void;
  lang: Language;
}

export default function ProfileModal({ isOpen, onClose, onSelect, profiles, onDelete, lang }: ProfileModalProps) {
  const t = translations[lang] as any;
  if (!isOpen) return null;

  const todayFortuneTextMobile = lang === "ko" ? "오늘 운세" : "Today's Fortune";
  const fullReportTextMobile = lang === "ko" ? "전체 리포트" : "Full Report";

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-cream/90 dark:bg-black/90 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 1.05, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 1.05, y: 10 }}
          className="w-full max-w-2xl bg-cream border border-ink-black/20 dark:bg-black dark:border-white/20 rounded-none overflow-hidden shadow-[0_0_100px_rgba(0,0,0,0.05)] dark:shadow-[0_0_100px_rgba(255,255,255,0.05)] dragon-pattern relative"
        >
          <div className="p-10 border-b border-ink-black/10 dark:border-white/10 flex justify-between items-center bg-ink-black/[0.01] dark:bg-white/[0.02] relative z-10">
            <div>
              <h2 className="text-3xl font-serif font-black italic text-ink-black dark:text-white tracking-tight">{t.storedProfiles}</h2>
              <p className="text-[10px] text-ink-black/40 dark:text-white/30 tracking-[0.6em] uppercase mt-2 font-black">{t.storedKnowledge}</p>
            </div>
            <button onClick={onClose} className="p-3 hover:bg-ink-black/10 dark:hover:bg-white/10 transition-all border border-ink-black/10 dark:border-white/10">
              <X className="w-6 h-6 text-ink-black dark:text-white" />
            </button>
          </div>

          <div className="max-h-[55vh] overflow-y-auto p-8 space-y-6 no-scrollbar relative z-10">
            {profiles.length === 0 ? (
              <div className="py-24 text-center text-ink-black/20 dark:text-white/10 italic font-serif text-2xl">
                {t.noProfiles}
              </div>
            ) : (
              profiles.map((profile) => (
                <div
                  key={profile.id}
                  className="group relative flex flex-col md:flex-row md:items-center justify-between p-6 md:p-8 bg-ink-black/[0.02] border border-ink-black/10 rounded-none hover:bg-ink-black/[0.04] dark:bg-white/[0.01] dark:border-white/10 dark:hover:bg-white/[0.03] transition-all cursor-default gap-6"
                >
                  {/* Left: Info Details */}
                  <div className="flex-1 min-w-0">
                    <div className="text-3xl font-serif font-black italic text-ink-black dark:text-white tracking-wide">
                      {profile.name}
                    </div>
                    
                    <div className="flex flex-col gap-1.5 mt-3 text-xs text-ink-black/60 dark:text-white/50 tracking-wide font-sans font-medium">
                      <span className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-ink-black/40 dark:text-white/40 shrink-0" /> 
                        {profile.birthDate} ({profile.isLunar ? t.lunar : t.solar})
                      </span>
                      
                      <span className="inline-block w-fit text-[11px] text-ink-black/45 dark:text-white/45 font-serif font-black italic tracking-widest uppercase hover:text-ink-black dark:hover:text-white transition-colors select-none">
                        <span className="underline underline-offset-4 decoration-[1px] decoration-ink-black/30 dark:decoration-white/30">
                          {profile.targetYear} LIFE ANALYSIS
                        </span>
                      </span>

                      <span className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-ink-black/40 dark:text-white/40 shrink-0" /> 
                        {profile.birthPlace}
                      </span>
                    </div>
                  </div>

                  {/* Middle & Right interactive panel */}
                  <div className="flex items-start gap-4 w-full md:w-auto shrink-0">
                    {/* Desktop View Buttons (md and up) */}
                    <div className="hidden md:flex flex-col gap-2.5 w-48">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelect(profile, "today");
                        }}
                        className="w-full py-3.5 px-4 text-xs font-sans font-black uppercase tracking-widest text-center bg-cream/50 dark:bg-zinc-900 border border-ink-black/20 dark:border-white/20 hover:bg-ink-black/5 dark:hover:bg-white/5 text-ink-black dark:text-white transition-all cursor-pointer rounded-none border-b-[1.5px] active:translate-y-[0.5px]"
                      >
                        {t.viewTodayFortune}
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelect(profile, "full");
                        }}
                        className="w-full py-3.5 px-4 text-xs font-sans font-black uppercase tracking-widest text-center bg-ink-black text-white dark:bg-white dark:text-black hover:bg-ink-black/90 dark:hover:bg-white/90 transition-all cursor-pointer rounded-none border-b-[1.5px] active:translate-y-[0.5px]"
                      >
                        {t.viewFullReport}
                      </button>
                    </div>

                    {/* Mobile View Buttons (below md) - side by side layout */}
                    <div className="flex md:hidden flex-row gap-3 w-full">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelect(profile, "today");
                        }}
                        className="flex-1 py-3.5 px-3 text-xs font-sans font-black uppercase tracking-widest text-center bg-cream/55 dark:bg-zinc-900 border border-ink-black/20 dark:border-white/20 hover:bg-ink-black/5 dark:hover:bg-white/5 text-ink-black dark:text-white transition-all cursor-pointer rounded-none"
                      >
                        {todayFortuneTextMobile}
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelect(profile, "full");
                        }}
                        className="flex-1 py-3.5 px-3 text-xs font-sans font-black uppercase tracking-widest text-center bg-ink-black text-white dark:bg-white dark:text-black hover:bg-ink-black/90 dark:hover:bg-white/90 transition-all cursor-pointer rounded-none"
                      >
                        {fullReportTextMobile}
                      </button>
                    </div>

                    {/* Trashcan button */}
                    {/* On Desktop: displayed adjacent to the buttons. On Mobile: absolute top-right for visual comfort but remains responsive */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDelete(profile.id);
                      }}
                      className="p-4 md:p-[17px] bg-ink-black/[0.05] dark:bg-white/[0.05] border border-ink-black/10 dark:border-white/10 hover:bg-mythic-red/10 dark:hover:bg-mythic-red/20 text-ink-black/60 dark:text-white/60 hover:text-mythic-red dark:hover:text-mythic-red md:flex hover:scale-[1.02] active:scale-[0.98] transition-all rounded-none shrink-0 cursor-pointer absolute top-4 right-4 md:static"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="p-8 bg-ink-black/[0.01] border-t border-ink-black/10 dark:bg-white/[0.01] dark:border-t dark:border-white/10 text-center relative z-10">
            <p className="text-[10px] text-ink-black/20 dark:text-white/10 uppercase tracking-[0.4em] font-black">
              {t.browserStorageNote}
            </p>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
