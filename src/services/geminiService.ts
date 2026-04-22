import { GoogleGenAI, Type, ThinkingLevel } from "@google/genai";

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  throw new Error("GEMINI_API_KEY is not defined");
}

const genAI = new GoogleGenAI({ apiKey });

export interface FortuneSection {
  title: string;
  content: string;
}

export interface FortuneResult {
  summary: string;
  sections: FortuneSection[];
  medicalAdvice?: string;
  isAbuse?: boolean;
  abuseMessage?: string;
}

const SYSTEM_INSTRUCTION = process.env.SYSTEM_INSTRUCTION;

export async function getFortune(userData: {
  name: string;
  birthDate: string;
  birthTime: string;
  isLunar: boolean;
  gender: string;
  birthPlace: string;
}): Promise<FortuneResult> {
  const now = new Date();
  const currentDate = now.toISOString().split('T')[0];
  const currentTime = now.toLocaleTimeString('ko-KR', { hour12: false });
  
  const prompt = `
현재 시각(서버 시간): ${currentDate} ${currentTime} (올해는 2026년 병오년(丙午年)임에 유의하게)

의뢰인 정보:
- 성명: ${userData.name}
- 생년월일: ${userData.birthDate} (ISO 형식)
- 출생시각: ${userData.birthTime}
- 역구분: ${userData.isLunar ? "음력" : "양력"}
- 성별: ${userData.gender}
- 출생지: ${userData.birthPlace}

위 정보를 바탕으로 '만세력(萬歲曆)'을 정확히 계산하여 '정묘년(丁卯年) 기유월(己酉월) 정해일(丁亥일) 갑진시(甲辰時)'와 같이 사주팔자의 간지(干支)를 명확히 도출하고, 이를 기반으로 할멈의 매서운 점사를 내려주게. 
특히 현재가 2026년 병오년임을 기준으로 대운과 세운을 정확히 짚어주어야 하네.
`;

  try {
    const response = await genAI.models.generateContent({
      model: "gemini-3-flash-preview", 
      contents: prompt,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        responseMimeType: "application/json",
        thinkingConfig: { thinkingLevel: ThinkingLevel.LOW }, // Minimize thinking for speed
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            summary: { type: Type.STRING },
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
            medicalAdvice: { type: Type.STRING },
            isAbuse: { type: Type.BOOLEAN },
            abuseMessage: { type: Type.STRING },
          },
          required: ["summary", "sections"],
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
  question: string
): Promise<string> {
  const now = new Date();
  const currentDate = now.toISOString().split('T')[0];

  const prompt = `
현재 시각: ${currentDate} (병오년)

이전 점사 내용:
${previousFortune}

사용자의 추가 질문:
${question}

이 질문에 대해 위 사주 분석에 기반하여 할멈의 말투로 대답해주게.
`;

  try {
    const response = await genAI.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
      },
    });

    return response.text || "할멈이 잠시 신명이 나갔나 보구나. 다시 물어보게나.";
  } catch (error) {
    console.error("Error in additional question:", error);
    return "할멈 기운이 다했으니 나중에 다시 오게.";
  }
}
