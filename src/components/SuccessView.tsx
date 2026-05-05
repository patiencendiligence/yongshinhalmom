import React from "react";
import { motion } from "motion/react";
import { CheckCircle, XCircle } from "lucide-react";
import { Language, translations } from "../lib/translations";

interface SuccessViewProps {
  lang: Language;
}

export default function SuccessView({ lang }: SuccessViewProps) {
  const t = translations[lang];

  const handleClose = () => {
    window.close();
    // Fallback if window.close() fails (common if not opened by script)
    alert(lang === 'ko' ? "결제가 완료되었습니다. 이 창을 닫고 원래 창에서 리포트를 확인해 주세요." : "Payment confirmed! You can now close this tab and return to the main window.");
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8 text-center bg-black">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="max-w-md w-full p-12 border border-white/10 rounded-2xl bg-neutral-900 shadow-2xl"
      >
        <div className="flex justify-center mb-8 text-mythic-gold">
          <CheckCircle className="w-20 h-20" />
        </div>
        
        <h2 className="text-4xl font-serif font-black italic text-white mb-6 uppercase tracking-tighter">
          {lang === 'ko' ? "결제 완료" : "Payment Successful"}
        </h2>
        
        <p className="text-white/60 mb-12 leading-relaxed">
          {lang === 'ko' 
            ? "결제가 성공적으로 처리되었습니다. 이제 상세 분석 내용을 확인하실 수 있습니다." 
            : "Your payment has been processed successfully. You can now view your detailed report."}
          <br/>
          <span className="text-white/40 text-sm mt-4 block">
            {lang === 'ko'
              ? "(원래 리포트 창으로 돌아가시면 자동으로 업데이트됩니다)"
              : "(Return to the original report window, it will update automatically)"}
          </span>
        </p>

        <button
          onClick={handleClose}
          className="holo-button w-full py-6 bg-white text-black text-[12px] font-black uppercase tracking-[0.5em] transition-all"
        >
          {lang === 'ko' ? "이 탭 닫기" : "Close This Tab"}
        </button>
      </motion.div>
    </div>
  );
}
