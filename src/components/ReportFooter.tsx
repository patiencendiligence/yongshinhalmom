import React from "react";
import { Link } from "react-router-dom";
import { RotateCcw } from "lucide-react";
import { Language, TranslationDictionary } from "../lib/translations";

interface ReportFooterProps {
  lang: Language;
  t: TranslationDictionary;
  onReset: () => void;
}

export const ReportFooter: React.FC<ReportFooterProps> = ({ lang, t, onReset }) => {
  return (
    <>
      {/* Feedback & Inquiries Footer Label */}
      <div className="mt-8 text-center opacity-40 hover:opacity-100 transition-opacity duration-300 relative z-10 hide-in-pdf flex flex-col items-center gap-2">
        <p className="text-[10px] font-sans font-bold tracking-[0.2em] uppercase">
          {lang === "ko" ? "오류 제보 및 문의" : "Bug Reports & Inquiries"}
        </p>
        <div className="flex flex-wrap justify-center items-center gap-x-4 gap-y-1 text-xs">
          <a
            href="mailto:yongshinhalmom@gmail.com"
            className="font-serif italic hover:text-purple-600 dark:hover:text-holo-cyan transition-all underline"
          >
            yongshinhalmom@gmail.com
          </a>
          <span className="opacity-40">|</span>
          <a
            href="https://www.instagram.com/yongshinhalmom.saju"
            target="_blank"
            rel="noopener noreferrer"
            className="font-serif italic hover:text-purple-600 dark:hover:text-holo-cyan transition-all underline"
          >
            Instagram: @yongshinhalmom.saju
          </a>
        </div>
      </div>

      {/* Multi-language Navigation Sitemap Footer */}
      <footer className="mt-32 pt-20 border-t border-ink-black/5 dark:border-white/5 flex flex-col md:flex-row justify-between items-center gap-8 opacity-40 relative z-10 hide-in-pdf text-ink-black dark:text-white">
        <div className="flex flex-col items-center md:items-start gap-4">
          <div className="text-3xl font-serif font-black italic text-ink-black/60 dark:text-white/60 mb-2">
            {t.title}
          </div>
          <div className="text-[10px] uppercase tracking-[0.4em] mb-4 text-ink-black/40 dark:text-white/40">
            {t.grandmother}
          </div>
          <div className="flex items-center gap-8">
            <button
              type="button"
              onClick={onReset}
              className="text-[10px] font-sans font-black uppercase tracking-[0.5em] text-ink-black dark:text-white hover:text-purple-600 dark:hover:text-holo-cyan transition-all flex items-center gap-4 group cursor-pointer"
            >
              <RotateCcw className="w-4 h-4 group-hover:rotate-180 transition-transform duration-500" />
              {t.backToHome}
            </button>
            <Link
              to="/policies"
              className="text-[10px] font-sans font-black uppercase tracking-[0.5em] text-ink-black dark:text-white hover:text-purple-600 dark:hover:text-holo-cyan transition-all"
            >
              {t.policy}
            </Link>
          </div>
        </div>
        <div className="text-[10px] font-sans font-bold tracking-[0.2em] uppercase text-ink-black/40 dark:text-white/40">
          © 2026 Yongshinhalmom. LIFESTYLE ANALYSIS REPORT.
        </div>
      </footer>
    </>
  );
};
