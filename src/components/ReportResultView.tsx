import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import ReactMarkdown from 'react-markdown';
import { getReport, ReportResult } from "../services/geminiService";
import { Language, translations } from "../lib/translations";
import { useAuth } from "../lib/AuthContext";
import { Link } from "react-router-dom";
import { Lock, FileDown, AlertCircle, AlertTriangle, RotateCcw } from "lucide-react";
import { getManseRyeok } from "../lib/manseRyeok";
import { getReportHash } from "../lib/hashUtils";
import { storageService } from "../services/storageService";
import PaymentModal from "./PaymentModal";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

const zodiacGuardians = "/assets/zodiac_guardians.png";

interface ReportResultViewProps {
  report: ReportResult;
  onReset: () => void;
  onUpgrade?: () => void;
  onOpenPolicy: () => void;
  onLogin?: () => Promise<void>;
  triggerPayment: (hash: string) => void;
  userData: any;
  lang: Language;
}

const Illustration = ({ zodiac, className = "" }: { zodiac: number, className?: string }) => {
  const col = zodiac % 6;
  const row = Math.floor(zodiac / 6);
  
  return (
    <div 
      className={`w-32 h-44 border border-white/10 rounded-lg bg-neutral-900 zodiac-illustration shadow-2xl ${className}`}
      data-col={col}
      data-row={row}
      style={{
        backgroundImage: `url("${zodiacGuardians}")`,
        backgroundSize: '600% 200%',
        backgroundPosition: `${col * 20}% ${row * 100}%`,
        backgroundRepeat: 'no-repeat'
      }}
    />
  );
};

export default function ReportResultView({ report, onReset, onUpgrade, onOpenPolicy, onLogin, triggerPayment: propTriggerPayment, userData, lang }: ReportResultViewProps) {
  const t = (translations[lang] as any);
  const { user, profile, login, markAsPaid, checkPaymentStatus } = useAuth();
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  
  const reportHash = React.useMemo(() => getReportHash(userData), [userData]);
  const [isCurrentlyPaid, setIsCurrentlyPaid] = useState(() => storageService.isLocalPaid(reportHash));
  const [isCheckingPayment, setIsCheckingPayment] = useState(false);

  // Sync isCheckingPayment with isCurrentlyPaid
  React.useEffect(() => {
    if (isCurrentlyPaid) {
      setIsCheckingPayment(false);
    }
  }, [isCurrentlyPaid]);

  // Handle auto-payment trigger if coming from ChoiceModal
  // REMOVED: Auto-triggering windows in useEffect is usually blocked by browsers.
  // We now trigger it directly in MainApp.tsx on the ChoiceModal button click.

  // Check if this specific report is paid
  React.useEffect(() => {
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
          
          // If they were looking at a simple report, automatically upgrade to detailed
          if (report.level === 'simple' && onUpgrade) {
            onUpgrade();
          }
          return; // Stop polling since we're paid
        }
      } catch (error: any) {
        // Handle specific lock error silently - it's a Supabase race condition
        const isLockError = error?.message?.includes('lock') || error?.details?.includes('lock');
        if (!isLockError) {
          console.error("Payment check failed:", error);
        }
      }

      // Schedule next check only if still mounted and not paid
      if (isMounted && !isCurrentlyPaid) {
        timerId = setTimeout(checkStatus, 3000); // 3 seconds is better for responsive feel
      }
    };

    // Initial check
    checkStatus();
    
    return () => {
      isMounted = false;
      if (timerId) clearTimeout(timerId);
    };
  }, [user, reportHash, isCurrentlyPaid, report.level, checkPaymentStatus, onUpgrade]);

  // Only the test account or users who paid for THIS specific report (matched by hash) see the detailed content
  const isPremiumUser = isCurrentlyPaid || user?.email === 'patiencendiligence@gmail.com';
  
  // Even if they are premium, if they chose 'simple' (Basic Summary), we show the simple view.
  // They only see details if they are premium AND selected (or upgraded to) 'detailed'.
  const displayDetailed = isPremiumUser && report.level === 'detailed';
  const manseRyeok = getManseRyeok(userData.birthDate, userData.birthTime, userData.isLunar);

  // Swap Sections 2 (idx 1) and 3 (idx 2)
  const displaySections = [...report.sections];
  if (displaySections.length > 2) {
    const temp = displaySections[1];
    displaySections[1] = displaySections[2];
    displaySections[2] = temp;
  }

  const handlePayment = () => {
    if (!user) {
      onLogin ? onLogin() : login();
      return;
    }
    
    if (user?.email === 'patiencendiligence@gmail.com') {
      setIsCurrentlyPaid(true);
      storageService.setPaidHash(reportHash);
      if (report.level === 'simple' && onUpgrade) onUpgrade();
      return;
    }

    setIsCheckingPayment(true);
    propTriggerPayment(reportHash);
  };

  const handleManualCheck = async () => {
    setIsCheckingPayment(true);
    const paid = await checkPaymentStatus(reportHash);
    if (paid) {
      setIsCurrentlyPaid(true);
      setIsCheckingPayment(false);
      storageService.setPaidHash(reportHash);
      if (report.level === 'simple' && onUpgrade) onUpgrade();
    } else {
      // Just a quick nudge, don't alert unless it's a hard error
      console.log("Still not verified...");
    }
  };

  const handleSavePdf = async () => {
    const element = document.getElementById("report-content");
    if (!element) return;

    try {
      const canvas = await html2canvas(element, {
        backgroundColor: "#000000",
        scale: 2,
        useCORS: true,
        allowTaint: true,
        logging: false,
        onclone: (clonedDoc) => {
          // 1. Disable ALL original styles to prevent oklab/modern CSS parsing errors
          for (let i = 0; i < clonedDoc.styleSheets.length; i++) {
            clonedDoc.styleSheets[i].disabled = true;
          }

          // 2. Hide Premium lock for PDF
          const premiumLock = clonedDoc.querySelector('[data-premium-lock="true"]');
          if (premiumLock) {
            (premiumLock as HTMLElement).style.display = 'none';
          }
          
          // Hide navigation/buttons in PDF
          const hideInPdf = clonedDoc.querySelectorAll('.hide-in-pdf');
          hideInPdf.forEach(node => {
            (node as HTMLElement).style.display = 'none';
          });

          // 3. Inject Ultra-Stable PDF Styles (HEX ONLY)
          const style = clonedDoc.createElement('style');
          style.innerHTML = `
            @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,900;1,700&family=Noto+Serif+KR:wght@700;900&display=swap');
            
            * { box-sizing: border-box !important; -webkit-print-color-adjust: exact !important; }
            body { background: #000000 !important; font-family: sans-serif !important; margin: 0; padding: 0; }
            #report-content { 
              background-color: #000000 !important; 
              background-image: radial-gradient(circle at 2px 2px, rgba(255,255,255,0.05) 1px, transparent 0) !important;
              background-size: 24px 24px !important;
              color: #ffffff !important; 
              padding: 80px !important; 
              width: 1200px !important;
              position: relative !important;
            }
            
            /* Mythic Aesthetic */
            .font-serif { font-family: 'Playfair Display', 'Noto Serif KR', serif !important; }
            h1 { color: #ffffff !important; line-height: 0.9 !important; font-size: 84px !important; margin-bottom: 40px !important; font-style: italic !important; font-weight: 900 !important; letter-spacing: -0.05em !important; }
            h3 { color: #ffffff !important; line-height: 1.2 !important; font-size: 36px !important; margin-bottom: 24px !important; font-style: italic !important; font-weight: 900 !important; }
            p, div, span { line-height: 1.6 !important; font-size: 18px !important; color: rgba(255,255,255,0.8) !important; }
            
            .mythic-gradient-text {
              color: #ffd60a !important; /* Fallback for PDF */
              background: linear-gradient(to right, #ffd60a, #ff9f0a) !important;
              -webkit-background-clip: text !important;
            }
            
            /* Structural Bento Cards */
            .grid { display: block !important; }
            .bg-black { 
              background-color: #0c0c0c !important; 
              border: 1px solid rgba(255,255,255,0.1) !important;
              border-radius: 16px !important;
              padding: 60px !important;
              margin-bottom: 40px !important;
              page-break-inside: avoid !important;
            }

            .bg-\\[\\#1a1a1a\\] { background-color: #1a1a1a !important; }
            .bg-mythic-red\\/90 { background-color: #ff3b30 !important; }
            
            /* Disclaimer styling in PDF */
            .opacity-30.bg-white {
              background-color: #1a1a1a !important;
              opacity: 1 !important;
              border: 1px solid #ff3b30 !important;
            }
            .opacity-30.bg-white p {
              color: #ff3b30 !important;
              font-weight: bold !important;
            }
            .opacity-30.bg-white .text-black {
              color: #ffffff !important;
            }
            
            /* Illustration Styling */
            .zodiac-container {
              background: rgba(255,255,255,0.02) !important;
              border: 1px solid rgba(255,255,255,0.05) !important;
              border-radius: 24px !important;
              padding: 20px !important;
              margin-bottom: 30px !important;
              display: inline-block !important;
            }

            .zodiac-illustration {
              width: 128px !important;
              height: 176px !important;
              overflow: hidden !important;
              position: relative !important;
              border: 1px solid rgba(255,255,255,0.1) !important;
              border-radius: 8px !important;
              background-color: #0c0c0c !important;
            }

            .zodiac-illustration img {
              max-width: none !important;
              position: absolute !important;
              display: block !important;
            }
            
            .manse-ryeok-badge {
              border-left: 2px solid rgba(255,255,255,0.2) !important;
              padding-left: 30px !important;
              margin-bottom: 60px !important;
            }

            .text-white { color: #ffffff !important; }
            .text-mythic-gold { color: #ffd60a !important; }
            
            /* Ensure text wrapping */
            .markdown-container { word-break: break-word !important; overflow-wrap: break-word !important; }
            
            /* Limit scaling */
            #report-content { transform-origin: top left !important; }
            
            /* Hide animations and shadows for clarity */
            * { box-shadow: none !important; text-shadow: none !important; backdrop-filter: none !important; transition: none !important; }
            
            /* Explicit chapter labeling */
            .chapter-label {
               font-size: 12px !important;
               font-weight: 900 !important;
               letter-spacing: 0.5em !important;
               color: rgba(255,255,255,0.3) !important;
               margin-bottom: 20px !important;
               text-transform: uppercase !important;
            }
          `;
          clonedDoc.head.appendChild(style);

          // Force clean background
          const clonedElement = clonedDoc.getElementById("report-content");
          if (clonedElement) {
            clonedElement.style.background = "#000000";
            clonedElement.style.color = "#ffffff";
          }

          // Handle Illustrations for PDF stability
          const illustrations = clonedDoc.querySelectorAll('.zodiac-illustration');
          illustrations.forEach(el => {
            const htmlEl = el as HTMLElement;
            const col = parseInt(htmlEl.dataset.col || '0');
            const row = parseInt(htmlEl.dataset.row || '0');

            htmlEl.style.width = '128px';
            htmlEl.style.height = '176px';
            htmlEl.style.display = 'block';
            htmlEl.style.visibility = 'visible';
            htmlEl.style.opacity = '1';
            htmlEl.style.backgroundImage = `url("${zodiacGuardians}")`;
            htmlEl.style.backgroundSize = '768px 352px';
            htmlEl.style.backgroundPosition = `-${col * 128}px -${row * 176}px`;
            htmlEl.style.backgroundRepeat = 'no-repeat';
          });
        }
      });
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");
      
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      
      const imgProps = pdf.getImageProperties(imgData);
      const totalImgHeightMm = (imgProps.height * pdfWidth) / imgProps.width;
      
      let heightLeft = totalImgHeightMm;
      let position = 0;

      // Add first page
      pdf.addImage(imgData, "PNG", 0, position, pdfWidth, totalImgHeightMm);
      heightLeft -= pdfHeight;

      // Add subsequent pages if content overflows the first page
      while (heightLeft > 0) {
        position = heightLeft - totalImgHeightMm;
        pdf.addPage();
        pdf.addImage(imgData, "PNG", 0, position, pdfWidth, totalImgHeightMm);
        heightLeft -= pdfHeight;
      }
      
      pdf.save(`yongshin_report_${userData.name}.pdf`);
    } catch (error) {
      console.error("PDF generation error:", error);
    }
  };

  const getSlotClass = (idx: number) => {
    // Swap 1 and 2 styles as well to maintain visual balance
    switch (idx) {
      case 0: return "col-span-12 row-span-auto md:row-span-3 pb-20"; // Detailed Saju
      case 1: return "col-span-12 md:col-span-6 row-span-2 border-mythic-gold/20"; // Today's Report (Previously Case 2)
      case 2: return "col-span-12 md:col-span-6 row-span-2 bg-[#1a1a1a]"; // Overview (Previously Case 1)
      case 3: return "col-span-12 md:col-span-12 row-span-auto"; // Monthly (Solar Detail)
      case 4: return "col-span-12 md:col-span-4 row-span-2 bg-[#1a1a1a]"; // Health
      case 5: return "col-span-12 md:col-span-4 row-span-2 bg-mythic-red/90 text-white"; // Love
      case 6: return "col-span-12 md:col-span-4 row-span-2 bg-[#1a1a1a]"; // Career
      case 7: return "col-span-12 row-span-2 bg-mythic-gold/5 border-mythic-gold/20"; // Remedy
      default: return "col-span-12 md:col-span-6 row-span-2";
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 pb-32 relative dragon-pattern min-h-screen">
      <div id="report-content">
        {/* Editorial Header */}
        <header className="pt-32 pb-24 flex flex-col items-center md:items-start md:flex-row justify-between border-b border-white/10 mb-16 relative z-10">
          <div className="max-w-3xl mb-12 md:mb-0">
            <h1 className="text-7xl md:text-11xl font-serif font-black italic tracking-tighter text-white leading-[0.8] mb-12">
              {t.yourLifestyleReport.split('Report')[0]} <span className="mythic-gradient-text">Report</span> <br/>
              {t.yourLifestyleReport.split('Report')[1]}
            </h1>
            <p className="text-2xl md:text-3xl font-serif text-white/40 italic leading-snug max-w-2xl">
              "{report.summary}"
            </p>

            <div className="mt-16 flex flex-wrap gap-8">
              {[
                { label: lang === "ko" ? "COLOR" : "COLOR", value: report.luckInfo.color },
                { label: lang === "ko" ? "ITEM" : "ITEM", value: report.luckInfo.item },
                { label: lang === "ko" ? "FOOD" : "FOOD", value: report.luckInfo.food },
              ].map((luck, i) => (
                <div key={i} className="flex flex-col gap-2">
                  <span className="text-[10px] font-sans font-black uppercase tracking-[0.4em] text-white/30">{luck.label}</span>
                  <span className="text-xl font-serif italic text-white">{luck.value}</span>
                </div>
              ))}
            </div>
          </div>
          
          <div className="text-center md:text-right flex flex-col justify-end items-center md:items-end">
            <div className="mb-8 p-1.5 border border-white/5 rounded-2xl bg-white/[0.02] zodiac-container">
              <Illustration zodiac={report.zodiac} />
            </div>
            <div className="text-[10px] font-sans font-bold tracking-[0.5em] text-white/20 uppercase mb-4">{t.authorizedRecipient}</div>
            <div className="text-5xl md:text-7xl font-serif font-black text-white italic">{userData.name}</div>
            <p className="text-xl text-white/20 italic mt-4">{userData.birthDate} ({userData.isLunar ? t.lunar : t.solar})</p>
          </div>
        </header>

        {/* Manse-ryeok - Museum Label Style */}
        <div className="mb-16 flex flex-col md:flex-row items-baseline gap-8 border-l-[1px] border-white/20 pl-8 manse-ryeok-badge">
          <div className="text-[11px] uppercase font-sans font-black tracking-[0.6em]">{t.manseRyeok}</div>
          <div className="text-3xl md:text-5xl font-serif font-black italic text-white/80 tracking-tighter">
            {manseRyeok.full}
          </div>
        </div>

        {/* Bento Grid with Refined Design */}
        <div className="grid grid-cols-12 gap-px bg-white/10 mb-32 relative z-10 border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
        {(() => {
          // If NOT showing detailed content, we only want to show the first 3 sections (0, 1, 2) 
          // and then ONE single box for the remaining CHAPTERS.
          const visibleSections = displayDetailed 
            ? displaySections 
            : displaySections.slice(0, 3);
          
          const rendered = visibleSections.map((section, idx) => {
            const isDark = idx === 2 || idx === 3 || idx === 4 || idx === 6;
            const isRed = idx === 5;
            
            return (
              <motion.div
                key={idx}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: idx * 0.05 }}
                className={`bg-black p-12 md:p-16 flex flex-col relative group ${getSlotClass(idx)}`}
              >
                <div className="mb-12">
                  <div className="flex items-center gap-4 mb-8">
                    <div className="text-[10px] uppercase tracking-[0.6em] font-sans font-black text-white/30 italic chapter-label">
                      {idx === 0 ? "FREE" : `CHAPTER ${String(idx + 1).padStart(2, '0')}`}
                    </div>
                  </div>
                  <h3 className={`text-3xl md:text-4xl font-serif font-black italic leading-[0.9] text-white`}>
                    {section.title}
                  </h3>
                </div>

                <div className="text-md md:text-md font-sans tracking-tight leading-relaxed markdown-container text-white/70">
                  <ReactMarkdown>
                    {section.content}
                  </ReactMarkdown>
                </div>
              </motion.div>
            );
          });

          // Append one locked box if not showing detailed content (Hides in PDF)
          if (!displayDetailed) {
            rendered.push(
              <motion.div
                key="locked-premium"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
                data-premium-lock="true"
                className="col-span-12 py-32 bg-black/50 p-12 md:p-16 flex flex-col items-center justify-center relative group backdrop-blur-sm border-t border-white/5"
              >
                <div className="mb-16 text-center">
                  <div className="flex items-center justify-center gap-4 mb-8">
                    <div className="text-[10px] uppercase tracking-[0.6em] font-sans font-black text-white/30 italic">
                      PREMIUM CONTENT
                    </div>
                    <span className="flex items-center gap-2 px-3 py-1 bg-white/5 border border-white/20 rounded-none text-[10px] font-black text-white uppercase tracking-widest">
                      <Lock className="w-3 h-3" />
                      {t.premiumBadge}
                    </span>
                  </div>
                   <h3 className="text-5xl md:text-7xl font-serif font-black italic leading-[0.9] text-white">
                    {t.unlockDetailedReport}
                  </h3>
                </div>

                <div className="flex flex-col items-center gap-12">
                  <p className="text-white/40 font-serif italic text-2xl text-center max-w-xl">
                    {isCheckingPayment 
                      ? (lang === 'ko' ? "결제가 완료된 후, 잠시만 기다려 주시면 자동으로 리포트가 생성됩니다. (결제 완료 후 이 창으로 돌아와 주세요)" : "After payment, the report will be generated automatically. (Please return to this window after payment)")
                      : t.simpleLockNote}
                  </p>
                  {isPremiumUser ? (
                    <button
                      onClick={onUpgrade}
                      className="holo-button px-20 py-6 bg-black text-white text-[12px] font-black uppercase tracking-[0.5em] transition-all flex items-center gap-4"
                    >
                      {report.level === 'loading' ? (
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : <RotateCcw className="w-4 h-4" />}
                      {lang === 'ko' ? "심층 분석 내용 보기" : "View Detailed Analysis"}
                    </button>
                  ) : (
                    <div className="flex flex-col items-center gap-4">
                      <button
                        onClick={handlePayment}
                        className="holo-button px-20 py-6 bg-black text-white text-[12px] font-black uppercase tracking-[0.5em] transition-all flex items-center gap-4"
                      >
                        {isCheckingPayment && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                        {isCheckingPayment 
                          ? (lang === 'ko' ? "결제 확인 중..." : "Verifying Payment...")
                          : t.unlockButton}
                      </button>
                      
                      {isCheckingPayment && (
                        <div className="flex flex-col items-center gap-4">
                          <button 
                            onClick={handleManualCheck}
                            className="text-[10px] text-white/40 uppercase tracking-widest hover:text-white transition-colors underline underline-offset-4"
                          >
                            {lang === 'ko' ? "결제 완료 후 클릭 (수동 확인)" : "Click after payment (Manual check)"}
                          </button>
                          <button 
                            onClick={handlePayment}
                            className="text-[10px] text-white/20 uppercase tracking-[0.2em] hover:text-white transition-colors"
                          >
                            {lang === 'ko' ? "결제창이 열리지 않았나요? 결제 다시 시도" : "Popup didn't open? Try again"}
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </motion.div>
            );
          }

          return rendered;
        })()}
        </div>

        {/* Medical / Warning Banner */}
        {report.medicalAdvice && (
          <div className="mb-16 p-6 bg-white opacity-30 flex flex-col md:flex-row items-center gap-12 relative z-10 border border-white/20">
            <div className="w-24 h-24 bg-black flex-shrink-0 flex items-center justify-center text-white border border-white/20">
              <AlertTriangle className="w-10 h-10 text-white" />
            </div>
            <div>
              <div className="text-[11px] uppercase font-sans font-black tracking-[0.8em] text-black mb-4 italic">{t.disclaimer}</div>
              <p className="text-black/80 font-sans leading-relaxed text-xl max-w-4xl italic font-black">{report.medicalAdvice}</p>
            </div>
          </div>
        )}
      </div>

      {/* Save PDF Button */}
      <div className="mt-32 flex justify-center pb-32 hide-in-pdf">
        <button
          onClick={handleSavePdf}
          className="holo-button group flex items-center gap-6 px-20 py-8 text-white font-sans font-black text-[12px] uppercase tracking-[0.6em] shadow-2xl"
        >
          <FileDown className="w-5 h-5 text-white/60 group-hover:text-white transition-colors" />
          {t.savePdf}
        </button>
      </div>


      {/* Feedback / Contact */}
      <div className="mt-24 text-center opacity-30 relative z-10 hide-in-pdf">
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

      <PaymentModal 
        isOpen={isPaymentModalOpen} 
        onClose={() => setIsPaymentModalOpen(false)} 
        lang={lang} 
      />

      {/* Footer Navigation */}
      <footer className="mt-32 pt-20 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-8 opacity-40 relative z-10 hide-in-pdf">
        <div className="flex flex-col items-center md:items-start gap-4">
          <div className="text-3xl font-serif font-black italic text-white/60 mb-2">{t.title}</div>
          <div className="text-[10px] uppercase tracking-[0.4em] mb-4">{t.grandmother}</div>
          <div className="flex items-center gap-8">
            <button onClick={onReset} className="text-[10px] font-sans font-black uppercase tracking-[0.5em] hover:text-white transition-all flex items-center gap-4 group">
              <RotateCcw className="w-4 h-4 group-hover:rotate-180 transition-transform duration-500" /> {t.backToHome}
            </button>
            <Link 
              to="/policies"
              className="text-[10px] font-sans font-black uppercase tracking-[0.5em] hover:text-white transition-all"
            >
              {t.policy}
            </Link>
          </div>
        </div>
        <div className="text-[10px] font-sans font-bold tracking-[0.2em] uppercase">
          © 2026 Yongshinhalmom. LIFESTYLE ANALYSIS REPORT.
        </div>
      </footer>
    </div>
  );
}
