import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import ReactMarkdown from 'react-markdown';
import { getReport, ReportResult, askAdditionalQuestion } from "../services/geminiService";
import { Language, translations } from "../lib/translations";
import { useAuth } from "../lib/AuthContext";
import { Lock, FileDown, AlertCircle, AlertTriangle, ArrowRight, RotateCcw } from "lucide-react";
import { getManseRyeok } from "../lib/manseRyeok";
import PaymentModal from "./PaymentModal";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

interface ReportResultViewProps {
  report: ReportResult;
  onReset: () => void;
  userData: any;
  lang: Language;
}

const Illustration = ({ zodiac }: { zodiac: number }) => {
  const col = zodiac % 6;
  const row = Math.floor(zodiac / 6);
  
  return (
    <div className="w-32 h-44 overflow-hidden relative border border-white/10 rounded-lg bg-black/20">
      <div 
        className="absolute inset-0 grayscale hover:grayscale-0 transition-all duration-700"
        style={{
          backgroundImage: 'url("zodiac_guardians.png")',
          backgroundSize: '600% 200%',
          backgroundPosition: `${(col / 5) * 100}% ${(row / 1) * 100}%`,
          backgroundRepeat: 'no-repeat'
        }}
      />
    </div>
  );
};

export default function ReportResultView({ report, onReset, userData, lang }: ReportResultViewProps) {
  const t = (translations[lang] as any);
  const { user, profile, login, markAsPaid } = useAuth();
  const [question, setQuestion] = useState("");
  const [chatHistory, setChatHistory] = useState<{ role: "user" | "halmeom"; text: string }[]>([]);
  const [isAsking, setIsAsking] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);

  const isPremium = profile?.isPremium === true;
  const manseRyeok = getManseRyeok(userData.birthDate, userData.birthTime, userData.isLunar);

  // Swap Sections 2 (idx 1) and 3 (idx 2)
  const displaySections = [...report.sections];
  if (displaySections.length > 2) {
    const temp = displaySections[1];
    displaySections[1] = displaySections[2];
    displaySections[2] = temp;
  }

  const handlePayment = async () => {
    if (!user) {
      await login();
      return;
    }
    setIsPaymentModalOpen(true);
    // User can manually be marked as paid via a separate logic or admin, 
    // for now we'll allow developer to use markAsPaid for testing or use a button in modal
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

  const handleAsk = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim()) return;

    const currentQuestion = question;
    setQuestion("");
    setChatHistory((prev) => [...prev, { role: "user", text: currentQuestion }]);
    setIsAsking(true);

    try {
      const userDataStr = `
        의뢰인 이름: ${userData.name}
        생년월일: ${userData.birthDate}
        성별: ${userData.gender}
        역구분: ${userData.isLunar ? "음력" : "양력"}
      `;
      const flatReport = `
        [기존 분석 요약]: ${report.summary}
        [상세 내용]: ${report.sections.map(s => `${s.title}: ${s.content}`).join("\n")}
        위 분석 내용을 바탕으로 사용자가 궁금해하는 질문에 대해 데이터 기반의 추가 인사이트를 제공하게. (전문적인 톤 유지)
      `;
      const answer = await askAdditionalQuestion(`${userDataStr}\n${flatReport}`, currentQuestion, lang);
      setChatHistory((prev) => [...prev, { role: "halmeom", text: answer }]);
    } catch (error: any) {
      console.error("Chat error:", error);
      const isQuota = error?.message?.includes("429") || error?.status === 429 || JSON.stringify(error).includes("429");
      const msg = isQuota ? (translations[lang] as any).quotaExceeded : t.errorMessage;
      setChatHistory((prev) => [...prev, { role: "halmeom", text: msg }]);
    } finally {
      setIsAsking(false);
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
    <div className="max-w-7xl mx-auto px-4 pb-32 relative">
      <div className="absolute inset-0 mythic-grain pointer-events-none" />

      <div id="report-content">
        {/* Header Section */}
        <header className="pt-20 pb-16 flex flex-col items-center md:items-start md:flex-row justify-between border-b border-white/5 mb-8 relative z-10">
          <div className="max-w-2xl mb-8 md:mb-0">
            <h1 className="text-6xl md:text-8xl font-serif font-black tracking-tighter text-white italic leading-none mb-6">
              {t.oracleHasSpoken.split('Report')[0]} <span className="text-mythic-gold">Report</span> <br/>
              {t.oracleHasSpoken.split('Report')[1]}
            </h1>
            <p className="text-xl md:text-2xl font-serif text-white/40 italic leading-snug">
              "{report.summary}"
            </p>

            <div className="mt-8 flex flex-wrap gap-4">
              {[
                { label: lang === "ko" ? "색상" : "Color", value: report.luckInfo.color, icon: "🎨" },
                { label: lang === "ko" ? "아이템" : "Item", value: report.luckInfo.item, icon: "💎" },
                { label: lang === "ko" ? "음식" : "Food", value: report.luckInfo.food, icon: "🍵" },
              ].map((luck, i) => (
                <div key={i} className="px-4 py-2 bg-white/5 border border-white/10 rounded-full flex items-center gap-3">
                  <span className="text-xs">{luck.icon}</span>
                  <span className="text-[10px] font-sans font-black uppercase tracking-widest text-mythic-gold">{luck.label}:</span>
                  <span className="text-xs text-white/80">{luck.value}</span>
                </div>
              ))}
            </div>
          </div>
          
          <div className="text-center md:text-right flex flex-col justify-end items-center md:items-end">
            <p className="text-[10px] font-sans font-bold tracking-[0.4em] text-white/20 uppercase mb-4">{t.authorizedRecipient}</p>
            <div className="text-4xl md:text-6xl font-serif font-black text-white">{userData.name}</div>
            <p className="text-lg text-white/30 italic mt-2 mb-6">{userData.birthDate} ({userData.isLunar ? t.lunar : t.solar})</p>
            
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.5, type: "spring" }}
              className="p-1 border border-white/5 rounded-xl bg-white/[0.02]"
            >
              <Illustration zodiac={report.zodiac} />
            </motion.div>
          </div>
        </header>

        {/* Manse-ryeok Section */}
        <div className="mb-8 p-6 bg-white/[0.02] border border-white/5 rounded-2xl flex flex-col items-center md:items-start gap-4">
          <div className="text-[10px] uppercase font-sans font-black tracking-[0.4em] text-mythic-gold opacity-60">{t.manseRyeok}</div>
          <div className="text-2xl md:text-4xl font-serif font-black italic text-white/80 tracking-tighter">
            {manseRyeok.full}
          </div>
        </div>

        {/* Bento Grid */}
        <div className="grid grid-cols-12 gap-6 mb-24 relative z-10">
        {displaySections.map((section, idx) => {
          const isDark = idx === 2 || idx === 3 || idx === 4 || idx === 6; // idx 1 (Today) is light, idx 2 (Overview) is dark
          const isRed = idx === 5;
          // After swap: 0 (Saju), 1 (Today), 2 (Overview) are unlocked. 3 onwards are locked and grouped.
          const isUnpaidLocked = !isPremium && idx >= 3;
          
          if (isUnpaidLocked && idx > 3) return null; // Only render the group block at index 3

          return (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              className={`bento-card-refined p-10 flex flex-col group overflow-hidden relative ${isUnpaidLocked ? "col-span-12 py-20 bg-black/40 border-mythic-gold/10" : getSlotClass(idx)}`}
              data-premium-section={idx >= 3 ? "true" : undefined}
            >
              <div className={`absolute -right-4 -top-4 text-9xl font-serif font-black italic opacity-[0.03] transition-all group-hover:scale-110 ${(isDark || isRed) ? "opacity-[0.1]" : ""}`}>
                {idx + 1}
              </div>

              <div className="mb-8">
                <div className={`flex items-center gap-3 mb-6`}>
                  <div className={`text-[10px] uppercase tracking-[0.4em] font-sans font-black ${(isDark || isRed) ? "opacity-60" : "text-mythic-gold"}`}>
                    {idx === 0 ? t.freeTaste : isUnpaidLocked ? t.premiumFeature : t.section + " " + String(idx + 1).padStart(2, '0')}
                  </div>
                  {isUnpaidLocked && (
                    <span className="flex items-center gap-1.5 px-2 py-0.5 bg-mythic-red/20 border border-mythic-red/30 rounded text-[9px] font-black text-mythic-red uppercase tracking-tight">
                      <Lock className="w-2.5 h-2.5" />
                      {t.premiumBadge}
                    </span>
                  )}
                </div>
                <h3 className={`text-2xl md:text-5xl font-serif font-black italic leading-tight text-white ${isUnpaidLocked ? "text-center mb-12" : ""}`}>
                  {isUnpaidLocked ? t.unlockDetailedReport : section.title}
                </h3>
              </div>

              <div className={`relative flex-1 ${isUnpaidLocked ? "flex flex-col items-center" : ""}`}>
                {!isUnpaidLocked ? (
                  <div className={`text-sm md:text-lg font-sans tracking-tight leading-relaxed markdown-container transition-all ${(isDark || isRed) ? "opacity-90" : "text-white/70"}`}>
                    <ReactMarkdown>
                      {section.content}
                    </ReactMarkdown>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-8">
                    <p className="text-white/40 font-serif italic text-lg text-center max-w-md">
                      {t.simpleLockNote}
                    </p>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={handlePayment}
                      className="px-12 py-6 bg-mythic-gold text-black text-[12px] font-black uppercase tracking-[0.3em] rounded-full shadow-2xl shadow-mythic-gold/40 hover:bg-white transition-colors"
                    >
                      {t.unlockButton}
                    </motion.button>
                  </div>
                )}
              </div>
            </motion.div>
          )
        })}
      </div>

      {/* Medical / Warning Banner */}
      {report.medicalAdvice && (
        <div className="mb-12 p-12 bg-mythic-red/10 border border-mythic-red/20 rounded-[40px] flex items-center gap-10 relative z-10">
          <div className="w-16 h-16 bg-mythic-red rounded-full flex-shrink-0 flex items-center justify-center text-white shadow-lg shadow-mythic-red/20">
            <AlertTriangle className="w-8 h-8" />
          </div>
          <div>
            <div className="text-[10px] uppercase font-sans font-black tracking-[0.4em] text-mythic-red mb-2">{t.disclaimer}</div>
            <p className="text-white/60 font-sans leading-relaxed text-sm md:text-base">{report.medicalAdvice}</p>
          </div>
        </div>
      )}

    

      </div>

      {/* Chat Bot Section - Premium Only - Tagged for PDF hiding */}
      {isPremium && (
        <div data-premium-section="true" className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start mb-24 relative z-10">
          <div className="lg:col-span-4 sticky top-12">
            <h2 className="text-5xl font-serif font-black italic mb-6 text-white">{t.askSpirit}</h2>
            <p className="text-white/30 font-sans leading-relaxed tracking-tight whitespace-pre-line">
              {t.askSpiritDetail}
            </p>
            <div className="mt-12 flex gap-4">
              <div className="w-12 h-1 bg-mythic-gold" />
              <div className="w-12 h-1 bg-white/10" />
              <div className="w-12 h-1 bg-white/10" />
            </div>
          </div>

          <div className="lg:col-span-8">
            <div className="bento-card-refined h-[600px] flex flex-col overflow-hidden bg-[#0a0a0a]">
              <div className="flex-1 overflow-y-auto p-12 space-y-10 no-scrollbar">
                {chatHistory.length === 0 && (
                  <div className="h-full flex flex-col items-center justify-center opacity-10 grayscale text-center">
                    <div className="text-8xl font-serif font-black italic mb-4">{lang === "ko" ? "무엇이든" : "Question?"}</div>
                    <p className="text-sm tracking-[0.5em] uppercase font-sans font-bold">{lang === "ko" ? "분석이 가능하네" : "Analysis Ready"}</p>
                  </div>
                )}
                {chatHistory.map((msg, i) => (
                  <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[80%] ${msg.role === "user" ? "text-right" : "text-left"}`}>
                      <div className="text-[10px] uppercase tracking-widest font-sans font-black opacity-30 mb-2">
                        {msg.role === "user" ? (lang === "ko" ? "의뢰인" : "Client") : t.halmeomSpirit}
                      </div>
                      <div className={`text-lg md:text-xl font-serif italic whitespace-pre-wrap ${msg.role === "user" ? "text-mythic-gold" : "text-white/80"}`}>
                        <ReactMarkdown>{msg.text}</ReactMarkdown>
                      </div>
                    </div>
                  </div>
                ))}
                {isAsking && (
                  <div className="flex justify-start animate-pulse">
                    <div className="text-xl font-serif italic text-white/20">{lang === "ko" ? "패턴 분석 중..." : "Analyzing patterns..."}</div>
                  </div>
                )}
              </div>

              <form onSubmit={handleAsk} className="p-8 bg-black border-t border-white/5 flex gap-4 relative">
                <input
                  type="text"
                  placeholder={t.askPlaceholder}
                  className="flex-1 bg-transparent border-b border-white/10 px-0 py-4 focus:border-mythic-gold outline-none transition-all font-serif text-xl text-white placeholder:text-white/5"
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  disabled={isAsking}
                />
                <button
                  type="submit"
                  disabled={isAsking || !question.trim()}
                  className="w-16 h-16 bg-white rounded-full flex items-center justify-center text-black hover:bg-mythic-gold transition-all hover:scale-110 active:scale-95 disabled:opacity-20"
                >
                  <ArrowRight className="w-6 h-6" />
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Save PDF Button */}
      <div className="mt-12 flex justify-center pb-24 border-b border-white/5">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleSavePdf}
          className="flex items-center gap-4 px-12 py-6 bg-white/5 border border-white/10 text-white/60 font-sans font-black text-[12px] uppercase tracking-[0.5em] rounded-full hover:bg-white/10 hover:text-white transition-all shadow-xl backdrop-blur-md"
        >
          <FileDown className="w-5 h-5" />
          {t.savePdf}
        </motion.button>
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
            <a href="/policy" target="_blank" className="text-[10px] font-sans font-black uppercase tracking-[0.5em] hover:text-white transition-all">
              {t.policy}
            </a>
          </div>
        </div>
        <div className="text-[10px] font-sans font-bold tracking-[0.2em] uppercase">
          © 2026 Yongshinhalmom. LIFESTYLE ANALYSIS REPORT.
        </div>
      </footer>
    </div>
  );
}
