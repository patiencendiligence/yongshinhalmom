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
    birthDate: initialData?.birthDate || "",
    birthTime: initialData?.birthTime || "",
    isLunar: initialData?.isLunar ?? false,
    gender: initialData?.gender || "female",
    birthPlace: initialData?.birthPlace || "",
    targetYear: initialData?.targetYear || currentYear
  });

  // Keep form in sync if initialData changes (e.g. after profile selection or error recovery)
  React.useEffect(() => {
    if (initialData) {
      setFormData(prev => ({
        ...prev,
        ...initialData,
        // Only update if the value is actually different and provided
        birthDate: initialData.birthDate ?? prev.birthDate,
        birthTime: initialData.birthTime ?? prev.birthTime,
        isLunar: initialData.isLunar ?? prev.isLunar,
        gender: initialData.gender ?? prev.gender,
        birthPlace: initialData.birthPlace ?? prev.birthPlace,
        targetYear: initialData.targetYear ?? prev.targetYear
      }));
    }
  }, [initialData]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.birthDate || !formData.birthPlace) {
      alert(t.missingFields);
      return;
    }
    onSubmit(formData);
  };

  return (
    <div className="bg-white/40 dark:bg-black/40 border border-ink-black/10 dark:border-white/10 p-6 md:p-12 md:p-20 relative overflow-hidden max-w-4xl mx-auto shadow-xl dark:shadow-2xl transition-all duration-300">
      <div className="absolute inset-0 dragon-pattern opacity-10 pointer-events-none" />

      <header className="mb-20 text-center">
        <h2 className="text-4xl md:text-7xl font-serif font-black text-ink-black dark:text-white italic mb-6 leading-none tracking-tighter">
          {t.registryTitle}
        </h2>
        <div className="text-[10px] uppercase tracking-[0.6em] text-ink-black/60 dark:text-white/40 font-sans font-black italic">
          {t.registrySubtitle}
        </div>
      </header>

      <form onSubmit={handleSubmit} className="space-y-16 relative z-10">
        

        <div className="grid grid-cols-1 md:grid-cols-2 gap-16">
          <div className="space-y-6">
            <label className="text-[10px] uppercase tracking-[0.4em] text-ink-black/40 dark:text-white/30 font-black italic">{t.birthDate}</label>
            <input
              type="date"
              className="w-full bg-transparent border-b border-ink-black/15 dark:border-white/10 px-0 py-4 outline-none focus:border-ink-black dark:focus:border-white transition-all font-serif text-3xl text-ink-black dark:text-white h-[70px] appearance-none"
              value={formData.birthDate}
              onChange={(e) => setFormData({ ...formData, birthDate: e.target.value })}
            />
          </div>
          <div className="space-y-6">
            <label className="text-[10px] uppercase tracking-[0.4em] text-ink-black/40 dark:text-white/30 font-black italic">{t.birthTime}</label>
            <input
              type="time"
              className="w-full bg-transparent border-b border-ink-black/15 dark:border-white/10 px-0 py-4 outline-none focus:border-ink-black dark:focus:border-white transition-all font-serif text-3xl text-ink-black dark:text-white h-[70px] appearance-none"
              value={formData.birthTime}
              onChange={(e) => setFormData({ ...formData, birthTime: e.target.value })}
            />
          </div>
        </div>
        <div className="space-y-6">
          <label className="text-[10px] uppercase tracking-[0.4em] text-ink-black/40 dark:text-white/30 font-black italic">{t.birthPlace}</label>
          <input
            type="text"
            placeholder={t.placePlaceholder}
            className="w-full bg-transparent border-b border-ink-black/15 dark:border-white/10 px-0 py-4 outline-none focus:border-ink-black dark:focus:border-white transition-all font-serif text-3xl text-ink-black dark:text-white placeholder:text-ink-black/12 dark:placeholder:text-white/12"
            value={formData.birthPlace}
            onChange={(e) => setFormData({ ...formData, birthPlace: e.target.value })}
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-16 pt-4">
          <div className="space-y-8">
            <label className="text-[10px] uppercase tracking-[0.4em] text-ink-black/40 dark:text-white/30 font-black italic">{t.calendarType}</label>
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
                    ? "bg-ink-black text-white border-ink-black dark:bg-white dark:text-black dark:border-white shadow-md dark:shadow-2xl" 
                    : "bg-transparent text-ink-black/40 dark:text-white/30 border-ink-black/10 dark:border-white/10 hover:border-ink-black/30 dark:hover:border-white/30 hover:text-ink-black dark:hover:text-white"
                  }`}
                >
                  {opt.kr}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-8">
            <label className="text-[10px] uppercase tracking-[0.4em] text-ink-black/40 dark:text-white/30 font-black italic">{t.gender}</label>
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
                    ? "bg-ink-black text-white border-ink-black dark:bg-white dark:text-black dark:border-white shadow-md dark:shadow-2xl" 
                    : "bg-transparent text-ink-black/40 dark:text-white/30 border-ink-black/10 dark:border-white/10 hover:border-ink-black/30 dark:hover:border-white/30 hover:text-ink-black dark:hover:text-white"
                  }`}
                >
                  {opt.kr}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-8 sm:space-y-2 pt-4 sm:pt-2">
          <label className="text-[10px] uppercase tracking-[0.4em] text-ink-black/40 dark:text-white/30 font-black italic">{t.selectYear}</label>
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
                  ? "bg-ink-black text-white border-ink-black dark:bg-white dark:text-black dark:border-white shadow-md dark:shadow-2xl" 
                  : "bg-transparent text-ink-black/40 dark:text-white/30 border-ink-black/10 dark:border-white/10 hover:border-ink-black/30 dark:hover:border-white/30 hover:text-ink-black dark:hover:text-white"
                }`}
              >
                {opt.kr}
              </button>
            ))}
          </div>
        </div>

        <button
          type="submit"
          className="holo-button w-full py-8 sm:py-2 mt-12 sm:mt-6 bg-ink-black text-white dark:bg-transparent dark:text-white font-sans font-black text-[12px] uppercase tracking-[0.6em] transition-all flex items-center justify-center gap-6"
        >
          {t.checkData} <ArrowRight className="w-5 h-5" />
        </button>
      </form>
    </div>
  );
}
