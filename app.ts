import express from "express";
import path from "path";
import axios from "axios";
import dotenv from "dotenv";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { createClient } from "@supabase/supabase-js";
import OpenAI from "openai";
import { getManseRyeok, getTodayPillar } from "./src/lib/manseRyeok.js";

dotenv.config();

const app = express();
const PORT = 3000;

// Supabase Admin Client holder
let _supabaseAdmin: any = null;

function getSupabaseAdmin() {
  if (!_supabaseAdmin) {
    // In Vercel, prioritize non-VITE prefixed keys for server-side
    const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

    if (!url || !key) {
      console.error("[Supabase Admin] URL or Key missing", { url: !!url, key: !!key });
      throw new Error("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required.");
    }

    console.log(`[Supabase Admin] Initializing with URL: ${url.substring(0, 20)}...`);

    _supabaseAdmin = createClient(url, key, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });
  }
  return _supabaseAdmin;
}

const HANJA_TO_KOREAN: Record<string, string> = {
  '甲': '갑', '乙': '을', '丙': '병', '丁': '정', '戊': '무',
  '己': '기', '庚': '경', '辛': '신', '壬': '임', '癸': '계',
  '子': '자', '丑': '축', '寅': '인', '卯': '묘', '辰': '진',
  '巳': '사', '午': '오', '未': '미', '申': '신', '酉': '유',
  '戌': '술', '亥': '해'
};

function translateHanjaToKorean(pillar: string): string {
  if (!pillar) return "";
  return pillar.split("").map(char => HANJA_TO_KOREAN[char] || char).join("");
}


app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// --- Explicit Static HTML Serving (High Priority) ---
// This ensures /policies.html and /purchase.html are served as files, not handled by SPA fallback
app.get("/policies.html", (req, res) => {
  const filePath = process.env.NODE_ENV === "production" 
    ? path.join(process.cwd(), "dist", "policies.html")
    : path.join(process.cwd(), "public", "policies.html");
  res.sendFile(filePath);
});

app.get("/purchase.html", (req, res) => {
  const filePath = process.env.NODE_ENV === "production" 
    ? path.join(process.cwd(), "dist", "purchase.html")
    : path.join(process.cwd(), "public", "purchase.html");
  res.sendFile(filePath);
});


// --- Gumroad Logic ---
app.post("/api/webhook/gumroad", async (req: any, res: any) => {
  // Gumroad sends application/x-www-form-urlencoded by default
  console.log(`[Gumroad Webhook] Received request at ${new Date().toISOString()}. Body keys:`, Object.keys(req.body));
  
  const getParam = (name: string) => {
    // 1. Root body
    if (req.body[name]) return req.body[name];
    
    // 2. Flattened patterns (common in Gumroad form data)
    const patterns = [`url_params[${name}]`, `url_parameters[${name}]`, `custom_fields[${name}]` ];
    for (const p of patterns) {
      if (req.body[p]) return req.body[p];
    }
    
    // 3. Deep search inside common containers (can be objects or JSON strings)
    const containers = ["url_params", "url_parameters", "custom_fields"];
    for (const containerName of containers) {
      const container = req.body[containerName];
      if (container) {
        if (typeof container === "string") {
          try {
            const parsed = JSON.parse(container);
            if (parsed[name]) return parsed[name];
          } catch (e) {}
        } else if (typeof container === "object" && container[name]) {
          return container[name];
        }
      }
    }

    // 4. Search within line_items (based on user's real payload logs)
    if (req.body.line_items && Array.isArray(req.body.line_items)) {
      for (const item of req.body.line_items) {
        // Try direct key in item
        if (item[name]) return item[name];
        
        // Items often have stringified JSON in these fields
        const subFields = ["url_parameters", "url_params", "custom_fields"];
        for (const f of subFields) {
          const val = item[f];
          if (val && typeof val === "string") {
            try {
              const parsed = JSON.parse(val);
              if (parsed[name]) return parsed[name];
            } catch (e) {}
          } else if (val && typeof val === "object" && val[name]) {
            return val[name];
          }
        }
      }
    }

    return req.query ? req.query[name] : undefined;
  };

  const user_id = getParam("user_id");
  const report_hash = getParam("report_hash");
  const email = getParam("email") || req.body.email;
  const sale_id = req.body.sale_id || req.body.order_number || req.body.order_id || req.body.order_number_string;
  
  console.log(`[Gumroad Webhook] Extraction results -> user_id: ${user_id}, hash: ${report_hash}, email: ${email}, sale: ${sale_id}`);

  // If extraction fails, log the full body for manual inspection in Vercel
  if (!user_id || !report_hash) {
    console.warn(`[Gumroad Webhook] MISSED identifiers. Body:`, JSON.stringify(req.body));
  }
  
  const supabaseAdmin = getSupabaseAdmin();

  let resolvedUserId = user_id;
  // Fallback: Try to find user_id by email if the explicit ID was lost
  if (!resolvedUserId && email) {
    try {
      console.log(`[Gumroad Webhook] attempting email fallback: ${email}`);
      const { data } = await supabaseAdmin.from("profiles").select("id").eq("email", email).limit(1).single();
      if (data?.id) {
        resolvedUserId = data.id;
        console.log(`[Gumroad Webhook] email fallback success -> ${resolvedUserId}`);
      }
    } catch (e) {}
  }
  
  if (!resolvedUserId || !report_hash) {
    console.warn(`[Gumroad Webhook] Incomplete data. user_id=${resolvedUserId}, hash=${report_hash}`);
    return res.status(200).send("Extraction failed");
  }

  try {
    // We rely entirely on the 'payments' table since 'profiles' does not exist in the schema.
    console.log(`[Gumroad Webhook] Upserting payment record: user=${resolvedUserId}, hash=${report_hash}`);
    
    const { error: payErr } = await supabaseAdmin.from("payments").upsert({ 
      user_id: resolvedUserId,
      report_hash: report_hash,
      is_premium: true,
      checkout_id: sale_id || "gumroad_direct",
      updated_at: new Date().toISOString()
    }, { onConflict: 'user_id' });
    
    if (payErr) {
      console.error("[Gumroad Webhook] Payment upsert error:", JSON.stringify(payErr));
    } else {
      console.log(`[Gumroad Webhook] Successfully processed payment for user ${resolvedUserId}`);
    }

    res.status(200).send("OK");
  } catch (err) {
    console.error("[Gumroad Webhook] Unexpected process error:", err);
    res.status(200).send("Internal server error but acknowledged");
  }
});


app.get("/api/check-payment", async (req, res) => {
  const { userId, reportHash } = req.query;
  if (!userId) return res.status(400).json({ error: "userId required" });
  
  try {
    const supabaseAdmin = getSupabaseAdmin();
    let query = supabaseAdmin
      .from("payments")
      .select("is_premium")
      .eq("user_id", userId);
      
    if (reportHash) {
      query = query.eq("report_hash", reportHash as string);
    }

    const { data, error } = await query.limit(1).maybeSingle();
    if (error) throw error;
    res.json({ isPremium: !!data?.is_premium });
  } catch (err) {
    console.error("[Check Payment API] Error:", err);
    res.status(500).json({ error: "Check failed" });
  }
});

const SYSTEM_INSTRUCTION = process.env.SYSTEM_INSTRUCTION || process.env.VITE_SYSTEM_INSTRUCTION || "";
const ohangContent = process.env.VITE_OHANG || process.env.OHANG || "";
const DAILY_PROMPT_PRINT = process.env.DAILY_PROMPT_PRINT || process.env.VITE_DAILY_PROMPT_PRINT || "";
const DAILY_PROMPT_TEMPLATE = process.env.DAILY_PROMPT_TEMPLATE || process.env.VITE_DAILY_PROMPT_TEMPLATE || "";
const PROMPT_PRINT = process.env.PROMPT_PRINT || process.env.VITE_PROMPT_PRINT || "";
const PROMPT_TEMPLATE = process.env.PROMPT_TEMPLATE || process.env.VITE_PROMPT_TEMPLATE
const MODELS_TO_TRY = [
  "gemini-3.1-flash-lite",
  "gemini-3.5-flash",
  "gemini-2.5-flash",
  "gemini-flash-latest"
];

function getApiKey() {
  const key = process.env.GEMINI_API_KEY || 
              process.env.GOOGLE_API_KEY || 
              process.env.VITE_GEMINI_API_KEY || 
              process.env.VITE_GOOGLE_API_KEY || "";
  
  if (!key) return "";
  return String(key).replace(/['"\\\r\n\t]+/g, '').trim();
}

async function tryOpenAI(prompt: string, systemInstruction: string): Promise<string> {
  const openAiKey = process.env.OPENAI_API_KEY || process.env.VITE_OPENAI_API_KEY || "";
  const cleanedKey = String(openAiKey).replace(/['"\\\r\n\t]+/g, '').trim();
  if (!cleanedKey) {
    throw new Error("OpenAI API key missing from environment");
  }
  const openai = new OpenAI({ apiKey: cleanedKey });
  console.log("[OpenAI Fallback] Initiating ChatGPT request with gpt-4o-mini...");
  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: systemInstruction },
      { role: "user", content: prompt }
    ],
    response_format: { type: "json_object" }
  });
  return completion.choices[0]?.message?.content || "";
}

// Gemini report API with OpenAI fallback
app.post("/api/generate-report", async (req, res) => {
  const { pillars, zodiac, targetYear, lang, level } = req.body;
  if (!pillars?.yearPillar) return res.status(400).json({ error: "pillars calculation required" });

  const apiKey = getApiKey();
  
  // Use KST (UTC+9) for current date to match user expectations
  const now = new Date();
  const kstOffset = 9 * 60 * 60 * 1000;
  const kstNow = new Date(now.getTime() + kstOffset);
  const kstToday = kstNow.toISOString().split('T')[0];
  
  const currentYear = targetYear || kstNow.getFullYear();
  const correctZodiacIndex = zodiac !== undefined ? zodiac : 0;

  console.log(JSON.stringify(pillars));

  const prompt = `
${SYSTEM_INSTRUCTION}
${PROMPT_TEMPLATE}
${PROMPT_PRINT}
`;

  let parsed: any = null;

  if (apiKey) {
    const genAI = new GoogleGenerativeAI(apiKey);

    for (const modelName of MODELS_TO_TRY) {
      try {
        console.log(`[Gemini Server] Trying ${modelName}...`);
        const model = genAI.getGenerativeModel({ 
          model: modelName,
          systemInstruction: SYSTEM_INSTRUCTION,
        });

        const result = await model.generateContent({
          contents: [{ role: "user", parts: [{ text: prompt }] }],
          generationConfig: {
            responseMimeType: "application/json",
            temperature: 0.1,
          }
        });

        const response = await result.response;
        let text = response.text();
        
        const firstCurly = text.indexOf('{');
        const lastCurly = text.lastIndexOf('}');
        if (firstCurly !== -1 && lastCurly !== -1) {
          text = text.substring(firstCurly, lastCurly + 1);
        }
        
        parsed = JSON.parse(text);
        break;
      } catch (e: any) {
         console.error(`[Gemini Server] ${modelName} failed:`, e.message);
      }
    }
  } else {
    console.warn("[Gemini Server] Gemini API key is missing. Skipping directly to OpenAI fallback.");
  }

  // Fallback to OpenAI
  if (!parsed) {
    try {
      console.log("[Gemini Server] Initiating OpenAI fallback...");

      const text = await tryOpenAI(prompt, SYSTEM_INSTRUCTION);
      parsed = JSON.parse(text);
    } catch (err: any) {
      console.error("[Gemini Server] OpenAI fallback failed:", err.message);
    }
  }

  if (parsed) {
    // Ensure zodiac is ALWAYS the correct one from calculation
    parsed.zodiac = correctZodiacIndex;
    return res.json(parsed);
  }

  res.status(500).json({ error: "All AI model generation attempts failed (Gemini and OpenAI)" });
});

// Daily guide API with OpenAI fallback
app.post("/api/generate-daily", async (req, res) => {
  const { pillars, lang } = req.body;
  if (!pillars?.yearPillar) return res.status(400).json({ error: "pillars calculation required" });
  const apiKey = getApiKey();
  const todayPillar = getTodayPillar();
  const kstOffset = 9 * 60 * 60 * 1000;
  const kstTodayDate = new Date(new Date().getTime() + kstOffset);
  const formattedToday = `${kstTodayDate.getFullYear()}-${String(kstTodayDate.getMonth() + 1).padStart(2, '0')}-${String(kstTodayDate.getDate()).padStart(2, '0')}`;


  const prompt = `
${SYSTEM_INSTRUCTION}
${DAILY_PROMPT_TEMPLATE}
${DAILY_PROMPT_PRINT}
`;

  let parsed: any = null;

  if (apiKey) {
    const genAI = new GoogleGenerativeAI(apiKey);

    for (const modelName of MODELS_TO_TRY) {
      try {
        console.log(`[Gemini Daily Server] Trying ${modelName}...`);
        const model = genAI.getGenerativeModel({ 
          model: modelName,
          systemInstruction: SYSTEM_INSTRUCTION
        });

        const result = await model.generateContent({
          contents: [{ role: "user", parts: [{ text: prompt }] }],
          generationConfig: {
            responseMimeType: "application/json",
            temperature: 0.1,
          }
        });

        const response = await result.response;
        let text = response.text();
        
        const firstCurly = text.indexOf('{');
        const lastCurly = text.lastIndexOf('}');
        if (firstCurly !== -1 && lastCurly !== -1) {
          text = text.substring(firstCurly, lastCurly + 1);
        }
        
        parsed = JSON.parse(text);
        break;
      } catch (e: any) {
        console.error(`[Gemini Daily Server] ${modelName} failed:`, e.message);
      }
    }
  } else {
    console.warn("[Gemini Daily Server] Gemini API key is missing. Skipping directly to OpenAI fallback.");
  }

  // Fallback to OpenAI
  if (!parsed) {
    try {
      console.log("[Gemini Daily Server] Initiating OpenAI fallback...");
      const text = await tryOpenAI(prompt, SYSTEM_INSTRUCTION);
      parsed = JSON.parse(text);
    } catch (err: any) {
      console.error("[Gemini Daily Server] OpenAI fallback failed:", err.message);
    }
  }

  if (parsed) {
    return res.json(parsed);
  }

  res.status(500).json({ error: "All AI model daily generation attempts failed (Gemini and OpenAI)" });
});

app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    hasKey: !!getApiKey(),
    node: process.version
  });
});

app.all("/api/ping", (req, res) => {
  res.send("pong");
});

app.post("/api/report-issue", async (req, res) => {
  const { content, userData, lang } = req.body;
  const token = process.env.GITHUB_TOKEN;
  if (!token) return res.status(500).send("No token");
  try {
    await axios.post(
      `https://api.github.com/repos/${process.env.GITHUB_REPO_OWNER || "patiencendiligence"}/${process.env.GITHUB_REPO_NAME || "yongshinhalmom"}/issues`,
      {
        title: `[Issue] ${userData?.name || "Anon"}`,
        body: content
      },
      { headers: { Authorization: `token ${token}` } }
    );
    res.json({ success: true });
  } catch (e) {
    res.status(500).send("GitHub Error");
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    try {
      const { createServer: createViteServer } = await import("vite");
      const vite = await createViteServer({ server: { middlewareMode: true }, appType: "spa" });
      app.use(vite.middlewares);
      console.log("[App] Vite middleware loaded");
    } catch (e) {
      console.warn("[App] Vite not found, skipping middleware");
    }
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    console.log(`[App] Production mode. Static: ${distPath}`);
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      if (req.path.startsWith('/api/')) return;
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }
}

// Invoke configuration
startServer().catch(err => console.error("[App] Config error:", err));

export default app;
