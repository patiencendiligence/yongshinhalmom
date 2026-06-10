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

  const response = await fetch("/api/generate-daily", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ pillars, lang })
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({ error: "Failed to generate daily" }));
    throw new Error(err.error || "Generation error");
  }

  return await response.json();
}

/**
 * @deprecated Moved to server
 */
async function tryOpenAI(prompt: string, level: string): Promise<ReportResult> {
  throw new Error("Moved to server");
}
