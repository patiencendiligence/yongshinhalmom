import React, { useState } from "react";
import { Link } from "react-router-dom";
import { FileDown, AlertTriangle, RotateCcw, Coffee, Share2, X } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useReportResult } from "../hooks/useReportResult";
import { generateReportPdf } from "../utils/pdfGenerator";
import { ReportResult } from "../services/geminiService";
import { Language, translations } from "../lib/translations";
import { parseDailyFortune, getStrongestElement, getStrongestElementFromReport } from "../utils/sajuUtils";
import ReportHeader from "./ReportHeader";
import ReportItemCard from "./ReportItemCard";
import PremiumLockBox from "./PremiumLockBox";
import PaymentModal from "./PaymentModal";

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
  isUpgradingDetail?: boolean;
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
  isUpgradingDetail,
}: ReportResultViewProps) {
  const t = translations[lang] as any;
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [showToast, setShowToast] = useState(false);

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
    const strongest = getStrongestElementFromReport(activeReport, safeManseRyeok);
    const shareUrl = window.location.origin;
    const copyText = lang === 'ko' ? `자네 아직 자기 팔자를 모르고 사는군.\n자네 사주에는 ${strongest.element} ${strongest.emoji} 기운이 강하다네.\n생년월일만 넣어보게. 이 할멈이 자네 길도 봐줌세.\n${shareUrl}` :
    `Hmm, you still don't know your own fate, do you?\nYour chart carries strong ${strongest.element} ${strongest.emoji} energy. Enter your birth date.\nThis old grandma shall read the path that awaits you.\n${shareUrl}`

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
    dailyLuckInfo,
  } = useReportResult({
    report,
    userData,
    lang,
    onUpgrade,
    onLogin,
    triggerPayment,
    viewMode,
  });

  const activeReport = swappedReport || report;
  const activeLuckInfo = (viewMode === "today" && dailyLuckInfo) ? dailyLuckInfo : (activeReport?.luckInfo || {});

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
    if (!activeReport) return null;
    const activeSections = Array.isArray(activeReport.sections) ? activeReport.sections : [];
    const dailySection = displaySections[0] || activeReport.todaysFortune || activeSections.find(s => s && s.title && (s.title.includes("컨디션") || s.title.includes("Condition") || s.title.includes("오늘"))) || activeSections[2];
    const dailyContent = dailySection ? dailySection.content : "";
    return parseDailyFortune(dailyContent);
  }, [viewMode, activeReport, displaySections]);

  if (viewMode === "today" && parsedFortune) {
    return (
      <div className="max-w-4xl mx-auto px-4 pb-32 relative dragon-pattern min-h-screen text-ink-black dark:text-white pt-24">
        {/* Simplified Header with User Context */}
        <div className="text-center mb-16 relative z-10">
          <div className="text-[10px] uppercase font-sans font-black tracking-[0.6em] text-mythic-gold mb-4">
            {t.todayFortuneTitle}
          </div>
          <h1 className="text-4xl md:text-7xl font-serif font-black italic tracking-tight text-ink-black dark:text-white leading-tight">
            {lang === "ko" ? "오늘의 운세" : "Today's Fortune"}
          </h1>
          <p className="text-sm text-ink-black/40 dark:text-white/30 italic mt-3 font-sans">
            {userData?.birthDate || ""} ({userData?.isLunar ? t.lunar : t.solar}) • {safeManseRyeok.full}
          </p>
        </div>

        {/* 6 Main Fortune Cards / Loading Skeleton */}
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
            ].filter(item => item.content && item.content.trim() !== "").map((item, i) => (
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

        {/* Lucky info row */}
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


        {/* Expand full report button */}
        <div className="flex flex-col items-center gap-8 relative z-10 hide-in-pdf">
          <div className="flex flex-col sm:flex-row items-start gap-4">
            <button
              onClick={() => setViewMode("full")}
              className="holo-button group flex items-center gap-6 px-16 py-7 bg-ink-black text-white dark:bg-white dark:text-black font-sans font-black text-[12px] uppercase tracking-[0.5em] shadow-xl dark:shadow-2xl hover:scale-102 transition-all cursor-pointer w-full sm:w-auto"
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
            .map((section, idx) => (
              <ReportItemCard
                key={idx}
                idx={idx}
                section={section}
                isRefreshingDaily={isRefreshingDaily}
                lang={lang}
                manseRyeok={safeManseRyeok}
                isLast={idx === displaySections.length - 1}
                report={activeReport}
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
              isUpgradingDetail={isUpgradingDetail}
            />
          )}
        </div>

        {/* Medical / Disclaimer Warning Box */}
        {activeReport?.medicalAdvice && (
          <div className="mb-16 p-6 bg-white/10 dark:bg-white/5 flex flex-col md:flex-row items-center gap-12 relative z-10 border border-ink-black/10 dark:border-white/20">
            <div className="w-24 h-24 bg-ink-black dark:bg-black/40 flex-shrink-0 flex items-center justify-center text-white border border-ink-black/20 dark:border-white/20">
              <AlertTriangle className="w-10 h-10 text-mythic-red" />
            </div>
            <div>
              <div className="text-[11px] uppercase font-sans font-black tracking-[0.8em] text-ink-black/40 dark:text-white/40 mb-4 italic">
                {t.disclaimer}
              </div>
              <p className="text-ink-black/80 dark:text-white/80 font-sans leading-relaxed text-xl max-w-4xl italic font-bold">
                {activeReport?.medicalAdvice}
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
      <div className="mt-8 text-center opacity-40 hover:opacity-100 transition-opacity duration-300 relative z-10 hide-in-pdf flex flex-col items-center gap-2">
        <p className="text-[10px] font-sans font-bold tracking-[0.2em] uppercase">
          {lang === "ko" ? "오류 제보 및 문의" : "Bug Reports & Inquiries"}
        </p>
        <div className="flex flex-wrap justify-center items-center gap-x-4 gap-y-1 text-xs">
          <a
            href="mailto:yongshinhalmom@gmail.com"
            className="font-serif italic hover:text-mythic-gold transition-all underline"
          >
            yongshinhalmom@gmail.com
          </a>
          <span className="opacity-40">|</span>
          <a
            href="https://www.instagram.com/yongshinhalmom.saju"
            target="_blank"
            rel="noopener noreferrer"
            className="font-serif italic hover:text-mythic-gold transition-all underline"
          >
            Instagram: @yongshinhalmom.saju
          </a>
        </div>
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