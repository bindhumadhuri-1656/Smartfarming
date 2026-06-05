"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import en from "../locales/en.json";
import te from "../locales/te.json";
import hi from "../locales/hi.json";
import ta from "../locales/ta.json";
import kn from "../locales/kn.json";

export type Language = "English" | "Telugu" | "Hindi" | "Tamil" | "Kannada";

interface LanguageContextProps {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const locales: Record<Language, Record<string, string>> = {
  English: en as Record<string, string>,
  Telugu: te as Record<string, string>,
  Hindi: hi as Record<string, string>,
  Tamil: ta as Record<string, string>,
  Kannada: kn as Record<string, string>
};

const LanguageContext = createContext<LanguageContextProps | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>("English");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedLang = localStorage.getItem("agripilot_lang") as Language;
      if (savedLang && locales[savedLang]) {
        setLanguageState(savedLang);
      }
    }
  }, []);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    if (typeof window !== "undefined") {
      localStorage.setItem("agripilot_lang", lang);
    }
  };

  const t = (key: string): string => {
    const currentDict = locales[language] || locales["English"];
    return currentDict[key] || locales["English"][key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useTranslation = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useTranslation must be used within a LanguageProvider");
  }
  return context;
};
