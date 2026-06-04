import { useState } from "react";
import { motion } from "motion/react";
import { Language, translations } from "../lib/translations";

interface LoadingViewProps {
  lang: Language;
}

export function LoadingView({ lang }: LoadingViewProps) {
  const t = translations[lang];
  
  // Pick a random cell out of 4 columns (0-3) and 2 rows (0-1) on component mount
  const [coords] = useState(() => {
    const col = Math.floor(Math.random() * 4);
    const row = Math.floor(Math.random() * 2);
    return { col, row };
  });

  // Calculate background coordinates in percentage
  const colPercent = coords.col * (100 / 3);
  const rowPercent = coords.row * 100;

  return (
    <motion.div 
      key="loading" 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      exit={{ opacity: 0 }} 
      className="flex flex-col items-center gap-16"
    >
      <div className="relative w-72 h-72 flex items-center justify-center border border-white/5 shadow-[0_0_100px_rgba(255,255,255,0.03)] dragon-pattern">
        {/* Decorative concentric rotating frames */}
        <div className="absolute inset-0 border-[0.5px] border-white/10 animate-[spin_20s_linear_infinite]" />
        <div className="absolute inset-8 border-[0.5px] border-white/5 animate-[spin_30s_linear_infinite_reverse]" />
        
        {/* Dynamic random loading graphic cell inside modern aesthetic frame */}
        <div 
          className=" rounded-xl border border-white/10 bg-transparent shadow-2xl relative z-10 select-none animate-pulse"
          style={{
            backgroundImage: 'url("/assets/loading.png")',
            backgroundSize: "400% 200%",
            backgroundPosition: `${colPercent}% ${rowPercent}%`,
            backgroundRepeat: "no-repeat",
            width: "265px",
            height: "482px"
          }}
        />
      </div>
      <div className="flex flex-col items-center gap-6 text-center max-w-sm">
        <h2 className="text-3xl md:text-5xl font-serif font-black italic text-white leading-none tracking-tighter">
          {t.loadingSummary}
        </h2>
        <div className="w-16 h-0.5 bg-white/10" />
        <p className="font-sans uppercase tracking-[0.8em] text-[9px] font-black italic text-ink-black/60 dark:text-white/60">
          {lang === 'ko' ? "데이터를 읽는 중" : "READING THE THREADS OF PATTERNS"}
        </p>
      </div>
    </motion.div>
  );
}

