import { GoogleGenAI, Type, ThinkingLevel } from "@google/genai";

import { Language } from "../lib/translations";

let genAI: GoogleGenAI | null = null;

function getGenAI() {
  if (!genAI) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY environment variable is required");
    }
    genAI = new GoogleGenAI({ apiKey });
  }
  return genAI;
}

export interface FortuneSection {
  title: string;
  content: string;
}

export interface FortuneResult {
  summary: string;
  illustrationType: "SUN" | "MOON" | "TREE" | "CANDLE" | "DRAGON" | "WATER" | "MOUNTAIN" | "BELLS";
  sections: FortuneSection[];
  luckInfo: {
    color: string;
    item: string;
    food: string;
  };
  medicalAdvice?: string;
  isAbuse?: boolean;
  abuseMessage?: string;
}

const SYSTEM_INSTRUCTION = process.env.SYSTEM_INSTRUCTION;
const TIME_LOGIC = process.env.TIME_LOGIC
export async function getFortune(userData: {
  name: string;
  birthDate: string;
  birthTime: string;
  isLunar: boolean;
  gender: string;
  birthPlace: string;
}, lang: Language = "ko"): Promise<FortuneResult> {
  const now = new Date();
  const currentDate = now.toISOString().split('T')[0];
  const currentTime = now.toLocaleTimeString('ko-KR', { hour12: false });
  
  const prompt = `
현재 시각(서버 시간): ${currentDate} ${currentTime} (올해는 2026년 병오년(丙午年)임에 유의하게)

응답 언어: ${lang === "ko" ? "한국어 (Korean)" : "영어 (English)"}

의뢰인 정보:
- 성명: ${userData.name}
- 생년월일: ${userData.birthDate} (ISO 형식)
- 출생시각: ${userData.birthTime}
- 역구분: ${userData.isLunar ? "음력" : "양력"}
- 성별: ${userData.gender}
- 출생지: ${userData.birthPlace}

위 정보를 바탕으로 '만세력(萬歲曆)'을 계산하되, 아래 [계산 기준]을 엄격히 준수하여 사주팔자의 간지(干支)를 도출하고 '현대 사주명리학'의 관점에서 매서운 점사를 내려주게.

[계산 기준 (매우 중요)]
${TIME_LOGIC}

[상세 지침]
1. 현대 사주명리학 관점: 단순한 길흉화복보다는 심리적 기제, 현대적 직업 적성, 자아 실현의 도구로서 사주를 풀이해주게나.
2. 모든 응답은 반드시 지정된 언어(${lang})로 작성해야 하네.
3. 섹션 구성:
   - 섹션 1 (대운 및 전체 사주 풀이): 타고난 성정(性情), 대운의 흐름, 초/중/장/노년의 운세를 현대적 관점에서 매우 상세히 기술하게.
   - 섹션 2 (2026년 병오년 총운): 올해의 흐름.
   - 섹션 3 (오늘의 운세): 접속일(${currentDate}) 기준 사주, 대명, 역술, 별자리, 띠를 종합한 운세.
   - 섹션 4 (월별 세부 운세): 양력 기준 1~12월 기술. 중요한 달은 **키워드** 볼드 처리.
   - 섹션 5~8: 건강, 애정, 직업/재물, 그리고 할멈의 비책.

반드시 할멈의 말투를 유지하며, 위 계산 기준을 어기면 할멈의 꾸지람을 면치 못할 것이야!
`;

  try {
    const ai = getGenAI();
    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash", 
      contents: prompt,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            summary: { type: Type.STRING },
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
            medicalAdvice: { type: Type.STRING },
            isAbuse: { type: Type.BOOLEAN },
            abuseMessage: { type: Type.STRING },
          },
          required: ["summary", "illustrationType", "sections", "luckInfo"],
        },
      },
    });

    return JSON.parse(response.text || "{}");
  } catch (error) {
    console.error("Error fetching fortune:", error);
    throw error;
  }
}

export async function askAdditionalQuestion(
  previousFortune: string,
  question: string,
  lang: Language = "ko"
): Promise<string> {
  const now = new Date();
  const currentDate = now.toISOString().split('T')[0];

  const prompt = `
현재 시각: ${currentDate} (병오년)
응답 언어: ${lang === "ko" ? "한국어" : "영어"}

이전 점사 내용:
${previousFortune}

사용자의 추가 질문:
${question}

이 질문에 대해 위 사주 분석에 기반하여 할멈의 말투로 대답해주게. 반드시 지정된 언어(${lang})로 작성해야 하네.
`;

  try {
    const ai = getGenAI();
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
      },
    });

    return response.text || (lang === "ko" ? "할멈이 잠시 신명이 나갔나 보구나. 다시 물어보게나." : "The spirit seems to have left me for a moment. Please ask again.");
  } catch (error) {
    console.error("Error in additional question:", error);
    return lang === "ko" ? "할멈 기운이 다했으니 나중에 다시 오게." : "My energy is spent, come back later.";
  }
}
