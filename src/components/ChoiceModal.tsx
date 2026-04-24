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
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="w-full max-w-md bg-black border border-white/20 rounded-none overflow-hidden shadow-2xl relative dragon-pattern"
        >
          <div className="p-12 text-center">
            <h2 className="text-4xl md:text-5xl font-serif font-black italic text-white mb-6 leading-none">{t.chooseLevel}</h2>
            <div className="text-[10px] uppercase font-sans font-black tracking-[0.5em] mythic-gradient-text mb-12 italic">
              {lang === 'ko' ? "명운의 깊이를 얼마나 알고 싶으신가?" : "How deep do you wish to see your destiny?"}
            </div>

            <div className="flex flex-col gap-6">
              <button
                onClick={() => onChoose('simple')}
                className="w-full py-7 bg-white/5 border border-white/10 text-white font-sans font-black text-[10px] uppercase tracking-[0.4em] transition-all hover:bg-white/10 flex items-center justify-center gap-4"
              >
                <Zap className="w-4 h-4 text-white/40" />
                {t.levelSimple}
              </button>

              <button
                onClick={() => onChoose('detailed')}
                className="holo-button w-full py-7 bg-black text-white font-sans font-black text-[10px] uppercase tracking-[0.4em] transition-all flex items-center justify-center gap-4 shadow-xl"
              >
                <Sparkles className="w-4 h-4" />
                {t.levelDetailed}
              </button>
            </div>
            
            <button 
              onClick={onClose}
              className="mt-12 text-[10px] text-white/20 uppercase tracking-[0.4em] font-sans font-black hover:text-white transition-all italic border-b border-white/10 pb-1"
            >
              {t.cancel}
            </button>
          </div>

          <div className="absolute top-0 right-0 p-6">
            <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full transition-all group">
              <X className="w-5 h-5 text-white/20 group-hover:text-white transition-all" />
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
