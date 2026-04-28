import { motion } from "motion/react";
import { Sparkles, Moon, Sun } from "lucide-react";

import { Language, translations } from "../lib/translations";

interface LandingProps {
  onStart: () => void;
  onOpenProfiles: () => void;
  hasProfiles: boolean;
  lang: Language;
}

export default function Landing({ onStart, onOpenProfiles, hasProfiles, lang }: LandingProps) {
  const t = translations[lang];
  
  return (
    <div className="flex flex-col items-center justify-center min-h-screen text-center px-4 relative overflow-hidden dragon-pattern">
      {/* Decorative Accents Inspired by Image 1 */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-hidden">
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 2 }}
          className="absolute -top-20 -left-20 w-[60vw] h-[60vw] rounded-full bg-holo-cyan/5 blur-[120px]" 
        />
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 2, delay: 0.5 }}
          className="absolute -bottom-20 -right-20 w-[60vw] h-[60vw] rounded-full bg-holo-pink/5 blur-[120px]" 
        />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="relative z-20 mb-8"
      >
        <div className="inline-block px-4 py-1 border border-white/10 rounded-none bg-black backdrop-blur-sm">
          <span className="text-[9px] font-sans font-black tracking-[0.5em] uppercase text-white/40 italic">{t.traditionalWisdom}</span>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.4, duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10"
      >
        <h1 className="flex flex-col items-center mb-12">
          <span className="text-[11px] font-sans font-black tracking-[0.8em] uppercase mythic-gradient-text mb-6">{t.ancientOracle}</span>
          <div className="flex flex-col items-center">
            <span className="text-6xl md:text-[10rem] font-serif font-black italic tracking-tighter leading-[0.85] text-white">
              {t.title}
            </span>
            <span className="text-2xl md:text-3xl font-serif text-white/20 italic tracking-[0.4em] mt-4 uppercase">
              {t.grandmother}
            </span>
          </div>
        </h1>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
        className="max-w-xl mx-auto mb-16 relative z-10"
      >
        <p className="text-white/60 text-sm md:text-base font-sans leading-relaxed tracking-tight max-w-sm">
          {t.landingQuote}
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
        className="flex flex-col items-center gap-10 relative z-20"
      >
        <div className="flex flex-col md:flex-row gap-6">
          <button
            onClick={onStart}
            className="holo-button group px-16 py-5 min-w-[280px] bg-white text-white/50 font-sans font-black text-[11px] uppercase tracking-[0.5em] flex items-center justify-center gap-4"
          >
            {t.enterOracle} <Sparkles className="w-3.5 h-3.5" />
          </button>

          {hasProfiles && (
            <button
              onClick={onOpenProfiles}
              className="px-10 py-5 border border-white/10 bg-black text-white/50 font-sans font-black text-[10px] uppercase tracking-[0.5em] transition-all hover:text-white hover:border-white/30"
            >
              {t.loadProfiles}
            </button>
          )}
        </div>
      </motion.div>

      <div className="absolute top-1/2 left-4 -translate-y-1/2 vertical-text text-[9px] font-sans font-black tracking-[0.4em] uppercase opacity-20">
        Pattern Science • Modern Tech
      </div>
      <div className="absolute top-1/2 right-4 -translate-y-1/2 vertical-text text-[9px] font-sans font-black tracking-[0.4em] uppercase opacity-20">
        User Insight • Life Pattern
      </div>
    </div>
  );
}
