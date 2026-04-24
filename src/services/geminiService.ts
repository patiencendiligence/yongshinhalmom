import { GoogleGenAI, Type } from "@google/genai";
import OpenAI from "openai";
import { Language } from "../lib/translations";

let genAI: GoogleGenAI | null = null;
let openaiClient: OpenAI | null = null;

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

function getOpenAI() {
  if (!openaiClient) {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error("OPENAI_API_KEY environment variable is required for fallback");
    }
    openaiClient = new OpenAI({ apiKey, dangerouslyAllowBrowser: true });
  }
  return openaiClient;
}

export interface ReportSection {
  title: string;
  content: string;
}

export interface ReportResult {
  summary: string;
  zodiac: number; // 0-11: 쥐, 소, 호랑이, 토끼, 용, 뱀, 말, 양, 원숭이, 닭, 개, 돼지
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

const SYSTEM_INSTRUCTION = process.env.SYSTEM_INSTRUCTION;
const TIME_LOGIC = process.env.TIME_LOGIC;

const FREE_MODELS = [
  "gemini-3-flash-preview",
  "gemini-3.1-flash-lite-preview",
  "gemini-flash-latest",
  "gemini-3.1-pro-preview"
];

async function callWithFallback(
  operation: (modelName: string) => Promise<any>,
  openaiFallback?: () => Promise<any>
) {
  let lastError: any = null;
  
  for (const modelName of FREE_MODELS) {
    try {
      return await operation(modelName);
    } catch (error: any) {
      lastError = error;
      const errorStr = typeof error === 'string' ? error : JSON.stringify(error);
      const isQuota = 
        error?.message?.includes("429") || 
        error?.status === 429 || 
        error?.error?.code === 429 ||
        errorStr.includes("429") ||
        errorStr.includes("RESOURCE_EXHAUSTED");
      
      const isNotFound =
        error?.message?.includes("404") ||
        error?.status === 404 ||
        error?.error?.code === 404 ||
        errorStr.includes("404") ||
        errorStr.includes("NOT_FOUND");
      
      if (isQuota || isNotFound) {
        console.warn(`Model ${modelName} ${isQuota ? 'exhausted' : 'not found'}. Trying next fallback...`);
        continue;
      }
      throw error;
    }
  }

  // Try OpenAI as last resort
  if (openaiFallback) {
    try {
      console.warn("All Gemini models exhausted. Trying OpenAI fallback...");
      return await openaiFallback();
    } catch (error) {
      console.error("OpenAI Fallback failed:", error);
      throw lastError; // Prefer showing the original quota error or the final error
    }
  }

  throw lastError;
}

export async function getReport(userData: {
  name: string;
  birthDate: string;
  birthTime: string;
  isLunar: boolean;
  gender: string;
  birthPlace: string;
}, lang: Language = "ko"): Promise<ReportResult> {
  const now = new Date();
  const currentDate = now.toISOString().split('T')[0];
  const currentTime = now.toLocaleTimeString('ko-KR', { hour12: false });
  
  const currentYear = now.getFullYear();
  
  const prompt = `
[STRICT LANGUAGE INSTRUCTION]
ALL responses MUST be written in ${lang === "ko" ? "KOREAN" : "ENGLISH"}. This is critical.

현재 시각(서버 시간): ${currentDate} ${currentTime} (올해는 ${currentYear}년임에 유의하게)

응답 언어: ${lang === "ko" ? "한국어 (Korean)" : "영어 (English)"}

의뢰인 정보:
- 성명: ${userData.name}
- 생년월일: ${userData.birthDate} (ISO 형식) 위 정보를 바탕으로 분석 알고리즘을 적용하여 사용자의 고유 패턴을 도출하게. **특히 각 시점의 변화는 입춘(立春, 보통 양력 2월 4~5일경)을 기준으로 분석해야 함을 절대 잊지 말게나.** 현대인의 데이터와 패턴을 분석하여 생산성 향상과 심리적 안정을 돕는 정밀 리포트를 작성해주게.

[계산 기준 (매우 중요)]
${TIME_LOGIC}

[상세 지침]
1. 분석 관점: 단순한 길흉화복보다는 심리적 기제, 현대적 직업 적성, 자아 실현의 도구로서 라이프스타일 패턴을 풀이해주게나. "~할 것이다"와 같은 단정적 예언보다는 "~한 경향이 있다", "~할 가능성이 높다"와 같은 분석적 표현을 사용하게.
2. 말투: 엄격하면서도 부드러운 할머니의 말투("하게"체와 "해라"체)를 사용하게나.
3. ALL CONTENT, including summary, titles, item names, and advice, MUST be written strictly in ${lang === "ko" ? "Korean" : "English"}.
4. 섹션 구성:
   - 섹션 1 (기초 패턴 및 성향 분석): 타고난 기저 성향, 환경적 변화의 흐름, 생애 주기별 패턴을 분석하여 기술하게. **반드시 글의 마지막에 아래 형식을 빌려 '리포트 요약'을 포함시킬 것.** 가독성을 위해 줄바꿈을 충분히 사용하게나.
     예시 형식:
     [한 줄 요약]
     
     분석 근거: [패턴 설명]

     주요 흐름: [기간별 경향성]
     
     * 핵심 인사이트
     [분석 포인트 1]

     [분석 포인트 2]
     
     [분석 포인트 3]
     
     더 나은 일상을 위한 가이드가 되길 바라네.

   - 섹션 2 (${currentYear}년 타임라인 분석): 올해의 주요 에너지 흐름.
   - 섹션 3 (데일리 체크): 접속일(${currentDate}) 기준 환경적 요인과 개인 패턴을 결합한 분석.
   - 섹션 4 (월별 세부 인사이트): 양력 기준 1~12월 기술. **각 월별 분석은 반드시 글머리 기호(Markdown Bullet Points)와 줄바꿈(Newline)을 사용하여 하나씩 명확하게 구분**할 것이며, 가독성을 최우선으로 하게. 유의미한 기간은 **키워드** 볼드 처리하게.
   - 섹션 5~8: 웰니스, 대인관계, 커리어/생산성, 그리고 할머니의 특별한 제언.

신뢰감 있고 무게감 있는 할머니의 말투를 유지하며, 분석 기준을 엄격히 따라주게나.
`;

  return callWithFallback(
    async (modelName) => {
      const ai = getGenAI();
      const response = await ai.models.generateContent({
        model: modelName, 
        contents: prompt,
        config: {
          systemInstruction: SYSTEM_INSTRUCTION,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              summary: { type: Type.STRING },
              zodiac: { type: Type.INTEGER, description: "Calculated zodiac index based on birth year (0:Rat, 1:Ox, 2:Tiger, 3:Rabbit, 4:Dragon, 5:Snake, 6:Horse, 7:Sheep, 8:Monkey, 9:Rooster, 10:Dog, 11:Pig) based on Ipchun." },
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
            required: ["summary", "zodiac", "illustrationType", "sections", "luckInfo"],
          },
        },
      });

      return JSON.parse(response.text || "{}");
    },
    async () => {
      const openai = getOpenAI();
      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: SYSTEM_INSTRUCTION || "" },
          { role: "user", content: prompt }
        ],
        response_format: { type: "json_object" }
      });
      return JSON.parse(response.choices[0].message.content || "{}");
    }
  );
}

export async function askAdditionalQuestion(
  previousReport: string,
  question: string,
  lang: Language = "ko"
): Promise<string> {
  const now = new Date();
  const currentDate = now.toISOString().split('T')[0];

  const prompt = `
[STRICT LANGUAGE INSTRUCTION]
The response MUST be written strictly in ${lang === "ko" ? "KOREAN" : "ENGLISH"}.

[STRICT FORMAT INSTRUCTION]
DO NOT use JSON format. DO NOT use markdown code blocks like \`\`\`json.
Reply ONLY with a natural, conversational response in the voice of a traditional Korean grandmother (Halmeom), using grandmotherly tone ("하게" and "해라").

현재 시각: ${currentDate}

이전 리포트 내용:
${previousReport}

사용자의 추가 질문:
${question}

이 질문에 대해 위 분석에 기반하여 할머니의 말투로 대답해주게. 반드시 지정된 언어(${lang})로 작성해야 하네.
`;

  try {
    return await callWithFallback(
      async (modelName) => {
        const ai = getGenAI();
        const response = await ai.models.generateContent({
          model: modelName,
          contents: prompt,
          config: {
            systemInstruction: SYSTEM_INSTRUCTION,
          },
        });

        return response.text || (lang === "ko" ? "할멈이 잠시 자리를 비웠나 보구나. 다시 물어보게나." : "I seem to have stepped out for a moment. Please ask again.");
      },
      async () => {
        const openai = getOpenAI();
        const response = await openai.chat.completions.create({
          model: "gpt-4o-mini",
          messages: [
            { role: "system", content: SYSTEM_INSTRUCTION || "" },
            { role: "user", content: prompt }
          ]
        });
        return response.choices[0].message.content || (lang === "ko" ? "할멈이 잠시 자리를 비웠나 보구나. 다시 물어보게나." : "I seem to have stepped out for a moment. Please ask again.");
      }
    );
  } catch (error) {
    console.error("Error in additional question:", error);
    return lang === "ko" ? "할멈 기운이 다했으니 나중에 다시 오게." : "My energy is spent, come back later.";
  }
}
