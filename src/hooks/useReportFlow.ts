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
    // Only restore if we are at home path and have zero data
    if (window.location.hash.length <= 2 && !userData && !report) {
      const savedState = sessionStorage.getItem("yongshin_pending_state");
      if (savedState) {
        try {
          const parsed = JSON.parse(savedState);
          const { state: s, userData: ud, report: r, pendingAction } = parsed;
          
          if (ud) setUserData(ud);
          if (r) setReport(r);
          
          // Clear session right after extraction to prevent loops
          sessionStorage.removeItem("yongshin_pending_state");

          if (s === "RESULT" && r) {
            setState("RESULT");
          } else if (pendingAction === 'detailed' && ud && user) {
            handleChoice('detailed', ud);
          } else {
            // Default to landing if we don't have a clear high-level state to resume
            setState("LANDING");
          }
        } catch (e) {
          console.error("Failed to restore state", e);
          sessionStorage.removeItem("yongshin_pending_state");
        }
      }
    }
  }, [user, userData, report]);

  // Handle success redirect context
  useEffect(() => {
    if (window.location.hash.includes('success')) {
      const savedHash = sessionStorage.getItem("yongshin_pending_pay_hash");
      if (savedHash && user) {
        markAsPaid(savedHash);
        sessionStorage.removeItem("yongshin_pending_pay_hash");
        // Clear success from URL if possible
        window.history.replaceState({}, document.title, window.location.pathname);
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

    // IMMEDIATELY set loading to provide visual feedback
    setState("LOADING");
    console.log(`[Flow] Starting analysis for ${activeData.name} (${level})...`);

    // Check payment status for detailed analysis
    let actualLevel = level;
    let pendingPayment = false;
    
    try {
      const isAdmin = user?.email === 'patiencendiligence@gmail.com' || user?.email === 'test@example.com';
      const reportHash = getReportHash(activeData);
      
      if (level === 'detailed') {
        console.log("[Flow] Checking payment status...");
        const isPaidForHash = await checkPaymentStatus(reportHash);
        const isPaid = isAdmin || isPaidForHash;
        
        if (!isPaid) {
          console.log("[Flow] Not paid. Downgrading to simple.");
          actualLevel = 'simple';
          pendingPayment = true;
        }
      } else {
        // Even if 'simple' is requested, check if it's already paid to mark as premium
        console.log("[Flow] Checking if already paid...");
        const isPaid = isAdmin || await checkPaymentStatus(reportHash);
        if (isPaid) {
          console.log("[Flow] Already paid. Upgrading to detailed.");
          actualLevel = 'detailed';
        }
      }

      const year = activeData.targetYear || new Date().getFullYear();
      console.log(`[Flow] Final level: ${actualLevel}. Looking for cache...`);
      const cached = storageService.findCachedReport(activeData, year, actualLevel);
      
      let result;
      if (cached) {
        console.log("[Flow] Cache found.");
        result = cached;
      } else {
        console.log("[Flow] No cache. Fetching from server...");
        result = await getReport(activeData, lang, actualLevel);
        
        // Safety wrap for caching
        try {
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
        } catch (e) {
          console.warn("[Flow] Failed to set cache:", e);
        }
      }

      console.log("[Flow] Success. Transitioning to RESULT.");
      setReport({ ...result, level: actualLevel, pendingPayment });
      setState("RESULT");
    } catch (error: any) {
      console.error("[Flow] Report generation error:", error);
      
      // CRITICAL: Ensure we get out of LOADING state even on error
      setState("INPUT");
      
      const isQuota = error?.status === 429 || error?.message?.includes("429");
      const isTimeout = error?.message?.includes("시간") || error?.message?.includes("timeout");
      
      let msg = translations[lang].errorMessage;
      if (isQuota) msg = (translations[lang] as any).quotaExceeded;
      if (isTimeout) msg = error.message;

      // Small delay to ensure state transition is visible before alert blocks
      setTimeout(() => alert(msg), 200);
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
    setUserData(profile);
    handleChoice('simple', profile);
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
