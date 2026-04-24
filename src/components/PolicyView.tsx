import { ArrowLeft } from "lucide-react";
import { motion } from "motion/react";
import { Language } from "../lib/translations";

interface PolicyViewProps {
  onBack: () => void;
  lang: Language;
}

export default function PolicyView({ onBack, lang }: PolicyViewProps) {
  const isKo = lang === 'ko';

  const t = {
    back: isKo ? "돌아가기" : "Back to App",
    title: isKo ? "용신할멈 라이프스타일 분석" : "Yongshinhalmom Lifestyle Insights",
    intro: isKo 
      ? "본 리포트를 통해 개인의 라이프스타일 패턴을 확인해보세요. 이 서비스는 날짜와 관련된 패턴을 기반으로 일반적인 통찰을 제공하며, 습관, 성향 및 일상 루틴을 돌아보는 데 도움을 줍니다."
      : "Discover your personal lifestyle patterns with our report. This service provides general insights based on date-related patterns, helping you reflect on your habits, tendencies, and daily routines.",
    whatYouGet: isKo ? "제공되는 내용:" : "What you get:",
    items: isKo ? [
      "개인 라이프스타일 패턴 개요",
      "습관 및 생산성 통찰",
      "자기 성찰을 위한 질문",
      "일상생활을 위한 일반적인 가이드"
    ] : [
      "Personal lifestyle pattern overview",
      "Habit and productivity insights",
      "Self-reflection prompts",
      "General guidance for daily life"
    ],
    disclaimer: isKo
      ? "본 리포트는 정보 제공 및 자기 성찰 목적으로만 제작되었습니다. 어떠한 예측이나 전문적인 조언도 제공하지 않습니다."
      : "This report is intended for informational and self-reflection purposes only. It does not provide predictions or professional advice.",
    support: isKo ? "고객 지원" : "Customer Support",
    responseTime: isKo ? "24시간 이내 답변" : "Response time: within 24 hours",
    refundTitle: isKo ? "환불 정책" : "Refund Policy",
    refundText: isKo
      ? "디지털 제품의 특성상, 리포트가 생성된 후에는 모든 판매가 최종적이며 환불이 불가능합니다. 기술적인 문제가 발생할 경우 문의해 주세요."
      : "Due to the nature of digital products, all sales are final and non-refundable once the report has been generated. If you experience technical issues, please contact us.",
    cancelTitle: isKo ? "취소 정책" : "Cancellation Policy",
    cancelText: isKo
      ? "본 서비스는 1회성 구매입니다. 구독이나 반복 결제는 포함되지 않습니다."
      : "This is a one-time purchase. No subscription or recurring billing is involved.",
    legalTitle: isKo ? "법적 고지" : "Legal Notice",
    legalText: isKo
      ? "본 서비스는 그러한 콘텐츠가 제한된 지역에서는 이용이 불가능할 수 있습니다."
      : "This service may not be available in jurisdictions where such content is restricted.",
    termsTitle: isKo ? "이용 약관" : "Terms of Use",
    termsText: isKo
      ? "본 제품을 구매함으로써 귀하는 콘텐츠가 일반적인 정보 제공 목적으로만 제공되며 금융, 의료 또는 법적 조언을 구성하지 않음에 동의합니다."
      : "By purchasing this product, you agree that the content is provided for general informational purposes only and does not constitute financial, medical, or legal advice."
  };

  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl text-white/80 font-sans leading-relaxed">
      <motion.button
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        onClick={onBack}
        className="flex items-center gap-3 text-white/40 hover:text-white transition-all mb-16 uppercase tracking-[0.5em] text-[10px] font-black group"
      >
        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-2 transition-transform" />
        {t.back}
      </motion.button>

      <div className="space-y-16 bg-black border border-white/20 p-8 md:p-20 relative overflow-hidden shadow-2xl dragon-pattern">
        <section className="relative z-10">
          <div className="text-[10px] uppercase font-sans font-black tracking-[0.8em] text-white/30 mb-6 italic">
            Legal Document — {lang === 'ko' ? "고시" : "PUBLIC NOTICE"}
          </div>
          <h1 className="text-4xl md:text-7xl font-serif font-black italic mb-8 text-white tracking-tighter leading-[0.85]">{t.title}</h1>
          <p className="text-xl text-white/50 mb-12 font-serif italic max-w-2xl leading-relaxed">
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

        <footer className="text-[10px] uppercase tracking-[0.5em] font-sans text-white/10 text-center pt-16 relative z-10">
          © {new Date().getFullYear()} Yongshinhalmom. All rights reserved.
        </footer>
      </div>
    </div>
  );
}

