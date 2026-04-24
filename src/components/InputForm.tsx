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
    <div className="bg-black/40 border border-white/10 p-12 md:p-20 relative overflow-hidden max-w-4xl mx-auto shadow-2xl">
      <div className="absolute inset-0 dragon-pattern opacity-10 pointer-events-none" />

      <header className="mb-20 text-center">
        <h2 className="text-5xl md:text-7xl font-serif font-black text-white italic mb-6 leading-none tracking-tighter">
          {t.registryTitle}
        </h2>
        <div className="text-[10px] uppercase tracking-[0.6em] mythic-gradient-text font-sans font-black italic">
          {t.registrySubtitle}
        </div>
      </header>

      <form onSubmit={handleSubmit} className="space-y-16 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-16">
          <div className="space-y-6">
            <label className="text-[10px] uppercase tracking-[0.4em] text-white/30 font-black italic">{t.clientName}</label>
            <input
              type="text"
              placeholder={t.namePlaceholder}
              className="w-full bg-transparent border-b border-white/10 px-0 py-4 outline-none focus:border-white transition-all font-serif text-3xl text-white placeholder:text-white/5"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>

          <div className="space-y-6">
            <label className="text-[10px] uppercase tracking-[0.4em] text-white/30 font-black italic">{t.birthPlace}</label>
            <input
              type="text"
              placeholder={t.placePlaceholder}
              className="w-full bg-transparent border-b border-white/10 px-0 py-4 outline-none focus:border-white transition-all font-serif text-3xl text-white placeholder:text-white/5"
              value={formData.birthPlace}
              onChange={(e) => setFormData({ ...formData, birthPlace: e.target.value })}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-16">
          <div className="space-y-6">
            <label className="text-[10px] uppercase tracking-[0.4em] text-white/30 font-black italic">{t.birthDate}</label>
            <input
              type="date"
              className="w-full bg-transparent border-b border-white/10 px-0 py-4 outline-none focus:border-white transition-all font-serif text-3xl text-white h-[70px] appearance-none"
              value={formData.birthDate}
              onChange={(e) => setFormData({ ...formData, birthDate: e.target.value })}
            />
          </div>
          <div className="space-y-6">
            <label className="text-[10px] uppercase tracking-[0.4em] text-white/30 font-black italic">{t.birthTime}</label>
            <input
              type="time"
              className="w-full bg-transparent border-b border-white/10 px-0 py-4 outline-none focus:border-white transition-all font-serif text-3xl text-white h-[70px] appearance-none"
              value={formData.birthTime}
              onChange={(e) => setFormData({ ...formData, birthTime: e.target.value })}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-16 pt-4">
          <div className="space-y-8">
            <label className="text-[10px] uppercase tracking-[0.4em] text-white/30 font-black italic">{t.calendarType}</label>
            <div className="flex gap-4">
              {[
                { value: false, label: "Solar", kr: t.solar },
                { value: true, label: "Lunar", kr: t.lunar }
              ].map((opt) => (
                <button
                  key={opt.label}
                  type="button"
                  onClick={() => setFormData({ ...formData, isLunar: opt.value })}
                  className={`flex-1 py-5 border transition-all text-[11px] font-black tracking-[0.4em] uppercase ${
                    formData.isLunar === opt.value 
                    ? "bg-white text-black border-white" 
                    : "bg-transparent text-white/30 border-white/10 hover:border-white/30 hover:text-white"
                  }`}
                >
                  {opt. kr}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-8">
            <label className="text-[10px] uppercase tracking-[0.4em] text-white/30 font-black italic">{t.gender}</label>
            <div className="flex gap-4">
              {[
                { value: "female", label: "Female", kr: t.female },
                { value: "male", label: "Male", kr: t.male }
              ].map((opt) => (
                <button
                  key={opt.label}
                  type="button"
                  onClick={() => setFormData({ ...formData, gender: opt.value })}
                  className={`flex-1 py-5 border transition-all text-[11px] font-black tracking-[0.4em] uppercase ${
                    formData.gender === opt.value 
                    ? "bg-white text-black border-white" 
                    : "bg-transparent text-white/30 border-white/10 hover:border-white/30 hover:text-white"
                  }`}
                >
                  {opt.kr}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-8 pt-4">
          <label className="text-[10px] uppercase tracking-[0.4em] text-white/30 font-black italic">{t.selectYear}</label>
          <div className="flex gap-4">
            {[
              { value: currentYear, kr: t.thisYear },
              { value: nextYear, kr: t.nextYear }
            ].map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setFormData({ ...formData, targetYear: opt.value })}
                className={`flex-1 py-5 border transition-all text-[11px] font-black tracking-[0.4em] uppercase ${
                  formData.targetYear === opt.value 
                  ? "bg-white text-black border-white shadow-2xl" 
                  : "bg-transparent text-white/30 border-white/10 hover:border-white/30 hover:text-white"
                }`}
              >
                {opt.kr}
              </button>
            ))}
          </div>
        </div>

        <button
          type="submit"
          className="holo-button w-full py-8 mt-12 bg-black text-white font-sans font-black text-[12px] uppercase tracking-[0.6em] transition-all flex items-center justify-center gap-6"
        >
          {t.checkDestiny} <ArrowRight className="w-5 h-5" />
        </button>
      </form>
    </div>
  );
}
