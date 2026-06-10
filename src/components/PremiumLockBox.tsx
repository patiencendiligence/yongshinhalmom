import React from "react";
import { motion } from "motion/react";
import { Lock, RotateCcw } from "lucide-react";
import { Language } from "../lib/translations";

interface PremiumLockBoxProps {
  t: any;
  lang: Language;
  isCheckingPayment: boolean;
  isPremiumUser: boolean;
  handlePayment: () => void;
  onUpgrade?: () => void;
  handleManualCheck: () => Promise<void>;
  isUpgradingDetail?: boolean;
}

export default function PremiumLockBox({
  t,
  lang,
  isCheckingPayment,
  isPremiumUser,
  handlePayment,
  onUpgrade,
  handleManualCheck,
  isUpgradingDetail,
}: PremiumLockBoxProps) {
  const [inlineProgress, setInlineProgress] = React.useState(0);

  React.useEffect(() => {
    if (!isUpgradingDetail) {
      setInlineProgress(0);
      return;
    }
    const start = Date.now();
    const timer = setInterval(() => {
      const elapsed = (Date.now() - start) / 1000;
      let newProgress = 0;
      if (elapsed < 3.5) {
        newProgress = (elapsed / 3.5) * 55;
      } else if (elapsed < 12) {
        newProgress = 55 + ((elapsed - 3.5) / 8.5) * 33;
      } else {
        newProgress = 88 + (1 - Math.exp(-(elapsed - 12) / 15)) * 10;
      }
      setInlineProgress(Math.floor(Math.min(99, newProgress)));
    }, 100);

    return () => clearInterval(timer);
  }, [isUpgradingDetail]);

  if (isUpgradingDetail) {
    return (
      <motion.div
        key="upgrading-premium"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="col-span-12 py-32 bg-white/40 dark:bg-black/50 p-12 md:p-16 flex flex-col items-center justify-center relative group backdrop-blur-sm border-t border-ink-black/5 dark:border-white/5"
      >
        <div className="mb-8 text-center max-w-md">
          <div className="flex items-center justify-center gap-4 mb-6">
            <span className="flex items-center gap-2 px-3 py-1 bg-mythic-gold/15 border border-mythic-gold/30 rounded-none text-[10px] font-black text-mythic-gold uppercase tracking-widest text-xs">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-mythic-gold opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-mythic-gold"></span>
              </span>
              {lang === "ko" ? "심층 사주 해독 중" : "INTERPRETING DETAILS"}
            </span>
          </div>
          <h3 className="text-3xl md:text-5xl font-serif font-black italic text-ink-black dark:text-white leading-tight mb-4">
            {lang === "ko" ? "용신할멈의 숨은 자취 해독" : "Tracing the Grandma's Whispers"}
          </h3>
          <p className="text-sm font-sans text-ink-black/55 dark:text-white/40 mb-8 leading-relaxed">
            {lang === "ko" 
              ? "의뢰인님의 태어난 날 깊은 실타래를 한 올씩 짚어가며 풀고 있사오니, 잠시만 숨을 고르고 기다려주십시오."
              : "Deciphering the deep details of your birth chart thread by thread. Take a brief breath and wait a moment."}
          </p>
        </div>

        <div className="w-full max-w-xs flex flex-col items-start gap-2 font-mono text-left select-none">
          <div className="flex justify-between w-full text-[11px] font-black tracking-wider text-ink-black/70 dark:text-white/70">
            <div className="flex items-center gap-1">
              <span className="uppercase text-[10px] animate-pulse">DECODING</span>
              <span className="text-[10px]">
                {Array(Math.max(1, Math.min(8, Math.floor((100 - inlineProgress) / 11))))
                  .fill(".")
                  .join(" ")}
              </span>
            </div>
            <span>{inlineProgress}%</span>
          </div>
          <div className="w-full h-5 border border-ink-black/20 dark:border-[#00fcff]/50 p-[2px] bg-ink-black/5 dark:bg-black/40 overflow-hidden relative rounded-xs">
            <motion.div
              className="h-full bg-ink-black dark:bg-[#00fcff] shadow-[0_0_8px_rgba(0,0,0,0.15)] dark:shadow-[0_0_12px_rgba(0,252,255,0.8)] rounded-xs"
              style={{ width: `${inlineProgress}%` }}
              animate={{ width: `${inlineProgress}%` }}
              transition={{ ease: "easeOut", duration: 0.2 }}
            />
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      key="locked-premium"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.2 }}
      data-premium-lock="true"
      className="col-span-12 py-32 bg-white/40 dark:bg-black/50 p-12 md:p-16 flex flex-col items-center justify-center relative group backdrop-blur-sm border-t border-ink-black/5 dark:border-white/5"
    >
      <div className="mb-16 text-center">
        <div className="flex items-center justify-center gap-4 mb-8">
          <div className="text-[10px] uppercase tracking-[0.6em] font-sans font-black text-ink-black/40 dark:text-white/30 italic">
            PREMIUM CONTENT
          </div>
          <span className="flex items-center gap-2 px-3 py-1 bg-ink-black/5 dark:bg-white/5 border border-ink-black/20 dark:border-white/20 rounded-none text-[10px] font-black text-ink-black dark:text-white uppercase tracking-widest text-xs">
            <Lock className="w-3 h-3" />
            {t.premiumBadge}
          </span>
        </div>
        <h3 className="text-4xl md:text-7xl font-serif font-black italic leading-[0.9] text-ink-black dark:text-white">
          {t.unlockDetailedReport}
        </h3>
      </div>
      

      <div className="flex flex-col items-center gap-12">
        <p className="text-ink-black/55 dark:text-white/40 font-serif italic text-2xl text-center max-w-xl animate-fade-in">
          {isCheckingPayment 
            ? (lang === "ko" 
                ? "결제가 완료된 후, 잠시만 기다려 주시면 자동으로 리포트가 생성됩니다. (결제 완료 후 이 창으로 돌아와 주세요)" 
                : "After payment, the report will be generated automatically. (Please return to this window after payment)")
            : t.simpleLockNote}
        </p>
        {isPremiumUser ? (
          <button
            onClick={onUpgrade}
            className="holo-button px-20 py-6 bg-ink-black text-white dark:bg-transparent dark:text-white/95 text-[12px] font-black uppercase tracking-[0.5em] transition-all flex items-center gap-4 animate-fade-in"
          >
            <RotateCcw className="w-4 h-4" />
            {lang === "ko" ? "심층 분석 내용 보기" : "View Detailed Analysis"}
          </button>
        ) : (
          <div className="flex flex-col items-center gap-4 animate-fade-in">
            <button
              onClick={handlePayment}
              className="holo-button px-20 py-6 bg-ink-black text-white dark:bg-transparent dark:text-white/95 text-[12px] font-black uppercase tracking-[0.5em] transition-all flex items-center gap-4"
            >
              {isCheckingPayment && (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              )}
              {isCheckingPayment 
                ? (lang === "ko" ? "결제 확인 중..." : "Verifying Payment...")
                : t.unlockButton}
            </button>
            
            {isCheckingPayment && (
              <div className="flex flex-col items-center gap-4 mt-4">
                <button 
                  onClick={handleManualCheck}
                  className="text-[10px] text-ink-black/45 dark:text-white/40 uppercase tracking-widest hover:text-ink-black dark:hover:text-white transition-colors underline underline-offset-4"
                >
                  {lang === "ko" ? "결제 완료 후 클릭 (수동 확인)" : "Click after payment (Manual check)"}
                </button>
                <button 
                  onClick={handlePayment}
                  className="text-[10px] text-ink-black/30 dark:text-white/20 uppercase tracking-[0.2em] hover:text-ink-black dark:hover:text-white transition-colors"
                >
                  {lang === "ko" ? "결제창이 열리지 않았나요? 결제 다시 시도" : "Popup didn't open? Try again"}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
}
