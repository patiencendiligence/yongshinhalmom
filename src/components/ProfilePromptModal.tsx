import { motion, AnimatePresence } from "motion/react";
import { Language, TranslationDictionary } from "../lib/translations";

interface ProfilePromptModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoadSaved: () => void;
  onInputNew: () => void;
  lang: Language;
  t: TranslationDictionary;
}

export default function ProfilePromptModal({
  isOpen,
  onClose,
  onLoadSaved,
  onInputNew,
  lang,
  t
}: ProfilePromptModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="w-full max-w-sm bg-[#faf8f5] dark:bg-[#0c0d12] border border-ink-black/20 dark:border-white/10 p-6 md:p-8 text-center relative overflow-hidden shadow-2xl"
          >
            {/* Decorative Corner Borders */}
            <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-ink-black/40 dark:border-white/30" />
            <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-ink-black/40 dark:border-white/30" />
            <div className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-ink-black/40 dark:border-white/30" />
            <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-ink-black/40 dark:border-white/30" />

            <h3 className="font-serif font-black italic text-lg text-ink-black dark:text-white mb-3 flex items-center justify-center gap-1.5">
              🔮 {t.loadSavedPromptTitle}
            </h3>
            
            <p className="text-xs min-[400px]:text-sm text-ink-black/70 dark:text-white/70 font-sans leading-relaxed mb-6 whitespace-pre-line">
              {t.loadSavedPromptDesc}
            </p>

            <div className="flex flex-col gap-3">
              <button
                type="button"
                onClick={onLoadSaved}
                className="w-full h-11 border border-ink-black/20 bg-[#f4f1ea] text-ink-black/90 hover:bg-[#eae7e0] dark:bg-[#14151a] dark:border-white/20 dark:text-white dark:hover:bg-white/5 font-sans font-black text-xs uppercase tracking-widest transition-all cursor-pointer"
              >
                {t.btnLoadSaved}
              </button>
              
              <button
                type="button"
                onClick={onInputNew}
                className="w-full h-11 border border-ink-black bg-ink-black text-white hover:bg-ink-black/95 dark:bg-white dark:text-black dark:hover:bg-white/95 dark:border-white font-sans font-black text-xs uppercase tracking-widest transition-all cursor-pointer"
              >
                {t.btnInputNew}
              </button>
              
              <button
                type="button"
                onClick={onClose}
                className="mt-2 text-[10px] font-sans font-bold uppercase tracking-wider text-ink-black/40 dark:text-white/40 hover:text-ink-black dark:hover:text-white transition-all underline decoration-dotted cursor-pointer"
              >
                {lang === "ko" ? "닫기" : "Close"}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
