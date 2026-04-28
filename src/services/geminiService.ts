import { Language } from "../lib/translations";
import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";

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
  medicalAdvice?: string;
  isAbuse?: boolean;
  abuseMessage?: string;
}

const SYSTEM_INSTRUCTION = "당신은 인생의 지혜를 전하는 엄격하면서도 따뜻한 할머니입니다.";

export async function getReport(userData: {
  name: string;
  birthDate: string;
  birthTime: string;
  isLunar: boolean;
  gender: string;
  birthPlace: string;
}, lang: Language = "ko"): Promise<ReportResult> {
  // 1. Try Server API first
  try {
    const response = await fetch("/api/report", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ userData, lang }),
    });

    if (response.ok) {
      return await response.json();
    }
    
    // Check if it's JSON before parsing
    const contentType = response.headers.get("content-type");
    if (contentType && contentType.includes("application/json")) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to generate report via server");
    } else {
      // If not JSON (like a 405 HTML page from GitHub), just go to fallback
      console.warn(`Server returned non-JSON response (${response.status}). Falling back to client-side.`);
    }
  } catch (error) {
    console.warn("Server API failed or not available, checking client-side fallback...", error);
  }

  // 2. Client-side Fallback (for Static Hosting like GitHub Pages)
  const clientApiKey = import.meta.env.VITE_GEMINI_API_KEY || import.meta.env.VITE_GOOGLE_API_KEY;
  if (!clientApiKey) {
    throw new Error("No API key found. For GitHub Pages, please configure VITE_GEMINI_API_KEY.");
  }

  const genAI = new GoogleGenerativeAI(clientApiKey);
  const model = genAI.getGenerativeModel({
    model: "gemini-1.5-flash",
    systemInstruction: SYSTEM_INSTRUCTION,
  });

  const now = new Date();
  const currentDate = now.toISOString().split('T')[0];
  const currentTime = now.toLocaleTimeString('ko-KR', { hour12: false });
  const currentYear = now.getFullYear();

  const prompt = `
[STRICT LANGUAGE INSTRUCTION]
ALL responses MUST be written in ${lang === "ko" ? "KOREAN" : "ENGLISH"}.

현재 시각: ${currentDate} ${currentTime}
의뢰인 정보: ${JSON.stringify(userData)}

[분석 지침]
엄격하면서도 부드러운 할머니 말투로 작성하게. 
JSON 형식으로 summary, zodiac(0-11), illustrationType, sections[], luckInfo{color, item, food}를 응답해라.
`;

  const response = await model.generateContent({
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: {
        type: SchemaType.OBJECT,
        properties: {
          summary: { type: SchemaType.STRING },
          zodiac: { type: SchemaType.NUMBER },
          illustrationType: { 
            type: SchemaType.STRING, 
            enum: ["SUN", "MOON", "TREE", "CANDLE", "DRAGON", "WATER", "MOUNTAIN", "BELLS"] 
          },
          sections: {
            type: SchemaType.ARRAY,
            items: {
              type: SchemaType.OBJECT,
              properties: {
                title: { type: SchemaType.STRING },
                content: { type: SchemaType.STRING },
              },
              required: ["title", "content"],
            },
          } as any,
          luckInfo: {
            type: SchemaType.OBJECT,
            properties: {
              color: { type: SchemaType.STRING },
              item: { type: SchemaType.STRING },
              food: { type: SchemaType.STRING },
            },
            required: ["color", "item", "food"],
          },
        },
        required: ["summary", "zodiac", "illustrationType", "sections", "luckInfo"],
      } as any,
    },
  });

  const text = response.response.text();
  if (!text) throw new Error("Empty response from Gemini Client");
  return JSON.parse(text);
}
