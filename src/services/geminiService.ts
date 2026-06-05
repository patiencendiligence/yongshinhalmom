import { Language } from "../lib/translations";

export interface ReportSection {
  title: string;
  content: string;
}

export interface ReportResult {
  summary: string;
  zodiac: number; 
  illustrationType: "SUN" | "MOON" | "TREE" | "CANDLE" | "DRAGON" | "WATER" | "MOUNTAIN" | "BELLS";
  sections: ReportSection[];
  luckInfo: {
    color: string;
    item: string;
    food: string;
  };
  level: 'simple' | 'detailed';
  medicalAdvice?: string;
  isAbuse?: boolean;
  abuseMessage?: string;
  todaysFortune?: ReportSection;
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
  const response = await fetch("/api/generate-report", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userData, lang, level })
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
  const response = await fetch("/api/generate-daily", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userData, lang })
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
