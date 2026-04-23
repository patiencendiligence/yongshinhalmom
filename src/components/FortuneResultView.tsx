import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import ReactMarkdown from 'react-markdown';
import { 
  Stethoscope, 
  MessageCircle, 
  Send, 
  RotateCcw,
  ArrowRight,
  AlertCircle,
  Sun,
  Moon,
  Flame,
  Trees,
  Waves,
  Mountain,
  Bell,
  Zap
} from "lucide-react";
import { FortuneResult, askAdditionalQuestion } from "../services/geminiService";
import { Language, translations } from "../lib/translations";

interface FortuneResultViewProps {
  fortune: FortuneResult;
  onReset: () => void;
  userData: any;
  lang: Language;
}

const Illustration = ({ zodiac }: { zodiac: number }) => {
  // zodiac: 0-5 (Row 1), 6-11 (Row 2)
  // Sheet is 6 cols x 2 rows
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

export default function FortuneResultView({ fortune, onReset, userData, lang }: FortuneResultViewProps) {
  const t = translations[lang];
  const [question, setQuestion] = useState("");
  const [chatHistory, setChatHistory] = useState<{ role: "user" | "halmeom"; text: string }[]>([]);
  const [isAsking, setIsAsking] = useState(false);

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
      const flatFortune = `
        [이전 점사 요약]: ${fortune.summary}
        [상세 내용]: ${fortune.sections.map(s => `${s.title}: ${s.content}`).join("\n")}
      `;
      const answer = await askAdditionalQuestion(`${userDataStr}\n${flatFortune}`, currentQuestion, lang);
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
    // Handling 8 sections with a more dynamic flow
    switch (idx) {
      case 0: return "col-span-12 row-span-auto md:row-span-3"; // Detailed Saju
      case 1: return "col-span-12 md:col-span-6 row-span-2 bg-[#1a1a1a]"; // 2026 Overview
      case 2: return "col-span-12 md:col-span-6 row-span-2 border-mythic-gold/20"; // Today's Fortune
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

      {/* Header Section */}
      <header className="pt-20 pb-16 flex flex-col items-center md:items-start md:flex-row justify-between border-b border-white/5 mb-16 relative z-10">
        <div className="max-w-2xl mb-8 md:mb-0">
          <h1 className="text-6xl md:text-8xl font-serif font-black tracking-tighter text-white italic leading-none mb-6">
            {t.oracleHasSpoken.split('Oracle')[0]} <span className="text-mythic-gold">Oracle</span> <br/>
            {t.oracleHasSpoken.split('Oracle')[1]}
          </h1>
          <p className="text-xl md:text-2xl font-serif text-white/40 italic leading-snug">
            "{fortune.summary}"
          </p>

          {/* Today's Luck Details */}
          <div className="mt-8 flex flex-wrap gap-4">
            {[
              { label: lang === "ko" ? "색상" : "Color", value: fortune.luckInfo.color, icon: "🎨" },
              { label: lang === "ko" ? "아이템" : "Item", value: fortune.luckInfo.item, icon: "💎" },
              { label: lang === "ko" ? "음식" : "Food", value: fortune.luckInfo.food, icon: "🍵" },
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
          
          {/* Dynamic Illustration */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5, type: "spring" }}
            className="p-1 border border-white/5 rounded-xl bg-white/[0.02]"
          >
            <Illustration zodiac={fortune.zodiac} />
          </motion.div>
        </div>
      </header>

      {/* Bento Grid */}
      <div className="grid grid-cols-12 gap-6 mb-24 relative z-10">
        {fortune.sections.map((section, idx) => {
          const isDark = idx === 1 || idx === 3 || idx === 4 || idx === 6;
          const isRed = idx === 5;
          
          return (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              className={`bento-card-refined p-10 flex flex-col group overflow-hidden relative ${getSlotClass(idx)}`}
            >
              <div className={`absolute -right-4 -top-4 text-9xl font-serif font-black italic opacity-[0.03] transition-all group-hover:scale-110 ${(isDark || isRed) ? "opacity-[0.1]" : ""}`}>
                {idx + 1}
              </div>

              <div className="mb-8">
                <div className={`text-[10px] uppercase tracking-[0.4em] font-sans font-black mb-6 ${(isDark || isRed) ? "opacity-60" : "text-mythic-gold"}`}>
                  {t.section} {String(idx + 1).padStart(2, '0')}
                </div>
                <h3 className={`text-2xl md:text-4xl font-serif font-black italic leading-tight text-white`}>
                  {section.title}
                </h3>
              </div>

              <div className={`text-sm md:text-lg font-sans tracking-tight leading-relaxed markdown-container transition-all ${(isDark || isRed) ? "opacity-90" : "text-white/70"}`}>
                <ReactMarkdown>
                  {section.content}
                </ReactMarkdown>
              </div>
            </motion.div>
          )
        })}
      </div>

      {/* Medical / Warning Banner */}
      {fortune.medicalAdvice && (
        <div className="mb-24 p-12 bg-mythic-red/10 border border-mythic-red/20 rounded-[40px] flex items-center gap-10">
          <div className="w-20 h-20 rounded-full bg-mythic-red flex items-center justify-center shrink-0 shadow-xl shadow-red-900/20">
             <AlertCircle className="w-10 h-10 text-white" />
          </div>
          <div>
            <div className="text-[10px] uppercase font-sans font-black tracking-[0.4em] text-mythic-red mb-2">Precautionary Guidance</div>
            <p className="text-xl font-serif italic text-red-100/60 leading-relaxed max-w-4xl">
              {fortune.medicalAdvice}
            </p>
          </div>
        </div>
      )}

      {/* Chat Bot Redesign */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
        <div className="lg:col-span-4 sticky top-12">
          <h2 className="text-5xl font-serif font-black italic mb-6 text-white">{lang === "ko" ? "할멈에게" : "Ask the"} <br/><span className="text-mythic-gold">{lang === "ko" ? "물어보기" : "Spirit"}</span></h2>
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
                  <p className="text-sm tracking-[0.5em] uppercase font-sans font-bold">{lang === "ko" ? "여쭈어 보게나" : "Waiting for your call"}</p>
                </div>
              )}
              {chatHistory.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[80%] ${msg.role === "user" ? "text-right" : "text-left"}`}>
                    <div className="text-[10px] uppercase tracking-widest font-sans font-black opacity-30 mb-2">
                      {msg.role === "user" ? (lang === "ko" ? "의뢰인" : "Client") : (lang === "ko" ? "할멈" : "Oracle")}
                    </div>
                    <div className={`text-lg md:text-xl font-serif italic whitespace-pre-wrap ${msg.role === "user" ? "text-mythic-gold" : "text-white/80"}`}>
                      <ReactMarkdown>{msg.text}</ReactMarkdown>
                    </div>
                  </div>
                </div>
              ))}
              {isAsking && (
                <div className="flex justify-start animate-pulse">
                  <div className="text-xl font-serif italic text-white/20">{lang === "ko" ? "신명이 대답하시네..." : "The spirits are answering..."}</div>
                </div>
              )}
            </div>

            <form onSubmit={handleAsk} className="p-8 bg-black border-t border-white/5 flex gap-4">
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

      {/* Ko-fi Donation Link */}
      <div className="mt-24 flex flex-col items-center justify-center p-8 border border-white/5 rounded-[40px] bg-white/[0.02] relative z-10">
        <p className="text-white/40 text-xs font-sans tracking-[0.3em] uppercase mb-6">{t.kofiNote}</p>
        <a 
          href="https://ko-fi.com/patiencendiligence" 
          target="_blank" 
          rel="noopener noreferrer"
          className="flex items-center gap-4 px-8 py-4 bg-mythic-gold text-black font-sans font-black text-[10px] uppercase tracking-[0.4em] rounded-full hover:scale-105 active:scale-95 transition-all shadow-lg shadow-mythic-gold/20"
        >
          <img src="https://ko-fi.com/img/cup-border.png" alt="Ko-fi" className="w-5 h-5 invert" referrerPolicy="no-referrer" />
          {t.payKofi}
        </a>
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

      {/* Footer Navigation */}
      <footer className="mt-32 pt-20 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-8 opacity-40 relative z-10">
        <div className="flex flex-col items-center md:items-start gap-4">
          <div className="text-3xl font-serif font-black italic text-white/60 mb-2">{t.title}</div>
          <div className="text-[10px] uppercase tracking-[0.4em] mb-4">{t.grandmother}</div>
          <button onClick={onReset} className="text-[10px] font-sans font-black uppercase tracking-[0.5em] hover:text-white transition-all flex items-center gap-4 group">
            <RotateCcw className="w-4 h-4 group-hover:rotate-180 transition-transform duration-500" /> {t.backToHome}
          </button>
        </div>
        <div className="text-[10px] font-sans font-bold tracking-[0.2em] uppercase">
          © 2026 YONG-SIN HALMOM. AUTHENTIC KOREAN ORACLE.
        </div>
      </footer>
    </div>
  );
}
