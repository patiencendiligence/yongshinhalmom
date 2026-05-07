import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import axios from "axios";
import dotenv from "dotenv";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { createClient } from "@supabase/supabase-js";

dotenv.config();

const app = express();
const PORT = 3000;

// Supabase Admin Client holder
let _supabaseAdmin: any = null;

function getSupabaseAdmin() {
  if (!_supabaseAdmin) {
    const url = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

    if (!url || !key) {
      console.error("[Supabase Admin] URL or Key missing", { url: !!url, key: !!key });
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
app.post("/api/webhook/gumroad", async (req: any, res) => {
  // Gumroad sends application/x-www-form-urlencoded by default
  console.log(`[Gumroad Webhook] Received payload keys:`, Object.keys(req.body));
  
  const getParam = (name: string) => {
    // 1. Direct body
    if (req.body[name]) return req.body[name];
    
    // 2. Nested url_params object (if extended:true works)
    if (req.body.url_params && req.body.url_params[name]) return req.body.url_params[name];
    
    // 3. Nested custom_fields object
    if (req.body.custom_fields && req.body.custom_fields[name]) return req.body.custom_fields[name];
    
    // 4. Flattened notation (common in x-www-form-urlencoded)
    if (req.body[`url_params[${name}]`]) return req.body[`url_params[${name}]`];
    if (req.body[`custom_fields[${name}]`]) return req.body[`custom_fields[${name}]`];
    
    // 5. Check if custom_fields is a JSON string
    if (typeof req.body.custom_fields === 'string') {
      try {
        const parsed = JSON.parse(req.body.custom_fields);
        if (parsed[name]) return parsed[name];
      } catch (e) {}
    }

    // 6. Check if url_params is a JSON string
    if (typeof req.body.url_params === 'string') {
      try {
        const parsed = JSON.parse(req.body.url_params);
        if (parsed[name]) return parsed[name];
      } catch (e) {}
    }

    return req.query[name];
  };

  let user_id = getParam("user_id");
  const report_hash = getParam("report_hash");
  const email = getParam("email") || req.body.email;
  const sale_id = req.body.sale_id || req.body.order_number;
  
  console.log(`[Gumroad Webhook] Extracted: user_id=${user_id}, report_hash=${report_hash}, email=${email}, sale_id=${sale_id}`);
  
  const supabaseAdmin = getSupabaseAdmin();

  // Fallback: Try to find user_id by email if missing
  if (!user_id && email) {
    console.log(`[Gumroad Webhook] Missing user_id, trying to resolve by email: ${email}`);
    const { data: userDataByEmail } = await supabaseAdmin
      .from("profiles")
      .select("id")
      .eq("email", email)
      .limit(1)
      .single();
    
    if (userDataByEmail?.id) {
      user_id = userDataByEmail.id;
      console.log(`[Gumroad Webhook] Resolved user_id: ${user_id}`);
    }
  }
  
  if (!user_id || !report_hash) {
    console.warn(`[Gumroad Webhook] Missing identifiers (user_id/report_hash). Body snippet:`, JSON.stringify(req.body).substring(0, 200));
    return res.status(200).send("Acknowledged but incomplete");
  }

  try {
    // 1. Update Profile
    const { error: profileError } = await supabaseAdmin.from("profiles").update({ is_premium: true }).eq("id", user_id);
    if (profileError) console.error("[Gumroad Webhook] Profile update error:", profileError);

    // 2. Mark Payment
    const { error: payError } = await supabaseAdmin.from("payments").upsert({ 
      user_id: user_id,
      report_hash: report_hash,
      is_premium: true,
      checkout_id: sale_id || "gumroad_sale"
    }, { onConflict: 'user_id,report_hash' });
    
    if (payError) console.error("[Gumroad Webhook] Payment insert error:", payError);

    console.log(`[Gumroad Webhook] Success for user ${user_id}`);
    res.status(200).send("OK");
  } catch (err) {
    console.error("[Gumroad Webhook] DB error:", err);
    res.status(200).send("DB Error but Acknowledged");
  }
});

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
    res.status(500).json({ error: "Check failed" });
  }
});

const SYSTEM_INSTRUCTION = process.env.SYSTEM_INSTRUCTION || process.env.VITE_SYSTEM_INSTRUCTION || "당신은 영험한 용신할멈으로, 사용자의 기초 정보를 바탕으로 한 해의 운세를 아주 상세하고 문학적으로 풀이해주는 점술가입니다.";

const MODELS_TO_TRY = [
  "gemini-1.5-flash",
  "gemini-2.0-flash",
  "gemini-1.5-flash-8b",
  "gemini-1.5-pro"
];

function getApiKey() {
  const key = process.env.GEMINI_API_KEY || 
              process.env.GOOGLE_API_KEY || 
              process.env.VITE_GEMINI_API_KEY || 
              process.env.VITE_GOOGLE_API_KEY || "";
  
  if (!key) return "";
  return String(key).replace(/['"\\\r\n\t]+/g, '').trim();
}

// Gemini report API is now handled client-side in geminiService.ts
// to comply with platform guidelines.

app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    hasKey: !!getApiKey(),
    node: process.version
  });
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
    const vite = await createViteServer({ server: { middlewareMode: true }, appType: "spa" });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => res.sendFile(path.join(distPath, 'index.html')));
  }
  app.listen(PORT, "0.0.0.0", () => console.log(`Server running on port ${PORT}`));
}

startServer();
