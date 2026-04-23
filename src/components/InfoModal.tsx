import { motion, AnimatePresence } from "motion/react";
import { X, Info, GraduationCap, MapPin, Clock, AlertCircle } from "lucide-react";
import { Language, translations } from "../lib/translations";

interface InfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenReport: () => void;
  lang: Language;
}

export default function InfoModal({ isOpen, onClose, onOpenReport, lang }: InfoModalProps) {
  const t = translations[lang];
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="w-full max-w-2xl bg-[#111] border border-white/10 rounded-[40px] overflow-hidden shadow-2xl"
        >
          <div className="p-8 border-b border-white/5 flex justify-between items-center bg-white/[0.02]">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-mythic-gold/10 rounded-full flex items-center justify-center">
                <Info className="w-5 h-5 text-mythic-gold" />
              </div>
              <div>
                <h2 className="text-2xl font-serif font-black italic text-white">{t.infoTitle}</h2>
                <p className="text-[10px] text-white/30 tracking-widest uppercase font-sans font-bold">About Yongshin Halmom</p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full transition-all">
              <X className="w-6 h-6 text-white/40" />
            </button>
          </div>

          <div className="p-8 md:p-12 space-y-10 max-h-[500px] overflow-y-auto no-scrollbar">
            <div className="space-y-6">
              <p className="text-white/60 font-sans leading-relaxed tracking-tight">
                {t.appIntro}
              </p>
            </div>

            <div className="space-y-8">
              <div className="flex items-center gap-3">
                <GraduationCap className="w-5 h-5 text-mythic-red" />
                <h3 className="text-lg font-serif font-black italic text-white">{t.calcStandards}</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[t.standard1, t.standard2, t.standard3, t.standard4].map((standard, i) => (
                  <div key={i} className="p-6 bg-white/[0.03] border border-white/5 rounded-3xl">
                    <p className="text-sm text-white/50 font-sans leading-relaxed">
                      {standard}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-8 border-t border-white/5">
              <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                  <AlertCircle className="w-5 h-5 text-mythic-gold animate-pulse" />
                  <p className="text-xs text-white/40 font-sans font-medium tracking-tight">
                    {t.diffInfo}
                  </p>
                </div>
                <button
                  onClick={onOpenReport}
                  className="px-6 py-3 bg-white/5 border border-white/10 text-white/60 font-sans font-black text-[10px] uppercase tracking-widest transition-all hover:bg-mythic-red hover:text-white hover:border-mythic-red rounded-full"
                >
                  {t.reportBtn}
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
