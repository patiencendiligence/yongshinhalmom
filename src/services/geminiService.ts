import { Language } from "../lib/translations";
import { GoogleGenAI, Type } from "@google/genai";

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
}

const SYSTEM_INSTRUCTION = import.meta.env.SYSTEM_INSTRUCTION || import.meta.env.VITE_SYSTEM_INSTRUCTION;

export async function getReport(userData: {
  name: string;
  birthDate: string;
  birthTime: string;
  isLunar: boolean;
  gender: string;
  birthPlace: string;
  targetYear: number;
}, lang: Language = "ko", level: 'simple' | 'detailed' = 'simple'): Promise<ReportResult> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 120000); // 2 minute timeout

  try {
    const response = await fetch("/api/report", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ userData, lang, level }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: "데이터 분석 중 서버 오류가 발생했습니다." }));
      throw new Error(errorData.error || `응답 오류가 발생했습니다 (상태 코드: ${response.status})`);
    }

    return await response.json();
  } catch (error: any) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      throw new Error("서버 응답 시간이 초과되었습니다. 현재 접속자가 많을 수 있으니 잠시 후 다시 시도해 주세요.");
    }
    if (error.message.includes('fetch') || error.message.includes('Load failed')) {
      throw new Error("네트워크 연결이 불안정합니다. 인터넷 연결을 확인하고 다시 시도해 주세요.");
    }
    throw error;
  }
}
