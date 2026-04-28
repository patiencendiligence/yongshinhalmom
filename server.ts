import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import axios from "axios";
import dotenv from "dotenv";
import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";
import OpenAI from "openai";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Gemini / OpenAI Logic moved to server
let genAI: GoogleGenerativeAI | null = null;
let openaiClient: OpenAI | null = null;

function getGenAI() {
  if (!genAI) {
    const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
    if (!apiKey) {
      console.error("Missing GEMINI_API_KEY or GOOGLE_API_KEY");
      throw new Error("Gemini API key environment variable is required");
    }
    
    // Masked logging for debugging
    const masked = apiKey.length > 8 ? `${apiKey.substring(0, 4)}...${apiKey.substring(apiKey.length - 4)}` : "****";
    console.log(`[Server] Initializing Gemini with key: ${masked}`);
    
    // Some keys might be passed with quotes from certain environments
    const cleanKey = apiKey.replace(/['"]/g, '').trim();
    genAI = new GoogleGenerativeAI(cleanKey);
  }
  return genAI;
}

function getOpenAI() {
  if (!openaiClient) {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      console.warn("Missing OPENAI_API_KEY, fallback disabled");
      return null;
    }
    openaiClient = new OpenAI({ apiKey });
  }
  return openaiClient;
}

const SYSTEM_INSTRUCTION = process.env.SYSTEM_INSTRUCTION || "당신은 인생의 지혜를 전하는 엄격하면서도 따뜻한 할머니입니다.";
const TIME_LOGIC = process.env.TIME_LOGIC || "";

const FREE_MODELS = [
  "gemini-1.5-flash",
  "gemini-1.5-pro",
  "gemini-2.0-flash-exp"
];

async function callWithFallback(
  operation: (modelName: string) => Promise<any>,
  openaiFallback?: () => Promise<any>
) {
  let lastError: any = null;
  
  for (const modelName of FREE_MODELS) {
    try {
      console.log(`Attempting with model: ${modelName}`);
      return await operation(modelName);
    } catch (error: any) {
      lastError = error;
      const errorStr = JSON.stringify(error);
      const isQuota = 
        error?.message?.includes("429") || 
        error?.status === 429 || 
        error?.error?.code === 429 ||
        errorStr.includes("429") ||
        errorStr.includes("RESOURCE_EXHAUSTED");
      
      console.warn(`Model ${modelName} failed. Error:`, error.message || error);
      
      // Continue to next model or fallback for any error during debugging
      continue;
    }
  }

  if (openaiFallback) {
    console.log("Falling back to OpenAI...");
    return await openaiFallback();
  }

  throw lastError;
}

app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    env: {
      hasGeminiKey: !!(process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY),
      hasOpenAIKey: !!process.env.OPENAI_API_KEY,
      nodeEnv: process.env.NODE_ENV,
      port: PORT
    }
  });
});

app.post("/api/report", async (req, res) => {
  const { userData, lang } = req.body;
  
  try {
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

    const result = await callWithFallback(
      async (modelName) => {
        const ai = getGenAI();
        const apiKey = process.env.GEMINI_API_KEY;
        console.log(`[Server] Model: ${modelName}, Key Prefix: ${apiKey ? apiKey.substring(0, 6) : "None"}`);
        
        const model = ai.getGenerativeModel({
          model: modelName,
          systemInstruction: SYSTEM_INSTRUCTION,
        });
        
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
                medicalAdvice: { type: SchemaType.STRING },
                isAbuse: { type: SchemaType.BOOLEAN },
                abuseMessage: { type: SchemaType.STRING },
              },
              required: ["summary", "zodiac", "illustrationType", "sections", "luckInfo"],
            } as any,
          },
        });

        const text = response.response.text();
        if (!text) throw new Error("Empty response from Gemini");
        return JSON.parse(text);
      },
      async () => {
        const openai = getOpenAI();
        if (!openai) throw new Error("OpenAI fallback not available");
        const response = await openai.chat.completions.create({
          model: "gpt-4o-mini",
          messages: [
            { role: "system", content: SYSTEM_INSTRUCTION || "" },
            { role: "user", content: prompt }
          ],
          response_format: { type: "json_object" }
        });
        const text = response.choices[0].message.content;
        if (!text) throw new Error("Empty response from OpenAI");
        return JSON.parse(text);
      }
    );

    res.json(result);
  } catch (error: any) {
    console.error("Report generation error:", error);
    res.status(500).json({ error: error.message || "Failed to generate report" });
  }
});

// GitHub Issue Reporting API
app.post("/api/report-issue", async (req, res) => {
  const { content, userData, lang } = req.body;
  
  if (!content || content.length < 15) {
    return res.status(400).json({ error: "Content must be at least 15 characters long." });
  }

  const token = process.env.GITHUB_TOKEN;
  const owner = process.env.GITHUB_REPO_OWNER || "patiencendiligence";
  const repo = process.env.GITHUB_REPO_NAME || "yongshinhalmom";

  if (!token) {
    console.error("GITHUB_TOKEN is not defined in environment variables.");
    return res.status(500).json({ error: "Server configuration error." });
  }

  try {
    const issueTitle = `[Analysis Report] ${userData?.name || "Anonymous"} - ${lang}`;
    const issueBody = `
**User Profile:**
- Name: ${userData?.name}
- Birth Date: ${userData?.birthDate} (${userData?.isLunar ? "Lunar" : "Solar"})
- Birth Time: ${userData?.birthTime}
- Birth Place: ${userData?.birthPlace}
- Gender: ${userData?.gender}

**Report Content:**
${content}

---
*Reported via Yongshin Halmom App*
    `;

    const response = await axios.post(
      `https://api.github.com/repos/${owner}/${repo}/issues`,
      {
        title: issueTitle,
        body: issueBody,
      },
      {
        headers: {
          Authorization: `token ${token}`,
          Accept: "application/vnd.github.v3+json",
        },
      }
    );

    res.json({ success: true, issueUrl: response.data.html_url });
  } catch (error: any) {
    console.error("Error creating GitHub issue:", error.response?.data || error.message);
    res.status(500).json({ error: "Failed to submit report." });
  }
});

async function startServer() {
  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
