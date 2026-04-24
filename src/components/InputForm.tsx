import React, { useState } from "react";
import { motion } from "motion/react";
import { User, Calendar, Clock, MapPin, CheckCircle2, ArrowRight } from "lucide-react";

import { Language, translations } from "../lib/translations";

interface InputFormProps {
  onSubmit: (data: any) => void;
  initialData?: any;
  lang: Language;
}

export default function InputForm({ onSubmit, initialData, lang }: InputFormProps) {
  const t = translations[lang];
  const currentYear = new Date().getFullYear();
  const nextYear = currentYear + 1;

  const [formData, setFormData] = useState({
    name: initialData?.name || "",
    birthDate: initialData?.birthDate || "",
    birthTime: initialData?.birthTime || "",
    isLunar: initialData?.isLunar ?? false,
    gender: initialData?.gender || "female",
    birthPlace: initialData?.birthPlace || "",
    targetYear: currentYear
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.birthDate || !formData.birthPlace) {
      alert(t.missingFields);
      return;
    }
    onSubmit(formData);
  };

  return (
    <div className="bento-card-refined p-10 md:p-16 relative overflow-hidden max-w-4xl mx-auto">
      <div className="absolute inset-0 mythic-grain pointer-events-none" />

      <header className="mb-16 text-center">
        <h2 className="text-4xl font-serif font-black text-white italic mb-4 tracking-tighter">
          {t.registryTitle}
        </h2>
        <div className="flex items-center justify-center gap-2">
          <div className="w-1 h-1 rounded-full bg-mythic-gold" />
          <p className="text-[10px] uppercase tracking-[0.4em] text-white/30 font-sans font-bold">{t.registrySubtitle}</p>
          <div className="w-1 h-1 rounded-full bg-mythic-gold" />
        </div>
      </header>

      <form onSubmit={handleSubmit} className="space-y-12 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          <div className="space-y-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-6 h-6 rounded-full bg-mythic-gold flex items-center justify-center text-[10px] text-black font-black">01</div>
              <label className="text-[10px] uppercase tracking-widest text-white/40 font-bold">{t.clientName}</label>
            </div>
            <input
              type="text"
              placeholder={t.namePlaceholder}
              className="w-full bg-transparent border-b border-white/10 px-0 py-4 outline-none focus:border-mythic-gold transition-all font-serif text-2xl text-white placeholder:text-white/20"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-6 h-6 rounded-full bg-mythic-red flex items-center justify-center text-[10px] text-white font-black">02</div>
              <label className="text-[10px] uppercase tracking-widest text-white/30 font-bold">{t.birthPlace}</label>
            </div>
            <input
              type="text"
              placeholder={t.placePlaceholder}
              className="w-full bg-transparent border-b border-white/30 px-0 py-4 outline-none focus:border-mythic-red transition-all font-serif text-2xl text-white placeholder:text-white/5"
              value={formData.birthPlace}
              onChange={(e) => setFormData({ ...formData, birthPlace: e.target.value })}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          <div className="space-y-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-6 h-6 rounded-full bg-white flex items-center justify-center text-[10px] text-black font-black">03</div>
              <label className="text-[10px] uppercase tracking-widest text-white/30 font-bold">{t.birthDate}</label>
            </div>
            <input
              type="date"
              className="w-full bg-transparent border-b border-white/30 px-0 py-4 outline-none focus:border-white transition-all font-serif text-2xl text-white/30 h-[65px]"
              value={formData.birthDate}
              onChange={(e) => setFormData({ ...formData, birthDate: e.target.value })}
            />
          </div>
          <div className="space-y-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-6 h-6 rounded-full bg-mythic-blue flex items-center justify-center text-[10px] text-white font-black">04</div>
              <label className="text-[10px] uppercase tracking-widest text-white/40 font-bold">{t.birthTime}</label>
            </div>
            <input
              type="time"
              className="w-full bg-transparent border-b border-white/10 px-0 py-4 outline-none focus:border-mythic-blue transition-all font-serif text-2xl text-white/30 h-[65px]"
              value={formData.birthTime}
              onChange={(e) => setFormData({ ...formData, birthTime: e.target.value })}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 pt-4">
          <div className="space-y-6">
            <label className="text-[10px] uppercase tracking-widest text-white/40 font-bold">{t.calendarType}</label>
            <div className="flex gap-4">
              {[
                { value: false, label: "Solar", kr: t.solar },
                { value: true, label: "Lunar", kr: t.lunar }
              ].map((opt) => (
                <button
                  key={opt.label}
                  type="button"
                  onClick={() => setFormData({ ...formData, isLunar: opt.value })}
                  className={`flex-1 py-4 border transition-all text-xs font-bold tracking-widest uppercase ${
                    formData.isLunar === opt.value 
                    ? "bg-white text-black border-white" 
                    : "bg-transparent text-white/30 border-white/5 hover:border-white/20 hover:text-white"
                  }`}
                >
                  {opt. kr} <span className="opacity-40 ml-1">{opt.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-6">
            <label className="text-[10px] uppercase tracking-widest text-white/40 font-bold">{t.gender}</label>
            <div className="flex gap-4">
              {[
                { value: "female", label: "Female", kr: t.female },
                { value: "male", label: "Male", kr: t.male }
              ].map((opt) => (
                <button
                  key={opt.label}
                  type="button"
                  onClick={() => setFormData({ ...formData, gender: opt.value })}
                  className={`flex-1 py-4 border transition-all text-xs font-bold tracking-widest uppercase ${
                    formData.gender === opt.value 
                    ? "bg-mythic-red text-white border-mythic-red" 
                    : "bg-transparent text-white/30 border-white/5 hover:border-white/20 hover:text-white"
                  }`}
                >
                  {opt.kr} <span className="opacity-40 ml-1">{opt.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-6 pt-4">
          <label className="text-[10px] uppercase tracking-widest text-white/40 font-bold">{t.selectYear}</label>
          <div className="flex gap-4">
            {[
              { value: currentYear, kr: t.thisYear },
              { value: nextYear, kr: t.nextYear }
            ].map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setFormData({ ...formData, targetYear: opt.value })}
                className={`flex-1 py-4 border transition-all text-xs font-bold tracking-widest uppercase rounded-lg ${
                  formData.targetYear === opt.value 
                  ? "bg-mythic-gold text-black border-mythic-gold" 
                  : "bg-transparent text-white/30 border-white/5 hover:border-white/20 hover:text-white"
                }`}
              >
                {opt.kr}
              </button>
            ))}
          </div>
        </div>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          type="submit"
          className="w-full py-8 mt-12 bg-mythic-gold text-black font-sans font-black text-sm uppercase tracking-[0.5em] transition-all flex items-center justify-center gap-4 group"
        >
          {t.checkDestiny} <ArrowRight className="w-5 h-5 group-hover:translate-x-2 transition-transform" />
        </motion.button>
      </form>
    </div>
  );
}
