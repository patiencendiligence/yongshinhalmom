import { motion } from "motion/react";
import { Sparkles } from "lucide-react";
import { Helmet } from "react-helmet-async";
import { faqSchema }from "../utils/sajuUtils.ts";
import { Language, translations } from "../lib/translations";

interface LandingProps {
  onStart: () => void;
  onOpenProfiles: () => void;
  hasProfiles: boolean;
  lang: Language;
}

export default function Landing({ onStart, onOpenProfiles, hasProfiles, lang }: LandingProps) {
  const t = translations[lang];
  
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
    <div className="flex flex-col items-center justify-center min-h-screen text-center px-4 relative overflow-hidden bg-cream text-ink-black dark:bg-dark-deep dark:text-white bg-paper-pattern transition-colors duration-300">
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
      
      {/* Decorative Accents */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-hidden">
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.05 }}
          className="absolute -top-20 -left-20 w-[60vw] h-[60vw] rounded-full bg-indigo-900/10 blur-[120px] dark:bg-indigo-300/5" 
        />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 5 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
        className="relative z-20 mb-8"
      >
        <div className="inline-block px-4 py-1 border border-ink-black/10 dark:border-white/10 rounded-none bg-ink-black/5 dark:bg-white/5 backdrop-blur-sm">
          <span className="text-[9px] font-sans font-black tracking-[0.5em] uppercase text-ink-black/60 dark:text-white/40 italic">{t.traditionalWisdom}</span>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.2 }}
        className="relative z-10"
      >
        <h1 className="flex flex-col items-center mb-12">
          <span className="text-[11px] font-sans font-black tracking-[0.8em] uppercase text-ink-black dark:text-white mb-6 opacity-80">{t.ancientOracle}</span>
          <div className="flex flex-col items-center">
            <span className="text-6xl md:text-8xl lg:text-[7rem] font-serif font-black italic tracking-tighter leading-[1.15] py-6 px-4 block overflow-visible gradient-title">
              {t.title}
            </span>
            <span className="text-2xl md:text-3xl font-serif text-ink-black/40 dark:text-white/20 italic tracking-[0.4em] mt-4 uppercase">
              {t.grandmother}
            </span>
          </div>
        </h1>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.2 }}
        className="max-w-xl mx-auto mb-16 relative z-10"
      >
        <p className="text-ink-black/70 dark:text-white/60 text-sm md:text-base font-sans leading-relaxed tracking-tight max-w-sm">
          {t.landingQuote}
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
        className="flex flex-col items-center gap-10 relative z-20 mb-10"
      >
        <div className="flex flex-col md:flex-row gap-6">
          <button
            onClick={onStart}
            className="holo-button group px-16 py-5 min-w-[280px] bg-ink-black text-white dark:bg-transparent dark:text-white/90 font-sans font-black text-[11px] uppercase tracking-[0.5em] flex items-center justify-center gap-4 transition-all hover:opacity-90"
          >
            {t.enterOracle} <Sparkles className="w-3.5 h-3.5" />
          </button>

          {hasProfiles && (
            <button
              onClick={onOpenProfiles}
              className="px-10 py-5 border border-ink-black/20 dark:border-white/10 bg-transparent text-ink-black/60 dark:text-white/50 font-sans font-black text-[10px] uppercase tracking-[0.5em] transition-all hover:text-ink-black hover:border-ink-black/40 dark:hover:text-white dark:hover:border-white/30"
            >
              {t.loadProfiles}
            </button>
          )}
        </div>
      </motion.div>
       <div className="flex flex-col items-center gap-8 mt-10 w-full max-w-lg">
        <button
          onClick={ () => location.href ='/basic/what-is-saju'}
          className="text-[10px] font-sans font-black uppercase tracking-[0.5em] text-ink-black/70 dark:text-white/60 hover:text-mythic-gold dark:hover:text-mythic-gold transition-all flex items-center gap-4 group"
        >
          {t.moreInfo}
        </button>

        {/* Beautiful, traditional, semantic footer for SEO and internal link crawling */}
        <footer className="mt-12 pt-8 border-t border-ink-black/10 dark:border-white/10 w-full text-left px-2 opacity-80 z-10">
          <h2 className="text-[10px] font-sans font-black uppercase tracking-[0.2em] text-ink-black/60 dark:text-white/40 mb-4">
            {lang === "en" ? "Saju & Astrology Library" : "🔮 용신할멈 명리비책 서재 바로가기"}
          </h2>
          <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-[11px] font-sans text-ink-black/80 dark:text-white/60">
            <a href="/basic/what-is-saju" className="hover:text-mythic-gold dark:hover:text-mythic-gold transition-colors">↳ {lang === "en" ? "What is Saju?" : "사주란 무엇인가? (무료 사주)"}</a>
            <a href="/basic/what-is-yongshin" className="hover:text-mythic-gold dark:hover:text-mythic-gold transition-colors">↳ {lang === "en" ? "What is Yongshin?" : "용신이란 무엇인가? (용신 찾기)"}</a>
            <a href="/basic/what-is-ilgan" className="hover:text-mythic-gold dark:hover:text-mythic-gold transition-colors">↳ {lang === "en" ? "What is Ilgan?" : "일간이란 무엇인가? (오행 분석)"}</a>
            <a href="/basic/what-is-sipsin" className="hover:text-mythic-gold dark:hover:text-mythic-gold transition-colors">↳ {lang === "en" ? "What is Sipsin?" : "십성이란 무엇인가? (사주 GPT)"}</a>
          </div>
          
          <div className="mt-6 flex flex-wrap items-center justify-between gap-4 border-t border-ink-black/5 dark:border-white/5 pt-4 text-[10px] font-sans tracking-wider text-ink-black/60 dark:text-white/40">
            <div>
              <span>✉️ {lang === "en" ? "Contact: " : "제보 및 문의: "}</span>
              <a href="mailto:yongshinhalmom@gmail.com" className="underline hover:text-mythic-gold dark:hover:text-mythic-gold transition-colors">yongshinhalmom@gmail.com</a>
            </div>
            <div>
              <span>📸 Instagram: </span>
              <a href="https://www.instagram.com/yongshinhalmom.saju" target="_blank" rel="noopener noreferrer" className="underline hover:text-mythic-gold dark:hover:text-mythic-gold transition-colors">@yongshinhalmom.saju</a>
            </div>
          </div>

          <p className="mt-8 text-[10px] text-ink-black/50 dark:text-white/30 leading-relaxed text-center font-sans tracking-wide">
            {lang === "en" 
              ? "Yongshin Halmeom © All traditional Saju analysis, fortune guides, and element characters are calculated based on orthodox Eastern astrology."
              : "용신할멈 © 용한 신점 수준의 사주 대운, 세운 흐름 분석과 정밀한 만세력 기운 계산은 정통 동양 사주 명리학 이론을 바탕으로 작동합니다."}
          </p>
        </footer>
      </div>
    </div>
  );
}
