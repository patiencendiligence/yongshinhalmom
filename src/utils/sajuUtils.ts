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

