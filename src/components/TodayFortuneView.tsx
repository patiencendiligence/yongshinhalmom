import React from "react";
import { Share2 } from "lucide-react";
import { Language, TranslationDictionary } from "../lib/translations";

interface TodayFortuneViewProps {
  lang: Language;
  t: TranslationDictionary;
  userData: any;
  safeManseRyeok: { full: string };
  isRefreshingDaily: boolean;
  parsedFortune: {
    flow?: string;
    watchOut?: string;
    goodEnergy?: string;
    wealth?: string;
    love?: string;
    lotto?: string;
    score?: number | string;
    evaluation?: string;
    sajuTag?: string;
  };
  activeLuckInfo?: { color?: string; item?: string; food?: string };
  setViewMode: (mode: "today" | "full") => void;
  handleShareSaju: () => void;
  onReset: () => void;
}

export const TodayFortuneView: React.FC<TodayFortuneViewProps> = ({
  lang,
  t,
  userData,
  safeManseRyeok,
  isRefreshingDaily,
  parsedFortune,
  activeLuckInfo,
  setViewMode,
  handleShareSaju,
  onReset,
}) => {
  const cards = [
    { 
      title: t.todayFlow || "오늘의 전반적인 흐름", 
      content: parsedFortune.flow, 
      colorClass: "border-ink-black/10 hover:border-ink-black/30 dark:border-white/10 dark:hover:border-white/30",
      badges: (
        <div className="flex flex-wrap gap-2 mt-2">
          <span className="inline-block px-2 py-0.5 text-[11px] font-sans font-black bg-ink-black/5 dark:bg-white/5 text-ink-black/80 dark:text-white/80 border border-ink-black/10 dark:border-white/10 uppercase tracking-widest rounded-sm">
            {parsedFortune.score}점 • {parsedFortune.evaluation}
          </span>
          {parsedFortune.sajuTag && (
            <span className="inline-block px-2 py-0.5 text-[11px] font-sans font-black bg-purple-600/10 text-purple-600 dark:text-holo-cyan dark:bg-holo-cyan/10 border border-purple-500/20 dark:border-holo-cyan/20 uppercase tracking-widest rounded-sm">
              {parsedFortune.sajuTag}
            </span>
          )}
        </div>
      )
    },
    { title: t.todayPrecautions || "오늘 조심할 것", content: parsedFortune.watchOut, colorClass: "border-mythic-red/20 hover:border-mythic-red/40 dark:border-mythic-red/20 dark:hover:border-mythic-red/40", titleStyle: "text-mythic-red dark:text-mythic-red" },
    { title: t.todayEnergies || "오늘 좋은 기운", content: parsedFortune.goodEnergy, colorClass: "border-purple-500/20 hover:border-purple-500/40 dark:border-holo-cyan/20 dark:hover:border-holo-cyan/40", titleStyle: "text-purple-600 dark:text-holo-cyan" },
    { title: t.todaySuccessWealth || "오늘의 성공운/재물운", content: parsedFortune.wealth, colorClass: "border-ink-black/10 hover:border-ink-black/30 dark:border-white/10 dark:hover:border-white/30" },
    { title: t.todayLove || "오늘의 애정운", content: parsedFortune.love, colorClass: "border-pink-500/10 hover:border-pink-500/30 dark:border-pink-500/15 dark:hover:border-pink-500/35", titleStyle: "text-pink-600 dark:text-pink-400" },
    { title: t.todayLotto || "오늘의 로또운", content: parsedFortune.lotto, colorClass: "border-emerald-500/10 hover:border-emerald-500/30 dark:border-emerald-500/15 dark:hover:border-emerald-500/35", titleStyle: "text-emerald-600 dark:text-emerald-400" },
  ].filter(item => item.content && item.content.trim() !== "");

  return (
    <div className="max-w-4xl mx-auto px-4 pb-32 relative dragon-pattern min-h-screen text-ink-black dark:text-white pt-24">
      {/* Header */}
      <div className="text-center mb-16 relative z-10">
        <div className="text-[10px] uppercase font-sans font-black tracking-[0.6em] text-purple-600 dark:text-holo-cyan mb-4">
          {t.todayFortuneTitle}
        </div>
        <div className="yongshin-circle mx-auto mb-10"></div>
        <h1 className="text-4xl md:text-7xl font-serif font-black italic tracking-tight text-ink-black dark:text-white leading-tight">
          {lang === "ko" ? "오늘의 운세" : "Today's Fortune"}
        </h1>
        <p className="text-sm text-ink-black/40 dark:text-white/30 italic mt-3 font-sans">
          {userData?.birthDate || ""} ({userData?.isLunar ? t.lunar : t.solar}) • {safeManseRyeok.full}
        </p>
      </div>

      {/* Cards or Loading Skeleton */}
      {isRefreshingDaily ? (
        <div className="space-y-6 mb-12 relative z-10">
          {[1, 2, 3].map((_, i) => (
            <div key={i} className="p-6 md:p-8 bg-white/20 dark:bg-black/10 border border-ink-black/5 dark:border-white/5 animate-pulse flex flex-col md:flex-row gap-6 items-start rounded-lg shadow-sm">
              <div className="md:w-1/4 shrink-0 space-y-3">
                <div className="h-6 bg-ink-black/10 dark:bg-white/10 rounded w-1/2" />
                <div className="h-4 bg-ink-black/10 dark:bg-white/10 rounded w-3/4" />
              </div>
              <div className="flex-1 space-y-3 w-full">
                <div className="h-4 bg-ink-black/10 dark:bg-white/10 rounded w-full" />
                <div className="h-4 bg-ink-black/10 dark:bg-white/10 rounded w-5/6" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-6 mb-12 relative z-10">
          {cards.map((item, i) => (
            <div 
              key={i} 
              className={`p-4 md:p-6 bg-white/40 dark:bg-black/30 border ${item.colorClass} backdrop-blur-sm transition-all duration-300 flex flex-col md:flex-row gap-6 items-start`}
            >
              <div className="md:w-1/4 shrink-0 flex flex-col items-start gap-1">
                <span className={`text-xl font-serif font-black italic ${item.titleStyle || "text-ink-black dark:text-white"}`}>
                  {item.title}
                </span>
                {"badges" in item ? item.badges : null}
              </div>
              <div className="flex-1 text-base md:text-lg text-ink-black/75 dark:text-white/80 leading-relaxed font-sans whitespace-pre-line">
                {item.content}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Lucky Info Row */}
      <div className="grid grid-cols-3 gap-4 md:gap-6 mb-16 relative z-10">
        {[
          { label: t.luckyColor || "행운 색상", value: activeLuckInfo?.color || "-" },
          { label: t.luckyItem || "행운 아이템", value: activeLuckInfo?.item || "-" },
          { label: t.luckyFood || "행운 음식", value: activeLuckInfo?.food || "-" }
        ].map((item, idx) => (
          <div key={idx} className="p-6 md:p-8 bg-white/40 dark:bg-black/20 border border-ink-black/10 dark:border-white/5 backdrop-blur-sm flex flex-col gap-2 text-center text-ink-black dark:text-white">
            <span className="text-[9px] font-sans font-black uppercase tracking-[0.3em] text-ink-black/40 dark:text-white/30">
              {item.label}
            </span>
            <span className="text-base md:text-xl font-serif italic text-ink-black dark:text-white font-medium">
              {item.value}
            </span>
          </div>
        ))}
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col items-center gap-8 relative z-10 hide-in-pdf">
        <div className="flex flex-col sm:flex-row items-start gap-4">
          <button
            type="button"
            onClick={() => setViewMode("full")}
            className="holo-button group flex items-center gap-6 px-16 py-7 bg-ink-black text-white dark:bg-white dark:text-black font-sans font-black text-[12px] uppercase tracking-[0.5em] shadow-xl dark:shadow-2xl hover:scale-102 transition-all cursor-pointer w-full sm:w-auto"
          >
            {t.expandFullReport || "전체 리포트 보기"}
          </button>
          <button
            type="button"
            onClick={handleShareSaju}
            className="group flex items-center gap-6 px-16 py-7 bg-ink-black/5 dark:bg-white/5 border border-ink-black/10 dark:border-white/10 rounded-none hover:bg-ink-black/10 dark:hover:bg-white/10 transition-all backdrop-blur-md font-sans font-black text-[12px] uppercase tracking-[0.6em] shadow-xl dark:shadow-2xl cursor-pointer w-full sm:w-auto"
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
