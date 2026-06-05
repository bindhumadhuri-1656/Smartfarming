"use client";

import React, { createContext, useContext, useState } from "react";
import { useTranslation, Language } from "./LanguageContext";

export type { Language };
export type Mode = "Farmer" | "Expert";
export type ActivePage =
  | "Home"
  | "My Farm"
  | "Disease Scanner"
  | "Weather Alerts"
  | "Market Prices"
  | "Ask AgriPilot"
  | "Government Benefits"
  | "Settings";

export interface FarmState {
  activeCrop: string;
  expectedProfit: string;
  rainAlert: string;
  nextActivity: string;
  riskAlert: string;
  location: string;
  soilType: string;
  waterAvailability: string;
  budget: string;
  experience: string;
  temperature: string;
  rainChance: string;
  humidity: string;
  marketPrice: string;
  cropHealth: string;
  waterRequirement: string;
  recommendedAction: string;
}

interface AppContextProps {
  language: Language;
  setLanguage: (lang: Language) => void;
  mode: Mode;
  setMode: (mode: Mode) => void;
  activePage: ActivePage;
  setActivePage: (page: ActivePage) => void;
  farmState: FarmState;
  updateFarmState: (updates: Partial<FarmState>) => void;
  t: (key: string) => string;
}

const defaultFarmState: FarmState = {
  activeCrop: "Tomato",
  expectedProfit: "₹28,000",
  rainAlert: "Heavy Rain Expected Tomorrow",
  nextActivity: "Irrigation Due in 2 Days",
  riskAlert: "Medium Disease Risk",
  location: "Hyderabad",
  soilType: "Red",
  waterAvailability: "Medium",
  budget: "Medium",
  experience: "Beginner",
  temperature: "29°C",
  rainChance: "65%",
  humidity: "60%",
  marketPrice: "₹3,200 / Quintal",
  cropHealth: "Excellent",
  waterRequirement: "Moderate",
  recommendedAction: "Apply organic fertilizer and monitor soil moisture.",
};

const AppContext = createContext<AppContextProps | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  // Delegate language and translation to LanguageContext (single source of truth)
  const { language, setLanguage, t } = useTranslation();
  const [mode, setMode] = useState<Mode>("Farmer");
  const [activePage, setActivePage] = useState<ActivePage>("Home");
  const [farmState, setFarmState] = useState<FarmState>(defaultFarmState);

  const updateFarmState = (updates: Partial<FarmState>) => {
    setFarmState((prev) => ({ ...prev, ...updates }));
  };

  return (
    <AppContext.Provider
      value={{
        language,
        setLanguage,
        mode,
        setMode,
        activePage,
        setActivePage,
        farmState,
        updateFarmState,
        t,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useApp must be used within an AppProvider");
  }
  return context;
};
