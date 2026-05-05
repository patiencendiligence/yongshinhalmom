import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import axios from "axios";
import dotenv from "dotenv";
import { GoogleGenAI, Type as SchemaType } from "@google/genai";
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

// Middleware for Lemon Squeezy Webhook (needs raw body for signature verification)
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

// --- Lemon Squeezy Logic ---

// --- Gumroad Logic ---
app.post("/api/webhook/gumroad", async (req: any, res) => {
  const payload = req.body;
  
  // Gumroad sends 'sale' events as POST with a set of fields
  // Note: For extra security, you should verify the 'seller_id' matches yours
  // Your Seller ID: patiencendiligence@gmail.com (usually matches account email or a hash)
  
  console.log(`[Gumroad Webhook] Received sale event:`, payload);

  const { email, product_id, sale_id } = payload;
  
  // Custom fields might be top-level or inside a list of fields/custom_fields
  const user_id = payload.user_id || (payload.custom_fields && payload.custom_fields.user_id) || payload["custom_fields[user_id]"];
  const report_hash = payload.report_hash || (payload.custom_fields && payload.custom_fields.report_hash) || payload["custom_fields[report_hash]"];
  
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

// Webhook for asynchronous payment notification
app.post("/api/webhook/lemonsqueezy", rawBodyMiddleware, async (req: any, res) => {
  const secret = process.env.LEMONSQUEEZY_WEBHOOK_SECRET;
  const hmac = crypto.createHmac("sha256", secret || "");
  const digest = hmac.update(req.rawBody).digest("hex");
  const signature = req.headers["x-signature"];

  if (signature !== digest) {
    console.error("[Webhook] Invalid signature");
    return res.status(401).send("Invalid signature");
  }

  const payload = JSON.parse(req.rawBody);
  const eventName = payload.meta.event_name;
  const customData = payload.meta.custom_data;

  console.log(`[Webhook] Received event: ${eventName}`, customData);

  if (eventName === "order_created") {
    const { user_id, report_hash } = customData;

    try {
      const supabaseAdmin = getSupabaseAdmin();
      // Update user to premium in Supabase
      if (user_id) {
        const { error } = await supabaseAdmin
          .from("profiles") // assuming 'profiles' table exists
          .update({ is_premium: true })
          .eq("id", user_id);

        if (error) throw error;
        console.log(`[Webhook] User ${user_id} upgraded to premium via LS Webhook`);
      }
      
      // Optionally mark the specific report as paid
      if (report_hash) {
        await supabaseAdmin
          .from("reports")
          .update({ is_paid: true })
          .eq("report_hash", report_hash);
      }
    } catch (err) {
      console.error("[Webhook] Database update failed:", err);
      return res.status(500).send("Database update failed");
    }
  }

  res.status(200).send("OK");
});

// GET /api/verify-order - Directly verify an order with Lemon Squeezy API
app.get("/api/verify-order", async (req, res) => {
  const { orderId, userId, reportHash } = req.query;
  const apiKey = process.env.LEMONSQUEEZY_API_KEY;

  if (!orderId || !userId) {
    return res.status(400).json({ error: "Missing orderId or userId" });
  }

  try {
    const supabaseAdmin = getSupabaseAdmin();
    // 1. Call Lemon Squeezy API to get order details
    const response = await axios.get(`https://api.lemonsqueezy.com/v1/orders/${orderId}`, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        Accept: "application/vnd.api+json",
        "Content-Type": "application/vnd.api+json",
      },
    });

    const orderData = response.data.data;
    const status = orderData.attributes.status; // e.g., 'paid'

    if (status === "paid") {
      // 2. Update Supabase
      const { error } = await supabaseAdmin
        .from("profiles")
        .update({ is_premium: true })
        .eq("id", userId);

      if (error) throw error;

      if (reportHash) {
        await supabaseAdmin
          .from("reports")
          .update({ is_paid: true })
          .eq("report_hash", reportHash);
      }

      return res.json({ success: true, status });
    }

    res.json({ success: false, status });
  } catch (err: any) {
    console.error("[VerifyOrder] Error:", err.response?.data || err.message);
    res.status(500).json({ error: "Failed to verify order" });
  }
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

// Gemini / OpenAI Logic moved to server
let genAI: GoogleGenAI | null = null;
let openaiClient: OpenAI | null = null;

function getGenAI() {
  if (!genAI) {
    // Platform-provided key in AI Studio
    const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
    
    if (!apiKey) {
      console.error("Missing GEMINI_API_KEY in environment");
      throw new Error("Gemini API key is required but not found in process.env.GEMINI_API_KEY.");
    }
    
    const cleanKey = apiKey.replace(/['"]/g, "").trim();
    const masked = cleanKey.length > 8 ? `${cleanKey.substring(0, 4)}...${cleanKey.substring(cleanKey.length - 4)}` : "****";
    console.log(`[Server] Initializing GoogleGenAI with key: ${masked} (Length: ${cleanKey.length})`);
    
    // Loosen validation to avoid false positives with real keys
    if (cleanKey.toLowerCase().includes("your_") || (cleanKey.length > 50 && cleanKey.toLowerCase().includes("placeholder"))) {
      throw new Error("GEMINI_API_KEY appears to be a placeholder.");
    }
    
    genAI = new GoogleGenAI({ apiKey: cleanKey });
  }
  return genAI;
}

function getOpenAI() {
  if (!openaiClient) {
    const apiKey = process.env.OPENAI_API_KEY || process.env.VITE_OPENAI_API_KEY;
    if (!apiKey) {
      console.warn("Missing OPENAI_API_KEY, fallback disabled");
      return null;
    }
    const cleanKey = apiKey.replace(/['"]/g, "").trim();
    if (cleanKey.toLowerCase().includes("your_") || cleanKey.toLowerCase().includes("placeholder")) {
      console.warn("OPENAI_API_KEY appears to be a placeholder");
      return null;
    }
    openaiClient = new OpenAI({ apiKey: cleanKey });
  }
  return openaiClient;
}

const SYSTEM_INSTRUCTION = process.env.SYSTEM_INSTRUCTION || "";
const TIME_LOGIC = process.env.TIME_LOGIC || "";

const FREE_MODELS = [
  "gemini-3-flash-preview",
  "gemini-3.1-pro-preview",
  "gemini-flash-latest"
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
      const errorMessage = error.message || "";
      const errorStr = JSON.stringify(error);
      
      console.error(`[Server] Model ${modelName} failed:`, errorMessage);
      
      // If the API key is strictly invalid, do not bother with other models
      if (errorMessage.includes("API key not valid") || errorMessage.includes("API_KEY_INVALID")) {
        throw new Error("The Gemini API key provided is invalid. Please check your Vercel/Environment settings.");
      }

      const isQuota = 
        errorMessage.includes("429") || 
        error?.status === 429 || 
        error?.error?.code === 429 ||
        errorStr.includes("429") ||
        errorStr.includes("RESOURCE_EXHAUSTED") ||
        errorMessage.includes("quota");
      
      if (isQuota) {
        console.warn(`[Server] Model ${modelName} hit rate limit/quota. Continuing to next...`);
        continue;
      }
      
      // For other errors, we might still want to try next models
      continue;
    }
  }

  if (openaiFallback) {
    console.log("[Server] All Gemini models failed or hit quota. Falling back to OpenAI...");
    try {
      return await openaiFallback();
    } catch (oaError: any) {
      console.error("[Server] OpenAI fallback also failed:", oaError.message || oaError);
      if (oaError.message?.includes("quota") || oaError.status === 429) {
        throw new Error("OpenAI quota exceeded. Please check your OpenAI billing details.");
      }
      throw oaError;
    }
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
  const { userData, lang, level } = req.body;
  const isDetailed = level === 'detailed';
  
  try {
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
분석 수준: ${isDetailed ? "심층 분석 (Deep Analysis)" : "기본 분석 (Quick Summary)"}

[분석 요구사항]
1. ${isDetailed ? "심층 분석 모드이므로, 각 섹션의 내용을 매우 상세하고 풍부하게 작성해주게. 특히 섹션 1, 4, 5, 6, 7에서 구체적인 행동 가이드와 심리적 기제 분석을 깊이 있게 다뤄주게나." : "기본 분석 모드이므로, 각 섹션의 핵심 내용을 명확하고 간결하게 전달해주게."}
2. 섹션 8 (월별 상세 생활 흐름)은 반드시 1월부터 12월까지의 정보를 모두 포함해야 하네.
3. 모든 내용은 '용신할멈'의 어투를 유지하며, 신뢰감 있는 데이터 기반의 라이프스타일 분석 리포트로 작성해주게.
4. JSON 형식을 엄격히 준수하게나.
`;

    const result = await callWithFallback(
      async (modelName) => {
        const ai = getGenAI();
        console.log(`[Server] Attempting call with model: ${modelName}`);
        
        const response = await ai.models.generateContent({
          model: modelName,
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
          config: {
            systemInstruction: SYSTEM_INSTRUCTION,
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

        const text = response.text;
        if (!text) throw new Error("Empty response from Gemini");
        const parsed = JSON.parse(text);
        return { ...parsed, level: level };
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
        const parsed = JSON.parse(text);
        return { ...parsed, level: level };
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
