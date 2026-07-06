import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Moon, Sparkles, AlertCircle, Calendar, Scroll, HeartPulse, ShieldAlert, Sparkle } from "lucide-react";
import { Language } from "../lib/translations";

interface DreamModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang: Language;
}

interface DreamResult {
  summary: string;
  dreamAnalysis: string;
  realityConnection: string;
  luckyAdvice: string;
}

export default function DreamModal({ isOpen, onClose, lang }: DreamModalProps) {
  const [dreamText, setDreamText] = useState("");
  const [isInterpreting, setIsInterpreting] = useState(false);
  const [result, setResult] = useState<DreamResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [canInterpretToday, setCanInterpretToday] = useState(true);
  const [lastDreamDate, setLastDreamDate] = useState<string | null>(null);

  // Helper to get KST Date String (YYYY-MM-DD)
  const getKSTDateString = () => {
    const now = new Date();
    const kst = new Date(now.getTime() + 9 * 60 * 60 * 1000);
    return kst.toISOString().split("T")[0];
  };

  // Reset and check daily limit when modal opens
  useEffect(() => {
    if (isOpen) {
      const todayKST = getKSTDateString();
      const storedDate = localStorage.getItem("last_dream_date");
      const storedResult = localStorage.getItem("last_dream_result");
      
      if (storedDate === todayKST) {
        setCanInterpretToday(false);
        setLastDreamDate(todayKST);
        if (storedResult) {
          try {
            setResult(JSON.parse(storedResult));
          } catch (e) {
            console.error("Failed to parse cached dream result:", e);
          }
        }
      } else {
        setCanInterpretToday(true);
        setResult(null);
        setDreamText("");
      }
      setError(null);
    }
  }, [isOpen]);

  const handleInterpret = async () => {
    if (!dreamText.trim()) {
      setError(lang === "ko" ? "꿈 내용을 입력해 주게나." : "Please enter your dream.");
      return;
    }
    if (dreamText.trim().length < 10) {
      setError(
        lang === "ko"
          ? "꿈을 너무 짧게 적으면 풀 수가 없다네. 조금 더 자세히(10자 이상) 적어주게."
          : "Please write your dream with a bit more detail (at least 10 characters)."
      );
      return;
    }

    const todayKST = getKSTDateString();
    const storedDate = localStorage.getItem("last_dream_date");
    if (storedDate === todayKST) {
      setError(
        lang === "ko"
          ? "이미 오늘 하루 해몽을 마쳤구만. 내일 새로운 꿈이 찾아오면 다시 오게나."
          : "You have already interpreted a dream today. Come back tomorrow with a new dream."
      );
      return;
    }

    setIsInterpreting(true);
    setError(null);

    try {
      const response = await fetch("/api/generate-dream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dreamText, lang }),
      });

      if (!response.ok) {
        const errJson = await response.json().catch(() => ({}));
        throw new Error(errJson.error || "Failed to generate interpretation");
      }

      const data = await response.json();
      setResult(data);
      
      // Save to localStorage
      localStorage.setItem("last_dream_date", todayKST);
      localStorage.setItem("last_dream_result", JSON.stringify(data));
      setCanInterpretToday(false);
    } catch (err: any) {
      console.error(err);
      setError(
        lang === "ko"
          ? "신비한 기운이 흩어져 꿈을 풀지 못했네. 잠시 후 다시 시도해 주게나."
          : "The mystical energy dispersed and could not interpret the dream. Please try again in a moment."
      );
    } finally {
      setIsInterpreting(false);
    }
  };

  const handleResetForTesting = () => {
    localStorage.removeItem("last_dream_date");
    localStorage.removeItem("last_dream_result");
    setCanInterpretToday(true);
    setResult(null);
    setDreamText("");
    setError(null);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md overflow-y-auto">
          <motion.div
            initial={{ opacity: 0, scale: 1.05, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 1.05, y: 15 }}
            className="w-full max-w-2xl bg-black border border-white/20 rounded-none overflow-hidden shadow-[0_0_100px_rgba(255,255,255,0.05)] relative my-8"
          >
            {/* Traditional Header Pattern */}
            <div className="p-8 border-b border-white/10 flex justify-between items-center bg-white/[0.02] relative z-10">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-white flex items-center justify-center text-black">
                  <Moon className="w-6 h-6 animate-pulse" />
                </div>
                <div>
                  <h2 className="text-2xl font-serif font-black italic text-white tracking-tight">
                    {lang === "ko" ? "신묘한 할멈 꿈해몽" : "Grandma's Dream Interpretation"}
                  </h2>
                  <p className="text-[10px] text-white/30 tracking-[0.6em] uppercase font-sans font-black mt-1">
                    Mystical Dream Oracle
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-3 hover:bg-white/10 transition-all border border-white/10"
              >
                <X className="w-6 h-6 text-white" />
              </button>
            </div>

            {/* Scrollable Content Container */}
            <div className="p-6 md:p-8 space-y-6 max-h-[70vh] overflow-y-auto no-scrollbar relative z-10">
              {!result ? (
                <>
                  {/* Guidelines Segment */}
                  <div className="p-6 bg-white/[0.02] border border-white/5 rounded-none space-y-4">
                    <div className="flex items-center gap-2 text-mythic-gold">
                      <Scroll className="w-4 h-4 text-[#ffd700]" />
                      <span className="font-serif italic text-sm text-[#ffd700]">
                        {lang === "ko" ? "꿈을 올바르게 풀이하는 법" : "How to properly unfold a dream"}
                      </span>
                    </div>
                    <div className="text-white/85 text-xs md:text-sm font-sans space-y-4 leading-relaxed whitespace-pre-line">
                      {lang === "ko" ? (
                        <>
                          <p className="font-serif font-black italic text-base text-white/95">
                            "꿈은 대충 들으면 대충밖에 못 푸는 법이라네. 자네가 아래 내용을 한 번에 자세히 적어주면, 내가 꿈속 기운부터 현실과 이어지는 의미까지 차근차근 풀어주겠네."
                          </p>
                          <div className="pl-2 border-l border-[#ffd700]/30 space-y-3 text-white/75">
                            <p>
                              <strong className="text-white">🌙 아래 내용을 함께 적어보게.</strong>
                            </p>
                            <p>
                              <strong>1. 꿈 내용을 처음부터 끝까지 이야기해 보게.</strong>
                              <br />
                              어떤 일이 있었는지 순서대로 적어주면 좋다네.
                            </p>
                            <p>
                              <strong>2. 꿈 전체 분위기는 어떠했나?</strong>
                              <br />
                              즐거웠는지 / 무서웠는지 / 불안했는지 / 평온했는지 / 답답했는지
                            </p>
                            <p>
                              <strong>3. 가장 기억에 남는 사람, 동물, 물건, 장소는 무엇이었나?</strong>
                              <br />
                              최대한 자세히 적어보게.
                            </p>
                            <p>
                              <strong>4. 자네는 꿈속에서 무엇을 했나?</strong>
                              <br />
                              도망쳤는지 / 싸웠는지 / 울었는지 / 바라보기만 했는지 / 누군가와 이야기했는지
                            </p>
                            <p>
                              <strong>5. 가장 선명하게 기억나는 장면이나 소리, 냄새, 감각이 있었나?</strong>
                            </p>
                            <p>
                              <strong>6. 요즘 현실에서 고민하거나 신경 쓰이는 일이 있다면 함께 적어보게.</strong>
                              <br />
                              직장 / 연애 / 가족 / 건강 / 돈 / 인간관계 / 진로 등 무엇이든 좋다네.
                            </p>
                          </div>
                          <p className="text-white/60">
                            이렇게 적어주면 꿈속 상징과 자네의 현재 운의 흐름을 함께 살펴 제대로 풀어주겠네.
                          </p>
                        </>
                      ) : (
                        <>
                          <p className="font-serif font-black italic text-base text-white/95">
                            "A poorly told dream can only be poorly solved. If you write down the following details together, I will unfold your dream's energy and its connection to reality."
                          </p>
                          <div className="pl-2 border-l border-[#ffd700]/30 space-y-3 text-white/75">
                            <p>
                              <strong className="text-white">🌙 Please include these details:</strong>
                            </p>
                            <p>
                              <strong>1. Narrate the dream from beginning to end.</strong>
                            </p>
                            <p>
                              <strong>2. What was the overall atmosphere?</strong>
                              <br />
                              Pleasant, scary, anxious, peaceful, or suffocating?
                            </p>
                            <p>
                              <strong>3. What stood out the most (person, animal, object, place)?</strong>
                            </p>
                            <p>
                              <strong>4. What did you do in the dream?</strong>
                              <br />
                              Fled, fought, cried, observed, or conversed?
                            </p>
                            <p>
                              <strong>5. Any vivid scenes, sounds, smells, or tactile sensations?</strong>
                            </p>
                            <p>
                              <strong>6. Any current real-life worries?</strong>
                              <br />
                              Job, love, family, health, money, relationships, or career.
                            </p>
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Text Input Area */}
                  <div className="space-y-2">
                    <label className="block text-xs uppercase font-sans font-black tracking-widest text-white/50">
                      {lang === "ko" ? "꿈 이야기 적기" : "Your Dream Details"}
                    </label>
                    <textarea
                      value={dreamText}
                      onChange={(e) => setDreamText(e.target.value)}
                      disabled={isInterpreting}
                      rows={6}
                      placeholder={
                        lang === "ko"
                          ? "위 안내에 따라 꿈속 분위기, 기억에 남는 사물, 최근의 현실 고민 등을 자유롭고 상세하게 적어주시게나..."
                          : "According to the guidelines above, write down your dream atmosphere, memorable objects, and recent real-life concerns in detail..."
                      }
                      className="w-full bg-white/[0.03] border border-white/20 p-4 font-sans text-sm text-white placeholder-white/30 focus:outline-none focus:border-white/50 transition-all rounded-none resize-none leading-relaxed"
                    />
                  </div>

                  {/* Error Notification */}
                  {error && (
                    <div className="flex items-center gap-3 p-4 bg-red-950/40 border border-red-900/50 text-red-200 text-xs">
                      <AlertCircle className="w-4 h-4 flex-shrink-0 text-red-400" />
                      <span>{error}</span>
                    </div>
                  )}

                  {/* Action buttons */}
                  <div className="pt-4 flex flex-col md:flex-row gap-4">
                    <button
                      onClick={onClose}
                      disabled={isInterpreting}
                      className="w-full md:w-1/3 py-4 border border-white/10 hover:bg-white/5 text-white/60 font-sans font-black text-xs uppercase tracking-[0.4em] transition-all"
                    >
                      {lang === "ko" ? "닫기" : "Close"}
                    </button>
                    <button
                      onClick={handleInterpret}
                      disabled={isInterpreting || !canInterpretToday}
                      className="w-full md:w-2/3 py-4 bg-white text-black font-sans font-black text-xs uppercase tracking-[0.4em] transition-all hover:bg-white/90 disabled:bg-white/20 disabled:text-white/40 flex items-center justify-center gap-2"
                    >
                      {isInterpreting ? (
                        <>
                          <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                          <span>{lang === "ko" ? "기운을 살피는 중..." : "Reading Energy..."}</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4" />
                          <span>{lang === "ko" ? "해몽하기" : "Interpret Dream"}</span>
                        </>
                      )}
                    </button>
                  </div>

                  {!canInterpretToday && (
                    <p className="text-center text-[11px] text-[#ffd700] tracking-wider pt-2">
                      {lang === "ko"
                        ? "※ 꿈해몽은 정신의 기운을 크게 소모하므로 하루에 한 번만 가능합니다."
                        : "※ Dream interpretation consumes deep energy and is limited to once a day."}
                    </p>
                  )}
                </>
              ) : (
                /* Interpretation Results View */
                <div className="space-y-6">
                  {/* One Line Summary */}
                  <div className="p-6 bg-white/[0.03] border-l-4 border-[#ffd700] relative">
                    <div className="absolute right-4 top-4 text-white/10">
                      <Moon className="w-12 h-12" />
                    </div>
                    <span className="text-[10px] font-sans font-black uppercase tracking-widest text-white/40 block mb-2">
                      {lang === "ko" ? "할멈의 일침 요약" : "Grandma's One-line Summary"}
                    </span>
                    <p className="text-lg md:text-xl font-serif font-black italic text-white leading-relaxed">
                      "{result.summary}"
                    </p>
                  </div>

                  {/* Section 1: Dream Analysis */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Scroll className="w-4 h-4 text-white/50" />
                      <h3 className="text-sm font-sans font-black uppercase tracking-widest text-white/60">
                        {lang === "ko" ? "꿈속 상징과 기운 풀이" : "Dream Symbols & Energy Analysis"}
                      </h3>
                    </div>
                    <div className="p-6 bg-white/[0.01] border border-white/10">
                      <p className="text-sm text-white/80 font-sans leading-relaxed whitespace-pre-line">
                        {result.dreamAnalysis}
                      </p>
                    </div>
                  </div>

                  {/* Section 2: Connection to Reality */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <HeartPulse className="w-4 h-4 text-white/50" />
                      <h3 className="text-sm font-sans font-black uppercase tracking-widest text-white/60">
                        {lang === "ko" ? "현실과 이어지는 의미" : "Connection to Your Reality"}
                      </h3>
                    </div>
                    <div className="p-6 bg-white/[0.01] border border-white/10">
                      <p className="text-sm text-white/80 font-sans leading-relaxed whitespace-pre-line">
                        {result.realityConnection}
                      </p>
                    </div>
                  </div>

                  {/* Section 3: Golden Advice */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Sparkle className="w-4 h-4 text-[#ffd700]" />
                      <h3 className="text-sm font-sans font-black uppercase tracking-widest text-[#ffd700]">
                        {lang === "ko" ? "오늘 하루 행운의 비책" : "Lucky Prescription for Today"}
                      </h3>
                    </div>
                    <div className="p-6 bg-[#ffd700]/[0.02] border border-[#ffd700]/20">
                      <p className="text-sm text-white/90 font-sans leading-relaxed whitespace-pre-line">
                        {result.luckyAdvice}
                      </p>
                    </div>
                  </div>

                  {/* Day limit warning and Reset option for dev testing */}
                  <div className="pt-4 flex flex-col md:flex-row gap-4">
                    <button
                      onClick={onClose}
                      className="w-full py-4 bg-white text-black font-sans font-black text-xs uppercase tracking-[0.4em] transition-all hover:bg-white/90 flex items-center justify-center gap-2"
                    >
                      {lang === "ko" ? "닫기" : "Close"}
                    </button>
                    {process.env.NODE_ENV !== "production" && (
                      <button
                        onClick={handleResetForTesting}
                        className="text-[9px] text-white/20 hover:text-white/40 transition-all font-mono uppercase tracking-widest self-center py-2"
                      >
                        [Dev Reset Limit]
                      </button>
                    )}
                  </div>

                  <p className="text-center text-[10px] text-white/30 tracking-widest">
                    {lang === "ko"
                      ? "※ 오늘 해몽 결과는 내일 꿈을 여쭤보기 전까지 저장된다네."
                      : "※ Today's interpretation remains saved until tomorrow."}
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
