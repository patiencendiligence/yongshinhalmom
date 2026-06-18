/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string
  readonly VITE_SUPABASE_ANON_KEY: string
  readonly VITE_GEMINI_API_KEY: string
  readonly VITE_GOOGLE_API_KEY: string
  readonly VITE_SYSTEM_INSTRUCTION: string
  readonly VITE_OHANG: string
  readonly VITE_DAILY_PROMPT_TEMPLATE: string
  readonly VITE_DAILY_PROMPT_PRINT: string
  readonly VITE_PROMPT_TEMPLATE: string
  readonly VITE_PROMPT_PRINT: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
