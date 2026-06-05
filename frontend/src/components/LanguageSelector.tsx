"use client";

import React, { useState } from "react";
import { useApp, Language } from "@/context/AppContext";
import { Globe, Check } from "lucide-react";

const languages: { name: Language; nativeName: string; flag: string }[] = [
  { name: "English", nativeName: "English", flag: "🇬🇧" },
  { name: "Telugu", nativeName: "తెలుగు", flag: "🇮🇳" },
  { name: "Hindi", nativeName: "हिन्दी", flag: "🇮🇳" },
  { name: "Tamil", nativeName: "தமிழ்", flag: "🇮🇳" },
  { name: "Kannada", nativeName: "ಕನ್ನಡ", flag: "🇮🇳" },
];

export default function LanguageSelector() {
  const { language, setLanguage, t } = useApp();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative inline-block text-left z-50">
      <div>
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2 px-4 py-2 border border-emerald-800/40 rounded-xl text-sm font-medium text-emerald-100 bg-[#032418]/60 backdrop-blur-md hover:bg-[#053624]/80 transition-all focus:outline-none"
          id="language-menu-button"
          aria-expanded={isOpen}
          aria-haspopup="true"
        >
          <Globe className="h-4.5 w-4.5 text-emerald-400" />
          <span className="hidden sm:inline">
            {languages.find((lang) => lang.name === language)?.nativeName || language}
          </span>
          <span className="sm:hidden">
            {languages.find((lang) => lang.name === language)?.flag || "🌐"}
          </span>
          <svg
            className="-mr-1 ml-1 h-5 w-5 text-emerald-400"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
            aria-hidden="true"
          >
            <path
              fillRule="evenodd"
              d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
              clipRule="evenodd"
            />
          </svg>
        </button>
      </div>

      {isOpen && (
        <div
          className="origin-top-right absolute right-0 mt-2 w-48 rounded-xl shadow-2xl bg-[#032015] border border-emerald-700/30 divide-y divide-emerald-900/40 focus:outline-none"
          role="menu"
          aria-orientation="vertical"
          aria-labelledby="language-menu-button"
          tabIndex={-1}
        >
          <div className="py-1" role="none">
            {languages.map((lang) => (
              <button
                key={lang.name}
                onClick={() => {
                  setLanguage(lang.name);
                  setIsOpen(false);
                }}
                className={`w-full flex items-center justify-between px-4 py-3 text-sm text-left transition-all ${
                  language === lang.name
                    ? "bg-[#063824] text-emerald-200 font-semibold"
                    : "text-emerald-100/70 hover:bg-[#04281a] hover:text-white"
                }`}
                role="menuitem"
                tabIndex={-1}
              >
                <div className="flex items-center gap-3">
                  <span className="text-base">{lang.flag}</span>
                  <div>
                    <p className="font-medium">{lang.nativeName}</p>
                    {lang.name !== lang.nativeName && (
                      <p className="text-[10px] text-emerald-500/80">{lang.name}</p>
                    )}
                  </div>
                </div>
                {language === lang.name && (
                  <Check className="h-4 w-4 text-emerald-400" />
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
