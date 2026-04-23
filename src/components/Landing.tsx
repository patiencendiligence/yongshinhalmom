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
    <div className="flex flex-col items-center justify-center min-h-screen text-center px-4 relative overflow-hidden">
      {/* Texture Layer */}
      <div className="absolute inset-0 mythic-grain pointer-events-none" />
      
      {/* Sophisticated Accents */}
      <div className="absolute top-[20%] right-[-5%] w-[300px] h-[300px] rounded-full bg-mythic-red/5 blur-[100px]" />
      <div className="absolute bottom-[20%] left-[-5%] w-[300px] h-[300px] rounded-full bg-mythic-gold/5 blur-[100px]" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="mb-12"
      >
        <div className="inline-flex items-center gap-6 px-6 py-2 border border-white/10 rounded-full bg-white/5 backdrop-blur-sm">
          <span className="text-[10px] font-sans font-bold tracking-[0.3em] uppercase text-white/40">{t.since}</span>
          <div className="w-1 h-1 rounded-full bg-mythic-gold" />
          <span className="text-[10px] font-sans font-bold tracking-[0.3em] uppercase text-white/40">{t.traditionalWisdom}</span>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.4, duration: 1, ease: "easeOut" }}
        className="relative z-10"
      >
        <h1 className="flex flex-col items-center mb-10">
          <span className="text-[12px] font-sans font-black tracking-[0.6em] uppercase text-mythic-gold mb-4 opacity-80">{t.ancientOracle}</span>
          <span className="text-8xl md:text-11xl font-serif font-black tracking-tighter leading-none mb-4 italic text-white whitespace-nowrap">
            {t.subtitle === "용신할멈" ? (
              <>龍神<span className="text-mythic-red">婆</span></>
            ) : (
              <span className="text-4xl md:text-6xl uppercase tracking-[0.2em]">{t.subtitle}</span>
            )}
          </span>
          <span className="text-lg md:text-xl font-serif text-white/30 italic tracking-[0.2em]">{t.grandmother}</span>
        </h1>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
        className="max-w-xl mx-auto mb-16"
      >
        <p className="text-white/40 text-base md:text-lg font-sans leading-relaxed tracking-tight whitespace-pre-line">
          "{t.landingQuote}"
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
        className="flex flex-col items-center gap-8"
      >
        <div className="flex flex-col md:flex-row gap-4">
          <button
            onClick={onStart}
            className="group relative px-20 py-6 bg-white text-black font-sans font-black text-xs uppercase tracking-[0.4em] transition-all overflow-hidden hover:scale-105 active:scale-95"
          >
            <div className="absolute inset-0 bg-mythic-gold transform -translate-x-full group-hover:translate-x-0 transition-transform duration-500" />
            <span className="relative z-10 flex items-center gap-4 whitespace-nowrap">
              {t.enterOracle} <Sparkles className="w-4 h-4" />
            </span>
          </button>

          {hasProfiles && (
            <button
              onClick={onOpenProfiles}
              className="px-12 py-6 border border-white/10 bg-white/5 text-white/60 font-sans font-black text-[10px] uppercase tracking-[0.4em] transition-all hover:bg-white/10 hover:text-white"
            >
              {t.loadProfiles}
            </button>
          )}
        </div>
        
        <div className="flex gap-4 items-center mt-4">
          {[
            { color: 'bg-mythic-red', label: '火' },
            { color: 'bg-mythic-gold', label: '土' },
            { color: 'bg-white', label: '金' },
            { color: 'bg-mythic-blue', label: '水' },
            { color: 'bg-mythic-green', label: '木' },
          ].map((item, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 0.4, scale: 1 }}
              transition={{ delay: 1 + i * 0.1 }}
              className={`w-2 h-2 rounded-full ${item.color}`}
            />
          ))}
        </div>
      </motion.div>

      {/* Background Decorative Letters */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[30vw] font-serif font-black text-white/[0.02] pointer-events-none select-none uppercase tracking-tighter">
        Destiny
      </div>

    </div>
  );
}
