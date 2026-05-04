import { motion } from "motion/react";
import { Language, translations } from "../lib/translations";

interface LoadingViewProps {
  lang: Language;
}

export function LoadingView({ lang }: LoadingViewProps) {
  const t = translations[lang];
  
  return (
    <motion.div 
      key="loading" 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      exit={{ opacity: 0 }} 
      className="flex flex-col items-center gap-16"
    >
      <div className="relative w-72 h-72 flex items-center justify-center border border-white/5 shadow-[0_0_100px_rgba(255,255,255,0.03)] dragon-pattern">
        <div className="absolute inset-0 border-[0.5px] border-white/10 animate-[spin_20s_linear_infinite]" />
        <div className="absolute inset-8 border-[0.5px] border-white/5 animate-[spin_30s_linear_infinite_reverse]" />
        <div className="text-8xl font-serif font-black italic text-white/10 animate-pulse tracking-tighter">Halmom</div>
      </div>
      <div className="flex flex-col items-center gap-6 text-center max-w-sm">
        <h2 className="text-3xl md:text-5xl font-serif font-black italic text-white leading-none tracking-tighter">
          {t.loadingSummary}
        </h2>
        <div className="w-16 h-0.5 bg-white/10" />
        <p className="text-white/20 font-sans uppercase tracking-[0.8em] text-[9px] font-black italic">
          {lang === 'ko' ? "데이터를 읽는 중" : "READING THE THREADS OF PATTERNS"}
        </p>
      </div>
    </motion.div>
  );
}
