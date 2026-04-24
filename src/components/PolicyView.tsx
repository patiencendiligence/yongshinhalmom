import { ArrowLeft } from "lucide-react";
import { motion } from "motion/react";
import { Language } from "../lib/translations";

interface PolicyViewProps {
  onBack: () => void;
  lang: Language;
}

export default function PolicyView({ onBack, lang }: PolicyViewProps) {
  return (
    <div className="container mx-auto px-6 py-12 max-w-4xl text-white/80 font-sans leading-relaxed">
      <motion.button
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        onClick={onBack}
        className="flex items-center gap-2 text-mythic-gold hover:opacity-70 transition-all mb-12 uppercase tracking-widest text-xs font-black"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to App
      </motion.button>

      <div className="space-y-12 bg-white/5 border border-white/10 p-8 md:p-16 rounded-[40px] backdrop-blur-xl">
        <section>
          <h1 className="text-4xl font-serif font-black italic mb-6 text-white tracking-tight">Yongshinhalmom Lifestyle Insights</h1>
          <p className="text-lg text-white/60 mb-8">
            Discover your personal lifestyle patterns with our report. 
            This service provides general insights based on date-related patterns, helping you reflect on your habits, tendencies, and daily routines.
          </p>
          <div className="bg-white/5 p-6 rounded-2xl border border-white/10 space-y-4">
            <strong className="text-mythic-gold uppercase text-xs tracking-[0.2em]">What you get:</strong>
            <ul className="list-disc list-inside space-y-2 text-white/70">
              <li>Personal lifestyle pattern overview</li>
              <li>Habit and productivity insights</li>
              <li>Self-reflection prompts</li>
              <li>General guidance for daily life</li>
            </ul>
          </div>
        </section>

        <p className="text-sm italic text-white/40 border-l-2 border-mythic-gold pl-4 py-2">
          This report is intended for informational and self-reflection purposes only. 
          It does not provide predictions or professional advice.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          <section>
            <h2 className="text-xl font-serif font-black italic mb-4 text-mythic-gold">Customer Support</h2>
            <div className="space-y-1 text-sm">
               <p>Email: <span className="text-white">patiencendiligence@gmail.com</span></p>
               <p>Response time: within 24 hours</p>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-serif font-black italic mb-4 text-mythic-gold">Refund Policy</h2>
            <p className="text-sm text-white/60">
              Due to the nature of digital products, all sales are final and non-refundable once the report has been generated. 
              If you experience technical issues, please contact us.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-serif font-black italic mb-4 text-mythic-gold">Cancellation Policy</h2>
            <p className="text-sm text-white/60">
              This is a one-time purchase. No subscription or recurring billing is involved.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-serif font-black italic mb-4 text-mythic-gold">Legal Notice</h2>
            <p className="text-sm text-white/60">
              This service may not be available in jurisdictions where such content is restricted.
            </p>
          </section>
        </div>

        <section className="pt-12 border-t border-white/10">
          <h2 className="text-xl font-serif font-black italic mb-4 text-white">Terms of Use</h2>
          <p className="text-sm text-white/60">
            By purchasing this product, you agree that the content is provided for general informational purposes only 
            and does not constitute financial, medical, or legal advice.
          </p>
        </section>

        <footer className="text-[10px] uppercase tracking-[0.3em] font-sans text-white/20 text-center pt-8">
          © {new Date().getFullYear()} Yongshinhalmom. All rights reserved.
        </footer>
      </div>
    </div>
  );
}
