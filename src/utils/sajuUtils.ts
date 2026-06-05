/**
 * Saju Calculation and Fortune Text Parsing Utilities
 * Implements Separation of Concerns between UI Rendering and Domain Logic.
 */

export function parseDailyFortune(content: string) {
  const getBlock = (titleKeywords: string[]) => {
    const lines = content.split('\n');
    let capture = false;
    let blockLines: string[] = [];
    for (const line of lines) {
      const trimmed = line.trim();
      if (
        trimmed.startsWith('###') || 
        trimmed.startsWith('##') || 
        trimmed.startsWith('*') || 
        trimmed.startsWith('**') || 
        trimmed.startsWith('- **') || 
        trimmed.startsWith('- ###')
      ) {
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

  // Extract score, evaluation, and Saju tag from the flow header
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
        
        // Find general Korean chars representing "살" or "귀인" as sajuTag
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

  // Fallbacks if some sections are missing
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

  const woodStems = ["甲", "乙"];
  const fireStems = ["丙", "丁"];
  const earthStems = ["戊", "己"];
  const metalStems = ["庚", "辛"];
  const waterStems = ["壬", "癸"];

  const woodBranches = ["寅", "卯"];
  const fireBranches = ["巳", "午"];
  const earthBranches = ["辰", "戌", "丑", "未"];
  const metalBranches = ["申", "酉"];
  const waterBranches = ["子", "亥"];

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

