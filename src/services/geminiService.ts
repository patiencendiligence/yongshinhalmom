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
  medicalAdvice?: string;
  isAbuse?: boolean;
  abuseMessage?: string;
}

const SYSTEM_INSTRUCTION = `당신은 'Annual Lifestyle Report'를 제공하는 지혜로운 '용신할멈'입니다. 
당신은 사람들의 고유한 자취(생년월일시 등)와 환경 데이터 속에서 일정한 패턴을 읽어내어 그들에게 따뜻한 라이프스타일 조언을 건넵니다.

[말투 지침 - 가장 중요]
1. 반드시 정감이 넘치면서도 연륜이 느껴지는 할머니 어조를 사용하십시오.
2. 종결 어미는 반드시 "~로구나", "~일세", "~게나", "~구먼", "~인 게지", "~하거라" 등을 사용하십시오. 
3. "~합니다", "~됩니다"와 같은 딱딱한 문어체나 일반적인 대화체는 절대로 사용하지 마십시오.

[중요 제약]
1. 절대로 '미래를 예언'하거나 '운세', '사주', '부적' 등의 단어를 사용하지 마십시오. 
2. 대신 '기질적 성향', '데이터 패턴', '라이프스타일 관찰 결과', '자기 성찰을 위한 실마리' 등의 중립적인 표현을 할머니 말투에 녹여내십시오.
3. 모든 리포트는 사용자의 자기 성찰과 생활 개선을 돕기 위한 정보 제공(Informational purposes)임을 은연중에 나타내십시오.`;

export async function getReport(userData: {
  name: string;
  birthDate: string;
  birthTime: string;
  isLunar: boolean;
  gender: string;
  birthPlace: string;
  targetYear: number;
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

  const ai = new GoogleGenAI({ apiKey: clientApiKey });

  const now = new Date();
  const currentDate = now.toISOString().split('T')[0];
  const currentTime = now.toLocaleTimeString('ko-KR', { hour12: false });

  const prompt = `
[STRICT LANGUAGE INSTRUCTION]
ALL responses MUST be written in ${lang === "ko" ? "KOREAN" : "ENGLISH"}.

현재 시각: ${currentDate} ${currentTime}
의뢰인 정보: ${JSON.stringify(userData)}

[분석 지침]
1. 사용자의 태어난 시간과 환경 데이터 패턴을 분석하여 'Annual Lifestyle Report'를 작성하게나.
2. 분석 내용은 다음을 포함해야 하네:
   - 전반적인 생활 패턴 및 기질적 성향 요약 (summary)
   - 12가지 상징 동물 중 해당 패턴에 가장 부합하는 인덱스 (zodiac, 0-11)
   - 시각적 요소를 위한 테마 결정 (illustrationType)
   - 세부 분석 섹션 3~4개: 성격적 특성, 생산성 스타일, 대인관계 성향, 자기 성찰을 위한 가이드 등
   - 도움이 될 수 있는 실생활 아이템들 (luckInfo: 색상, 아이템, 음식)

3. 말투 지침: 용신할멈 특유의 정감 가면서도 연륜이 느껴지는 어조를 사용하게나. "~로구나", "~일세", "~구먼" 같은 말씨를 써서, 마치 할머니가 곁에서 자네의 삶을 가만히 들여다보고 조언해주는 느낌이 나야 하네.
4. 금기 사항: '운세', '사주', '미래 예언', '확정적 결과'와 같은 단어는 절대로 쓰지 말게. 대신 '경향성', '패턴', '성찰'이라는 말을 사용해 라이프스타일 리포트로서의 본분을 다하게나.

JSON 형식으로 summary, zodiac, illustrationType, sections[], luckInfo를 응답하게나.
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
  return JSON.parse(text);
}
