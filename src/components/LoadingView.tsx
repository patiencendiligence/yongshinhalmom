import { useState, useEffect } from "react";
import { motion } from "motion/react";
import { Language, translations } from "../lib/translations";

interface LoadingViewProps {
  lang: Language;
}

export function LoadingView({ lang }: LoadingViewProps) {
  const t = translations[lang];
  const [progress, setProgress] = useState(0);
  
  // Pick a random cell out of 4 columns (0-3) and 2 rows (0-1) on component mount
  const [coords] = useState(() => {
    const col = Math.floor(Math.random() * 4);
    const row = Math.floor(Math.random() * 2);
    return { col, row };
  });

  // Calculate background coordinates in percentage
  const colPercent = coords.col * (100 / 3);
  const rowPercent = coords.row * 100;

  // Handles smooth fake progress bar acceleration & gradual deceleration
  useEffect(() => {
    const start = Date.now();
    const timer = setInterval(() => {
      const elapsed = (Date.now() - start) / 1000; // in seconds
      let newProgress = 0;
      if (elapsed < 3.5) {
        // Smoothly speed up through first seconds: 0% to 55%
        newProgress = (elapsed / 3.5) * 55;
      } else if (elapsed < 12) {
        // Slow down through middle seconds: 55% to 88%
        newProgress = 55 + ((elapsed - 3.5) / 8.5) * 33;
      } else {
        // Creep slowly up from 88% towards 98%
        newProgress = 88 + (1 - Math.exp(-(elapsed - 12) / 15)) * 10;
      }
      setProgress(Math.floor(Math.min(99, newProgress)));
    }, 100);

    return () => clearInterval(timer);
  }, []);

  return (
    <motion.div 
      key="loading" 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      exit={{ opacity: 0 }} 
      className="flex flex-col items-center gap-10 md:gap-16 w-full max-w-md px-6 mx-auto"
    >
      <div className="relative w-64 h-64 md:w-72 md:h-72 flex items-center justify-center border border-ink-black/5 dark:border-white/5 shadow-[0_0_100px_rgba(255,255,255,0.03)] dragon-pattern">
        {/* Decorative concentric rotating frames */}
        <div className="absolute inset-0 border-[0.5px] border-ink-black/10 dark:border-white/10 animate-[spin_20s_linear_infinite]" />
        <div className="absolute inset-8 border-[0.5px] border-ink-black/5 dark:border-white/5 animate-[spin_30s_linear_infinite_reverse]" />
        
        {/* Dynamic random loading graphic cell inside modern aesthetic frame */}
        <div 
          className="rounded-xl border border-ink-black/10 dark:border-white/10 bg-transparent shadow-2xl relative z-10 select-none animate-pulse"
          style={{
            backgroundImage: 'url("/assets/loading.png")',
            backgroundSize: "400% 200%",
            backgroundPosition: `${colPercent}% ${rowPercent}%`,
            backgroundRepeat: "no-repeat",
            width: "132px",
            height: "241px"
          }}
        />
      </div>
      <div className="flex flex-col items-center gap-6 text-center w-full">
        <h2 className="text-3xl md:text-5xl font-serif font-black italic text-ink-black dark:text-white leading-none tracking-tighter">
          {t.loadingSummary}
        </h2>
        <div className="w-16 h-0.5 bg-ink-black/10 dark:bg-white/10" />
        <p className="font-sans uppercase tracking-[0.8em] text-[9px] font-black italic text-ink-black/60 dark:text-white/60">
          {lang === 'ko' ? "데이터를 읽는 중" : "READING THE THREADS OF PATTERNS"}
        </p>

        {/* Retro-styled Theme-Conforming Percentage Progress Bar */}
        <div className="w-full max-w-xs flex flex-col items-start gap-2 font-mono mt-4 text-left select-none">
          <div className="flex justify-between w-full text-[11px] font-black tracking-wider text-ink-black/70 dark:text-white/70">
            <div className="flex items-center gap-1">
              <span className="uppercase text-[10px] animate-pulse">LOADING</span>
              <span className="text-[10px]">
                {Array(Math.max(1, Math.min(8, Math.floor((100 - progress) / 11))))
                  .fill(".")
                  .join(" ")}
              </span>
            </div>
            <span>{progress}%</span>
          </div>
          <div className="w-full h-5 border border-ink-black/20 dark:border-holo-cyan/50 p-[2px] bg-ink-black/5 dark:bg-black/40 overflow-hidden relative rounded-xs">
            {/* Inner Glowing Bar */}
            <motion.div
              className="h-full bg-ink-black dark:bg-holo-cyan shadow-[0_0_8px_rgba(0,0,0,0.15)] dark:shadow-[0_0_12px_rgba(0,252,255,0.8)] rounded-3xs"
              style={{ width: `${progress}%` }}
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ ease: "easeOut", duration: 0.2 }}
            />
          </div>
        </div>
      </div>
    </motion.div>
  );
}

