import { Language } from "../lib/translations";
import { GoogleGenAI } from "@google/genai";
import OpenAI from "openai";

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


const SYSTEM_INSTRUCTION = import.meta.env.VITE_SYSTEM_INSTRUCTION || import.meta.env.SYSTEM_INSTRUCTION;

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
ALL responses MUST be written in ${lang === "ko" ? "KOREAN" : "ENGLISH"}.
STRICTLY RETURN ONLY A VALID JSON OBJECT. NO MARKDOWN CODE BLOCKS.

분석 대상 연도: ${currentYear}년
의뢰인 정보: ${JSON.stringify(userData)}
분석 수준: ${level === 'detailed' ? "심격 분석 (Detailed)" : "기본 분석 (Standard)"}
현재 날짜: ${new Date().toISOString().split('T')[0]}

REQUIRED JSON STRUCTURE:
{
  "summary": "Full fortune summary (min 400 characters)",
  "zodiac": 1-12,
  "illustrationType": "SUN"|"MOON"|"TREE"|"CANDLE"|"DRAGON"|"WATER"|"MOUNTAIN"|"BELLS",
  "sections": [
    { "title": "Section Title", "content": "Detailed analysis content" }
  ],
  "luckInfo": {
    "color": "Today Lucky Color",
    "item": "Today Lucky Item",
    "food": "Today Lucky Food"
  }
}

NOTE: The third section (sections[2]) MUST be the "Today's Condition Guide". 
In the content of sections[2], you MUST start with the current date (e.g. "### 2026-05-11\n\n...").
`;

  let lastError: any = null;

  for (const modelName of MODELS_TO_TRY) {
    try {
      console.log(`[GeminiService] Attempting generation with ${modelName}...`);
      
      // Use race for a per-model timeout
      const response = await Promise.race([
        ai.models.generateContent({
          model: modelName,
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
          config: {
            systemInstruction: SYSTEM_INSTRUCTION,
            responseMimeType: "application/json",
            temperature: 0.8,
          }
        }),
        new Promise<any>((_, reject) => setTimeout(() => reject(new Error("MODEL_TIMEOUT")), 60000))
      ]);

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

  try {
    return await tryOpenAI(prompt, level);
  } catch (openAiError: any) {
    console.error("[GeminiService] OpenAI fallback also failed:", openAiError.message);
    throw new Error(`분석 실패: ${lastError?.message || "모든 모델 시도 실패"} (OpenAI: ${openAiError.message})`);
  }
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
  const env = typeof process !== 'undefined' ? process.env : {};
  const apiKeyRaw = (env.GEMINI_API_KEY || import.meta.env.VITE_GEMINI_API_KEY || "").toString();
  const apiKey = apiKeyRaw.replace(/['"\\\r\n\t]+/g, '').trim();

  if (!apiKey) {
    throw new Error("API key is missing.");
  }

  const ai = new GoogleGenAI({ apiKey });
  const today = new Date();
  const formattedToday = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

  const prompt = `
YOU ARE THE FORTUNE TELLER "YONGSHIN HALMOM".
ALL responses MUST be written in ${lang === "ko" ? "KOREAN" : "ENGLISH"}.
STRICTLY RETURN ONLY A VALID JSON OBJECT.

의뢰인 사주 정보: ${JSON.stringify(userData)}
현재 날짜: ${formattedToday}

이 의뢰인의 사주와 '현재 날짜'의 일진(日辰)을 분석하여 '오늘의 컨디션 가이드'를 작성하세요.
내용에는 반드시 "${formattedToday}" 날짜를 첫 줄에 명시하세요.

REQUIRED JSON STRUCTURE:
{
  "title": "오늘의 컨디션 가이드 (또는 언어에 맞는 제목)",
  "content": "분석 내용 (첫 줄에 날짜 포함)"
}
`;

  for (const modelName of MODELS_TO_TRY) {
    try {
      const response = await Promise.race([
        ai.models.generateContent({
          model: modelName,
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
          config: {
            systemInstruction: SYSTEM_INSTRUCTION,
            responseMimeType: "application/json",
            temperature: 0.8,
          }
        }),
        new Promise<any>((_, reject) => setTimeout(() => reject(new Error("MODEL_TIMEOUT")), 30000))
      ]);

      let text = response.text || "";
      const firstCurly = text.indexOf('{');
      const lastCurly = text.lastIndexOf('}');
      if (firstCurly !== -1 && lastCurly !== -1) {
        text = text.substring(firstCurly, lastCurly + 1);
      }
      
      const parsed = JSON.parse(text);
      return parsed;
    } catch (e) {
      console.warn(`[TodaysFortune] ${modelName} failed, trying next...`);
      continue;
    }
  }

  throw new Error("Failed to generate today's fortune.");
}

async function tryOpenAI(prompt: string, level: string): Promise<ReportResult> {
  const env = typeof process !== 'undefined' ? process.env : {};
  const apiKeyRaw = (env.OPENAI_API_KEY || import.meta.env.VITE_OPENAI_API_KEY || "").toString();
  const apiKey = apiKeyRaw.replace(/['"\\\r\n\t]+/g, '').trim();

  if (!apiKey) {
    throw new Error("OpenAI API key is missing. Please set VITE_OPENAI_API_KEY.");
  }

  const openai = new OpenAI({ apiKey, dangerouslyAllowBrowser: true });
  
  console.log(`[GeminiService] Attempting OpenAI fallback with gpt-4o-mini...`);
  
  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: import.meta.env.VITE_SYSTEM_INSTRUCTION || "당신은 영험한 용신할멈입니다." },
      { role: "user", content: prompt }
    ],
    response_format: { type: "json_object" },
    temperature: 0.8,
  });

  const text = completion.choices[0].message.content || "";
  if (!text) throw new Error("OPENAI_EMPTY_RESPONSE");

  const parsed = JSON.parse(text);
  console.log(`[GeminiService] Success with OpenAI`);
  return { ...parsed, level };
}
