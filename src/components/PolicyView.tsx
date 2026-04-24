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
    <div className="container mx-auto px-6 py-12 max-w-4xl text-white/80 font-sans leading-relaxed">
      <motion.button
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        onClick={onBack}
        className="flex items-center gap-2 text-mythic-gold hover:opacity-70 transition-all mb-12 uppercase tracking-widest text-xs font-black"
      >
        <ArrowLeft className="w-4 h-4" />
        {t.back}
      </motion.button>

      <div className="space-y-12 bg-white/5 border border-white/10 p-8 md:p-16 rounded-[40px] backdrop-blur-xl">
        <section>
          <h1 className="text-4xl font-serif font-black italic mb-6 text-white tracking-tight">{t.title}</h1>
          <p className="text-lg text-white/60 mb-8">
            {t.intro}
          </p>
          <div className="bg-white/5 p-6 rounded-2xl border border-white/10 space-y-4">
            <strong className="text-mythic-gold uppercase text-xs tracking-[0.2em]">{t.whatYouGet}</strong>
            <ul className="list-disc list-inside space-y-2 text-white/70">
              {t.items.map((item, i) => (
                <li key={i}>{item}</li>
              ))}
            </ul>
          </div>
        </section>

        <p className="text-sm italic text-white/40 border-l-2 border-mythic-gold pl-4 py-2">
          {t.disclaimer}
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          <section>
            <h2 className="text-xl font-serif font-black italic mb-4 text-mythic-gold">{t.support}</h2>
            <div className="space-y-1 text-sm">
               <p>Email: <span className="text-white">patiencendiligence@gmail.com</span></p>
               <p>{t.responseTime}</p>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-serif font-black italic mb-4 text-mythic-gold">{t.refundTitle}</h2>
            <p className="text-sm text-white/60">
              {t.refundText}
            </p>
          </section>

          <section>
            <h2 className="text-xl font-serif font-black italic mb-4 text-mythic-gold">{t.cancelTitle}</h2>
            <p className="text-sm text-white/60">
              {t.cancelText}
            </p>
          </section>

          <section>
            <h2 className="text-xl font-serif font-black italic mb-4 text-mythic-gold">{t.legalTitle}</h2>
            <p className="text-sm text-white/60">
              {t.legalText}
            </p>
          </section>
        </div>

        <section className="pt-12 border-t border-white/10">
          <h2 className="text-xl font-serif font-black italic mb-4 text-white">{t.termsTitle}</h2>
          <p className="text-sm text-white/60">
            {t.termsText}
          </p>
        </section>

        <footer className="text-[10px] uppercase tracking-[0.3em] font-sans text-white/20 text-center pt-8">
          © {new Date().getFullYear()} Yongshinhalmom. All rights reserved.
        </footer>
      </div>
    </div>
  );
}

