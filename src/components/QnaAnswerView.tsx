import React from "react";
import { Share2 } from "lucide-react";
import { Language, TranslationDictionary } from "../lib/translations";

interface QnaAnswerViewProps {
  lang: Language;
  t: TranslationDictionary;
  userData: any;
  safeManseRyeok: { full: string };
  answerTitle: string;
  answerContent: string;
  activeLuckInfo?: { color?: string; item?: string; food?: string };
  handleShareSaju: () => void;
  onReset: () => void;
}

export const QnaAnswerView: React.FC<QnaAnswerViewProps> = ({
  lang,
  t,
  userData,
  safeManseRyeok,
  answerTitle,
  answerContent,
  activeLuckInfo,
  handleShareSaju,
  onReset,
}) => {
  return (
    <div className="max-w-3xl mx-auto px-4 pb-32 relative dragon-pattern min-h-screen text-ink-black dark:text-white pt-24 flex flex-col justify-center">
      {/* Header */}
      <div className="text-center mb-12 relative z-10">
        <div className="text-[10px] uppercase font-sans font-black tracking-[0.6em] text-purple-600 dark:text-holo-cyan mb-4">
          {lang === "ko" ? "할멈과의 1:1 문답" : "1:1 Consultation with Grandma"}
        </div>
        <h1 className="text-3xl md:text-5xl font-serif font-black italic tracking-tight text-ink-black dark:text-white leading-tight">
          {lang === "ko" ? "신묘한 문답" : "Mystical Q&A"}
        </h1>
        <p className="text-sm text-ink-black/40 dark:text-white/30 italic mt-3 font-sans">
          {userData?.birthDate || ""} ({userData?.isLunar ? t.lunar : t.solar}) • {safeManseRyeok.full}
        </p>
      </div>

      {/* User's Question Box */}
      <div className="mb-8 p-6 bg-white/20 dark:bg-black/10 border border-ink-black/5 dark:border-white/5 relative z-10 rounded-xl shadow-sm">
        <span className="text-[10px] uppercase font-sans font-black tracking-[0.2em] text-ink-black/40 dark:text-white/30 block mb-2">
          {lang === "ko" ? "자네가 물어본 질문" : "Your Burning Question"}
        </span>
        <p className="text-base font-medium font-sans leading-relaxed text-ink-black/80 dark:text-white/80">
          "{userData?.customQuestion}"
        </p>
      </div>

      {/* Halmom's Answer Box */}
      <div className="p-8 md:p-12 bg-white/45 dark:bg-black/30 border-2 border-purple-500/25 dark:border-holo-cyan/20 backdrop-blur-md transition-all duration-300 relative z-10 shadow-2xl space-y-6 rounded-none">
        <div className="flex gap-4 items-center border-b border-purple-500/10 dark:border-holo-cyan/10 pb-6">
          <div className="w-12 h-12 shrink-0 bg-purple-600 dark:bg-holo-cyan flex items-center justify-center text-white dark:text-black text-sm font-serif font-black italic rounded-full shadow-lg">
            할멈
          </div>
          <div>
            <span className="text-xl md:text-2xl font-serif font-black italic text-purple-600 dark:text-holo-cyan block">
              {answerTitle}
            </span>
            <span className="text-[9px] uppercase tracking-[0.2em] text-ink-black/45 dark:text-white/35 font-sans">
              {lang === "ko" ? "사주·오행·대운 기반 정밀 분석" : "Detailed analysis based on Saju & Elements"}
            </span>
          </div>
        </div>
        
        <div className="text-base md:text-lg text-ink-black/85 dark:text-white/90 leading-relaxed font-sans whitespace-pre-line text-left">
          {answerContent}
        </div>
      </div>

      {/* Lucky info row if available */}
      {activeLuckInfo && (activeLuckInfo.color || activeLuckInfo.item || activeLuckInfo.food) && (
        <div className="grid grid-cols-3 gap-4 md:gap-6 mt-12 mb-16 relative z-10">
          {[
            { label: t.luckyColor || "행운 색상", value: activeLuckInfo?.color || "-" },
            { label: t.luckyItem || "행운 아이템", value: activeLuckInfo?.item || "-" },
            { label: t.luckyFood || "행운 음식", value: activeLuckInfo?.food || "-" }
          ].map((item, idx) => (
            <div key={idx} className="p-4 md:p-6 bg-white/40 dark:bg-black/20 border border-ink-black/10 dark:border-white/5 backdrop-blur-sm flex flex-col gap-1 text-center text-ink-black dark:text-white">
              <span className="text-[9px] font-sans font-black uppercase tracking-[0.2em] text-ink-black/40 dark:text-white/30">
                {item.label}
              </span>
              <span className="text-sm md:text-base font-serif italic text-ink-black dark:text-white font-medium">
                {item.value}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex flex-col items-center gap-8 mt-12 relative z-10 hide-in-pdf">
        <div className="flex flex-col sm:flex-row items-center gap-4">
          <button
            type="button"
            onClick={handleShareSaju}
            className="group flex items-center gap-6 px-16 py-7 bg-ink-black text-white dark:bg-white dark:text-black hover:scale-102 transition-all font-sans font-black text-[12px] uppercase tracking-[0.6em] shadow-xl dark:shadow-2xl cursor-pointer w-full sm:w-auto"
          >
            <Share2 className="w-5 h-5 opacity-80 group-hover:opacity-100 transition-opacity" />
            {lang === "ko" ? "용신할멈 소개하기" : "Recommend Yongshin Halmom"}
          </button>
        </div>
        <button
          type="button"
          onClick={onReset}
          className="text-[10px] font-sans font-black uppercase tracking-[0.4em] text-ink-black/40 dark:text-white/40 hover:text-purple-600 dark:hover:text-holo-cyan transition-all cursor-pointer"
        >
          {t.backToHome}
        </button>
      </div>
    </div>
  );
};
