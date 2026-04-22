import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Stethoscope, 
  MessageCircle, 
  Send, 
  RotateCcw,
  ArrowRight,
  AlertCircle
} from "lucide-react";
import { FortuneResult, askAdditionalQuestion } from "../services/geminiService";

interface FortuneResultViewProps {
  fortune: FortuneResult;
  onReset: () => void;
  userData: any;
}

export default function FortuneResultView({ fortune, onReset, userData }: FortuneResultViewProps) {
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
      const flatFortune = `
        Summary: ${fortune.summary}
        ${fortune.sections.map(s => `${s.title}: ${s.content}`).join("\n")}
      `;
      const answer = await askAdditionalQuestion(flatFortune, currentQuestion);
      setChatHistory((prev) => [...prev, { role: "halmeom", text: answer }]);
    } catch (error) {
      setChatHistory((prev) => [...prev, { role: "halmeom", text: "할멈이 잠시 기력이 쇠했다네..." }]);
    } finally {
      setIsAsking(false);
    }
  };

  const getSlotClass = (idx: number) => {
    switch (idx) {
      case 0: return "col-span-12 md:col-span-8 row-span-2";
      case 1: return "col-span-12 md:col-span-4 row-span-2 bg-[#1a1a1a]";
      case 2: return "col-span-12 md:col-span-6 row-span-2";
      case 3: return "col-span-12 md:col-span-6 row-span-2 bg-[#1a1a1a] text-white";
      case 4: return "col-span-12 md:col-span-4 row-span-2 bg-mythic-red text-white";
      case 5: return "col-span-12 md:col-span-8 row-span-2";
      default: return "col-span-12 md:col-span-4 row-span-2";
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 pb-32 relative">
      <div className="absolute inset-0 mythic-grain pointer-events-none" />

      {/* Header Section */}
      <header className="pt-20 pb-16 flex flex-col items-center md:items-start md:flex-row justify-between border-b border-white/5 mb-16 relative z-10">
        <div className="max-w-2xl mb-8 md:mb-0">
          <div className="flex items-center gap-4 mb-6">
            <div className="obangsaek-circle bg-mythic-gold">01</div>
            <div className="obangsaek-circle bg-mythic-red text-white">02</div>
            <div className="obangsaek-circle bg-white">03</div>
          </div>
          <h1 className="text-6xl md:text-8xl font-serif font-black tracking-tighter text-white italic leading-none mb-6">
            Your <span className="text-mythic-gold">Oracle</span> <br/>
            Has Spoken
          </h1>
          <p className="text-xl md:text-2xl font-serif text-white/40 italic leading-snug">
            "{fortune.summary}"
          </p>
        </div>
        
        <div className="text-center md:text-right flex flex-col justify-end">
          <p className="text-[10px] font-sans font-bold tracking-[0.4em] text-white/20 uppercase mb-4">Authorized Recipient</p>
          <div className="text-4xl md:text-6xl font-serif font-black text-white">{userData.name}</div>
          <p className="text-lg text-white/30 italic mt-2">{userData.birthDate}</p>
        </div>
      </header>

      {/* Bento Grid */}
      <div className="grid grid-cols-12 md:auto-rows-[220px] gap-6 mb-24 relative z-10">
        {fortune.sections.map((section, idx) => {
          const isSpecial = idx === 3 || idx === 4;
          return (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              className={`bento-card-refined p-10 flex flex-col justify-between group overflow-hidden relative ${getSlotClass(idx)}`}
            >
              <div className={`absolute -right-4 -top-4 text-9xl font-serif font-black italic opacity-[0.03] transition-all group-hover:scale-110 ${isSpecial ? "opacity-[0.1]" : ""}`}>
                {idx + 1}
              </div>

              <div>
                <div className={`text-[10px] uppercase tracking-[0.4em] font-sans font-black mb-6 ${isSpecial ? "opacity-60" : "text-mythic-gold"}`}>
                  Section {String(idx + 1).padStart(2, '0')}
                </div>
                <h3 className={`text-2xl md:text-3xl font-serif font-black italic mb-6 leading-tight ${isSpecial ? "" : "text-white"}`}>
                  {section.title}
                </h3>
              </div>

              <div className={`text-sm md:text-base font-sans tracking-tight leading-relaxed ${isSpecial ? "opacity-90" : "text-white/60"}`}>
                {section.content}
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
          <h2 className="text-5xl font-serif font-black italic mb-6 text-white">Ask the <br/><span className="text-mythic-gold">Spirit</span></h2>
          <p className="text-white/30 font-sans leading-relaxed tracking-tight">
            의뢰인의 명운에 대해 더 깊은 통찰이 필요하다면, <br/>
            할멈에게 조심스럽게 여쭈어 보게나. <br/>
            천상의 기운이 아직 이곳에 머물러 있다네.
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
                <div className="h-full flex flex-col items-center justify-center opacity-10 grayscale">
                  <div className="text-8xl font-serif font-black italic mb-4">Question?</div>
                  <p className="text-sm tracking-[0.5em] uppercase font-sans font-bold">Waiting for your call</p>
                </div>
              )}
              {chatHistory.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[80%] ${msg.role === "user" ? "text-right" : "text-left"}`}>
                    <div className="text-[10px] uppercase tracking-widest font-sans font-black opacity-30 mb-2">
                      {msg.role === "user" ? "Client" : "Oracle"}
                    </div>
                    <div className={`text-lg md:text-xl font-serif italic ${msg.role === "user" ? "text-mythic-gold" : "text-white/80"}`}>
                      {msg.text}
                    </div>
                  </div>
                </div>
              ))}
              {isAsking && (
                <div className="flex justify-start animate-pulse">
                  <div className="text-xl font-serif italic text-white/20">The spirits are answering...</div>
                </div>
              )}
            </div>

            <form onSubmit={handleAsk} className="p-8 bg-black border-t border-white/5 flex gap-4">
              <input
                type="text"
                placeholder="여쭈어 볼 것이 있는가?"
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
        <p className="text-white/40 text-xs font-sans tracking-[0.3em] uppercase mb-6">마음에 드셨다면 할멈에게 복채를 주시게나</p>
        <a 
          href="https://ko-fi.com/patiencendiligence" 
          target="_blank" 
          rel="noopener noreferrer"
          className="flex items-center gap-4 px-8 py-4 bg-mythic-gold text-black font-sans font-black text-[10px] uppercase tracking-[0.4em] rounded-full hover:scale-105 active:scale-95 transition-all shadow-lg shadow-mythic-gold/20"
        >
          <img src="https://ko-fi.com/img/cup-border.png" alt="Ko-fi" className="w-5 h-5 invert" referrerPolicy="no-referrer" />
          Give a Ko-fi
        </a>
      </div>

      {/* Footer Navigation */}
      <footer className="mt-32 pt-20 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-8 opacity-40 relative z-10">
        <div className="flex flex-col items-center md:items-start gap-4">
          <button onClick={onReset} className="text-[10px] font-sans font-black uppercase tracking-[0.5em] hover:text-white transition-all flex items-center gap-4 group">
            <RotateCcw className="w-4 h-4 group-hover:rotate-180 transition-transform duration-500" /> New Reading
          </button>
          {/* Visitor Counter Badge */}
          <div className="mt-4 opacity-50 grayscale hover:grayscale-0 transition-all">
            <img 
              src={`https://hits.seeyoufarm.com/api/count/incr/badge.svg?url=${encodeURIComponent(window.location.origin)}&count_bg=%23D4AF37&title_bg=%231A1A1A&icon=&icon_color=%23E7E7E7&title=Visitors&edge_flat=false`} 
              alt="Visitors" 
              referrerPolicy="no-referrer"
            />
          </div>
        </div>
        <div className="text-[10px] font-sans font-bold tracking-[0.2em] uppercase">
          © 2024 YONG-SIN GRANDMOTHER. AUTHENTIC KOREAN ORACLE.
        </div>
      </footer>
    </div>
  );
}
