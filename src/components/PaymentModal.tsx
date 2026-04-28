import React from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, ExternalLink } from "lucide-react";
import { Language } from "../lib/translations";

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang: Language;
}

export default function PaymentModal({ isOpen, onClose, lang }: PaymentModalProps) {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/95 backdrop-blur-2xl">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="w-full max-w-2xl bg-black border border-white/20 rounded-none overflow-hidden shadow-2xl relative dragon-pattern"
        >
          <div className="p-6 border-b border-white/10 flex justify-between items-center bg-white/[0.02]">
            <span className="text-[10px] font-black uppercase tracking-[0.5em] text-white/30 italic">Secure Payment Terminal</span>
            <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-all group">
              <X className="w-5 h-5 text-white/40 group-hover:text-white" />
            </button>
          </div>
          
          <div className="py-24 px-12 flex flex-col items-center justify-center text-center backdrop-blur-sm">
            <div className="w-24 h-24 bg-white p-5 rounded-none flex items-center justify-center mb-12 shadow-2xl border border-white/20">
              <img src="https://polar.sh/favicon.ico" alt="Polar" className="w-full h-full grayscale" />
            </div>
            <h3 className="text-4xl md:text-6xl font-serif font-black italic mb-6 text-white leading-none">
              {lang === 'ko' ? "Annual Lifestyle Report" : "Annual Lifestyle Report"}
            </h3>
            <p className="text-white/40 font-sans tracking-tight mb-4 max-w-md text-lg leading-relaxed">
              {lang === 'ko' 
                ? "개인적인 성찰과 생활 패턴 분석을 위한 1회용 디지털 리포트입니다. (990원)" 
                : "A one-time digital report providing general lifestyle insights for self-reflection. (990 KRW)"}
            </p>
            <p className="text-white/20 text-[11px] mb-12 max-w-md leading-relaxed">
              {lang === 'ko'
                ? "본 서비스는 전문적, 재정적 또는 예측적 조언을 제공하지 않으며, 디지털 콘텐츠 특성상 결제 후 환불이 불가능합니다."
                : "This service does not provide professional or predictive advice. Due to the nature of digital content, all sales are final."}
            </p>
            <a 
              href="https://buy.polar.sh/polar_cl_ypvnbPpvJaL5lsVY8n3UWuXLzMTVlnZDS82YE1HPBMN" 
              target="_blank" 
              rel="noopener noreferrer"
              referrerPolicy="no-referrer"
              className="holo-button px-16 py-7 bg-white text-black font-black text-[12px] uppercase tracking-[0.6em] transition-all flex items-center gap-6 shadow-2xl"
            >
              Polar {lang === 'ko' ? "입장" : "Enter"}
              <ExternalLink className="w-5 h-5" />
            </a>
          </div>
          
          <div className="p-10 bg-white/[0.05] text-center border-t border-white/10">
            <p className="text-white/30 text-[10px] font-sans font-black uppercase tracking-[0.3em] italic">
              {lang === 'ko' ? "결제 완료 후 이 창을 닫으면 정밀 분석이 시작되네." : "Close this terminal after payment to begin analysis."}
            </p>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
