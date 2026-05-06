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
  profile: any,
  login: () => Promise<void>, 
  markAsPaid: (hash?: string, checkoutId?: string) => void,
  checkPaymentStatus: (hash: string) => Promise<boolean>
) {
  const [state, setState] = useState<AppState>("LANDING");
  const [userData, setUserData] = useState<any>(null);
  const [report, setReport] = useState<ReportResult | null>(null);
  const [preFilledData, setPreFilledData] = useState<any>(null);
  const navigate = useNavigate();

  // Restore state after redirect or reload
  useEffect(() => {
    const savedState = sessionStorage.getItem("yongshin_pending_state");
    if (savedState) {
      try {
        const { state: s, userData: ud, report: r, pendingAction } = JSON.parse(savedState);
        // Important: Only restore if we don't already have live data to avoid overriding
        if (!userData && ud) setUserData(ud);
        if (!report && r) setReport(r);
        if (state === "LANDING" && s) setState(s);

        // If we were in the middle of a detailed choice, and now have user, try to resume
        if (pendingAction === 'detailed' && ud && user && state === "LANDING") {
          handleChoice('detailed', ud);
          sessionStorage.removeItem("yongshin_pending_state"); // Clear once resumed
        }
      } catch (e) {
        console.error("Failed to restore state", e);
      }
    }
  }, [user]);

  // Handle success redirect context
  useEffect(() => {
    if (window.location.hash.includes('success')) {
      const savedHash = sessionStorage.getItem("yongshin_pending_pay_hash");
      if (savedHash && user) {
        markAsPaid(savedHash);
        sessionStorage.removeItem("yongshin_pending_pay_hash");
      }
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
    let activeData = overridenData || userData;
    
    // Attempt session recovery if direct data is missing
    if (!activeData) {
      const saved = sessionStorage.getItem("yongshin_pending_state");
      if (saved) {
        try { activeData = JSON.parse(saved).userData; } catch(e){}
      }
    }

    if (level === 'detailed' && !user) {
      await loginAndPersist('detailed');
      return;
    }

    if (!activeData) {
      console.warn("handleChoice aborted: No userData available.");
      return;
    }

    // Check payment status for detailed analysis
    let actualLevel = level;
    let pendingPayment = false;
    
    if (level === 'detailed') {
      const isAdmin = user?.email === 'patiencendiligence@gmail.com';
      const reportHash = getReportHash(activeData);
      const isPaidForHash = await checkPaymentStatus(reportHash);
      const isPaid = isAdmin || isPaidForHash;
      
      if (!isPaid) {
        actualLevel = 'simple';
        pendingPayment = true;
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

      setReport({ ...result, level: actualLevel, pendingPayment });
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

  const triggerPayment = useCallback((reportHash: string) => {
    if (!user) return;
    
    // Save current state snapshot for total recovery
    const stateSnapshot = {
      state,
      userData,
      report,
      pendingAction: 'detailed',
      reportHash
    };
    sessionStorage.setItem("yongshin_pending_state", JSON.stringify(stateSnapshot));
    sessionStorage.setItem("yongshin_pending_pay_hash", reportHash);
    
    // Gumroad Payment Link
    const gumroadUrl = "https://yshm.gumroad.com/l/jueghh";

    // Append user context
    const checkoutUrl = new URL(gumroadUrl);
    if (user?.email) checkoutUrl.searchParams.set("email", user.email);
    checkoutUrl.searchParams.set("report_hash", reportHash);
    checkoutUrl.searchParams.set("user_id", user.id);
    
    // Use current URL path (e.g., pricing.html) instead of just origin
    const currentBase = window.location.href.split('#')[0];
    const successUrl = `${currentBase}#/success`;
    checkoutUrl.searchParams.set("redirect_url", successUrl);
    
    window.open(checkoutUrl.toString(), "_blank", "noreferrer");
  }, [user, state, userData, report]);

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
    handlePurchase,
    triggerPayment
  };
}
