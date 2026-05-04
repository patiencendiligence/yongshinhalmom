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
  // 1. Try Server API first
  try {
    const response = await fetch("/api/report", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ userData, lang, level }),
    });

    if (response.ok) {
      return await response.json();
    }
    
    // Check if it's JSON before parsing
    const contentType = response.headers.get("content-type");
    if (contentType && contentType.includes("application/json")) {
      const errorData = await response.json();
      const serverError = errorData.error || "Failed to generate report via server";
      
      // If it's a critical configuration or quota error, re-throw it immediately
      if (serverError.includes("API key") || serverError.includes("quota") || serverError.includes("INVALID_GEMINI_KEY")) {
        throw new Error(serverError);
      }
      
      throw new Error(serverError);
    } else {
      // If not JSON (like a 405 HTML page from GitHub), just go to fallback
      console.warn(`Server returned non-JSON response (${response.status}). Falling back to client-side.`);
    }
  } catch (error: any) {
    // If it's a direct error we threw above, keep throwing it
    if (error.message.includes("API key") || error.message.includes("quota")) {
      throw error;
    }
    console.warn("Server API failed or not available, checking client-side fallback...", error);
  }

  // 2. Client-side Fallback (for Static Hosting like GitHub Pages)
  const clientApiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || import.meta.env.VITE_GEMINI_API_KEY || import.meta.env.VITE_GOOGLE_API_KEY;
  if (!clientApiKey) {
    throw new Error("No Gemini API key found. Please configure GEMINI_API_KEY or GOOGLE_API_KEY in your environment.");
  }

  const ai = new GoogleGenAI({ apiKey: clientApiKey });

  const now = new Date();
  const currentDate = now.toISOString().split('T')[0];
  const currentTime = now.toLocaleTimeString('ko-KR', { hour12: false });
  const currentYear = userData?.targetYear || now.getFullYear();

  const prompt = `
[STRICT LANGUAGE INSTRUCTION]
ALL responses MUST be written in ${lang === "ko" ? "KOREAN" : "ENGLISH"}.

현재 시각: ${currentDate} ${currentTime}
분석 대상 연도: ${currentYear}년
의뢰인 정보: ${JSON.stringify(userData)}
분석 수준: ${level === 'detailed' ? "심층 분석 (Deep Analysis)" : "기본 분석 (Quick Summary)"}

[분석 요구사항]
1. ${level === 'detailed' ? "심층 분석 모드이므로, 각 섹션의 내용을 매우 상세하고 풍부하게 작성해주게. 특히 섹션 1, 4, 5, 6, 7에서 구체적인 행동 가이드와 심리적 기제 분석을 깊이 있게 다뤄주게나." : "기본 분석 모드이므로, 각 섹션의 핵심 내용을 명확하고 간결하게 전달해주게."}
2. 섹션 8 (월별 상세 생활 흐름)은 반드시 1월부터 12월까지의 정보를 모두 포함해야 하네.
3. 모든 내용은 '용신할멈'의 어투를 유지하며, 신뢰감 있는 데이터 기반의 라이프스타일 분석 리포트로 작성해주게.
4. JSON 형식을 엄격히 준수하게나.
`;

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    config: {
      systemInstruction: SYSTEM_INSTRUCTION,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          summary: { type: Type.STRING },
          zodiac: { type: Type.NUMBER },
          illustrationType: { 
            type: Type.STRING, 
            enum: ["SUN", "MOON", "TREE", "CANDLE", "DRAGON", "WATER", "MOUNTAIN", "BELLS"] 
          },
          sections: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING },
                content: { type: Type.STRING },
              },
              required: ["title", "content"],
            },
          },
          luckInfo: {
            type: Type.OBJECT,
            properties: {
              color: { type: Type.STRING },
              item: { type: Type.STRING },
              food: { type: Type.STRING },
            },
            required: ["color", "item", "food"],
          },
        },
        required: ["summary", "zodiac", "illustrationType", "sections", "luckInfo"],
      },
    },
  });

  const text = response.text;
  if (!text) throw new Error("Empty response from Gemini Client");
  const parsed = JSON.parse(text);
  return { ...parsed, level };
}
