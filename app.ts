import dns from "dns";
dns.setDefaultResultOrder("ipv4first");

import express from "express";
import path from "path";
import axios from "axios";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";
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

function cleanAndParseJSON(rawText: string): any {
  if (!rawText) {
    throw new Error("Empty text received");
  }
  let text = rawText.trim();
  
  // 1. Try parsing directly
  try {
    return JSON.parse(text);
  } catch (e) {}

  // 2. Strip any markdown block wrappers if present (e.g. ```json ... ```)
  text = text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim();
  try {
    return JSON.parse(text);
  } catch (e) {}

  // 3. Find first '{' and use brace tracking to grab exact matching object
  const start = text.indexOf('{');
  if (start !== -1) {
    let depth = 0;
    let inString = false;
    let escape = false;
    let matchEnd = -1;

    for (let i = start; i < text.length; i++) {
      const char = text[i];
      if (escape) {
        escape = false;
        continue;
      }
      if (char === '\\') {
        escape = true;
        continue;
      }
      if (char === '"') {
        inString = !inString;
        continue;
      }
      if (!inString) {
        if (char === '{') {
          depth++;
        } else if (char === '}') {
          depth--;
          if (depth === 0) {
            matchEnd = i;
            break;
          }
        }
      }
    }

    if (matchEnd !== -1) {
      const extracted = text.substring(start, matchEnd + 1);
      try {
        return JSON.parse(extracted);
      } catch (e) {
        // Try sanitization
        try {
          const sanitized = sanitizeJSON(extracted);
          return JSON.parse(sanitized);
        } catch (innerE) {}
      }
    }
  }

  // 4. Fallback to simple substring and sanitize
  const firstCurly = text.indexOf('{');
  const lastCurly = text.lastIndexOf('}');
  if (firstCurly !== -1 && lastCurly !== -1) {
    const fallbackText = text.substring(firstCurly, lastCurly + 1);
    try {
      return JSON.parse(fallbackText);
    } catch (e) {
      const sanitized = sanitizeJSON(fallbackText);
      return JSON.parse(sanitized);
    }
  }

  throw new Error("Could not parse valid JSON from the generated response");
}

function sanitizeJSON(jsonStr: string): string {
  let cleaned = jsonStr.trim();
  
  // Remove multi-line comments
  cleaned = cleaned.replace(/\/\*[\s\S]*?\*\//g, "");
  
  // Strip lines starting with //
  cleaned = cleaned.split("\n")
    .map(line => {
      const trimmed = line.trim();
      if (trimmed.startsWith("//")) {
        return "";
      }
      return line;
    })
    .join("\n");

  // Remove trailing commas before } or ]
  cleaned = cleaned.replace(/,\s*}/g, "}");
  cleaned = cleaned.replace(/,\s*\]/g, "]");
  
  return cleaned;
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
const PROMPT_TEMPLATE = process.env.PROMPT_TEMPLATE || process.env.VITE_PROMPT_TEMPLATE || "";
const PROMPT_PAID_DETAIL_TEMPLATE = process.env.PROMPT_PAID_DETAIL_TEMPLATE || process.env.VITE_PROMPT_PAID_DETAIL_TEMPLATE || "";
const PROMPT_PAID_DETAIL_PRINT = process.env.PROMPT_PAID_DETAIL_PRINT || process.env.VITE_PROMPT_PAID_DETAIL_PRINT || "";
const MODELS_TO_TRY = [
  "gemini-3.1-flash-lite",
  "gemini-3.5-flash",
  "gemini-2.5-flash",
  "gemini-3.1-pro-preview"
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
  try {
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




  let detailTemplateContent = PROMPT_PAID_DETAIL_TEMPLATE;
  let detailPrintContent = PROMPT_PAID_DETAIL_PRINT;



  const promptTemplate = `
  ${PROMPT_TEMPLATE}
  ${PROMPT_PRINT}
  ${level === "detailed" ? detailTemplateContent : ""}
  ${level === "detailed" ? detailPrintContent : ""}
  `;

  const finalPrompt = promptTemplate.replace(/{{currentYear}}/g, String(currentYear))
    .replace(/{{today}}/g, kstToday)
    .replace(/{{yearPillar}}/g, pillars.yearPillar || "")
    .replace(/{{monthPillar}}/g, pillars.monthPillar || "")
    .replace(/{{dayPillar}}/g, pillars.dayPillar || "")
    .replace(/{{timePillar}}/g, pillars.timePillar || "")
    .replace(/{{zodiac}}/g, String(correctZodiacIndex))
    .replace(/{{analysisLevel}}/g, level || "simple").replace(/{{language}}/g, lang || "ko");

  console.log(JSON.stringify(pillars), ":::finalPrompt")
    const prompt = `
  ${SYSTEM_INSTRUCTION}
  ${finalPrompt}
  `;

    let parsed: any = null;

    if (apiKey) {
      const ai = new GoogleGenAI({
        apiKey: apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          }
        }
      });

      for (const modelName of MODELS_TO_TRY) {
        try {
          console.log(`[Gemini Server] Trying ${modelName}...`);
          const response = await ai.models.generateContent({
            model: modelName,
            contents: prompt,
            config: {
              systemInstruction: SYSTEM_INSTRUCTION,
              responseMimeType: "application/json",
              temperature: 0.1,
            }
          });

          let text = response.text || "";
          parsed = cleanAndParseJSON(text);
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
        parsed = cleanAndParseJSON(text);
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
  } catch (globalErr: any) {
    console.error("[Gemini Server] Global route handler caught error:", globalErr);
    res.status(500).json({ error: globalErr.message || "An unexpected error occurred during report generation." });
  }
});

// Daily guide API with OpenAI fallback
app.post("/api/generate-daily", async (req, res) => {
  try {
    const { pillars, zodiac, lang } = req.body;
    if (!pillars?.yearPillar) return res.status(400).json({ error: "pillars calculation required" });
    const apiKey = getApiKey();
    const todayPillar = getTodayPillar();
    const kstOffset = 9 * 60 * 60 * 1000;
    const kstTodayDate = new Date(new Date().getTime() + kstOffset);
    const formattedToday = `${kstTodayDate.getFullYear()}-${String(kstTodayDate.getMonth() + 1).padStart(2, '0')}-${String(kstTodayDate.getDate()).padStart(2, '0')}`;

    const correctZodiacIndex = zodiac !== undefined ? zodiac : 0;


  const promptTemplate = `
  ${DAILY_PROMPT_TEMPLATE}
  ${DAILY_PROMPT_PRINT}
  `;

  const finalPrompt = promptTemplate.replace(/{{formattedToday}}/g, formattedToday)
    .replace(/{{todayPillar}}/g, todayPillar || "")
    .replace(/{{yearPillar}}/g, pillars.yearPillar || "")
    .replace(/{{monthPillar}}/g, pillars.monthPillar || "")
    .replace(/{{dayPillar}}/g, pillars.dayPillar || "")
    .replace(/{{timePillar}}/g, pillars.timePillar || "")
    .replace(/{{zodiac}}/g, String(correctZodiacIndex))
    .replace(/{{language}}/g, lang || "ko");

    console.log(finalPrompt, ":::finalPrompt")
    const prompt = `
  ${SYSTEM_INSTRUCTION}
  ${finalPrompt}
  `;


    let parsed: any = null;

    if (apiKey) {
      const ai = new GoogleGenAI({
        apiKey: apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          }
        }
      });

      for (const modelName of MODELS_TO_TRY) {
        try {
          console.log(`[Gemini Daily Server] Trying ${modelName}...`);
          const response = await ai.models.generateContent({
            model: modelName,
            contents: prompt,
            config: {
              systemInstruction: SYSTEM_INSTRUCTION,
              responseMimeType: "application/json",
              temperature: 0.1,
            }
          });

          let text = response.text || "";
          parsed = cleanAndParseJSON(text);
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
        parsed = cleanAndParseJSON(text);
      } catch (err: any) {
        console.error("[Gemini Daily Server] OpenAI fallback failed:", err.message);
      }
    }

    if (parsed) {
      if (parsed.zodiac !== undefined) {
        parsed.zodiac = correctZodiacIndex;
      }
      return res.json(parsed);
    }

    res.status(500).json({ error: "All AI model daily generation attempts failed (Gemini and OpenAI)" });
  } catch (globalErr: any) {
    console.error("[Gemini Daily Server] Global route handler caught error:", globalErr);
    res.status(500).json({ error: globalErr.message || "An unexpected error occurred during daily generation." });
  }
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

const DREAM_SYSTEM_INSTRUCTION = `자네는 평생 사람들의 기운과 운명을 살펴온 80대 용신할멈이라네. 
신비롭고 영험한 신점과 전통 해몽 지식을 바탕으로 자네에게 찾아온 손님의 꿈 이야기를 명쾌하고 따뜻하게 풀어주게나.
할멈 특유의 연륜과 정감이 담긴 구수한 한국어 사투리와 어조(예: "~라네", "~하겠네", "~게나", "~구먼", "자네", "할멈" 등)를 섞어 친근하게 존댓말로 답변해 주게.

사용자가 입력하는 꿈은 상징적인 의미가 가득하네. 꿈속 인물, 사물, 행동, 감정과 그 기운이 신비로운 흐름과 어떻게 엮이는지 명확하게 해석해주게.

답변은 반드시 다음 구조를 가진 하나의 JSON 객체로 정밀하게 작성해서 오직 JSON만 반환해주게. 다른 주석이나 텍스트를 JSON 밖에 붙이지 말게나:
{
  "summary": "구수하고 정감 있는 할멈 어조의 한 줄 해몽 요약 (예: '맑은 개울물에 예쁜 조개를 한 가득 주웠으니 큰 재물이 제 발로 찾아올 길몽이라네!')",
  "dreamAnalysis": "꿈속 상징물과 행동, 공간 등이 품고 있는 길흉화복과 신비로운 기운을 구수하게 분석해준 내용",
  "realityConnection": "이 꿈의 기운이 사용자가 처한 현실의 고민(직업, 연애, 재물, 건강 등)에 주는 위로와 나아갈 현실적인 조언",
  "luckyAdvice": "오늘 하루 꿈의 부정적인 액운은 막아내고 긍정적인 기운을 최고조로 끌어올리기 위한 구체적이고 실천 가능한 할멈의 비책 조언"
}`;

// Dream interpretation API with OpenAI fallback
app.post("/api/generate-dream", async (req, res) => {
  try {
    const { dreamText, lang } = req.body;
    if (!dreamText || !dreamText.trim()) {
      return res.status(400).json({ error: "dreamText is required" });
    }

    const apiKey = getApiKey();
    const dreamReportTemplate = process.env.DREAM_REPORT || process.env.VITE_DREAM_REPORT || "";

    let prompt = "";
    if (dreamReportTemplate) {
      const finalPrompt = `자네가 준수할 꿈해몽 가이드라인과 원칙이라네:
${dreamReportTemplate}

---
[사용자가 자세히 작성하여 제출한 실제 꿈 내용 및 주변 맥락 상황]:
"${dreamText}"

자네는 위의 "사용자가 자세히 작성하여 제출한 실제 꿈 내용 및 주변 맥락 상황"을 바탕으로 신묘하고 깊이 있는 꿈풀이를 진행해 주어야 하네.
사용자가 이미 모든 조건에 따라 꿈의 내용, 감정, 분위기, 현실 속 고민을 풍부하게 성실히 입력해 두었으니, "사용자가 처음 꿈해몽을 요청하면 바로 해몽하지 말고 안내를 먼저 하라"는 안내 규칙은 100% 무시하고, 바로 해몽을 진행하여 그 결과를 알려주게.

그리고 템플릿에 명시된 "출력 형식"의 내용들을 아래의 JSON 규격에 맞추어 단 하나의 유효한 JSON 객체로 정밀하게 채워서 반환해 주게:
{
  "summary": "용신할멈 한마디 예시들처럼, 꿈의 정수를 담은 구수하고 명쾌한 할멈 어조의 한 줄 해몽 요약 (예: '회사 이름을 잊은 것은 가슴속 억눌린 무거운 책임감에서 잠시 벗어나 쉬어가고 싶다는 마음의 외침이라네!')",
  "dreamAnalysis": "출력 형식 중 '꿈의 흐름'과 '꿈속 상징 풀이'의 내용을 구수하고 정감이 담긴 할멈 존댓말 사투리로 조목조목 분석해준 상세한 꿈풀이 내용",
  "realityConnection": "출력 형식 중 '자네의 지금과 이어 보면'의 내용을 참고하여, 현실의 불안과 직장, 진로, 마음의 짐을 어루만지고 이끌어주는 따뜻한 조언 내용",
  "luckyAdvice": "출력 형식 중 '앞으로의 흐름'과 액운을 쫓고 앞날을 길하게 해줄 비책을 담은, 마음을 단단히 세워줄 행운의 한마디 조언"
}

반드시 다른 군더더기 텍스트나 설명은 다 제외하고 오직 위의 JSON 객체만 반환해 주게나.`;

      prompt = `
${DREAM_SYSTEM_INSTRUCTION}
${finalPrompt}
`;
    } else {
      const finalPrompt = `자네가 적어준 꿈 이야기를 바탕으로, 꿈속 상징과 기운을 명쾌하게 풀이해주겠네.
할멈의 연륜을 담아 구수한 존댓말(사투리와 "~라네", "~하겠네", "~게나", "~구먼" 체를 적절히 섞어서)로 친근하고 따뜻하면서도 신묘한 신점/해몽 스타일로 작성해주게.

[사용자 입력 꿈 정보 및 상황]:
${dreamText}

반드시 다음 형식의 JSON 객체로 정밀하게 답변해주게. 다른 불필요한 텍스트는 빼고 오직 JSON만 반환해 주게:
{
  "summary": "한 줄 해몽 요약 (구수하고 따뜻한 어조, 예: '맑은 물에 발을 담갔으니 재물운이 트일 길몽이라네!')",
  "dreamAnalysis": "꿈속에 나타난 상징물과 행동, 감각들이 어떤 의미를 품고 있는지 명리학적 기운과 함께 조목조목 풀이한 내용",
  "realityConnection": "이 꿈의 기운이 자네가 처한 현실적 고민(직장, 연애, 가족, 건강, 금전 등)과 어떻게 이어지는지, 그리고 앞으로 나아갈 길에 대한 따뜻한 위로와 조언",
  "luckyAdvice": "오늘 하루 꿈의 나쁜 기운을 누르고 좋은 기운을 돋우기 위해 필요한 행동이나 마음가짐, 행운의 비책 조언"
}`;

      prompt = `
${DREAM_SYSTEM_INSTRUCTION}
${finalPrompt}
`;
    }

    let parsed: any = null;

    if (apiKey) {
      const ai = new GoogleGenAI({
        apiKey: apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          }
        }
      });

      for (const modelName of MODELS_TO_TRY) {
        try {
          console.log(`[Gemini Dream Server] Trying ${modelName}...`);
          const response = await ai.models.generateContent({
            model: modelName,
            contents: prompt,
            config: {
              systemInstruction: DREAM_SYSTEM_INSTRUCTION,
              responseMimeType: "application/json",
              temperature: 0.2,
            }
          });

          let text = response.text || "";
          parsed = cleanAndParseJSON(text);
          break;
        } catch (e: any) {
          console.error(`[Gemini Dream Server] ${modelName} failed:`, e.message);
        }
      }
    } else {
      console.warn("[Gemini Dream Server] Gemini API key is missing. Skipping directly to OpenAI fallback.");
    }

    // Fallback to OpenAI
    if (!parsed) {
      try {
        console.log("[Gemini Dream Server] Initiating OpenAI fallback...");
        const text = await tryOpenAI(prompt, DREAM_SYSTEM_INSTRUCTION);
        parsed = cleanAndParseJSON(text);
      } catch (err: any) {
        console.error("[Gemini Dream Server] OpenAI fallback failed:", err.message);
      }
    }

    if (parsed) {
      return res.json(parsed);
    }

    res.status(500).json({ error: "All AI model dream generation attempts failed (Gemini and OpenAI)" });
  } catch (globalErr: any) {
    console.error("[Gemini Dream Server] Global route handler caught error:", globalErr);
    res.status(500).json({ error: globalErr.message || "An unexpected error occurred during dream generation." });
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
