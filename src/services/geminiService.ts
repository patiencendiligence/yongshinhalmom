import { Language } from "../lib/translations";
import { getManseRyeok } from "../lib/manseRyeok";

const HANJA_TO_KOREAN: Record<string, string> = {
  '甲': '갑', '乙': '을', '丙': '병', '丁': '정', '戊': '무',
  '己': '기', '庚': '경', '辛': '신', '壬': '임', '癸': '계',
  '子': '자', '丑': '축', '寅': '인', '卯': '묘', '辰': '진',
  '巳': '사', '午': '오', '未': '미', '申': '신', '酉': '유',
  '戌': '술', '亥': '해'
};

function translateHanjaToKorean(pillar: string): string {
  if (!pillar) return "";
  return pillar.split("").map(char => HANJA_TO_KOREAN[char] || char).join("");
}

export interface ReportSection {
  title: string;
  content: string;
}

export interface ReportResult {
  summary: string;
  zodiac: number; 
  sections: ReportSection[];
  luckInfo: {
    color: string;
    item: string;
    food: string;
    location: string;
  };
  analysis: Record<string, string | number>;
  level: 'simple' | 'detailed';
  medicalAdvice?: string;
  isAbuse?: boolean;
  abuseMessage?: string;
  todaysFortune?: ReportSection;
  pendingPayment?: boolean;
}


export async function getReport(userData: {
  name: string;
  birthDate: string;
  birthTime: string;
  isLunar: boolean;
  gender: string;
  birthPlace: string;
  targetYear: number;
}, lang: Language = "ko", level: 'simple' | 'detailed' = 'simple'): Promise<ReportResult> {
  const manse = getManseRyeok(userData.birthDate, userData.birthTime || "12:00", userData.isLunar || false);
  const pillars = manse ? {
    yearPillar: translateHanjaToKorean(manse.pillars.year),
    monthPillar: translateHanjaToKorean(manse.pillars.month),
    dayPillar: translateHanjaToKorean(manse.pillars.day),
    timePillar: translateHanjaToKorean(manse.pillars.time)
  } : null;

  const correctZodiacIndex = (manse && manse.zodiac !== undefined)
    ? manse.zodiac
    : ((parseInt(userData.birthDate.split('-')[0]) - 1924) % 12);

  const response = await fetch("/api/generate-report", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ 
      pillars, 
      zodiac: correctZodiacIndex, 
      targetYear: userData.targetYear, 
      lang, 
      level 
    })
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({ error: "Failed to generate report" }));
    throw new Error(err.error || "Generation error");
  }

  const data = await response.json();
  return { ...data, level };
}

function arePillarsEqual(p1: any, p2: any): boolean {
  if (!p1 && !p2) return true;
  if (!p1 || !p2) return false;
  return p1.yearPillar === p2.yearPillar &&
         p1.monthPillar === p2.monthPillar &&
         p1.dayPillar === p2.dayPillar &&
         p1.timePillar === p2.timePillar;
}

export async function getTodaysFortune(
  userData: {
    birthDate: string;
    birthTime: string;
    isLunar: boolean;
    gender: string;
    birthPlace: string;
  },
  lang: Language = "ko"
): Promise<{ title: string; content: string }> {
  const manse = getManseRyeok(userData.birthDate, userData.birthTime || "12:00", userData.isLunar || false);
  const pillars = manse ? {
    yearPillar: translateHanjaToKorean(manse.pillars.year),
    monthPillar: translateHanjaToKorean(manse.pillars.month),
    dayPillar: translateHanjaToKorean(manse.pillars.day),
    timePillar: translateHanjaToKorean(manse.pillars.time)
  } : null;

  const correctZodiacIndex = (manse && manse.zodiac !== undefined)
    ? manse.zodiac
    : ((parseInt(userData.birthDate.split('-')[0]) - 1924) % 12);

  const CACHE_KEY = "saju_daily_fortune_cache";
  
  // Calculate current KST date
  const kstNow = new Date(new Date().getTime() + 9 * 60 * 60 * 1000);
  const todayDateStr = kstNow.toISOString().split('T')[0];

  // Try parsing cached data from localStorage
  let cachedData: any = null;
  try {
    const rawCache = localStorage.getItem(CACHE_KEY);
    if (rawCache) {
      cachedData = JSON.parse(rawCache);
    }
  } catch (err) {
    console.warn("Failed to retrieve daily fortune cache:", err);
  }

  if (cachedData && cachedData.payload && cachedData.response) {
    const cachedPayload = cachedData.payload;
    const cachedResponse = cachedData.response;

    const pillarsMatch = arePillarsEqual(cachedPayload.pillars, pillars);
    const zodiacMatch = cachedPayload.zodiac === correctZodiacIndex;
    const langMatch = cachedPayload.lang === lang;

    // Check if response contains today's KST date (YYYY-MM-DD format)
    const dateRegex = /\d{4}-\d{2}-\d{2}/;
    const contentMatch = cachedResponse.content ? cachedResponse.content.match(dateRegex) : null;
    const titleMatch = cachedResponse.title ? cachedResponse.title.match(dateRegex) : null;
    const dateInResponse = (contentMatch ? contentMatch[0] : null) || (titleMatch ? titleMatch[0] : null);

    const dateMatch = dateInResponse === todayDateStr || (cachedResponse.content && cachedResponse.content.includes(todayDateStr));

    if (pillarsMatch && zodiacMatch && langMatch && dateMatch) {
      console.log("[getTodaysFortune] Active daily fortune found in cache. Avoiding API call.", todayDateStr);
      return cachedResponse;
    }
  }

  const response = await fetch("/api/generate-daily", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ pillars, zodiac: correctZodiacIndex, lang })
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({ error: "Failed to generate daily" }));
    throw new Error(err.error || "Generation error");
  }

  const result = await response.json();

  // Store in cache
  try {
    const cacheToStore = {
      payload: {
        pillars,
        zodiac: correctZodiacIndex,
        lang
      },
      response: result,
      cachedAt: new Date().toISOString()
    };
    localStorage.setItem(CACHE_KEY, JSON.stringify(cacheToStore));
    console.log("[getTodaysFortune] Cached new daily fortune successfully.");
  } catch (err) {
    console.warn("Failed to write daily fortune cache:", err);
  }

  return result;
}

/**
 * @deprecated Moved to server
 */
async function tryOpenAI(prompt: string, level: string): Promise<ReportResult> {
  throw new Error("Moved to server");
}
