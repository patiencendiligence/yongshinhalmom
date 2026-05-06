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
      const errorData = await response.json().catch(() => ({ error: "Server error" }));
      throw new Error(errorData.error || `Failed with status ${response.status}`);
    }

    return await response.json();
  } catch (error: any) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      throw new Error("Report generation timed out. Please try again.");
    }
    throw error;
  }
}
