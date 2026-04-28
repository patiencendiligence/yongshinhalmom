import { ArrowLeft, CreditCard, ChevronRight } from "lucide-react";
import { motion } from "motion/react";
import { Language } from "../lib/translations";

interface PricingViewProps {
  onBack: () => void;
  onPurchase: () => void;
  lang: Language;
}

export default function PricingView({ onBack, onPurchase, lang }: PricingViewProps) {
  const isKo = lang === 'ko';

  const t = {
    back: isKo ? "돌아가기" : "Back",
    title: isKo ? "상세리포트보기" : "Detailed Report Access",
    subtitle: isKo ? "당신의 라이프스타일 패턴을 깊이 분석합니다." : "Analyze the lifestyle pattern in detail.",
    price: isKo ? "990원" : "₩990",
    purchase: isKo ? "구매하기" : "Purchase Access",
    features: isKo ? [
      "개인 라이프스타일 패턴 개요",
      "습관 및 생산성 통찰",
      "자기 성찰을 위한 실천 가이드"
    ] : [
      "Personalized Lifestyle Overview",
      "Habit & Productivity Insights",
      "Practical Reflection Guide"
    ],
    oneTime: isKo ? "단회성 결제 (구독 없음)" : "One-time purchase (No subscription)"
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

      <div className="bg-black border border-white/20 p-8 md:p-20 relative overflow-hidden shadow-2xl dragon-pattern">
        <div className="relative z-10 flex flex-col items-center text-center">
          <div className="text-[10px] uppercase font-sans font-black tracking-[0.8em] text-cyan-400/50 mb-6 italic">
            {isKo ? "프리미엄 서비스" : "PREMIUM SERVICE"}
          </div>
          
          <h1 className="text-4xl md:text-7xl font-serif font-black italic mb-6 text-white tracking-tighter leading-[0.85]">
            {t.title}
          </h1>
          
          <p className="text-lg text-white/50 mb-12 font-serif italic max-w-xl leading-relaxed">
            {t.subtitle}
          </p>

          <div className="w-full max-w-md bg-white/[0.03] border border-white/10 rounded-2xl p-10 mb-12 transform hover:scale-[1.02] transition-all duration-500 shadow-[0_0_50px_rgba(255,255,255,0.02)]">
            <div className="flex flex-col items-center gap-2 mb-8 border-b border-white/10 pb-8">
              <span className="text-[10px] uppercase tracking-[0.4em] text-white/30 font-black">Limited Access</span>
              <div className="text-6xl font-serif font-black italic text-white flex items-start">
                <span className="text-2xl mt-2 mr-1">{isKo ? "" : "₩"}</span>
                {isKo ? "990" : "990"}
                <span className="text-xl mt-8 ml-1">{isKo ? "원" : ""}</span>
              </div>
            </div>

            <ul className="space-y-4 mb-10 text-left">
              {t.features.map((feature, i) => (
                <li key={i} className="flex items-start gap-4 text-sm tracking-tight text-white/60">
                  <ChevronRight className="w-4 h-4 text-cyan-400/40 shrink-0 mt-0.5" />
                  {feature}
                </li>
              ))}
            </ul>

            <button
              onClick={onPurchase}
              className="w-full py-6 bg-white text-black font-sans font-black uppercase tracking-[0.4em] text-xs hover:bg-cyan-400 transition-all duration-300 transform active:scale-95 flex items-center justify-center gap-3"
            >
              <CreditCard className="w-4 h-4" />
              {t.purchase}
            </button>
            <p className="text-[9px] uppercase tracking-[0.2em] text-white/20 mt-4 font-black">{t.oneTime}</p>
          </div>

          <p className="text-[10px] text-white/30 italic max-w-md font-sans tracking-widest leading-loose">
            {isKo 
              ? "결제 즉시 분석이 시작되며 디지털 콘텐츠 특성상 환불이 불가능합니다." 
              : "Analysis begins immediately after purchase. Digital contents are non-refundable."}
          </p>
        </div>
      </div>
      
      <footer className="text-[10px] uppercase tracking-[0.5em] font-sans text-white/10 text-center pt-16">
        © {new Date().getFullYear()} Yongshinhalmom.
      </footer>
    </div>
  );
}
