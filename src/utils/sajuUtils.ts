/**
 * Saju Calculation and Fortune Text Parsing Utilities
 * Implements Separation of Concerns between UI Rendering and Domain Logic.
 */

export function parseDailyFortune(content: string) {
  if (!content) {
    return {
      flow: "",
      watchOut: "",
      goodEnergy: "",
      wealth: "",
      love: "",
      lotto: "",
      score: 70,
      evaluation: "보통",
      sajuTag: ""
    };
  }

  // Normalize line endings to avoid \r issues
  const normalized = content.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  const lines = normalized.split('\n');

  const getBlock = (titleKeywords: string[]) => {
    let capture = false;
    let blockLines: string[] = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmed = line.trim();

      // Check if this line is likely a header
      const isHeader = 
        trimmed.startsWith('#') || 
        /^\d+[\.\s\:\)]/.test(trimmed) ||
        /^\[\d+\]/.test(trimmed);

      if (isHeader) {
        const isMatch = titleKeywords.some(keyword => trimmed.includes(keyword));
        if (isMatch) {
          capture = true;
          continue; // Skip the header line itself from body content
        } else if (capture) {
          // If we hit any other header while capturing, stop capturing this block
          break;
        }
      }

      if (capture) {
        // Prevent accidental bleed into other utility blocks or element distributions
        if (
          trimmed.includes('전체적인 오행') || 
          trimmed.includes('오행 분포') || 
          trimmed.includes('오행 균형') || 
          trimmed.includes('오행 분석') ||
          trimmed.includes('오행 균형 설명') ||
          trimmed.startsWith('[전체적')
        ) {
          break;
        }
        blockLines.push(line);
      }
    }

    let cleaned = blockLines.join('\n').trim();
    // Strip bullet markers or markdown stars from the cleaned output
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

  // If we could not find structured markdown blocks but we do have raw content,
  // we fallback to showing the entire content in the flow block rather than returning empty.
  if (!flow && content) {
    flow = content.trim();
  }

  // Extract score, evaluation, and Saju tag from the flow header
  let score = 70;
  let evaluation = "보통";
  let sajuTag = "";

  const flowHeaderLine = lines.find(line => {
    const l = line.trim();
    return l.includes('전반적인 흐름') || l.includes('Overall Flow') || l.includes('오늘의 흐름');
  });

  if (flowHeaderLine) {
    const strippedHeader = flowHeaderLine.replace(/^#+\s*/, '').replace(/오늘의\s*전반적인\s*흐름|전반적인\s*흐름|Today's\s*Overall\s*Flow/i, '').trim();
    const bracketMatch = strippedHeader.match(/\[?\s*(\d+)\s*[\/|:]\s*([^,\n\])]+)(?:,\s*([^,\n\])]+))?\s*\]?/);
    
    if (bracketMatch) {
      score = parseInt(bracketMatch[1]) || 70;
      evaluation = bracketMatch[2]?.trim() || "보통";
      sajuTag = bracketMatch[3]?.trim() || "";
    } else {
      const parts = strippedHeader.replace(/[\[\]()]/g, '').split('/');
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

  return {
    flow: flow || "",
    watchOut: watchOut || "",
    goodEnergy: goodEnergy || "",
    wealth: wealth || "",
    love: love || "",
    lotto: lotto || "",
    score,
    evaluation,
    sajuTag
  };
}

export function getStrongestElement(manseRyeok: any) {
  if (!manseRyeok || !manseRyeok.pillars) {
    return { element: "화", emoji: "🔥" };
  }

  const { year = "", month = "", day = "", time = "" } = manseRyeok.pillars;
  
  const allChars = [
    year.charAt(0), year.charAt(1),
    month.charAt(0), month.charAt(1),
    day.charAt(0), day.charAt(1),
    time.charAt(0), time.charAt(1)
  ].filter(Boolean);

  const woodStems = ["甲", "乙", "갑", "을"];
  const fireStems = ["丙", "丁", "병", "정"];
  const earthStems = ["戊", "己", "무", "기"];
  const metalStems = ["庚", "辛", "경", "신"];
  const waterStems = ["壬", "癸", "임", "계"];

  const woodBranches = ["寅", "卯", "인", "묘"];
  const fireBranches = ["巳", "午", "사", "오"];
  const earthBranches = ["辰", "戌", "丑", "未", "진", "술", "축", "미"];
  const metalBranches = ["申", "酉", "신", "유"];
  const waterBranches = ["子", "亥", "자", "해"];

  let woodCount = 0;
  let fireCount = 0;
  let earthCount = 0;
  let metalCount = 0;
  let waterCount = 0;

  allChars.forEach(char => {
    if (woodStems.includes(char) || woodBranches.includes(char)) {
      woodCount++;
    } else if (fireStems.includes(char) || fireBranches.includes(char)) {
      fireCount++;
    } else if (earthStems.includes(char) || earthBranches.includes(char)) {
      earthCount++;
    } else if (metalStems.includes(char) || metalBranches.includes(char)) {
      metalCount++;
    } else if (waterStems.includes(char) || waterBranches.includes(char)) {
      waterCount++;
    }
  });

  const elements = [
    { element: "목", emoji: "🪵", count: woodCount },
    { element: "화", emoji: "🔥", count: fireCount },
    { element: "토", emoji: "⛰️", count: earthCount },
    { element: "금", emoji: "🪙", count: metalCount },
    { element: "수", emoji: "🌊", count: waterCount }
  ];

  elements.sort((a, b) => b.count - a.count);

  return {
    element: elements[0].element,
    emoji: elements[0].emoji
  };
}

export function getStrongestElementFromReport(report: any, manseRyeok: any): { element: string; emoji: string } {
  const fallback = getStrongestElement(manseRyeok);
  if (!report) return fallback;

  // 1. Try to find the specific Five Elements (오행 분석) section first to isolate the analysis
  let textToScan = "";
  const sections = Array.isArray(report.sections) ? report.sections : [];
  const fiveElementsSec = sections.find((s: any) => {
    const titleLower = (s.title || "").toLowerCase();
    return (
      titleLower.includes("오행 분석") || 
      titleLower.includes("오행 해석") || 
      titleLower.includes("five elements") ||
      titleLower.includes("오행 분포") ||
      titleLower.includes("오행 균형")
    );
  });

  if (fiveElementsSec) {
    textToScan = (fiveElementsSec.title || "") + "\n" + (fiveElementsSec.content || "");
  } else {
    // Fallback: Combine summary and all section contents if specific section not found
    if (report.summary) textToScan += report.summary + "\n";
    sections.forEach((sec: any) => {
      textToScan += (sec.title || "") + "\n" + (sec.content || "") + "\n";
    });
    if (report.content) textToScan += report.content + "\n";
  }

  const lowerText = textToScan.toLowerCase();

  // We want to count the occurrences of strong element patterns,
  // or look for direct phrases like "[Element] 기운이 강", "dominant [element]" etc.
  const elementKeywords = {
    "목": {
      patterns: [
        /목\s*기운이\s*(가장\s*)?(강|왕성|우세|많|발달|지배|주도)/,
        /나무\s*기운이\s*(가장\s*)?(강|왕성|우세|많|발달|지배|주도)/,
        /목\(나무\)\s*기운/,
        /나무\s*기운이\s*태산/,
        /가장\s*(강한|왕성한|많은|발달한)\s*(기운|오행은|오행은 바로)\s*(바로\s*)?목/,
        /지배적인\s*(기운은|오행은)\s*목/,
        /wood\s*energy\s*is\s*(the\s*)?strongest/,
        /strongest\s*element\s*is\s*wood/,
        /dominant\s*element\s*is\s*wood/
      ],
      simple: ["목 기운", "나무 기운", "wood energy", "strong wood"]
    },
    "화": {
      patterns: [
        /화\s*기운이\s*(가장\s*)?(강|왕성|우세|많|발달|지배|주도)/,
        /불\s*기운이\s*(가장\s*)?(강|왕성|우세|많|발달|지배|주도)/,
        /화\(불\)\s*기운/,
        /불\s*기운이\s*태산/,
        /가장\s*(강한|왕성한|많은|발달한)\s*(기운|오행은|오행은 바로)\s*(바로\s*)?화/,
        /지배적인\s*(기운은|오행은)\s*화/,
        /fire\s*energy\s*is\s*(the\s*)?strongest/,
        /strongest\s*element\s*is\s*fire/,
        /dominant\s*element\s*is\s*fire/
      ],
      simple: ["화 기운", "불 기운", "fire energy", "strong fire"]
    },
    "토": {
      patterns: [
        /토\s*기운이\s*(가장\s*)?(강|왕성|우세|많|발달|지배|주도)/,
        /흙\s*기운이\s*(가장\s*)?(강|왕성|우세|많|발달|지배|주도)/,
        /토\(흙\)\s*기운/,
        /흙\s*기운이\s*태산/,
        /가장\s*(강한|왕성한|많은|발달한)\s*(기운|오행은|오행은 바로)\s*(바로\s*)?토/,
        /지배적인\s*(기운은|오행은)\s*토/,
        /earth\s*energy\s*is\s*(the\s*)?strongest/,
        /strongest\s*element\s*is\s*earth/,
        /dominant\s*element\s*is\s*earth/
      ],
      simple: ["토 기운", "흙 기운", "earth energy", "strong earth"]
    },
    "금": {
      patterns: [
        /금\s*기운이\s*(가장\s*)?(강|왕성|우세|많|발달|지배|주도)/,
        /쇠\s*기운이\s*(가장\s*)?(강|왕성|우세|많|발달|지배|주도)/,
        /금\(쇠\)\s*기운/,
        /쇠\s*기운이\s*태산/,
        /가장\s*(강한|왕성한|많은|발달한)\s*(기운|오행은|오행은 바로)\s*(바로\s*)?금/,
        /지배적인\s*(기운은|오행은)\s*금/,
        /metal\s*energy\s*is\s*(the\s*)?strongest/,
        /strongest\s*element\s*is\s*metal/,
        /dominant\s*element\s*is\s*metal/
      ],
      simple: ["금 기운", "쇠 기운", "metal energy", "strong metal"]
    },
    "수": {
      patterns: [
        /수\s*기운이\s*(가장\s*)?(강|왕성|우세|많|발달|지배|주도)/,
        /물\s*기운이\s*(가장\s*)?(강|왕성|우세|많|발달|지배|주도)/,
        /수\(물\)\s*기운/,
        /물\s*기운이\s*태산/,
        /가장\s*(강한|왕성한|많은|발달한)\s*(기운|오행은|오행은 바로)\s*(바로\s*)?수/,
        /지배적인\s*(기운은|오행은)\s*수/,
        /water\s*energy\s*is\s*(the\s*)?strongest/,
        /strongest\s*element\s*is\s*water/,
        /dominant\s*element\s*is\s*water/
      ],
      simple: ["수 기운", "물 기운", "water energy", "strong water"]
    }
  };

  const emojis: Record<string, string> = {
    "목": "🪵",
    "화": "🔥",
    "토": "⛰️",
    "금": "🪙",
    "수": "🌊"
  };

  // 1. First, check for strong patterns
  let bestElement: string | null = null;
  let maxPatternMatches = 0;

  Object.entries(elementKeywords).forEach(([elem, data]) => {
    let matchCount = 0;
    data.patterns.forEach(regex => {
      if (regex.test(lowerText)) {
        matchCount++;
      }
    });
    if (matchCount > maxPatternMatches) {
      maxPatternMatches = matchCount;
      bestElement = elem;
    }
  });

  if (bestElement && maxPatternMatches > 0) {
    return { element: bestElement, emoji: emojis[bestElement] };
  }

  // 2. Fallback to simple keyword counts if patterns didn't yield a result
  let bestSimpleElem: string | null = null;
  let maxSimpleCount = 0;

  Object.entries(elementKeywords).forEach(([elem, data]) => {
    let count = 0;
    data.simple.forEach(kw => {
      const escaped = kw.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
      const regex = new RegExp(escaped, 'gi');
      const matches = lowerText.match(regex);
      if (matches) {
        count += matches.length;
      }
    });
    if (count > maxSimpleCount) {
      maxSimpleCount = count;
      bestSimpleElem = elem;
    }
  });

  if (bestSimpleElem && maxSimpleCount > 0) {
    return { element: bestSimpleElem, emoji: emojis[bestSimpleElem] };
  }

  // 3. Fallback to manse calculation if no explicit text matches
  return fallback;
}

/**
 * Filter Markdown content dynamically based on custom language block comments.
 * Keeps only target language content and strips language markers.
 * Example of markdown blocks:
 * <!-- ko -->한국어 문서 내용입니다.<!-- /ko -->
 * <!-- en -->English content body here.<!-- /en -->
 */
export function filterContentByLanguage(rawText: string, lang: "ko" | "en"): string {
  if (!rawText) return "";
  let result = rawText;
  
  if (lang === "en") {
    // 1. Remove all KO blocks completely
    result = result.replace(/<!--\s*ko\s*-->[\s\S]*?<!--\s*\/ko\s*-->/gi, "");
    // 2. Strip only the EN markers to expose the EN content
    result = result.replace(/<!--\s*en\s*-->/gi, "").replace(/<!--\s*\/en\s*-->/gi, "");
  } else {
    // Default to "ko"
    // 1. Remove all EN blocks completely
    result = result.replace(/<!--\s*en\s*-->[\s\S]*?<!--\s*\/en\s*-->/gi, "");
    // 2. Strip only the KO markers to expose the KO content
    result = result.replace(/<!--\s*ko\s*-->/gi, "").replace(/<!--\s*\/ko\s*-->/gi, "");
  }
  
  return result;
}


export const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "사주는 무료인가요?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "이 용신할멈은 기본 사주풀이는 무료일세."
      }
    },
    {
      "@type": "Question",
      "name": "용신은 어떻게 찾나요?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "사주의 오행 균형과 일간의 상태를 분석해 용신을 판단하지."
      }
    }
  ]
};