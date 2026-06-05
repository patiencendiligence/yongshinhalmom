import { ArrowLeft, Home } from "lucide-react";
import { motion } from "motion/react";
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { Language, translations } from "../lib/translations";

interface PolicyViewProps {
  onBack: () => void;
  lang: Language;
}

export default function PolicyView({ onBack, lang }: PolicyViewProps) {
  const t = (translations[lang] as any).policyView;
  const mainT = translations[lang] as any;

  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl text-white/80 font-sans leading-relaxed">
      <Helmet>
        <title>{lang === "en" ? "Privacy Policy & Terms of Service - Yongshin Halmeom" : "개인정보 처리방침 및 이용약관 - 용신할멈"}</title>
        <meta name="description" content={lang === "en" ? "Review the privacy practices and user terms of service for Yongshin Halmeom AI Saju." : "용신할멈 홈페이지의 개인정보처리방침 및 서비스 이용약관을 공지합니다."} />
        <link rel="canonical" href="https://yongshinhalmom.vercel.app/policies" />
      </Helmet>
      <div className="flex justify-between items-center mb-16">
        <motion.button
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          onClick={onBack}
          className="flex items-center gap-3 text-white/40 hover:text-white transition-all uppercase tracking-[0.5em] text-[10px] font-black group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-2 transition-transform" />
          {t.back}
        </motion.button>

        <motion.div
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
        >
          <Link
            to="/"
            className="flex items-center gap-3 text-mythic-gold/60 hover:text-mythic-gold transition-all uppercase tracking-[0.5em] text-[10px] font-black group"
          >
            <Home className="w-4 h-4 group-hover:scale-110 transition-transform" />
            {mainT.backToHome}
          </Link>
        </motion.div>
      </div>

      <div className="space-y-16 bg-black border border-white/20 p-8 md:p-20 relative overflow-hidden shadow-2xl dragon-pattern">
        <section className="relative z-10">
          <div className="text-[10px] uppercase font-sans font-black tracking-[0.8em] text-white/30 mb-6 italic">
            Legal Document — {t.label}
          </div>
          <h1 className="text-4xl md:text-4xl font-serif font-black italic mb-8 text-white tracking-tighter leading-[0.85]">{t.title}</h1>
          <p className="text-xl text-white/50 mb-12 font-serif italic max-w-xl leading-relaxed">
            {t.intro}
          </p>
          <div className="bg-white/5 p-8 border-l-4 border-white/20 space-y-6">
            <strong className="text-white uppercase text-xs tracking-[0.4em] font-black">{t.whatYouGet}</strong>
            <ul className="space-y-4 text-white/70 font-sans">
              {t.items.map((item, i) => (
                <li key={i} className="flex items-center gap-4">
                  <div className="w-1.5 h-1.5 bg-white/20" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </section>

        <p className="text-sm italic text-white/40 border-l-[1px] border-white/10 pl-6 py-4 font-serif relative z-10">
          {t.disclaimer}
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-16 relative z-10">
          <section>
            <h2 className="text-xl font-serif font-black italic mb-6 text-white uppercase tracking-widest">{t.support}</h2>
            <div className="space-y-2 text-sm font-sans tracking-tight">
               <p className="text-white/40 uppercase text-[10px] tracking-widest">Inquiry Line</p>
               <p className="text-white text-lg font-serif italic">patiencendiligence@gmail.com</p>
               <p className="text-white/40 mt-2">{t.responseTime}</p>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-serif font-black italic mb-6 text-white uppercase tracking-widest">{t.refundTitle}</h2>
            <p className="text-sm text-white/50 leading-relaxed">
              {t.refundText}
            </p>
          </section>

          <section>
            <h2 className="text-xl font-serif font-black italic mb-6 text-white uppercase tracking-widest">{t.cancelTitle}</h2>
            <p className="text-sm text-white/50 leading-relaxed">
              {t.cancelText}
            </p>
          </section>

          <section>
            <h2 className="text-xl font-serif font-black italic mb-6 text-white uppercase tracking-widest">{t.legalTitle}</h2>
            <p className="text-sm text-white/50 leading-relaxed">
              {t.legalText}
            </p>
          </section>
        </div>

        <section className="pt-16 border-t border-white/10 relative z-10">
          <h2 className="text-2xl font-serif font-black italic mb-6 text-white uppercase tracking-widest">{t.termsTitle}</h2>
          <p className="text-sm text-white/50 leading-relaxed max-w-3xl">
            {t.termsText}
          </p>
        </section>

        <section className="pt-16 border-t border-white/10 relative z-10 flex flex-col items-center gap-4">
          <Link
            to="/"
            className="flex items-center gap-3 text-mythic-gold/60 hover:text-mythic-gold transition-all uppercase tracking-[0.5em] text-[10px] font-black group px-8 py-4 border border-white/10 hover:border-mythic-gold/30 rounded bg-white/[0.02]"
          >
            <Home className="w-4 h-4 group-hover:scale-110 transition-transform" />
            {mainT.backToHome}
          </Link>
        </section>

        <footer className="text-[10px] uppercase tracking-[0.5em] font-sans text-white/10 text-center pt-16 relative z-10">
          © {new Date().getFullYear()} Yongshinhalmom. All rights reserved.
        </footer>
      </div>
    </div>
  );
}

