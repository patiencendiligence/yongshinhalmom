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

  if (level === "detailed") {
    if (!detailTemplateContent) {
      if (lang === "ko") {
        detailTemplateContent = `
응답 JSON 최상위 레벨에 반드시 "analysis" 키를 포함하고(최상위 "summary", "sections" 등과 동등한 레벨), 그 아래에 정확히 다음 예시 구조를 지닌 상세 분석들을 한국어로 작성해서 응답 객체에 넣으시오.
{
  "analysis": {
    "원국 구조 요약": {
      "년주": "",
      "월주": "",
      "일주": "",
      "시주": "",
      "일간": "",
      "천간 구성": "",
      "지지 구성": "",
      "강한 오행": "",
      "약한 오행": "",
      "핵심 십성 구조": "",
      "반복되는 충/합/형/해": "",
      "특수 구조 여부": "",
      "영성 분석 핵심 글자": ""
    },
    "선천적 영성 지표 분석": {
      "화개성": "예시: 진술축미 중 글자가 발현되어 정신적 관심과 탐구 능력이 뛰어남",
      "태극귀인": "",
      "공망 가능성": "",
      "편인 발달 여부": "",
      "사고 辰戌丑未 발달 여부": "",
      "칠살/상관 강세 여부": "",
      "壬 癸 丁 / 子 午 卯 酉 발달 여부": "",
      "천을귀인 여부": "",
      "월덕귀인 여부": "",
      "천덕귀인 여부": "",
      "고신/과숙 여부": "",
      "역마 발달 여부": ""
    },
    "심리 구조 분석": {
      "핵심 심리 구조": "",
      "반복되는 패턴": "",
      "무의식적 방어기제": "",
      "가장 약한 부분": "",
      "성장 포인트": ""
    },
    "업(karma) 패턴 분석": {
      "반복 업": "",
      "원국 근거": "",
      "삶에서 나타나는 방식": "",
      "끊어야 할 패턴": ""
    },
    "관계 운용 방식": {
      "관계 핵심 패턴": "",
      "장점": "",
      "주의점": "",
      "개선 방향": ""
    },
    "돈 흐름 / 재물 감각 분석": {
      "재물 흐름": "",
      "장점": "",
      "약점": "",
      "현실 조언": ""
    },
    "직업 / 사명 / 현실 발현력": {
      "현실 발현 구조": "",
      "추천 방향": "",
      "주의점": "",
      "장기 성장 방향": ""
    },
    "핵심 영성 유형 정의": "핵심 영성 유형을 한 자의 긴 선언문장 형태로 설명하시오.",
    "현재 영적 성장 단계 추정": {
      "현재 단계": "",
      "원국 근거": "",
      "현재 핵심 과제": "",
      "다음 단계로 가는 길": ""
    },
    "삶을 바꾸는 실전 솔루션": {
      "10-1": "",
      "10-2": "",
      "10-3": "",
      "10-4": "",
      "10-5": "",
      "10-6": "",
      "10-7": ""
    },
    "용신할멈 최종 결론": {
      "가장 먼저 고쳐야 할 것": "",
      "가장 믿어도 되는 자기 강점": "",
      "오늘부터 시작할 행동": ""
    }
  }
}
각 항목들은 사용자의 사주 원국에 맞춰 매우 정교하고 길고 정성스러운 설명으로 작성해야 합니다. 절대 비워두지 마십시오.
`;
      } else {
        detailTemplateContent = `
Your JSON response MUST include a top-level key "analysis", which contains EXACTLY deep analysis sub-keys in English matching this structure:
{
  "analysis": {
    "Saju Pillar Structure Summary": {
      "Year Pillar": "",
      "Month Pillar": "",
      "Day Pillar": "",
      "Time Pillar": "",
      "Day Master": "",
      "Heavenly Stems": "",
      "Earthly Branches": "",
      "Strong Element(s)": "",
      "Weak Element(s)": "",
      "Core Ten Gods Structure": "",
      "Recurring Clash/Harm/Combination/Punishment": "",
      "Special Structure/Form (if any)": "",
      "Key Characters for Spiritual Analysis": ""
    },
    "Innate Spiritual Indicator Analysis": {
      "Hwagae Star (화개성)": "",
      "Taeguk Nobleman (태극귀인)": "",
      "Emptiness/Gongmang (공망)": "",
      "Indirect Resource (편인) Strength": "",
      "Four Earthly Vaults (辰戌丑未)": "",
      "Seven Killings (칠살) or Hurting Officer (상관) Strength": "",
      "Presence of Stems/Branches (壬, 癸, 丁, 子, 午, 卯, 酉)": "",
      "Heavenly Yi Nobleman (천을귀인)": "",
      "Monthly Virtue Nobleman (월덕귀인)": "",
      "Heavenly Virtue Nobleman (천덕귀인)": "",
      "Solitary Star (고신/과숙)": "",
      "Stagecoach Star (역마살)": ""
    },
    "Psychological Structure Analysis": {
      "Core Psychological Mechanism": "",
      "Recurring Mind Pattern": "",
      "Unconscious Defense Mechanism": "",
      "Most Vulnerable Aspect": "",
      "Key Area for Personal Growth": ""
    },
    "Karma Pattern Analysis": {
      "Recurring Karma": "",
      "Natal Chart Basis": "",
      "Real-life Expression": "",
      "Pattern to Break": ""
    },
    "Relationship Dynamics": {
      "Key Relationship Style": "",
      "Strengths": "",
      "Precautions": "",
      "Path for Improvement": ""
    },
    "Financial Flow & Wealth Perception": {
      "Financial Flow Profile": "",
      "Strengths": "",
      "Weaknesses (Blindspots)": "",
      "Practical Financial Advice": ""
    },
    "Career, Mission & Reality Alignment": {
      "Reality Expression Structure": "",
      "Empowered Career Path": "",
      "Warning Points (Workplace/Business)": "",
      "Long-term Expansion Path": ""
    },
    "Core Spiritual Type Definition": "State the core spiritual archetype in a single clear, profound sentence.",
    "Current Spiritual Growth Stage Estimation": {
      "Current Phase": "",
      "Natal Chart Clue": "",
      "Core Spiritual Lesson Current": "",
      "Path to the Next Phase": ""
    },
    "Practical Life-Transforming Solutions": {
      "Action 1": "",
      "Action 2": "",
      "Action 3": "",
      "Action 4": "",
      "Action 5": "",
      "Action 6": "",
      "Action 7": ""
    },
    "Oracle's Final Verdict": {
      "Urgent Course Correction Needed": "",
      "Superpower to Fully Trust": "",
      "Action to Begin Immediately": ""
    }
  }
}
Please ensure all fields are informative, detailed, and directly customized based on the user's Saju. Do not leave fields blank.
`;
      }
    }
  }

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
