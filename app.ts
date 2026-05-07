import express from "express";
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
      },
      db: {
        schema: 'public'
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
    // 1. Update Profile to Premium
    console.log(`[Gumroad Webhook] Updating profile: ${resolvedUserId}`);
    const { data: pData, error: pErr } = await supabaseAdmin.from("profiles").update({ is_premium: true }).eq("id", resolvedUserId).select();
    
    if (pErr) {
      console.error("[Gumroad Webhook] Profile update error detail:", JSON.stringify(pErr));
      // Special check: if table is missing, log it clearly
      if (pErr.code === 'PGRST205') {
        console.error("[Gumroad Webhook] CRITICAL: 'profiles' table not found. Please check Supabase project and schema.");
      }
    } else {
      console.log(`[Gumroad Webhook] Profile updated successfully. Data:`, pData);
    }

    // 2. Insert/Update Payment Record
    console.log(`[Gumroad Webhook] Upserting payment for user: ${resolvedUserId}, hash: ${report_hash}`);
    const { error: payErr } = await supabaseAdmin.from("payments").upsert({ 
      user_id: resolvedUserId,
      report_hash: report_hash,
      is_premium: true,
      checkout_id: sale_id || "gumroad_direct"
    }, { onConflict: 'user_id,report_hash' });
    
    if (payErr) console.error("[Gumroad Webhook] Payment insert error detail:", JSON.stringify(payErr));

    console.log(`[Gumroad Webhook] Finished processing for user ${resolvedUserId}`);
    res.status(200).send("OK");
  } catch (err) {
    console.error("[Gumroad Webhook] Unexpected process error:", err);
    res.status(200).send("Internal server error but acknowledged");
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
