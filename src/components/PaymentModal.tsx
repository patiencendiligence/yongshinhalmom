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
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 50 }}
          className="w-full max-w-2xl bg-white border border-white/20 rounded-[30px] overflow-hidden shadow-2xl relative"
        >
          <div className="p-4 bg-gray-50 border-b flex justify-between items-center">
            <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Payment Process</span>
            <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full transition-all">
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>
          
          <div className="h-[400px] w-full bg-white flex flex-col items-center justify-center p-12 text-center">
            <div className="w-24 h-24 bg-white rounded-3xl flex items-center justify-center mb-8 shadow-2xl border border-gray-100">
              <img src="https://polar.sh/favicon.ico" alt="Polar" className="w-12 h-12" />
            </div>
            <h3 className="text-3xl font-serif font-black italic mb-4 text-black">
              {lang === 'ko' ? "심층 리포트 (990원) 구매" : "Buy Full Report (990 KRW)"}
            </h3>
            <p className="text-gray-500 font-sans tracking-tight mb-8 max-w-sm">
              {lang === 'ko' ? "Polar를 통해 안전하게 결제하고 나만의 라이프스타일 분석 리포트 전체를 확인해보세요." : "Securely pay via Polar and unlock your full lifestyle analysis report."}
            </p>
            <a 
              href="https://buy.polar.sh/polar_cl_jVS8higVh9RXkUM8rPOZAzD2ijTajsWPMLWID1cUGuy" 
              target="_blank" 
              rel="noopener noreferrer"
              referrerPolicy="no-referrer"
              className="px-12 py-6 bg-black text-white font-black text-sm uppercase tracking-[0.3em] rounded-full hover:bg-gray-800 transition-all flex items-center gap-4 shadow-xl"
            >
              Polar {lang === 'ko' ? "방문하기" : "Visit"}
              <ExternalLink className="w-5 h-5" />
            </a>
          </div>
          
          <div className="p-8 bg-black text-center">
            <p className="text-white/60 text-xs font-serif italic mb-2">
              {lang === 'ko' ? "결제 후 창을 닫으면 정밀 분석 결과가 표시됩니다." : "Close the window after payment to see precision results."}
            </p>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
