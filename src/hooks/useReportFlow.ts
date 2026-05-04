import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { AppState } from "../components/MainApp";
import { ReportResult, getReport } from "../services/geminiService";
import { getReportHash } from "../lib/hashUtils";
import { storageService } from "../services/storageService";
import { Language, translations } from "../lib/translations";

export function useReportFlow(
  lang: Language, 
  user: any, 
  login: () => Promise<void>, 
  markAsPaid: (hash?: string, checkoutId?: string) => void,
  checkPaymentStatus: (hash: string) => Promise<boolean>
) {
  const [state, setState] = useState<AppState>("LANDING");
  const [userData, setUserData] = useState<any>(null);
  const [report, setReport] = useState<ReportResult | null>(null);
  const [preFilledData, setPreFilledData] = useState<any>(null);
  const navigate = useNavigate();

  // Restore state after redirect
  useEffect(() => {
    const savedState = sessionStorage.getItem("yongshin_pending_state");
    if (savedState) {
      try {
        const { state: s, userData: ud, report: r, pendingAction } = JSON.parse(savedState);
        if (s) setState(s);
        if (ud) setUserData(ud);
        if (r) setReport(r);
        sessionStorage.removeItem("yongshin_pending_state");

        // Auto-resume if there was a pending action
        if (pendingAction === 'detailed' && ud) {
          handleChoice('detailed', ud);
        }
      } catch (e) {
        console.error("Failed to restore state", e);
      }
    }
  }, [user]); // Add user dependency to ensure handleChoice has the user

  // Handle payment success redirect (Lemonsqueezy)
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('payment') === 'success' && user) {
      const checkoutId = urlParams.get('checkout_id');
      const savedHash = sessionStorage.getItem("yongshin_pending_pay_hash");
      
      if (savedHash) {
        markAsPaid(savedHash, checkoutId || undefined);
        storageService.setPaidHash(savedHash);
        sessionStorage.removeItem("yongshin_pending_pay_hash");
      } else {
        markAsPaid();
      }
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [user, markAsPaid]);

  const loginAndPersist = useCallback(async (action?: string) => {
    sessionStorage.setItem("yongshin_pending_state", JSON.stringify({
      state,
      userData,
      report,
      pendingAction: action
    }));
    await login();
  }, [state, userData, report, login]);

  const handleChoice = async (level: 'simple' | 'detailed', overridenData?: any) => {
    const activeData = overridenData || userData;
    
    if (level === 'detailed' && !user) {
      await loginAndPersist('detailed');
      return;
    }

    if (!activeData) return;

    // Check payment status for detailed analysis
    let actualLevel = level;
    if (level === 'detailed') {
      const isAdmin = user?.email === 'patiencendiligence@gmail.com';
      const reportHash = getReportHash(activeData);
      const isPaid = isAdmin || (await checkPaymentStatus(reportHash));
      
      if (!isPaid) {
        actualLevel = 'simple';
      }
    }

    setState("LOADING");
    try {
      const year = activeData.targetYear;
      const cached = storageService.findCachedReport(activeData, year, actualLevel);
      
      let result;
      if (cached) {
        result = cached;
      } else {
        result = await getReport(activeData, lang, actualLevel);
        storageService.setReportCache({
          inputHash: JSON.stringify({
            name: activeData.name,
            birthDate: activeData.birthDate,
            birthTime: activeData.birthTime,
            isLunar: activeData.isLunar,
            gender: activeData.gender
          }),
          year: year,
          level: actualLevel,
          date: new Date().toISOString().split('T')[0],
          result: result
        });
      }

      setReport(result);
      setState("RESULT");
    } catch (error: any) {
      console.error(error);
      const isQuota = error?.message?.includes("429") || error?.status === 429 || JSON.stringify(error).includes("429");
      const msg = isQuota ? (translations[lang] as any).quotaExceeded : translations[lang].errorMessage;
      alert(msg);
      setState("INPUT");
    }
  };

  const handleReset = () => {
    setReport(null);
    setUserData(null);
    setPreFilledData(null);
    setState("LANDING");
  };

  const handleStart = () => {
    setPreFilledData(null);
    setState("INPUT");
  };

  const handleSelectProfile = (profile: any) => {
    setPreFilledData(profile);
    setState("INPUT");
  };

  const handleBack = () => {
    navigate("/");
  };

  const handlePurchase = () => {
    if (report) {
      setState("RESULT");
    } else {
      setState("LANDING");
    }
    navigate("/");
  };

  return {
    state,
    setState,
    userData,
    setUserData,
    report,
    preFilledData,
    loginAndPersist,
    handleChoice,
    handleReset,
    handleStart,
    handleSelectProfile,
    handleBack,
    handlePurchase
  };
}
