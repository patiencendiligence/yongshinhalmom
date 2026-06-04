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
}

export default function PremiumLockBox({
  t,
  lang,
  isCheckingPayment,
  isPremiumUser,
  handlePayment,
  onUpgrade,
  handleManualCheck,
}: PremiumLockBoxProps) {
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
        <h3 className="text-5xl md:text-7xl font-serif font-black italic leading-[0.9] text-ink-black dark:text-white">
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
