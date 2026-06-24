import React from "react";
import Illustration from "./Illustration";
import { ReportResult } from "../services/geminiService";
import { Language } from "../lib/translations";

interface ReportHeaderProps {
  t: any;
  report: ReportResult;
  lang: Language;
  userData: any;
  manseRyeok: any;
}

export default function ReportHeader({ t, report, lang, userData, manseRyeok }: ReportHeaderProps) {
  console.log(JSON.stringify(manseRyeok), ':???manseRyeok')
  const quotesKo = [
    "쯧. 네 속이 훤히 보이는구나.",
    "어허. 마음이 먼저 달려갔구나.",
    "거 보아라. 될 일은 결국 되게 되어 있단다.",
    "에잉. 쓸데없는 걱정은 거두거라.",
    "정신 차리거라. 아직 끝난 판도 아니다."
  ];

  const quotesEn = [
    "Tsk. At it again, I see.",
    "Aha. Your mind ran ahead of you.",
    "See? What's meant to be will eventually happen.",
    "Hmph. Put away your useless worries.",
    "Snap out of it. It's not over yet."
  ];

  const hashInt = React.useMemo(() => {
    const baseStr = userData?.birthDate || "";
    let val = 0;
    for (let i = 0; i < baseStr.length; i++) {
      val += baseStr.charCodeAt(i);
    }
    return val;
  }, [userData?.birthDate]);

  const quote = React.useMemo(() => {
    const list = lang === "ko" ? quotesKo : quotesEn;
    return list[hashInt % list.length];
  }, [lang, hashInt]);

  const titleContent = React.useMemo(() => {
    if (lang === "ko") {
      return (
        <>
          할멈의 <span className="mythic-gradient-text">조언</span>
        </>
      );
    } else {
      const parts = t.yourLifestyleReport.split("Report");
      return (
        <>
          {parts[0]} <span className="mythic-gradient-text">Report</span> <br />
          {parts[1]}
        </>
      );
    }
  }, [lang, t.yourLifestyleReport]);

  return (
    <header className="pt-20 pb-16 md:pt-32 md:pb-24 flex flex-col items-center md:items-start md:flex-row justify-between border-b border-ink-black/10 dark:border-white/10 mb-16 relative z-10">
      <div className="max-w-3xl mb-12 md:mb-0 w-full">
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-serif font-black italic tracking-tighter text-ink-black dark:text-white leading-[0.9] md:leading-[0.8] mb-4 text-left">
          {titleContent}
        </h1>
        <p className="mt-5 text-sm font-sans font-medium text-ink-black/45 dark:text-white/35 mb-8 text-left tracking-wide block">
          {quote}
        </p>
        <p className="text-lg md:text-3xl font-serif text-ink-black/55 dark:text-white/40 italic leading-relaxed md:leading-snug max-w-2xl text-left">
          "{report?.summary}"
        </p>

        <div className="mt-12 md:mt-16 flex flex-wrap gap-x-8 gap-y-4">
          {[
            { label: lang === "ko" ? "COLOR" : "COLOR", value: report?.luckInfo?.color || "" },
            { label: lang === "ko" ? "ITEM" : "ITEM", value: report?.luckInfo?.item || "" },
            { label: lang === "ko" ? "FOOD" : "FOOD", value: report?.luckInfo?.food || "" },
          ].map((luck, i) => (
            <div key={i} className="flex flex-col gap-1 sm:gap-2">
              <span className="text-[9px] sm:text-[10px] font-sans font-black uppercase tracking-[0.4em] text-ink-black/40 dark:text-white/30">
                {luck.label}
              </span>
              <span className="text-lg sm:text-xl font-serif italic text-ink-black dark:text-white">
                {luck.value}
              </span>
            </div>
          ))}
        </div>
      </div>
      
      <div className="text-center md:text-right flex flex-col justify-end items-center md:items-end w-full md:w-auto">
        <div className="mb-6 md:mb-8 p-1.5 border border-ink-black/5 dark:border-white/5 rounded-2xl bg-ink-black/[0.02] dark:bg-white/[0.02] zodiac-container">
          <Illustration zodiac={manseRyeok?.zodiac !== undefined ? manseRyeok.zodiac : report?.zodiac} />
        </div>
        <div className="text-[9px] sm:text-[10px] font-sans font-bold tracking-[0.5em] text-ink-black/20 dark:text-white/20 uppercase mb-3 md:mb-4">
          {lang === "ko" ? "사주 대상자" : "Saju Subject"}
        </div>
        <div className="text-2xl md:text-xl font-serif font-black text-ink-black dark:text-white italic">
          {userData?.birthDate || ""} {userData?.isLunar ? '🌙 ': '🌞'}
        </div>
        <p className="text-base sm:text-xl text-ink-black/30 dark:text-white/20 italic mt-3 md:mt-4">
          {userData?.gender === "male" ? (lang === "ko" ? "남성" : "Male") : (lang === "ko" ? "여성" : "Female")}
        </p>
      </div>
    </header>
  );
}
