import { motion } from "motion/react";
import { Sparkles } from "lucide-react";
import { Helmet } from "react-helmet-async";

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
    <div className="flex flex-col items-center justify-center min-h-screen text-center px-4 relative overflow-hidden bg-cream text-ink-black dark:bg-dark-deep dark:text-white bg-paper-pattern transition-colors duration-300">
      <Helmet>
        <title>{lang === "en" ? "Yongshin Halmeom - Korean Saju Report & Today's Fortune" : "용신할멈 - 사주명리 & 오늘의 운세"}</title>
        <meta name="description" content={lang === "en" ? "Tsk. Looking for answers? Yongsin Grandma reads the patterns of your life through Saju—personality, relationships, career, and daily fortune included." : "쯧. 답답한 마음이 있느냐. 용신할멈이 사주를 바탕으로 자네의 기질과 인간관계, 직업, 재물, 오늘의 흐름까지 찬찬히 풀어주마."} />
        <link rel="canonical" href="https://yongshinhalmom.vercel.app/" />
      </Helmet>
      
      {/* Decorative Accents */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-hidden">
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.05 }}
          className="absolute -top-20 -left-20 w-[60vw] h-[60vw] rounded-full bg-indigo-900/10 blur-[120px] dark:bg-indigo-300/5" 
        />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 5 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
        className="relative z-20 mb-8"
      >
        <div className="inline-block px-4 py-1 border border-ink-black/10 dark:border-white/10 rounded-none bg-ink-black/5 dark:bg-white/5 backdrop-blur-sm">
          <span className="text-[9px] font-sans font-black tracking-[0.5em] uppercase text-ink-black/60 dark:text-white/40 italic">{t.traditionalWisdom}</span>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.2 }}
        className="relative z-10"
      >
        <h1 className="flex flex-col items-center mb-12">
          <span className="text-[11px] font-sans font-black tracking-[0.8em] uppercase text-ink-black dark:text-white mb-6 opacity-80">{t.ancientOracle}</span>
          <div className="flex flex-col items-center">
            <span className="text-6xl md:text-8xl lg:text-[7rem] font-serif font-black italic tracking-tighter leading-[1.15] py-6 px-4 block overflow-visible gradient-title">
              {t.title}
            </span>
            <span className="text-2xl md:text-3xl font-serif text-ink-black/40 dark:text-white/20 italic tracking-[0.4em] mt-4 uppercase">
              {t.grandmother}
            </span>
          </div>
        </h1>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.2 }}
        className="max-w-xl mx-auto mb-16 relative z-10"
      >
        <p className="text-ink-black/70 dark:text-white/60 text-sm md:text-base font-sans leading-relaxed tracking-tight max-w-sm">
          {t.landingQuote}
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
        className="flex flex-col items-center gap-10 relative z-20 mb-10"
      >
        <div className="flex flex-col md:flex-row gap-6">
          <button
            onClick={onStart}
            className="holo-button group px-16 py-5 min-w-[280px] bg-ink-black text-white dark:bg-transparent dark:text-white/90 font-sans font-black text-[11px] uppercase tracking-[0.5em] flex items-center justify-center gap-4 transition-all hover:opacity-90"
          >
            {t.enterOracle} <Sparkles className="w-3.5 h-3.5" />
          </button>

          {hasProfiles && (
            <button
              onClick={onOpenProfiles}
              className="px-10 py-5 border border-ink-black/20 dark:border-white/10 bg-transparent text-ink-black/60 dark:text-white/50 font-sans font-black text-[10px] uppercase tracking-[0.5em] transition-all hover:text-ink-black hover:border-ink-black/40 dark:hover:text-white dark:hover:border-white/30"
            >
              {t.loadProfiles}
            </button>
          )}
        </div>
      </motion.div>
       <div className="flex items-center gap-8 mt-10">
        <button
          onClick={ () => location.href ='/basic/what-is-saju'}
          className="text-[10px] font-sans font-black uppercase tracking-[0.5em] text-ink-black/70 dark:text-white/60 hover:text-mythic-gold dark:hover:text-mythic-gold transition-all flex items-center gap-4 group"
        >

          {t.moreInfo}
        </button>
      </div>
    </div>
  );
}
