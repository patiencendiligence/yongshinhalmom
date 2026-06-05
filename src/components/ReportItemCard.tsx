import React from "react";
import { Link } from "react-router-dom";
import { motion } from "motion/react";
import ReactMarkdown from "react-markdown";
import { ReportSection } from "../services/geminiService";
import { Language } from "../lib/translations";
import { getStrongestElement } from "../utils/sajuUtils";
import {  ArrowRight } from "lucide-react";
interface ReportItemCardProps {
  idx: number;
  section: ReportSection;
  isRefreshingDaily: boolean;
  lang?: Language;
  manseRyeok?: any;
}

function parseDailyFortune(content: string) {
  const getBlock = (titleKeywords: string[]) => {
    const lines = content.split('\n');
    let capture = false;
    let blockLines: string[] = [];
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.startsWith('###') || trimmed.startsWith('##') || trimmed.startsWith('*') || trimmed.startsWith('**') || trimmed.startsWith('- **') || trimmed.startsWith('- ###')) {
        const isMatch = titleKeywords.some(keyword => trimmed.includes(keyword));
        if (isMatch) {
          capture = true;
          continue;
        } else if (capture) {
          break;
        }
      }
      if (capture) {
        blockLines.push(line);
      }
    }
    let cleaned = blockLines.join('\n').trim();
    if (cleaned.startsWith('-') || cleaned.startsWith('*')) {
      cleaned = cleaned.replace(/^[\s-*]+/, '').trim();
    }
    return cleaned;
  };

  let flow = getBlock(['전반적인 흐름', 'Overall Flow', '전반 적인 흐름', '오늘의 흐름']);
  let watchOut = getBlock(['조심할 것', 'Watch Out', '조심할 사항', '조심']);
  let goodEnergy = getBlock(['좋은 기운', 'Good Energies', '좋은 기운', '기운']);
  let wealth = getBlock(['성공운/재물운', '재물운', '성공운', 'Success & Wealth', 'Success and Wealth']);
  let love = getBlock(['애정운', 'Love Fortune', 'Love']);
  let lotto = getBlock(['로또운', 'Lotto Fortune', 'Lotto']);

  // Extract score, evaluation, and Saju tag from flow header
  let score = 70;
  let evaluation = "보통";
  let sajuTag = "";

  const lines = content.split('\n');
  const flowHeaderLine = lines.find(line => {
    const l = line.trim();
    return l.startsWith('###') && (l.includes('전반적인 흐름') || l.includes('Overall Flow') || l.includes('전반 적인 흐름') || l.includes('오늘의 흐름'));
  });

  if (flowHeaderLine) {
    const strippedHeader = flowHeaderLine.replace(/^###\s*/, '').replace(/오늘의\s*전반적인\s*흐름|전반적인\s*흐름|Today's\s*Overall\s*Flow/i, '').trim();
    const match = strippedHeader.match(/(\d+)\s*[\/|:]\s*([^,\n]+)(?:,\s*([^,\n]+))?/);
    if (match) {
      score = parseInt(match[1]) || 70;
      evaluation = match[2]?.trim() || "보통";
      sajuTag = match[3]?.trim() || "";
    } else {
      const parts = strippedHeader.split('/');
      if (parts.length >= 2) {
        const parsedScore = parseInt(parts[0].replace(/[^0-9]/g, ''));
        if (!isNaN(parsedScore)) score = parsedScore;
        const subParts = parts[1].split(',');
        evaluation = subParts[0].trim();
        if (subParts.length >= 2) {
          sajuTag = subParts[1].trim();
        }
      } else {
        const numbers = strippedHeader.match(/\d+/);
        if (numbers) {
          score = parseInt(numbers[0]);
        }
        if (strippedHeader.includes('아주 좋음')) evaluation = "아주 좋음";
        else if (strippedHeader.includes('좋음')) evaluation = "좋음";
        else if (strippedHeader.includes('비교적 좋음')) evaluation = "비교적 좋음";
        else if (strippedHeader.includes('비교적 좋지 않음')) evaluation = "비교적 좋지 않음";
        else if (strippedHeader.includes('좋지 않음')) evaluation = "좋지 않음";
        else if (strippedHeader.includes('주의')) evaluation = "주의";
        
        const sajuTags = ['천을', '도화', '화개', '역마', '망신', '귀인', '연살', '겁살', '재살', '천살', '지살', '월살', '반안', '육해'];
        for (const tag of sajuTags) {
          if (strippedHeader.includes(tag)) {
            sajuTag = tag;
            break;
          }
        }
      }
    }
  }

  // Fallbacks
  if (!watchOut) {
    watchOut = "지나치게 급하게 결정을 내리거나 내면의 자만을 앞세우지 않도록 경계하게나.";
  }
  if (!goodEnergy) {
    goodEnergy = "묵묵히 자기 일을 해나갈 때 예상치 못한 보상과 긍정적인 평가가 따를 기운일세.";
  }
  if (!wealth) {
    wealth = "재물 기운의 흐름이 차분한 편이니 불필요한 지출을 삼가고 자산을 굳건히 지키는 데 힘쓰게나.";
  }
  if (!love) {
    love = "주변 사람이나 소중한 인연에게 따뜻한 덕담을 먼저 건넨다면 기쁨과 애정 지수가 크게 차오를 것이야.";
  }
  if (!lotto) {
    lotto = "뜻밖의 횡재수보다는 일상 속 소소한 공덕이 자네에게 행운의 단비를 가져다줄 일진이니 성실히 임하게.";
  }

  return {
    flow: flow || "오늘의 전반적인 흐름을 살피는 중일세. 차분하고 고요한 기운이 자네를 감싸는구나.",
    watchOut,
    goodEnergy,
    wealth,
    love,
    lotto,
    score,
    evaluation,
    sajuTag,
  };
}

const getSlotClass = (idx: number, title?: string) => {
  if (title) {
    const t = title.toLowerCase();
    if (t.includes("월별") || t.includes("monthly") || t.includes("세운")) {
      return "col-span-12 bg-white/60 dark:bg-black border-t border-ink-black/10 dark:border-white/10 p-8 md:p-12";
    }
  }
  switch (idx) {
    case 0: return "col-span-12 row-span-auto md:row-span-3 pb-20"; // Detailed Saju
    case 1: return "col-span-12 md:col-span-6 row-span-2 border-mythic-gold/20"; // Today's Report
    case 2: return "col-span-12 md:col-span-6 row-span-2 bg-ink-black/5 dark:bg-[#1a1a1a]"; // Overview
    case 3: return "col-span-12 md:col-span-12 row-span-auto"; // Monthly (Solar Detail)
    case 4: return "col-span-12 md:col-span-4 row-span-2 bg-ink-black/5 dark:bg-[#1a1a1a]"; // Health
    case 5: return "col-span-12 md:col-span-4 row-span-2 bg-mythic-red/90 text-white"; // Love
    case 6: return "col-span-12 md:col-span-4 row-span-2 bg-ink-black/5 dark:bg-[#1a1a1a]"; // Career
    case 7: return "col-span-12 row-span-2 bg-mythic-gold/5 border-mythic-gold/20"; // Remedy
    case 8: return "col-span-12 bg-white/60 dark:bg-black border-t border-ink-black/10 dark:border-white/10 p-8 md:p-12";
    default: return "col-span-12 md:col-span-6 row-span-2";
  }
};

export default function ReportItemCard({ idx, section, isRefreshingDaily, lang = "ko", manseRyeok }: ReportItemCardProps) {
  const isRed = idx === 5;
  const isRefreshing = idx === 0 && isRefreshingDaily;

  const parsedFortune = React.useMemo(() => {
    if (idx !== 0) return null;
    return parseDailyFortune(section.content);
  }, [idx, section.content]);

  const strongest = React.useMemo(() => {
    return manseRyeok ? getStrongestElement(manseRyeok) : { element: "화", emoji: "🔥" };
  }, [manseRyeok]);

  const elementEngMap: Record<string, string> = {
    "목": "wood",
    "화": "fire",
    "토": "earth",
    "금": "metal",
    "수": "water"
  };
  const elementSlug = elementEngMap[strongest.element] || "fire";

  const isFiveElementsSection = 
    section.title === "전체 오행 분석" || 
    section.title === "Overall Five Elements Analysis" ||
    section.title.includes("전체 오행 분석") ||
    section.title.includes("Overall Five Elements Analysis");

  if (idx === 0) {
    if (!parsedFortune) return null;
    const dateMatch = section.content.match(/(?:###\s*)?(\d{4}-\d{2}-\d{2})/);
    const dateStr = dateMatch ? dateMatch[1] : new Date(new Date().getTime() + 9 * 60 * 60 * 1000).toISOString().split('T')[0];
    
    const items = [
      {
        title: lang === "ko" ? "오늘의 전반적인 흐름" : "Today's Overall Flow",
        content: parsedFortune.flow,
        colorClass: "border-ink-black/15 hover:border-ink-black/35 dark:border-white/10 dark:hover:border-white/30",
        titleStyle: "text-ink-black dark:text-white",
        badges: (
          <div className="flex flex-wrap gap-2 mt-1.5">
            <span className="inline-block px-2 py-0.5 text-[11px] font-sans font-black bg-ink-black/5 dark:bg-white/5 text-ink-black/80 dark:text-white/80 border border-ink-black/10 dark:border-white/10 uppercase tracking-widest rounded-sm">
              {parsedFortune.score}점 • {parsedFortune.evaluation}
            </span>
            {parsedFortune.sajuTag && (
              <span className="inline-block px-2 py-0.5 text-[11px] font-sans font-black bg-mythic-gold/15 text-mythic-gold dark:text-mythic-gold border border-mythic-gold/30 uppercase tracking-widest rounded-sm">
                {parsedFortune.sajuTag}
              </span>
            )}
          </div>
        )
      },
      {
        title: lang === "ko" ? "오늘 조심할 것" : "Today's Precautions",
        content: parsedFortune.watchOut,
        colorClass: "border-mythic-red/20 hover:border-mythic-red/40 dark:border-mythic-red/20 dark:hover:border-mythic-red/40",
        titleStyle: "text-mythic-red dark:text-mythic-red"
      },
      {
        title: lang === "ko" ? "오늘 좋은 기운" : "Today's Good Energy",
        content: parsedFortune.goodEnergy,
        colorClass: "border-mythic-gold/20 hover:border-mythic-gold/40 dark:border-mythic-gold/20 dark:hover:border-mythic-gold/40",
        titleStyle: "text-mythic-gold dark:text-mythic-gold"
      },
      {
        title: lang === "ko" ? "오늘의 성공운/재물운" : "Today's Success & Wealth",
        content: parsedFortune.wealth,
        colorClass: "border-ink-black/15 hover:border-ink-black/35 dark:border-white/10 dark:hover:border-white/30",
        titleStyle: "text-ink-black dark:text-white"
      },
      {
        title: lang === "ko" ? "오늘의 애정운" : "Today's Love Fortune",
        content: parsedFortune.love,
        colorClass: "border-pink-500/20 hover:border-pink-500/40 dark:border-pink-500/15 dark:hover:border-pink-500/35",
        titleStyle: "text-pink-600 dark:text-pink-400"
      },
      {
        title: lang === "ko" ? "오늘의 로또운" : "Today's Lotto Fortune",
        content: parsedFortune.lotto,
        colorClass: "border-emerald-500/20 hover:border-emerald-500/40 dark:border-emerald-500/15 dark:hover:border-emerald-500/35",
        titleStyle: "text-emerald-600 dark:text-emerald-400"
      }
    ];

    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: idx * 0.05 }}
        className="col-span-12 p-4 md:p-8 flex flex-col relative group bg-white/40 dark:bg-black/30 text-ink-black dark:text-white rounded-none border-b border-ink-black/10 dark:border-zinc-900"
      >
        <div className="mb-10 text-left">
          <div className="text-[10px] uppercase tracking-[0.6em] font-sans font-black text-ink-black/40 dark:text-white/40 italic chat-label mb-4">
            FREE
          </div>
          <h3 className={`text-4xl md:text-5xl font-serif font-black italic tracking-wide text-ink-black dark:text-white leading-tight mb-4 ${isRefreshing ? "opacity-30 animate-pulse" : ""}`}>
            {section.title}
          </h3>
          <p className="text-ink-black/45 dark:text-white/40 text-sm font-sans tracking-[0.15em] font-medium mt-1 font-mono">
            {dateStr}
          </p>
        </div>

        {isRefreshing ? (
          <div className="space-y-6">
            <div className="h-4 bg-ink-black/10 dark:bg-white/10 rounded w-full animate-pulse" />
            <div className="h-4 bg-ink-black/10 dark:bg-white/10 rounded w-5/6 animate-pulse" />
            <div className="h-4 bg-ink-black/10 dark:bg-white/10 rounded w-4/6 animate-pulse" />
          </div>
        ) : (
          <div className="space-y-4 md:space-y-6">
            {items.map((item, i) => (
              <div 
                key={i} 
                className={`p-6 md:p-8 bg-white/50 dark:bg-[#0c0c0c]/40 border ${item.colorClass} backdrop-blur-sm transition-all duration-300 flex flex-col md:flex-row gap-6 items-start rounded-lg shadow-sm`}
              >
                <div className="md:w-1/4 shrink-0 flex flex-col items-start gap-1">
                  <span className={`text-lg md:text-xl font-serif font-black italic ${item.titleStyle}`}>
                    {item.title}
                  </span>
                  {item.badges}
                </div>
                <div className="flex-1 text-sm md:text-base text-ink-black/85 dark:text-white/90 leading-relaxed font-sans whitespace-pre-line text-left">
                  {item.content}
                </div>
              </div>
            ))}
          </div>
        )}
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: idx * 0.05 }}
      className={`p-4 md:p-12 flex flex-col relative group ${
        isRed 
          ? "bg-mythic-red/90 text-white" 
          : "bg-white/60 dark:bg-black text-ink-black dark:text-white"
      } ${getSlotClass(idx, section.title)}`}
    >
      <div className="mb-12">
        <div className="flex items-center gap-4 mb-8">
          <div className="text-[10px] uppercase tracking-[0.6em] font-sans font-black text-ink-black/40 dark:text-white/30 italic chapter-label">
            {idx === 0 ? "FREE" : `CHAPTER ${String(idx + 1).padStart(2, "0")}`}
          </div>
          {isRefreshing && (
            <span className="text-[10px] text-mythic-gold animate-pulse font-sans font-bold tracking-widest">
              REFRESHING...
            </span>
          )}
        </div>
        <h3 className={`text-3xl md:text-4xl font-serif font-black italic leading-[0.9] ${
          isRed ? "text-white" : "text-ink-black dark:text-white"
        } ${isRefreshing ? "opacity-30" : ""}`}>
          {section.title}
        </h3>
      </div>

      <div className={`text-md md:text-md font-sans tracking-tight leading-relaxed markdown-container ${
        isRed ? "text-white/95" : "text-ink-black/80 dark:text-white/70"
      } ${isRefreshing ? "opacity-30" : ""}`}>
        {isRefreshing ? (
          <div className="space-y-4">
            <div className="h-4 bg-ink-black/10 dark:bg-white/10 rounded w-full animate-pulse" />
            <div className="h-4 bg-ink-black/10 dark:bg-white/10 rounded w-5/6 animate-pulse" />
            <div className="h-4 bg-ink-black/10 dark:bg-white/10 rounded w-4/6 animate-pulse" />
          </div>
        ) : (
          <>
            <ReactMarkdown>
              {section.content}
            </ReactMarkdown>
            {isFiveElementsSection && (
              <div className="mt-8 pt-6 border-t border-ink-black/5 dark:border-white/5 flex flex-col sm:flex-row items-center justify-start gap-4">
                <Link
                  id="strongest-element-link"
                  to={`/element/${elementSlug}`}
                  className="holo-button group flex items-center gap-4 px-8 py-4 bg-mythic-gold/15 hover:bg-mythic-gold/25 border border-mythic-gold/40 hover:border-mythic-gold text-mythic-gold dark:text-mythic-gold font-sans font-black text-[12px] uppercase tracking-[0.2em] shadow-lg hover:scale-102 transition-all cursor-pointer rounded-sm"
                >
                  <span className="text-base">{strongest.emoji}</span>
                  <span>
                    {lang === "en"
                      ? `Characteristics of Strong ${strongest.element} (${elementSlug.toUpperCase()}) Energy`
                      : `${strongest.element} 기운이 강한 사람 특징`}
                      <ArrowRight />
                  </span>
                </Link>
              </div>
            )}
          </>
        )}
      </div>
    </motion.div>
  );
}

