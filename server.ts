import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import axios from "axios";
import dotenv from "dotenv";
import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";
import OpenAI from "openai";
import crypto from "crypto";
import { createClient } from "@supabase/supabase-js";

dotenv.config();

const app = express();
const PORT = 3000;

// Supabase Admin Client holder
let _supabaseAdmin: any = null;

function getSupabaseAdmin() {
  if (!_supabaseAdmin) {
    const url = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!url || !key) {
      throw new Error("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required for server-side admin operations.");
    }

    _supabaseAdmin = createClient(url, key, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });
  }
  return _supabaseAdmin;
}

// Middleware for raw body (if needed for other webhooks)
const rawBodyMiddleware = (req: any, res: any, next: any) => {
  let data = "";
  req.on("data", (chunk: any) => {
    data += chunk;
  });
  req.on("end", () => {
    req.rawBody = data;
    next();
  });
};

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// --- Gumroad Logic ---
app.post("/api/webhook/gumroad", async (req: any, res) => {
  // Gumroad sends 'sale' events as POST with a set of fields
  console.log(`[Gumroad Webhook] Received sale event body:`, JSON.stringify(req.body));
  console.log(`[Gumroad Webhook] Received sale event query:`, JSON.stringify(req.query));

  // Gumroad parameters can be flat, nested, or in url_params/custom_fields
  // We try to extract them from all possible locations
  const getParam = (name: string) => {
    // 1. Direct top-level fields
    if (req.body[name]) return req.body[name];
    
    // 2. Nested objects if express.json() / express.urlencoded() handled them
    if (req.body.url_params && req.body.url_params[name]) return req.body.url_params[name];
    if (req.body.custom_fields && req.body.custom_fields[name]) return req.body.custom_fields[name];
    
    // 3. Flat bracket keys (e.g. url_params[user_id])
    if (req.body[`url_params[${name}]`]) return req.body[`url_params[${name}]`];
    if (req.body[`custom_fields[${name}]`]) return req.body[`custom_fields[${name}]`];
    
    // 4. Try parsing custom_fields if it's a stringified JSON
    if (typeof req.body.custom_fields === 'string') {
      try {
        const parsed = JSON.parse(req.body.custom_fields);
        if (parsed[name]) return parsed[name];
      } catch (e) {}
    }
    
    // 5. Query params as fallback
    return req.query[name];
  };

  const user_id = getParam("user_id");
  const report_hash = getParam("report_hash");
  const { email, product_id, sale_id } = req.body;
  
  console.log(`[Gumroad Webhook] Extraction attempt: user_id=${user_id}, report_hash=${report_hash}, sale_id=${sale_id}`);

  if (!user_id || !report_hash) {
    console.warn(`[Gumroad Webhook] Data missing. Body keys: ${Object.keys(req.body).join(", ")}`);
    // If essential data is missing, we can't process payment verification
    return res.status(200).send("Acknowledge but missing required identifiers");
  }
  
  console.log(`[Gumroad Webhook] Extracted: user_id=${user_id}, report_hash=${report_hash}, sale_id=${sale_id}`);

  try {
    const supabaseAdmin = getSupabaseAdmin();
    
    // 1. Update Profile (if exists)
    if (user_id) {
      await supabaseAdmin
        .from("profiles")
        .update({ is_premium: true })
        .eq("id", user_id);
    }

    // 2. Mark Specific Payment as Paid in 'payments' table
    if (user_id && report_hash) {
      await supabaseAdmin
        .from("payments")
        .upsert({ 
          user_id: user_id,
          report_hash: report_hash,
          is_premium: true,
          checkout_id: sale_id || "gumroad_sale"
        }, { onConflict: 'user_id,report_hash' });
      console.log(`[Gumroad Webhook] Payment marked as paid for user ${user_id} and hash ${report_hash}`);
    }
  } catch (err) {
    console.error("[Gumroad Webhook] Database update failed:", err);
    // Don't 500 Gumroad unless it's a transient error, or it will keep retrying
    return res.status(200).send("DB update failed but acknowledged");
  }

  res.status(200).send("OK");
});

// GET /api/check-payment - Allow client to verify their own payment status
app.get("/api/check-payment", async (req, res) => {
  const { userId } = req.query;
  if (!userId) return res.status(400).json({ error: "userId required" });
  
  try {
    const supabaseAdmin = getSupabaseAdmin();
    const { data, error } = await supabaseAdmin
      .from("profiles")
      .select("is_premium")
      .eq("id", userId)
      .single();

    if (error) throw error;
    res.json({ isPremium: !!data?.is_premium });
  } catch (err) {
    res.status(500).json({ error: "Failed to check status" });
  }
});

const SYSTEM_INSTRUCTION = process.env.SYSTEM_INSTRUCTION || process.env.VITE_SYSTEM_INSTRUCTION || "당신은 영험한 용신할멈으로, 사용자의 기초 정보를 바탕으로 한 해의 운세를 아주 상세하고 문학적으로 풀이해주는 점술가입니다. 사주 명리학과 육효, 그리고 현대적 라이프스타일 분석을 결합하여 조언하십시오.";

// Gemini / OpenAI Logic hidden on server
let genAI: GoogleGenerativeAI | null = null;
function getGenAI() {
  if (!genAI) {
    const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || process.env.VITE_GEMINI_API_KEY || process.env.VITE_GOOGLE_API_KEY;
    if (!apiKey) throw new Error("GEMINI_API_KEY is missing in server environment");
    genAI = new GoogleGenerativeAI(apiKey.replace(/['"]/g, "").trim());
  }
  return genAI;
}

const MODELS_TO_TRY = [
  "gemini-3-flash-preview",
  "gemini-2.0-flash-exp",
  "gemini-1.5-flash",
  "gemini-1.5-pro"
];

console.log("[Server] Gemini models prioritized:", MODELS_TO_TRY.join(", "));
if (!(process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || process.env.VITE_GEMINI_API_KEY || process.env.VITE_GOOGLE_API_KEY)) {
  console.warn("[Server] WARNING: No Gemini API key found in environment variables!");
}

app.post("/api/report", async (req, res) => {
  const { userData, lang, level } = req.body;
  
  let lastError = null;
  for (const modelName of MODELS_TO_TRY) {
    try {
      console.log(`[Server] Attempting report generation with ${modelName}...`);
      const ai = getGenAI();
      const model = ai.getGenerativeModel({ 
        model: modelName,
        systemInstruction: SYSTEM_INSTRUCTION
      });

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

      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error("MODEL_TIMEOUT")), 40000)
      );

      console.log(`[Server] Prompt prepared for ${modelName}. Waiting for generation...`);
      const generatePromise = model.generateContent({
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
              },
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
          },
          maxOutputTokens: 3000,
          temperature: 0.7,
        },
      });

      const result: any = await Promise.race([generatePromise, timeoutPromise]);
      const response = result.response;
      const text = response.text();
      
      if (!text) {
        console.warn(`[Server] Model ${modelName} returned empty text.`);
        throw new Error("EMPTY_RESPONSE");
      }
      
      try {
        const parsed = JSON.parse(text);
        console.log(`[Server] Successfully generated report using ${modelName}`);
        return res.json({ ...parsed, level });
      } catch (e) {
        console.error(`[Server] Model ${modelName} returned invalid JSON:`, text.substring(0, 500));
        throw new Error("INVALID_JSON_RESPONSE");
      }
      
    } catch (error: any) {
      const errorMsg = error.message || String(error);
      console.error(`[Server] Model ${modelName} session failed. Error:`, errorMsg);
      lastError = error;
      
      if (errorMsg === "MODEL_TIMEOUT") {
        console.warn(`[Server] ${modelName} timed out after 45s.`);
        continue;
      }
      
      if (errorMsg.includes("429") || errorMsg.includes("quota")) {
        console.warn(`[Server] ${modelName} quota exceeded. Trying next...`);
        continue;
      }

      if (errorMsg.includes("API key") || errorMsg.includes("INVALID_ARGUMENT") || errorMsg.includes("PERMISSION_DENIED")) {
        console.error("[Server] Terminal Error (Auth/Key).");
        return res.status(401).json({ error: "API 키 설정 오류가 발견되었습니다. 관리자에게 문의해 주세요." });
      }

      // If it's a general safety error or something, try next
      continue;
    }
  }

  res.status(500).json({ 
    error: `모든 모델이 분석에 실패했습니다. (마지막 에러: ${lastError?.message || "알 수 없는 오류"})` 
  });
});


app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    env: {
      hasGeminiKey: !!(process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || process.env.VITE_GEMINI_API_KEY || process.env.VITE_GOOGLE_API_KEY),
      nodeEnv: process.env.NODE_ENV,
      port: PORT
    }
  });
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
