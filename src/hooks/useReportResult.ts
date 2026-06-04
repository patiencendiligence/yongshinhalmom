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
}

export function useReportResult({
  report,
  userData,
  lang,
  onUpgrade,
  onLogin,
  triggerPayment: propTriggerPayment
}: UseReportResultProps) {
  const { user, login, checkPaymentStatus } = useAuth();
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const reportHash = useMemo(() => getReportHash(userData), [userData]);
  const [isCurrentlyPaid, setIsCurrentlyPaid] = useState(() => storageService.isLocalPaid(reportHash));
  const [isCheckingPayment, setIsCheckingPayment] = useState(false);
  const [dailySection, setDailySection] = useState<ReportSection | null>(null);
  const [isRefreshingDaily, setIsRefreshingDaily] = useState(false);

  // Daily Refresh Effect if date is different in KST
  useEffect(() => {
    const kstNow = new Date(new Date().getTime() + 9 * 60 * 60 * 1000);
    const today = kstNow.toISOString().split('T')[0];
    const originalDailySection = report.sections[2];

    if (originalDailySection && !originalDailySection.content.split('\n')[0].includes(today)) {
      console.log("[useReportResult] Daily section is stale or needs date prepending. Refreshing...");
      
      const refreshDaily = async () => {
        setIsRefreshingDaily(true);
        try {
          const fresh = await getTodaysFortune(userData, lang);
          const todayFormatted = `### ${today}`;
          if (!fresh.content.includes(today)) {
            fresh.content = `${todayFormatted}\n\n${fresh.content}`;
          }
          setDailySection(fresh);
        } catch (error) {
          console.error("[useReportResult] Failed to refresh daily fortune section:", error);
        } finally {
          setIsRefreshingDaily(false);
        }
      };
      
      refreshDaily();
    }
  }, [report.sections, userData, lang]);

  // Sync checking status with payment state
  useEffect(() => {
    if (isCurrentlyPaid) {
      setIsCheckingPayment(false);
    }
  }, [isCurrentlyPaid]);

  // Status Polling Effect for database sync
  useEffect(() => {
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
  }, [user, reportHash, isCurrentlyPaid, report.level, checkPaymentStatus, onUpgrade]);

  const isPremiumUser = isCurrentlyPaid;
  const displayDetailed = isPremiumUser && report.level === 'detailed';
  const manseRyeok = getManseRyeok(userData.birthDate, userData.birthTime, userData.isLunar);
  const safeManseRyeok = manseRyeok || { full: "" };

  // Generate sections list with swapped / re-formatted chapters
  const displaySections = useMemo(() => {
    const list = [...report.sections];
    if (dailySection && list.length > 2) {
      list[2] = dailySection;
    }
    if (list.length > 2) {
      const original0 = list[0];
      const original1 = list[1];
      const original2 = list[2];
      list[0] = original2; // Today's Condition Guide at the very top
      list[1] = original1; // Overall Fortune (총운) in the middle
      list[2] = original0; // Your Lifestyle Report (Saju) at the bottom
    }
    return list;
  }, [report.sections, dailySection]);

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
    handleManualCheck
  };
}
