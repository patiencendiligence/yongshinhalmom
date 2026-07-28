import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "motion/react";
import { Sparkles, Moon } from "lucide-react";
import { Helmet } from "react-helmet-async";
import { faqSchema }from "../utils/sajuUtils.ts";
import { Language, translations } from "../lib/translations";
import DreamModal from "./DreamModal";
import InstallPrompt from "./InstallPrompt.tsx";

interface LandingProps {
  onStart: () => void;
  onOpenProfiles: () => void;
  hasProfiles: boolean;
  lang: Language;
}

export default function Landing({ onStart, onOpenProfiles, hasProfiles, lang }: LandingProps) {
  const navigate = useNavigate();
  const t = translations[lang];
  const [isDreamModalOpen, setIsDreamModalOpen] = useState(false);
  
  const websiteSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": lang === "en" ? "Yongshin Halmeom" : "용신할멈",
    "alternateName": ["YongshinHalmeom", "용신할멈 사주"],
    "url": "https://yongshinhalmom.vercel.app/"
  };

  const orgSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": lang === "en" ? "Yongshin Halmeom" : "용신할멈",
    "url": "https://yongshinhalmom.vercel.app/",
    "logo": "https://yongshinhalmom.vercel.app/assets/yongshin.png"
  };

  const webAppSchema = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    "name": lang === "en" ? "Yongshin Halmeom AI Saju" : "용신할멈 AI 사주명리 & 오늘의 운세",
    "alternateName": ["용신할멈", "용신할멈 사주", "Yongshin Halmeom", "사주 GPT", "AI 사주", "무료 사주", "용한 신점"],
    "url": "https://yongshinhalmom.vercel.app/",
    "image": "https://yongshinhalmom.vercel.app/assets/yongshin.png",
    "description": lang === "en" 
      ? "Get free professional Saju analysis & today's fortune by Yongshin Halmeom, utilizing traditional Korean Astrology with advanced AI technology." 
      : "👵 용신할멈이 알려주는 나만의 사주팔자와 오늘의 정교한 기운 가이드. 무료 오늘의 운세 및 명리학 보고서를 상세하게 분석해 드립니다. 용신 찾기, 오행 분석, 일주론, 십성 해설 제공.",
    "applicationCategory": "LifestyleApplication",
    "operatingSystem": "All",
    "browserRequirements": "Requires HTML5 support",
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "KRW"
    },
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": "4.9",
      "reviewCount": "1540"
    }
  };

  return (
    <div className="flex flex-col items-center justify-start min-h-full w-full text-center px-4 pt-16 pb-12 relative overflow-y-auto overflow-x-hidden bg-transparent text-ink-black dark:text-white transition-colors duration-300">
      <Helmet>
        <title>{lang === "en" ? "Yongshin Halmeom - Korean Saju Report & Today's Fortune" : "용신할멈 - 사주명리 & 오늘의 운세"}</title>
        <meta name="description" content={lang === "en" ? 
        "Tsk. Looking for answers? Yongsin Grandma reads the patterns of your life through Saju—personality, relationships, career, and daily fortune included." :
        "쯧. 답답한 마음이 있느냐. 용신할멈이 사주를 바탕으로 자네의 기질과 인간관계, 직업, 재물, 오늘의 흐름까지 찬찬히 풀어주마."} />
        <link rel="canonical" href="https://yongshinhalmom.vercel.app/" />
        
        {/* OpenGraph Core Metadata */}
        <meta property="og:title" content={lang === "en" ? "Yongshin Halmeom - Saju & Fortune" : "용신할멈 - 사주명리 & 오늘의 운세"} />
        <meta property="og:description" content={lang === "en" ? "Yongsin Grandma reads the patterns of your life through Saju—personality, relationships, career, and daily fortune included." : "쯧. 답답한 마음이 있느냐. 용신할멈이 사주를 바탕으로 자네의 기질과 인간관계, 직업, 재물, 오늘의 흐름까지 찬찬히 풀어주마."} />
        <meta property="og:image" content="https://yongshinhalmom.vercel.app/assets/yongshin.png" />
        <meta property="og:url" content="https://yongshinhalmom.vercel.app/" />
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content={lang === "en" ? "Yongshin Halmeom" : "용신할멈"} />
        <meta property="og:locale" content={lang === "en" ? "en_US" : "ko_KR"} />

        {/* Twitter Card Metadata */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={lang === "en" ? "Yongshin Halmeom - Saju & Fortune" : "용신할멈 - 사주명리 & 오늘의 운세"} />
        <meta name="twitter:description" content={lang === "en" ? "Yongsin Grandma reads the patterns of your life through Saju—personality, relationships, career, and daily fortune included." : "쯧. 답답한 마음이 있느냐. 용신할멈이 사주를 바탕으로 자네의 기질과 인간관계, 직업, 재물, 오늘의 흐름까지 찬찬히 풀어주마."} />
        <meta name="twitter:image" content="https://yongshinhalmom.vercel.app/assets/yongshin.png" />

        {/* JSON-LD Structured Data */}
        <script type="application/ld+json">
          {JSON.stringify(websiteSchema)}
        </script>
        <script type="application/ld+json">
          {JSON.stringify(orgSchema)}
        </script>
        <script type="application/ld+json">
          {JSON.stringify(webAppSchema)}
        </script>
        <script type="application/ld+json">
          {JSON.stringify(faqSchema)}
        </script>
      </Helmet>
      
      {/* Grid of plus signs background */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-20 dark:opacity-[0.07] text-ink-black dark:text-white" 
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='50' height='50' viewBox='0 0 50 50' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M24 25h2M25 24v2' stroke='currentColor' stroke-width='1.5' stroke-linecap='round' fill='none'/%3E%3C/svg%3E")`,
          backgroundRepeat: 'repeat',
        }} 
      />

      {/* Dynamic Ambient Blur Accent */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-hidden">
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.08 }}
          className="absolute -top-40 left-1/2 -translate-x-1/2 w-[80vw] h-[80vw] rounded-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 blur-[140px] dark:opacity-10" 
        />
      </div>

      <div className="relative z-10 max-w-md w-full flex flex-col items-center">
        
        {/* Category Header: Saju Analysis */}
        <motion.div
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="relative z-20 mb-4"
        >
          <span className="text-[12px] min-[400px]:text-[14px] font-sans font-black tracking-[0.5em] uppercase text-ink-black/40 dark:text-white/40 italic">
            Saju Analysis
          </span>
        </motion.div>

        {/* Brand Main Heading Area */}
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
          className="relative z-10 mb-8"
        >
          <h1 className="flex flex-col items-center">
            {/* Primary Calligraphy Title */}
            <span className="text-6xl min-[400px]:text-7xl md:text-8xl font-serif font-black italic tracking-tighter leading-none py-4 px-2 block overflow-visible gradient-title filter drop-shadow-[0_2px_12px_rgba(244,114,182,0.15)] dark:drop-shadow-[0_2px_16px_rgba(0,242,255,0.12)]">
              {t.title}
            </span>
            {/* Sub-Brand Romanization */}
            <span className="text-[12px] min-[400px]:text-[15px] font-serif font-medium text-ink-black/50 dark:text-white/30 italic tracking-[0.65em] mt-3 uppercase">
              S C A R Y &nbsp; G R A N D M A
            </span>
          </h1>
        </motion.div>

        {/* Grandma Quote */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="max-w-xs min-[400px]:max-w-sm mx-auto mb-12 relative z-10"
        >
          <p className="text-ink-black/80 dark:text-white/70 text-[12px] min-[400px]:text-sm font-sans leading-relaxed tracking-tight whitespace-pre-line">
            {t.landingQuote}
          </p>
        </motion.div>

        {/* Primary Interactive Actions - Stacked with identical sizing */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.15 }}
          className="flex flex-col items-center gap-4 relative z-20 w-full px-4"
        >
          {/* Button 1: See For Yourself */}
          <button
            onClick={onStart}
            className="w-full max-w-[328px] h-[56px] rounded-none font-sans font-black text-[12px] uppercase tracking-[0.4em] flex items-center justify-center gap-3 transition-all duration-300 active:scale-[0.98] border border-pink-200/40 bg-gradient-to-r from-pink-100/40 via-purple-50/30 to-cyan-100/40 text-ink-black/90 hover:opacity-95 shadow-[0_4px_20px_rgba(244,114,182,0.06)] dark:border-white/10 dark:from-[rgba(0,242,255,0.12)] dark:via-[rgba(157,0,255,0.12)] dark:to-[rgba(255,0,255,0.12)] dark:text-white dark:shadow-[0_0_20px_rgba(157,0,255,0.1)] dark:hover:shadow-[0_0_25px_rgba(157,0,255,0.18)]"
          >
            <svg className="w-4 h-4 shrink-0 opacity-80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 21l7-7" />
              <path d="M5 17l4-4" />
              <path d="M7 19l4-4" />
              <path d="M15 4l1.5 3.5L20 9l-3.5 1.5L15 14l-1.5-3.5L10 9l3.5-1.5z" />
            </svg>
            <span>{t.enterOracle}</span>
            <Sparkles className="w-3.5 h-3.5 opacity-80" />
          </button>

          {/* Button 2: Mysterious Dream Interpretation */}
          <button
            onClick={() => setIsDreamModalOpen(true)}
            className="w-full max-w-[328px] h-[56px] rounded-none font-sans font-black text-[12px] uppercase tracking-[0.4em] flex items-center justify-center gap-3 transition-all duration-300 active:scale-[0.98] border border-ink-black/10 bg-[#f9f7f0]/80 hover:bg-white/90 text-ink-black/90 shadow-[0_4px_15px_rgba(0,0,0,0.02)] dark:border-white/10 dark:bg-black/40 dark:hover:bg-white/5 dark:text-white dark:shadow-none"
          >
            <Moon className="w-4 h-4 opacity-80" />
            <span>{lang === 'ko' ? '신묘한 꿈해몽' : 'Dream Interpretation'}</span>
          </button>

          {/* Low-profile Profiles Trigger Button if existing profiles are found */}
          {hasProfiles && (
            <button
              onClick={onOpenProfiles}
              className="mt-2 text-[10px] font-sans font-bold uppercase tracking-[0.3em] text-ink-black/40 dark:text-white/40 hover:text-ink-black dark:hover:text-white transition-all underline decoration-dotted underline-offset-4"
            >
              {t.loadProfiles}
            </button>
          )}
        </motion.div>

        <div className="flex flex-col items-center gap-6 mt-12 w-full max-w-sm px-4">
          <InstallPrompt />
          <button
            type="button"
            onClick={() => navigate('/basic/what-is-saju')}
            className="text-[10px] font-sans font-black uppercase tracking-[0.4em] text-ink-black/50 dark:text-white/50 hover:text-ink-black/70 dark:hover:text-white/70 transition-all flex items-center gap-2 group cursor-pointer"
          >
            {t.moreInfo}
          </button>

          {/* Beautiful, traditional, semantic footer for SEO and internal link crawling */}
          <footer className="mt-8 pt-6 border-t border-ink-black/10 dark:border-white/10 w-full text-left opacity-80 z-10">
            <h2 className="text-[10px] font-sans font-black uppercase tracking-[0.2em] text-ink-black/50 dark:text-white/40 mb-3 text-center">
              {lang === "en" ? "Saju & Astrology Library" : "🔮 용신할멈 명리비책 서재 바로가기"}
            </h2>
            <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-[11px] font-sans text-ink-black/70 dark:text-white/50 justify-items-center">
              <Link to="/basic/what-is-saju" className="hover:text-ink-black/70 dark:hover:text-white/70 transition-colors">↳ {lang === "en" ? "What is Saju?" : "사주란 무엇인가?"}</Link>
              <Link to="/basic/what-is-yongshin" className="hover:text-ink-black/70 dark:hover:text-white/70 transition-colors">↳ {lang === "en" ? "What is Yongshin?" : "용신이란 무엇인가?"}</Link>
              <Link to="/basic/what-is-ilgan" className="hover:text-ink-black/70 dark:hover:text-white/70 transition-colors">↳ {lang === "en" ? "What is Ilgan?" : "일간이란 무엇인가?"}</Link>
              <Link to="/basic/what-is-sipsin" className="hover:text-ink-black/70 dark:hover:text-white/70 transition-colors">↳ {lang === "en" ? "What is Sipsin?" : "십성이란 무엇인가?"}</Link>
            </div>
            
            <div className="mt-4 flex flex-col items-center gap-1.5 border-t border-ink-black/5 dark:border-white/5 pt-3 text-[9px] font-sans tracking-wide text-ink-black/50 dark:text-white/40">
              <div>
                <span>✉️ {lang === "en" ? "Contact: " : "제보 및 문의: "}</span>
                <a href="mailto:yongshinhalmom@gmail.com" className="underline hover:text-ink-black/70 dark:hover:text-white/70 transition-colors">yongshinhalmom@gmail.com</a>
              </div>
              <div>
                <span>📸 Instagram: </span>
                <a href="https://www.instagram.com/yongshinhalmom.saju" target="_blank" rel="noopener noreferrer" className="underline hover:text-ink-black/70 dark:hover:text-white/70 transition-colors">@yongshinhalmom.saju</a>
              </div>
            </div>

            <p className="mt-6 text-[9px] text-ink-black/40 dark:text-white/30 leading-relaxed text-center font-sans tracking-wide">
              {lang === "en" 
                ? "Yongshin Halmeom © All traditional Saju analysis, fortune guides, and element characters are calculated based on orthodox Eastern astrology."
                : "용신할멈 © 용한 신점 수준의 사주 대운, 세운 흐름 분석과 정밀한 만세력 기운 계산은 정통 동양 사주 명리학 이론을 바탕으로 작동합니다."}
            </p>
          </footer>
        </div>
      </div>
      <DreamModal isOpen={isDreamModalOpen} onClose={() => setIsDreamModalOpen(false)} lang={lang} />
    </div>
  );
}
