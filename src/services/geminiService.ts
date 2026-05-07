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

const DEFAULT_SYSTEM_INSTRUCTION = "당신은 영험한 용신할멈으로, 사용자의 기초 정보를 바탕으로 한 해의 운세를 아주 상세하고 문학적으로 풀이해주는 점술가입니다. 사주 명리학과 육효, 그리고 현대적 라이프스타일 분석을 결합하여 조언하십시오.";
const SYSTEM_INSTRUCTION = import.meta.env.VITE_SYSTEM_INSTRUCTION || DEFAULT_SYSTEM_INSTRUCTION;

// Note: Use models from gemini-api skill
const MODELS_TO_TRY = [
  "gemini-3-flash-preview",
  "gemini-3.1-pro-preview",
  "gemini-2.0-flash-exp",
  "gemini-1.5-flash-latest"
];

export async function getReport(userData: {
  name: string;
  birthDate: string;
  birthTime: string;
  isLunar: boolean;
  gender: string;
  birthPlace: string;
  targetYear: number;
}, lang: Language = "ko", level: 'simple' | 'detailed' = 'simple'): Promise<ReportResult> {
  
  // Try to find the API key. 
  // In AI Studio, process.env.GEMINI_API_KEY is usually used.
  // We also check for VITE_ prefixed one as fallback based on user's setup.
  const env = typeof process !== 'undefined' ? process.env : {};
  const apiKeyRaw = (env.GEMINI_API_KEY || import.meta.env.VITE_GEMINI_API_KEY || "").toString();
  const apiKey = apiKeyRaw.replace(/['"\\\r\n\t]+/g, '').trim();

  if (!apiKey) {
    throw new Error("Gemini API key is missing. Please set GEMINI_API_KEY or VITE_GEMINI_API_KEY in the environment.");
  }

  const ai = new GoogleGenAI({ apiKey });
  const currentYear = userData.targetYear || new Date().getFullYear();
  
  const prompt = `
YOU ARE THE FORTUNE TELLER "YONGSHIN HALMOM".
ALL responses MUST be written in ${lang === "ko" ? "KOREAN" : "ENGLISH"}.
STRICTLY RETURN ONLY A VALID JSON OBJECT. NO MARKDOWN CODE BLOCKS.

분석 대상 연도: ${currentYear}년
의뢰인 정보: ${JSON.stringify(userData)}
분석 수준: ${level === 'detailed' ? "심격 분석 (Detailed)" : "기본 분석 (Standard)"}

REQUIRED JSON STRUCTURE:
{
  "summary": "Full fortune summary (min 400 characters, mystical/traditional tone)",
  "zodiac": 1-12,
  "illustrationType": "SUN"|"MOON"|"TREE"|"CANDLE"|"DRAGON"|"WATER"|"MOUNTAIN"|"BELLS",
  "sections": [
    { "title": "Section Title", "content": "Detailed analysis content" }
  ],
  "luckInfo": {
    "color": "Lucky Color",
    "item": "Lucky Item",
    "food": "Lucky Food"
  }
}
`;

  let lastError: any = null;

  for (const modelName of MODELS_TO_TRY) {
    try {
      console.log(`[GeminiService] Attempting generation with ${modelName}...`);
      
      const response = await ai.models.generateContent({
        model: modelName,
        contents: prompt,
        config: {
          systemInstruction: SYSTEM_INSTRUCTION,
          responseMimeType: "application/json",
          temperature: 0.8,
        }
      });

      let text = response.text || "";
      if (!text) throw new Error("EMPTY_RESPONSE");

      // Clean text in case of markdown blocks
      const firstCurly = text.indexOf('{');
      const lastCurly = text.lastIndexOf('}');
      if (firstCurly !== -1 && lastCurly !== -1) {
        text = text.substring(firstCurly, lastCurly + 1);
      }

      try {
        const parsed = JSON.parse(text);
        console.log(`[GeminiService] Success with ${modelName}`);
        return { ...parsed, level };
      } catch (e) {
        console.error(`[GeminiService] JSON Parse error with ${modelName}:`, e);
        throw new Error("MALFORMED_JSON");
      }
    } catch (error: any) {
      console.warn(`[GeminiService] ${modelName} failed:`, error.message || error);
      lastError = error;
      
      // If auth fails, don't keep trying models if the key is likely the issue
      if (error.message?.includes("API key not valid") || error.message?.includes("401")) {
        throw new Error("Gemini API 키 인증에 실패했습니다. 키 설정을 확인해 주세요.");
      }
      
      continue;
    }
  }

  throw new Error(`분석 실패: ${lastError?.message || "모든 모델 시도 실패"}`);
}
