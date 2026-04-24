import React from "react";
import { motion, AnimatePresence } from "motion/react";
import { Sparkles, Zap, X } from "lucide-react";
import { Language, translations } from "../lib/translations";

interface ChoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onChoose: (level: 'simple' | 'detailed') => void;
  lang: Language;
}

export default function ChoiceModal({ isOpen, onClose, onChoose, lang }: ChoiceModalProps) {
  const t = translations[lang] as any;
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/90 backdrop-blur-xl">
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="w-full max-w-md bg-[#0a0a0a] border border-white/10 rounded-[40px] overflow-hidden shadow-2xl relative"
        >
          <div className="p-10 text-center">
            <h2 className="text-3xl font-serif font-black italic text-white mb-4">{t.chooseLevel}</h2>
            <p className="text-white/40 text-sm mb-12 font-sans tracking-tight">
              {lang === 'ko' ? "명운의 깊이를 얼마나 알고 싶으신가?" : "How deep do you wish to see your destiny?"}
            </p>

            <div className="flex flex-col gap-4">
              <button
                onClick={() => onChoose('simple')}
                className="w-full py-6 bg-white/5 border border-white/10 text-white font-sans font-black text-[10px] uppercase tracking-[0.3em] rounded-2xl hover:bg-white/10 transition-all flex items-center justify-center gap-3"
              >
                <Zap className="w-4 h-4 text-white/40" />
                {t.levelSimple}
              </button>

              <button
                onClick={() => onChoose('detailed')}
                className="w-full py-6 bg-mythic-gold text-black font-sans font-black text-[10px] uppercase tracking-[0.3em] rounded-2xl hover:scale-105 transition-all flex items-center justify-center gap-3 shadow-lg shadow-mythic-gold/20"
              >
                <Sparkles className="w-4 h-4" />
                {t.levelDetailed}
              </button>
            </div>
            
            <button 
              onClick={onClose}
              className="mt-8 text-[10px] text-white/20 uppercase tracking-widest hover:text-white transition-all"
            >
              {t.cancel}
            </button>
          </div>

          <div className="absolute top-0 right-0 p-6">
            <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full transition-all">
              <X className="w-5 h-5 text-white/20" />
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
