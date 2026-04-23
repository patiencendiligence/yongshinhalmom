import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Send, AlertCircle, Loader2, CheckCircle2 } from "lucide-react";
import { Language, translations } from "../lib/translations";
import axios from "axios";

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang: Language;
  userData: any;
}

export default function ReportModal({ isOpen, onClose, lang, userData }: ReportModalProps) {
  const t = translations[lang];
  const [content, setContent] = useState("");
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (content.length < 15) {
      alert(t.minCharsError);
      return;
    }

    setStatus("submitting");
    try {
      await axios.post("/api/report-issue", {
        content,
        userData,
        lang,
      });
      setStatus("success");
      setTimeout(() => {
        onClose();
        setStatus("idle");
        setContent("");
      }, 3000);
    } catch (error: any) {
      console.error(error);
      setStatus("error");
      setErrorMessage(error.response?.data?.error || t.reportError);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/90 backdrop-blur-xl">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="w-full max-w-lg bg-[#151515] border border-white/10 rounded-[40px] overflow-hidden shadow-2xl"
        >
          <div className="p-8 border-b border-white/5 flex justify-between items-center bg-white/[0.02]">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-mythic-red/10 rounded-full flex items-center justify-center">
                <AlertCircle className="w-5 h-5 text-mythic-red" />
              </div>
              <h2 className="text-2xl font-serif font-black italic text-white">{t.reportTitle}</h2>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full transition-all">
              <X className="w-6 h-6 text-white/40" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-8 space-y-8">
            {status === "success" ? (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="py-12 flex flex-col items-center text-center gap-6"
              >
                <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center">
                  <CheckCircle2 className="w-8 h-8 text-green-500" />
                </div>
                <p className="text-white font-serif italic text-lg">{t.reportSuccess}</p>
              </motion.div>
            ) : (
              <>
                <div className="space-y-4">
                  <label className="text-[10px] uppercase tracking-widest text-white/40 font-bold">{t.reportLabel}</label>
                  <textarea
                    required
                    placeholder={t.reportPlaceholder}
                    className="w-full min-h-[200px] bg-white/[0.03] border border-white/5 rounded-3xl p-6 outline-none focus:border-mythic-gold transition-all font-sans text-sm text-white resize-none"
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                  />
                  <div className="flex justify-end">
                    <span className={`text-[10px] font-bold ${content.length < 15 ? 'text-mythic-red/60' : 'text-green-500/60'}`}>
                      {content.length} / 15+
                    </span>
                  </div>
                </div>

                {status === "error" && (
                  <div className="p-4 bg-mythic-red/10 border border-mythic-red/20 rounded-2xl">
                    <p className="text-xs text-mythic-red font-medium">{errorMessage}</p>
                  </div>
                )}

                <div className="flex gap-4">
                  <button
                    type="button"
                    onClick={onClose}
                    className="flex-1 py-5 border border-white/5 bg-white/5 text-white/40 font-sans font-black text-[10px] uppercase tracking-widest transition-all hover:bg-white/10 hover:text-white rounded-2xl"
                  >
                    {t.cancel}
                  </button>
                  <button
                    type="submit"
                    disabled={status === "submitting" || content.length < 15}
                    className="flex-1 py-5 bg-mythic-gold text-black font-sans font-black text-[10px] uppercase tracking-widest transition-all hover:scale-105 active:scale-95 disabled:opacity-30 disabled:scale-100 rounded-2xl flex items-center justify-center gap-3"
                  >
                    {status === "submitting" ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                    {t.submit}
                  </button>
                </div>
              </>
            )}
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
