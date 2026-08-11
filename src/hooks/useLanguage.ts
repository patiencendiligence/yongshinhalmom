import { useState, useEffect } from "react";
import { Language } from "../lib/translations";

export function useLanguage() {
  const [lang, setLang] = useState<Language>("ko");

  useEffect(() => {
    if (typeof window !== "undefined" && typeof localStorage !== "undefined") {
      const saved = localStorage.getItem("yongshin_lang");
      if (saved === "ko" || saved === "en") {
        setLang(saved);
      }
    }
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined" && typeof localStorage !== "undefined") {
      localStorage.setItem("yongshin_lang", lang);
    }
  }, [lang]);

  const toggleLang = () => {
    setLang(prev => prev === "ko" ? "en" : "ko");
  };

  return { lang, toggleLang };
}
