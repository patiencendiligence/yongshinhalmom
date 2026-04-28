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

import zodiacGuardians from "../zodiac_guardians.png";

interface ReportResultViewProps {
  report: ReportResult;
  onReset: () => void;
  onOpenPolicy: () => void;
  onLogin?: () => Promise<void>;
  userData: any;
  lang: Language;
}

const Illustration = ({ zodiac }: { zodiac: number }) => {
  const col = zodiac % 6;
  const row = Math.floor(zodiac / 6);
  
  return (
    <div className="w-32 h-44 overflow-hidden relative border border-white/10 rounded-lg bg-neutral-900">
      <div 
        className="absolute inset-0 grayscale hover:grayscale-0 transition-all duration-700"
        style={{
          backgroundImage: `url("${zodiacGuardians}")`,
          backgroundSize: '600% 200%',
          backgroundPosition: `${(col / 5) * 100}% ${(row / 1) * 100}%`,
          backgroundRepeat: 'no-repeat'
        }}
      />
    </div>
  );
};

export default function ReportResultView({ report, onReset, onOpenPolicy, onLogin, userData, lang }: ReportResultViewProps) {
  const t = (translations[lang] as any);
  const { user, profile, login, markAsPaid, checkPaymentStatus } = useAuth();
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  
  const reportHash = React.useMemo(() => getReportHash(userData), [userData]);
  const [isCurrentlyPaid, setIsCurrentlyPaid] = useState(() => storageService.isLocalPaid(reportHash));

  // Check if this specific report is paid
  React.useEffect(() => {
    const checkStatus = async () => {
      // If we already know it's paid locally, we can still verify with server
      if (user && reportHash) {
        const paid = await checkPaymentStatus(reportHash);
        if (paid) {
          setIsCurrentlyPaid(true);
          storageService.setPaidHash(reportHash);
        }
      }
    };
    checkStatus();
  }, [user, reportHash, checkPaymentStatus]);

  const isPremium = isCurrentlyPaid || profile?.isPremium === true;
  const manseRyeok = getManseRyeok(userData.birthDate, userData.birthTime, userData.isLunar);

  // Swap Sections 2 (idx 1) and 3 (idx 2)
  const displaySections = [...report.sections];
  if (displaySections.length > 2) {
    const temp = displaySections[1];
    displaySections[1] = displaySections[2];
    displaySections[2] = temp;
  }

  const handlePayment = async () => {
    console.log("handlePayment triggered, user status:", !!user);
    if (!user) {
      if (onLogin) {
        await onLogin();
      } else {
        await login();
      }
      return;
    }
    
    // Save current hash for redirect recovery
    sessionStorage.setItem("yongshin_pending_pay_hash", reportHash);
    
    // Polar Payment Link
    const polarUrl = "https://buy.polar.sh/polar_cl_ypvnbPpvJaL5lsVY8n3UWuXLzMTVlnZDS82YE1HPBMN";
    
    // Using window.open for checkout links is more reliable in iframes
    window.open(polarUrl, "_blank", "noreferrer");
  };

  const handleSavePdf = async () => {
    const element = document.getElementById("report-content");
    if (!element) return;

    try {
      const canvas = await html2canvas(element, {
        backgroundColor: "#000",
        scale: 2,
        useCORS: true,
        logging: false,
        onclone: (clonedDoc) => {
          // 1. Disable ALL original styles to prevent oklab/modern CSS parsing errors
          for (let i = 0; i < clonedDoc.styleSheets.length; i++) {
            clonedDoc.styleSheets[i].disabled = true;
          }

          // 2. Hide Premium sections for non-premium users in the PDF clone
          if (!isPremium) {
            const premiumSections = clonedDoc.querySelectorAll('[data-premium-section="true"]');
            premiumSections.forEach(node => {
              (node as HTMLElement).style.display = 'none';
            });
          }

          // 3. Inject Ultra-Stable PDF Styles (HEX ONLY)
          const style = clonedDoc.createElement('style');
          style.innerHTML = `
            * { box-sizing: border-box !important; -webkit-print-color-adjust: exact !important; }
            body { background: #000000 !important; font-family: sans-serif !important; margin: 0; padding: 0; }
            #report-content { 
              background: #000000 !important; 
              color: #ffffff !important; 
              padding: 60px !important; 
              width: 1200px !important; 
            }
            
            /* Typography with proper line-height for readability */
            .font-serif { font-family: serif !important; }
            h1 { color: #ffd60a !important; line-height: 1.2 !important; font-size: 54px !important; margin-bottom: 40px !important; }
            h3 { color: #ffd60a !important; line-height: 1.5 !important; font-size: 28px !important; margin-bottom: 24px !important; }
            p, div, span { line-height: 2.2 !important; font-size: 16px !important; }
            
            /* Structural Bento Cards */
            .bento-card-refined { 
              background-color: #111111 !important; 
              border: 1px solid #333333 !important;
              border-radius: 40px !important;
              padding: 50px !important;
              margin-bottom: 60px !important;
              display: block !important;
              page-break-inside: avoid !important;
              overflow: visible !important;
            }
            
            /* Ensure text wrapping */
            .markdown-container { word-break: break-word !important; overflow-wrap: break-word !important; }
            
            /* Layout Helpers */
            .flex { display: flex !important; }
            .items-center { align-items: center !important; }
            .gap-10 { margin-right: 40px !important; }
            
            .text-mythic-gold { color: #ffd60a !important; }
            .text-mythic-red { color: #ff3b30 !important; }
            .bg-mythic-red { background-color: #ff3b30 !important; }
            .rounded-full { border-radius: 9999px !important; border: 1px solid #333333 !important; padding: 12px 24px !important; }
            
            /* Limit scaling */
            #report-content { transform-origin: top left !important; }
            
            * { box-shadow: none !important; text-shadow: none !important; backdrop-filter: none !important; transition: none !important; }
          `;
          clonedDoc.head.appendChild(style);

          const clonedElement = clonedDoc.getElementById("report-content");
          if (clonedElement) {
            clonedElement.style.background = "#000000";
            clonedElement.style.color = "#ffffff";
          }
        }
      });
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");
      const imgProps = pdf.getImageProperties(imgData);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
      
      pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
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
            <div className="mb-8 p-1.5 border border-white/5 rounded-2xl bg-white/[0.02]">
              <Illustration zodiac={report.zodiac} />
            </div>
            <div className="text-[10px] font-sans font-bold tracking-[0.5em] text-white/20 uppercase mb-4">{t.authorizedRecipient}</div>
            <div className="text-5xl md:text-7xl font-serif font-black text-white italic">{userData.name}</div>
            <p className="text-xl text-white/20 italic mt-4">{userData.birthDate} ({userData.isLunar ? t.lunar : t.solar})</p>
          </div>
        </header>

        {/* Manse-ryeok - Museum Label Style */}
        <div className="mb-16 flex flex-col md:flex-row items-baseline gap-8 border-l-[1px] border-white/20 pl-8">
          <div className="text-[11px] uppercase font-sans font-black tracking-[0.6em]">{t.manseRyeok}</div>
          <div className="text-3xl md:text-5xl font-serif font-black italic text-white/80 tracking-tighter">
            {manseRyeok.full}
          </div>
        </div>

        {/* Bento Grid with Refined Design */}
        <div className="grid grid-cols-12 gap-px bg-white/10 mb-32 relative z-10 border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
        {displaySections.map((section, idx) => {
          const isDark = idx === 2 || idx === 3 || idx === 4 || idx === 6; // idx 1 (Today) is light, idx 2 (Overview) is dark
          const isRed = idx === 5;
          // After swap: 0 (Saju), 1 (Today), 2 (Overview) are unlocked. 3 onwards are locked and grouped.
          const isUnpaidLocked = !isPremium && idx >= 3;
          
          if (isUnpaidLocked && idx > 3) return null; // Only render the group block at index 3

          return (
            <motion.div
              key={idx}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: idx * 0.05 }}
              className={`bg-black p-12 md:p-16 flex flex-col relative group ${isUnpaidLocked ? "col-span-12 py-32" : getSlotClass(idx)}`}
              data-premium-section={idx >= 3 ? "true" : undefined}
            >
              <div className="mb-12">
                <div className="flex items-center gap-4 mb-8">
                  <div className="text-[10px] uppercase tracking-[0.6em] font-sans font-black text-white/30 italic">
                    {idx === 0 ? "FREE TRIAL" : isUnpaidLocked ? "PREMIUM CONTENT" : `CHAPTER ${String(idx + 1).padStart(2, '0')}`}
                  </div>
                  {isUnpaidLocked && (
                    <span className="flex items-center gap-2 px-3 py-1 bg-white/5 border border-white/20 rounded-none text-[10px] font-black text-white uppercase tracking-widest">
                      <Lock className="w-3 h-3" />
                      {t.premiumBadge}
                    </span>
                  )}
                </div>
                <h3 className={`text-3xl md:text-4xl font-serif font-black italic leading-[0.9] text-white ${isUnpaidLocked ? "text-center mb-16 text-5xl md:text-7xl" : ""}`}>
                  {isUnpaidLocked ? t.unlockDetailedReport : section.title}
                </h3>
              </div>

              {!isUnpaidLocked ? (
                <div className="text-md md:text-md font-sans tracking-tight leading-relaxed markdown-container text-white/70">
                  <ReactMarkdown>
                    {section.content}
                  </ReactMarkdown>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-12">
                  <p className="text-white/40 font-serif italic text-2xl text-center max-w-xl">
                    {t.simpleLockNote}
                  </p>
                  <button
                    onClick={handlePayment}
                    className="holo-button px-20 py-6 bg-black text-white text-[12px] font-black uppercase tracking-[0.5em] transition-all"
                  >
                    {t.unlockButton}
                  </button>
                </div>
              )}
            </motion.div>
          )
        })}
        </div>

        {/* Medical / Warning Banner */}
        {report.medicalAdvice && (
          <div className="mb-16 p-6 bg-white opatcity-30 flex flex-col md:flex-row items-center gap-12 relative z-10 border border-white/20">
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
      <div className="mt-32 flex justify-center pb-32">
        <button
          onClick={handleSavePdf}
          className="holo-button group flex items-center gap-6 px-20 py-8 text-white font-sans font-black text-[12px] uppercase tracking-[0.6em] shadow-2xl"
        >
          <FileDown className="w-5 h-5 text-white/60 group-hover:text-white transition-colors" />
          {t.savePdf}
        </button>
      </div>


      {/* Feedback / Contact */}
      <div className="mt-24 text-center opacity-30 relative z-10">
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
      <footer className="mt-32 pt-20 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-8 opacity-40 relative z-10">
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
