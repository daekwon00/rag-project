"use client";

import { useState, useEffect, useCallback } from "react";
import { translations, type Lang, type Section } from "./translations";

export function useLang(): [Lang, (lang: Lang) => void] {
  const [lang, setLangState] = useState<Lang>("ko");

  useEffect(() => {
    const stored = localStorage.getItem("lang");
    if (stored === "en" || stored === "ko") {
      setLangState(stored);
    }
  }, []);

  const setLang = useCallback((newLang: Lang) => {
    setLangState(newLang);
    localStorage.setItem("lang", newLang);
  }, []);

  return [lang, setLang];
}

export function useTranslation() {
  const [lang, setLang] = useLang();

  const t = useCallback(
    <S extends Section>(section: S, key: keyof (typeof translations)["ko"][S]): string => {
      const dict = translations[lang] as typeof translations["ko"];
      return dict[section][key] as string;
    },
    [lang]
  );

  return { t, lang, setLang };
}
