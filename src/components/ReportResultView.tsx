import React, { useState } from "react";
import { Link } from "react-router-dom";
import { FileDown, AlertTriangle, RotateCcw, Coffee, Share2, X } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useReportResult } from "../hooks/useReportResult";
import { generateReportPdf } from "../utils/pdfGenerator";
import { ReportResult } from "../services/geminiService";
import { Language, translations } from "../lib/translations";
import ReportHeader from "./ReportHeader";
import ReportItemCard from "./ReportItemCard";
import PremiumLockBox from "./PremiumLockBox";
import PaymentModal from "./PaymentModal";

function parseDailyFortune(content: string) {
  const getBlock = (titleKeywords: string[]) => {
    const lines = content.split('\n');
    let capture = false;
    let blockLines: string[] = [];
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.startsWith('###') || trimmed.startsWith('##') || trimmed.startsWith('*') || trimmed.startsWith('**') || trimmed.startsWith('- **') || trimmed.startsWith('- ###')) {
        const isMatch = titleKeywords.some(keyword => trimmed.includes(keyword));
        if (isMatch) {
          capture = true;
          continue;
        } else if (capture) {
          break;
        }
      }
      if (capture) {
        blockLines.push(line);
      }
    }
    let cleaned = blockLines.join('\n').trim();
    if (cleaned.startsWith('-') || cleaned.startsWith('*')) {
      cleaned = cleaned.replace(/^[\s-*]+/, '').trim();
    }
    return cleaned;
  };

  let flow = getBlock(['전반적인 흐름', 'Overall Flow', '전반 적인 흐름', '오늘의 흐름']);
  let watchOut = getBlock(['조심할 것', 'Watch Out', '조심할 사항', '조심']);
  let goodEnergy = getBlock(['좋은 기운', 'Good Energies', '좋은 기운', '기운']);
  let wealth = getBlock(['성공운/재물운', '재물운', '성공운', 'Success & Wealth', 'Success and Wealth']);
  let love = getBlock(['애정운', 'Love Fortune', 'Love']);
  let lotto = getBlock(['로또운', 'Lotto Fortune', 'Lotto']);

  // Extract score, evaluation, and Saju tag from the flow header
  let score = 70;
  let evaluation = "보통";
  let sajuTag = "";

  const lines = content.split('\n');
  const flowHeaderLine = lines.find(line => {
    const l = line.trim();
    return l.startsWith('###') && (l.includes('전반적인 흐름') || l.includes('Overall Flow') || l.includes('전반 적인 흐름') || l.includes('오늘의 흐름'));
  });

  if (flowHeaderLine) {
    const strippedHeader = flowHeaderLine.replace(/^###\s*/, '').replace(/오늘의\s*전반적인\s*흐름|전반적인\s*흐름|Today's\s*Overall\s*Flow/i, '').trim();
    const match = strippedHeader.match(/(\d+)\s*[\/|:]\s*([^,\n]+)(?:,\s*([^,\n]+))?/);
    if (match) {
      score = parseInt(match[1]) || 70;
      evaluation = match[2]?.trim() || "보통";
      sajuTag = match[3]?.trim() || "";
    } else {
      const parts = strippedHeader.split('/');
      if (parts.length >= 2) {
        const parsedScore = parseInt(parts[0].replace(/[^0-9]/g, ''));
        if (!isNaN(parsedScore)) score = parsedScore;
        const subParts = parts[1].split(',');
        evaluation = subParts[0].trim();
        if (subParts.length >= 2) {
          sajuTag = subParts[1].trim();
        }
      } else {
        const numbers = strippedHeader.match(/\d+/);
        if (numbers) {
          score = parseInt(numbers[0]);
        }
        if (strippedHeader.includes('아주 좋음')) evaluation = "아주 좋음";
        else if (strippedHeader.includes('좋음')) evaluation = "좋음";
        else if (strippedHeader.includes('비교적 좋음')) evaluation = "비교적 좋음";
        else if (strippedHeader.includes('비교적 좋지 않음')) evaluation = "비교적 좋지 않음";
        else if (strippedHeader.includes('좋지 않음')) evaluation = "좋지 않음";
        else if (strippedHeader.includes('주의')) evaluation = "주의";
        
        // Find general Korean chars representing "살" or "귀인" as sajuTag
        const sajuTags = ['천을', '도화', '화개', '역마', '망신', '귀인', '연살', '겁살', '재살', '천살', '지살', '월살', '반안', '육해'];
        for (const tag of sajuTags) {
          if (strippedHeader.includes(tag)) {
            sajuTag = tag;
            break;
          }
        }
      }
    }
  }

  // Fallbacks if some sections are missing (e.g. older files)
  if (!watchOut) {
    watchOut = "지나치게 급하게 결정을 내리거나 내면의 자만을 앞세우지 않도록 경계하게나.";
  }
  if (!goodEnergy) {
    goodEnergy = "묵묵히 자기 일을 해나갈 때 예상치 못한 보상과 긍정적인 평가가 따를 기운일세.";
  }
  if (!wealth) {
    wealth = "재물 기운의 흐름이 차분한 편이니 불필요한 지출을 삼가고 자산을 굳건히 지키는 데 힘쓰게나.";
  }
  if (!love) {
    love = "주변 사람이나 소중한 인연에게 따뜻한 덕담을 먼저 건넨다면 기쁨과 애정 지수가 크게 차오를 것이야.";
  }
  if (!lotto) {
    lotto = "뜻밖의 횡재수보다는 일상 속 소소한 공덕이 자네에게 행운의 단비를 가져다줄 일진이니 성실히 임하게.";
  }

  return {
    flow: flow || "오늘의 전반적인 흐름을 살피는 중일세. 차분하고 고요한 기운이 자네를 감싸는구나.",
    watchOut,
    goodEnergy,
    wealth,
    love,
    lotto,
    score,
    evaluation,
    sajuTag
  };
}

interface ReportResultViewProps {
  report: ReportResult;
  viewMode: "today" | "full";
  setViewMode: React.Dispatch<React.SetStateAction<"today" | "full">>;
  onReset: () => void;
  onUpgrade?: () => void;
  onOpenPolicy: () => void;
  onLogin?: () => Promise<void>;
  triggerPayment: (hash: string) => void;
  userData: any;
  lang: Language;
}

export default function ReportResultView({
  report,
  viewMode,
  setViewMode,
  onReset,
  onUpgrade,
  onLogin,
  triggerPayment,
  userData,
  lang,
}: ReportResultViewProps) {
  const t = translations[lang] as any;
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [showToast, setShowToast] = useState(false);

  const getStrongestElement = (manseRyeok: any) => {
    if (!manseRyeok || !manseRyeok.pillars) {
      return { element: "화", emoji: "🔥" };
    }

    const { year = "", month = "", day = "", time = "" } = manseRyeok.pillars;
    
    const allChars = [
      year.charAt(0), year.charAt(1),
      month.charAt(0), month.charAt(1),
      day.charAt(0), day.charAt(1),
      time.charAt(0), time.charAt(1)
    ].filter(Boolean);

    const woodStems = ["甲", "乙"];
    const fireStems = ["丙", "丁"];
    const earthStems = ["戊", "己"];
    const metalStems = ["庚", "辛"];
    const waterStems = ["壬", "癸"];

    const woodBranches = ["寅", "卯"];
    const fireBranches = ["巳", "午"];
    const earthBranches = ["辰", "戌", "丑", "未"];
    const metalBranches = ["申", "酉"];
    const waterBranches = ["子", "亥"];

    let woodCount = 0;
    let fireCount = 0;
    let earthCount = 0;
    let metalCount = 0;
    let waterCount = 0;

    allChars.forEach(char => {
      if (woodStems.includes(char) || woodBranches.includes(char)) {
        woodCount++;
      } else if (fireStems.includes(char) || fireBranches.includes(char)) {
        fireCount++;
      } else if (earthStems.includes(char) || earthBranches.includes(char)) {
        earthCount++;
      } else if (metalStems.includes(char) || metalBranches.includes(char)) {
        metalCount++;
      } else if (waterStems.includes(char) || waterBranches.includes(char)) {
        waterCount++;
      }
    });

    const elements = [
      { element: "목", emoji: "🪵", count: woodCount },
      { element: "화", emoji: "🔥", count: fireCount },
      { element: "토", emoji: "⛰️", count: earthCount },
      { element: "금", emoji: "🪙", count: metalCount },
      { element: "수", emoji: "🌊", count: waterCount }
    ];

    elements.sort((a, b) => b.count - a.count);

    return {
      element: elements[0].element,
      emoji: elements[0].emoji
    };
  };

  const fallbackCopyText = (text: string) => {
    try {
      const textArea = document.createElement("textarea");
      textArea.value = text;
      textArea.style.top = "0";
      textArea.style.left = "0";
      textArea.style.position = "fixed";
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      const successful = document.execCommand("copy");
      document.body.removeChild(textArea);
      if (successful) {
        setShowToast(true);
      }
    } catch (err) {
      console.error("Fallback copy failed:", err);
    }
  };

  const handleShareSaju = () => {
    const strongest = getStrongestElement(safeManseRyeok);
    const shareUrl = window.location.origin;
    const copyText = lang === 'ko' ? `자네 아직 자기 팔자를 모르고 사는군.\n${userData.name} 는 ${strongest.element} ${strongest.emoji} 기운이 강하다네.\n생년월일만 넣어보게.이 할멈이 자네 길도 봐줌세.\n${shareUrl}` :
    `Hmm, you still don't know your own fate, do you?\n${userData.name} carries strong ${strongest.element} ${strongest.emoji} energy. Enter your birth date.\nThis old grandma shall read the path that awaits you.\n${shareUrl}`

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(copyText)
        .then(() => {
          setShowToast(true);
        })
        .catch((err) => {
          console.error("navigator.clipboard.writeText failed:", err);
          fallbackCopyText(copyText);
        });
    } else {
      fallbackCopyText(copyText);
    }
  };

  const {
    isPaymentModalOpen,
    setIsPaymentModalOpen,
    isCheckingPayment,
    isRefreshingDaily,
    isPremiumUser,
    displayDetailed,
    safeManseRyeok,
    manseRyeok,
    displaySections,
    handlePayment,
    handleManualCheck,
    swappedReport,
  } = useReportResult({
    report,
    userData,
    lang,
    onUpgrade,
    onLogin,
    triggerPayment,
  });

  const activeReport = swappedReport || report;

  const handleSavePdf = async () => {
    if (isGeneratingPdf) return;
    setIsGeneratingPdf(true);
    try {
      await generateReportPdf({
        displayDetailed,
        userData,
        translations,
        zodiacGuardians: "/assets/zodiac_guardians.png",
        lang,
      });
    } catch (error) {
      console.error("[ReportResultView] Failed to generate report PDF:", error);
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const parsedFortune = React.useMemo(() => {
    if (viewMode !== "today") return null;
    const dailySection = activeReport.sections[2] || activeReport.sections.find(s => s.title.includes("컨디션") || s.title.includes("Condition") || s.title.includes("오늘"));
    const dailyContent = dailySection ? dailySection.content : "";
    return parseDailyFortune(dailyContent);
  }, [viewMode, activeReport.sections]);

  if (viewMode === "today" && parsedFortune) {
    return (
      <div className="max-w-4xl mx-auto px-4 pb-32 relative dragon-pattern min-h-screen text-ink-black dark:text-white pt-24">
        {/* Simplified Header with User Context */}
        <div className="text-center mb-16 relative z-10">
          <div className="text-[10px] uppercase font-sans font-black tracking-[0.6em] text-mythic-gold mb-4">
            {t.todayFortuneTitle}
          </div>
          <h1 className="text-5xl md:text-7xl font-serif font-black italic tracking-tight text-ink-black dark:text-white leading-tight">
            {userData.name}{lang === "ko" ? "님의 오늘의 운세" : "'s Today's Fortune"}
          </h1>
          <p className="text-sm text-ink-black/40 dark:text-white/30 italic mt-3 font-sans">
            {userData.birthDate} ({userData.isLunar ? t.lunar : t.solar}) • {safeManseRyeok.full}
          </p>
        </div>

        {/* 6 Main Fortune Cards */}
        <div className="space-y-6 mb-12 relative z-10">
          {[
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
                    <span className="inline-block px-2 py-0.5 text-[11px] font-sans font-black bg-mythic-gold/15 text-mythic-gold dark:text-mythic-gold border border-mythic-gold/30 uppercase tracking-widest rounded-sm">
                      {parsedFortune.sajuTag}
                    </span>
                  )}
                </div>
              )
            },
            { title: t.todayPrecautions || "오늘 조심할 것", content: parsedFortune.watchOut, colorClass: "border-mythic-red/20 hover:border-mythic-red/40 dark:border-mythic-red/20 dark:hover:border-mythic-red/40", titleStyle: "text-mythic-red dark:text-mythic-red" },
            { title: t.todayEnergies || "오늘 좋은 기운", content: parsedFortune.goodEnergy, colorClass: "border-mythic-gold/20 hover:border-mythic-gold/40 dark:border-mythic-gold/20 dark:hover:border-mythic-gold/40", titleStyle: "text-mythic-gold dark:text-mythic-gold" },
            { title: t.todaySuccessWealth || "오늘의 성공운/재물운", content: parsedFortune.wealth, colorClass: "border-ink-black/10 hover:border-ink-black/30 dark:border-white/10 dark:hover:border-white/30" },
            { title: t.todayLove || "오늘의 애정운", content: parsedFortune.love, colorClass: "border-pink-500/10 hover:border-pink-500/30 dark:border-pink-500/15 dark:hover:border-pink-500/35", titleStyle: "text-pink-600 dark:text-pink-400" },
            { title: t.todayLotto || "오늘의 로또운", content: parsedFortune.lotto, colorClass: "border-emerald-500/10 hover:border-emerald-500/30 dark:border-emerald-500/15 dark:hover:border-emerald-500/35", titleStyle: "text-emerald-600 dark:text-emerald-400" },
          ].map((item, i) => (
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

        {/* Lucky info row */}
        <div className="grid grid-cols-3 gap-4 md:gap-6 mb-16 relative z-10">
          {[
            { label: t.luckyColor || "행운 색상", value: activeReport.luckInfo.color },
            { label: t.luckyItem || "행운 아이템", value: activeReport.luckInfo.item },
            { label: t.luckyFood || "행운 음식", value: activeReport.luckInfo.food }
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


        {/* Expand full report button */}
        <div className="flex flex-col items-center gap-8 relative z-10 hide-in-pdf">
          <div className="flex flex-col sm:flex-row items-start gap-4">
            <button
              onClick={() => setViewMode("full")}
              className="holo-button group flex items-center gap-6 px-16 py-7 bg-ink-black text-white dark:bg-white dark:text-black font-sans font-black text-[12px] uppercase tracking-[0.5em] shadow-xl dark:shadow-2xl hover:scale-102 transition-all cursor-pointer"
            >
              {t.expandFullReport || "전체 리포트 보기"}
            </button>
            <button
              onClick={handleShareSaju}
              className="group flex items-center gap-6 px-16 py-7 bg-ink-black/5 dark:bg-white/5 border border-ink-black/10 dark:border-white/10 rounded-none hover:bg-ink-black/10 dark:hover:bg-white/10 transition-all backdrop-blur-md font-sans font-black text-[12px] uppercase tracking-[0.6em] shadow-xl dark:shadow-2xl cursor-pointer w-full sm:w-auto"
            >
              <Share2 className="w-5 h-5 opacity-80 group-hover:opacity-100 transition-opacity" />
              {lang === "ko" ? "용신할멈 소개하기" : "Recommend Yongshin Halmom"}
            </button>
          </div>
            <button
              onClick={onReset}
              className="text-[10px] font-sans font-black uppercase tracking-[0.4em] text-ink-black/40 dark:text-white/40 hover:text-mythic-gold dark:hover:text-mythic-gold transition-all"
            >
              {t.backToHome}
            </button>

        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 pb-32 relative dragon-pattern min-h-screen text-ink-black dark:text-white">
      <div id="report-content">
        {/* Editorial Astronomic Header */}
        <ReportHeader
          t={t}
          report={activeReport}
          lang={lang}
          userData={userData}
          manseRyeok={manseRyeok}
        />

        {/* Manse-Ryeok Museum Badge */}
        <div className="mb-16 flex flex-col md:flex-row items-baseline gap-8 border-l-[1px] border-ink-black/20 dark:border-white/20 pl-8 manse-ryeok-badge">
          <div className="text-[11px] uppercase font-sans font-black tracking-[0.6em] text-ink-black/50 dark:text-white/40">
            {t.manseRyeok}
          </div>
          <div className="text-3xl md:text-5xl font-serif font-black italic text-ink-black/80 dark:text-white/80 tracking-tighter">
            {safeManseRyeok.full}
          </div>
        </div>

        {/* Structural Bento Grid Layout */}
        <div id="report-grid" className="grid grid-cols-12 gap-px bg-ink-black/10 dark:bg-white/10 mb-32 relative z-10 border border-ink-black/10 dark:border-white/10 rounded-2xl overflow-hidden shadow-xl dark:shadow-2xl">
          {displaySections
            .slice(0, displayDetailed ? undefined : 3)
            .map((section, idx) => (
              <ReportItemCard
                key={idx}
                idx={idx}
                section={section}
                isRefreshingDaily={isRefreshingDaily}
                lang={lang}
              />
            ))}

          {!displayDetailed && (
            <PremiumLockBox
              t={t}
              lang={lang}
              isCheckingPayment={isCheckingPayment}
              isPremiumUser={isPremiumUser}
              handlePayment={handlePayment}
              onUpgrade={onUpgrade}
              handleManualCheck={handleManualCheck}
            />
          )}
        </div>

        {/* Medical / Disclaimer Warning Box */}
        {activeReport.medicalAdvice && (
          <div className="mb-16 p-6 bg-white/10 dark:bg-white/5 flex flex-col md:flex-row items-center gap-12 relative z-10 border border-ink-black/10 dark:border-white/20">
            <div className="w-24 h-24 bg-ink-black dark:bg-black/40 flex-shrink-0 flex items-center justify-center text-white border border-ink-black/20 dark:border-white/20">
              <AlertTriangle className="w-10 h-10 text-mythic-red" />
            </div>
            <div>
              <div className="text-[11px] uppercase font-sans font-black tracking-[0.8em] text-ink-black/40 dark:text-white/40 mb-4 italic">
                {t.disclaimer}
              </div>
              <p className="text-ink-black/80 dark:text-white/80 font-sans leading-relaxed text-xl max-w-4xl italic font-bold">
                {activeReport.medicalAdvice}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Save PDF / Share CTA Option */}
      <div className="mt-32 flex flex-col sm:flex-row justify-center items-center gap-6 pb-32 hide-in-pdf">
        <button
          onClick={handleSavePdf}
          disabled={isGeneratingPdf}
          className="holo-button group flex items-center gap-6 px-12 md:px-16 py-6 md:py-8 bg-ink-black text-white dark:bg-transparent dark:text-white font-sans font-black text-[12px] uppercase tracking-[0.6em] shadow-xl dark:shadow-2xl disabled:opacity-55 cursor-pointer w-full sm:w-auto"
        >
          <FileDown className={`w-5 h-5 opacity-60 group-hover:opacity-100 transition-opacity ${isGeneratingPdf ? "animate-bounce" : ""}`} />
          {isGeneratingPdf 
            ? (lang === "ko" ? "PDF 생성 중..." : "Generating PDF...") 
            : t.savePdf}
        </button>

        <button
          onClick={handleShareSaju}
          className="group flex items-center gap-6 px-12 md:px-16 py-6 md:py-8 bg-ink-black/5 dark:bg-white/5 border border-ink-black/10 dark:border-white/10 rounded-none hover:bg-ink-black/10 dark:hover:bg-white/10 transition-all backdrop-blur-md font-sans font-black text-[12px] uppercase tracking-[0.6em] shadow-xl dark:shadow-2xl cursor-pointer w-full sm:w-auto"
        >
          <Share2 className="w-5 h-5 opacity-80 group-hover:opacity-100 transition-opacity" />
          {lang === "ko" ? "용신할멈 소개하기" : "Recommend Yongshin Halmom"}
        </button>
      </div>

     

      {/* Feedback & Inquiries Footer Label */}
      <div className="mt-8 text-center opacity-30 relative z-10 hide-in-pdf">
        <p className="text-[10px] font-sans font-bold tracking-[0.2em] uppercase mb-2">
          {lang === "ko" ? "오류 제보 및 문의" : "Bug Reports & Inquiries"}
        </p>
        <a
          href="mailto:patiencendiligence@gmail.com"
          className="text-xs font-serif italic hover:text-mythic-gold transition-all"
        >
          patiencendiligence@gmail.com
        </a>
      </div>

      {/* Lazy Loaded Interactive Payment Confirmation Overlay */}
      <PaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        lang={lang}
      />

      <AnimatePresence>
        {showToast && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 flex items-center gap-4 px-6 py-4 bg-ink-black/95 dark:bg-zinc-900 border border-mythic-gold/40 text-white shadow-2xl backdrop-blur-md max-w-sm w-[90%] rounded-lg"
          >
            <div className="flex-1 text-sm font-sans font-medium text-left">
             {t.copiedShareText}
            </div>
            <button
              onClick={() => setShowToast(false)}
              className="p-1 text-white/50 hover:text-white hover:bg-white/10 rounded-full transition-all cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

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
              onClick={onReset}
              className="text-[10px] font-sans font-black uppercase tracking-[0.5em] text-ink-black dark:text-white hover:text-mythic-gold dark:hover:text-mythic-gold transition-all flex items-center gap-4 group"
            >
              <RotateCcw className="w-4 h-4 group-hover:rotate-180 transition-transform duration-500" />
              {t.backToHome}
            </button>
            <Link
              to="/policies"
              className="text-[10px] font-sans font-black uppercase tracking-[0.5em] text-ink-black dark:text-white hover:text-mythic-gold dark:hover:text-mythic-gold transition-all"
            >
              {t.policy}
            </Link>
          </div>
        </div>
        <div className="text-[10px] font-sans font-bold tracking-[0.2em] uppercase text-ink-black/40 dark:text-white/40">
          © 2026 Yongshinhalmom. LIFESTYLE ANALYSIS REPORT.
        </div>
      </footer>
    </div>
  );
}
