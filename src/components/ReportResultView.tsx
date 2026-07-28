import React, { useState } from "react";
import { FileDown, AlertTriangle, Coffee, Share2, X } from "lucide-react";
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
import { QnaAnswerView } from "./QnaAnswerView";
import { TodayFortuneView } from "./TodayFortuneView";
import { ReportFooter } from "./ReportFooter";

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

  const hasCustomQuestion = userData?.customQuestion && userData.customQuestion.trim();

  if (hasCustomQuestion) {
    const customAnswerSection = activeReport?.sections?.find(
      (s: any) => 
        s?.title?.includes("할멈") || 
        s?.title?.includes("답변") || 
        s?.title?.includes("Answer") || 
        s?.title?.includes("Grandma") ||
        s?.title?.includes("명쾌한")
    ) || activeReport?.sections?.[0];

    const answerTitle = customAnswerSection?.title || (lang === "ko" ? "할멈의 명쾌한 답변" : "Grandma's Clear Answer");
    const answerContent = customAnswerSection?.content || "";

    return (
      <QnaAnswerView
        lang={lang}
        t={t as any}
        userData={userData}
        safeManseRyeok={safeManseRyeok}
        answerTitle={answerTitle}
        answerContent={answerContent}
        activeLuckInfo={activeLuckInfo}
        handleShareSaju={handleShareSaju}
        onReset={onReset}
      />
    );
  }

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
      <TodayFortuneView
        lang={lang}
        t={t as any}
        userData={userData}
        safeManseRyeok={safeManseRyeok}
        isRefreshingDaily={isRefreshingDaily}
        parsedFortune={parsedFortune}
        activeLuckInfo={activeLuckInfo}
        setViewMode={setViewMode}
        handleShareSaju={handleShareSaju}
        onReset={onReset}
      />
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

     

      <ReportFooter
        lang={lang}
        t={t as any}
        onReset={onReset}
      />

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
            className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 flex items-center gap-4 px-6 py-4 bg-ink-black/95 dark:bg-zinc-900 border border-purple-500/40 dark:border-holo-cyan/40 text-white shadow-2xl backdrop-blur-md max-w-sm w-[90%] rounded-lg"
          >
            <div className="flex-1 text-sm font-sans font-medium text-left">
             {t.copiedShareText}
            </div>
            <button
              type="button"
              onClick={() => setShowToast(false)}
              className="p-1 text-white/50 hover:text-white hover:bg-white/10 rounded-none transition-all cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}