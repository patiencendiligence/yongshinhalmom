import React, { useState, useEffect, useMemo } from "react";
import { useAuth } from "../lib/AuthContext";
import { getReportHash } from "../lib/hashUtils";
import { storageService } from "../services/storageService";
import { getTodaysFortune, ReportResult, ReportSection } from "../services/geminiService";
import { getManseRyeok } from "../lib/manseRyeok";
import { Language } from "../lib/translations";

interface UseReportResultProps {
  report: ReportResult;
  userData: any;
  lang: Language;
  onUpgrade?: () => void;
  onLogin?: () => Promise<void>;
  triggerPayment: (hash: string) => void;
  viewMode?: "today" | "full";
}

export function useReportResult({
  report,
  userData,
  lang,
  onUpgrade,
  onLogin,
  triggerPayment: propTriggerPayment,
  viewMode,
}: UseReportResultProps) {
  const { user, login, checkPaymentStatus } = useAuth();
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const reportHash = useMemo(() => getReportHash(userData), [userData]);
  const [isCurrentlyPaid, setIsCurrentlyPaid] = useState(() => storageService.isLocalPaid(reportHash));
  const [isCheckingPayment, setIsCheckingPayment] = useState(false);
  const [dailySection, setDailySection] = useState<ReportSection | null>(null);
  const [isRefreshingDaily, setIsRefreshingDaily] = useState(false);

  // Daily Refresh Effect if date is different in KST or when explicitly requested in "today" mode
  useEffect(() => {
    const kstNow = new Date(new Date().getTime() + 9 * 60 * 60 * 1000);
    const today = kstNow.toISOString().split('T')[0];
    const originalDailySection = report.todaysFortune || (report.sections && report.sections[2]);

    let shouldFetch = false;

    // Trigger 1: In "today" mode, but dailySection is missing or doesn't have today's date
    if (viewMode === "today" && (!dailySection || !dailySection.content.includes(today))) {
      shouldFetch = true;
    }
    // Trigger 2: If we have an original daily section on report load, but it is stale
    else if (originalDailySection && typeof originalDailySection.content === "string") {
      const firstLine = originalDailySection.content.split('\n')[0];
      if (firstLine && !firstLine.includes(today) && !dailySection) {
        shouldFetch = true;
      }
    }

    if (shouldFetch && !isRefreshingDaily) {
      console.log("[useReportResult] Today's fortune is needed or stale. Fetching fresh daily fortune...");
      
      const refreshDaily = async () => {
        setIsRefreshingDaily(true);
        try {
          const fresh = await getTodaysFortune(userData, lang);
          console.log("[useReportResult] Fresh daily fortune received:", fresh);

          if (!fresh) {
            throw new Error("Received empty response from daily fortune API");
          }

          let contentStr = "";
          if (typeof fresh.content === "string") {
            contentStr = fresh.content;
          } else if (typeof (fresh as any).content === "object" && (fresh as any).content !== null) {
            contentStr = JSON.stringify((fresh as any).content);
          } else if (typeof fresh === "string") {
            contentStr = fresh;
          } else if (typeof (fresh as any).todaysFortune?.content === "string") {
            contentStr = (fresh as any).todaysFortune.content;
          } else if (typeof (fresh as any).todaysFortune === "string") {
            contentStr = (fresh as any).todaysFortune;
          } else {
            const keys = Object.keys(fresh);
            const contentKey = keys.find(k => k.toLowerCase().includes("content") || k.toLowerCase().includes("fortune") || k.toLowerCase().includes("text"));
            if (contentKey && typeof (fresh as any)[contentKey] === "string") {
              contentStr = (fresh as any)[contentKey];
            } else {
              contentStr = JSON.stringify(fresh);
            }
          }

          const todayFormatted = `### ${today}`;
          if (contentStr && !contentStr.includes(today)) {
            contentStr = `${todayFormatted}\n\n${contentStr}`;
          }

          const titleStr = typeof fresh.title === "string" ? fresh.title : (lang === "ko" ? "오늘의 컨디션 가이드" : "Today's Condition Guide");

          setDailySection({
            title: titleStr,
            content: contentStr
          });
        } catch (error) {
          console.error("[useReportResult] Failed to refresh daily fortune section:", error);
        } finally {
          setIsRefreshingDaily(false);
        }
      };
      
      refreshDaily();
    }
  }, [report.sections, report.todaysFortune, userData, lang, viewMode, dailySection, isRefreshingDaily]);

  // Sync checking status with payment state
  useEffect(() => {
    if (isCurrentlyPaid) {
      setIsCheckingPayment(false);
    }
  }, [isCurrentlyPaid]);

  // Status Polling Effect for database sync
  useEffect(() => {
    if (viewMode === "today") return;
    if (!user || (isCurrentlyPaid && report.level === 'detailed')) return;

    let isMounted = true;
    let timerId: ReturnType<typeof setTimeout>;

    const checkStatus = async () => {
      if (!isMounted) return;
      try {
        const paid = await checkPaymentStatus(reportHash);
        if (paid && isMounted) {
          setIsCurrentlyPaid(true);
          setIsCheckingPayment(false);
          storageService.setPaidHash(reportHash);
          if (report.level === 'simple' && onUpgrade) {
            onUpgrade();
          }
          return;
        }
      } catch (error: any) {
        const isLockError = error?.message?.includes('lock') || error?.details?.includes('lock');
        if (!isLockError) {
          console.error("[useReportResult] Payment check failed:", error);
        }
      }

      if (isMounted && !isCurrentlyPaid) {
        timerId = setTimeout(checkStatus, 3000);
      }
    };

    checkStatus();
    return () => {
      isMounted = false;
      if (timerId) clearTimeout(timerId);
    };
  }, [user, reportHash, isCurrentlyPaid, report.level, checkPaymentStatus, onUpgrade, viewMode]);

  const isPremiumUser = isCurrentlyPaid;
  const displayDetailed = isPremiumUser && report.level === 'detailed';
  const manseRyeok = useMemo(() => {
    if (!userData?.birthDate) return { full: "" };
    return getManseRyeok(userData.birthDate, userData.birthTime || "12:00", userData.isLunar);
  }, [userData?.birthDate, userData?.birthTime, userData?.isLunar]);
  const safeManseRyeok = manseRyeok || { full: "" };

  const swappedReport = useMemo(() => {
    return report || ({ sections: [], todaysFortune: undefined } as any);
  }, [report]);

  // Generate sections list with swapped / re-formatted chapters
  const displaySections = useMemo(() => {
    const sections = (swappedReport && Array.isArray(swappedReport.sections)) ? swappedReport.sections : [];
    if (swappedReport && swappedReport.todaysFortune) {
      const list = [...sections];
      const dailySec: ReportSection = dailySection || swappedReport.todaysFortune || {
        title: lang === "ko" ? "오늘의 컨디션 가이드" : "Today's Condition Guide",
        content: ""
      };
      return [dailySec, ...list];
    } else {
      const list = [...sections];
      if (dailySection && list.length > 2) {
        list[2] = dailySection;
      }
      if (list.length > 2) {
        const sec0 = list[0];
        const sec1 = list[1];
        const sec2 = list[2];
        list[0] = sec2; // Today's Fortune is placed first
        list[1] = sec0; // Overall Daily Saju is placed second
        list[2] = sec1; // 2026 Saju Forecast is placed third
      }
      return list;
    }
  }, [swappedReport, dailySection, lang]);

  const handlePayment = () => {
    if (!user) {
      if (onLogin) {
        onLogin();
      } else {
        login();
      }
      return;
    }
    
    setIsCheckingPayment(true);
    propTriggerPayment(reportHash);
  };

  const handleManualCheck = async () => {
    setIsCheckingPayment(true);
    try {
      const paid = await checkPaymentStatus(reportHash);
      if (paid) {
        setIsCurrentlyPaid(true);
        setIsCheckingPayment(false);
        storageService.setPaidHash(reportHash);
        if (report.level === 'simple' && onUpgrade) {
          onUpgrade();
        }
      } else {
        console.log("Payment status still not verified...");
        setIsCheckingPayment(false);
      }
    } catch (e) {
      console.error("[useReportResult] Manual verification error:", e);
      setIsCheckingPayment(false);
    }
  };

  return {
    user,
    isPaymentModalOpen,
    setIsPaymentModalOpen,
    isCurrentlyPaid,
    setIsCurrentlyPaid,
    isCheckingPayment,
    isRefreshingDaily,
    isPremiumUser,
    displayDetailed,
    safeManseRyeok,
    manseRyeok,
    displaySections,
    reportHash,
    handlePayment,
    handleManualCheck,
    swappedReport,
    dailySection
  };
}
