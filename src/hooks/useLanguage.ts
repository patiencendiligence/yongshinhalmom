import { useState, useEffect } from "react";
import { Language } from "../lib/translations";

export function useLanguage() {
  const [lang, setLang] = useState<Language>(() => {
    const saved = localStorage.getItem("yongshin_lang");
    return (saved as Language) || "ko";
  });

  useEffect(() => {
    localStorage.setItem("yongshin_lang", lang);
  }, [lang]);

  const toggleLang = () => {
    setLang(prev => prev === "ko" ? "en" : "ko");
  };

  return { lang, toggleLang };
}
