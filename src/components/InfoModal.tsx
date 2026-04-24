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
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 1.05, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 1.05, y: 10 }}
          className="w-full max-w-2xl bg-black border border-white/20 rounded-none overflow-hidden shadow-[0_0_100px_rgba(255,255,255,0.05)] dragon-pattern relative"
        >
          <div className="p-10 border-b border-white/10 flex justify-between items-center bg-white/[0.02] relative z-10">
            <div className="flex items-center gap-6">
              <div className="w-12 h-12 bg-white flex items-center justify-center text-black">
                <Info className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-3xl font-serif font-black italic text-white tracking-tight">{t.infoTitle}</h2>
                <p className="text-[10px] text-white/30 tracking-[0.6em] uppercase font-sans font-black mt-1">About Yongshin Halmom</p>
              </div>
            </div>
            <button onClick={onClose} className="p-3 hover:bg-white/10 transition-all border border-white/10">
              <X className="w-6 h-6 text-white" />
            </button>
          </div>

          <div className="p-10 md:p-14 space-y-12 max-h-[70vh] overflow-y-auto no-scrollbar relative z-10">
            <div className="space-y-6">
              <p className="text-xl text-white/70 font-serif italic leading-relaxed">
                {t.appIntro}
              </p>
            </div>

            <div className="space-y-8">
              <div className="flex items-center gap-4">
                <GraduationCap className="w-6 h-6 text-white/40" />
                <h3 className="text-2xl font-serif font-black italic text-white tracking-widest">{t.calcStandards}</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[t.standard1, t.standard2, t.standard3, t.standard4].map((standard, i) => (
                  <div key={i} className="p-8 bg-white/[0.03] border border-white/10 flex flex-col justify-center">
                    <p className="text-sm text-white/50 font-sans leading-relaxed tracking-tight">
                      {standard}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-10 border-t border-white/10">
              <div className="flex flex-col md:flex-row items-center justify-between gap-8">
                <div className="flex items-center gap-5">
                  <AlertCircle className="w-5 h-5 text-white/20 animate-pulse" />
                  <p className="text-[11px] text-white/30 font-sans font-bold uppercase tracking-widest leading-loose">
                    {t.diffInfo}
                  </p>
                </div>
                <button
                  onClick={onOpenReport}
                  className="w-full md:w-auto px-10 py-5 bg-white text-black font-sans font-black text-[11px] uppercase tracking-[0.4em] transition-all hover:scale-105 active:scale-95"
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
