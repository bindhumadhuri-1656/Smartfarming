"use client";

import React, { useState } from "react";
import { useApp, ActivePage } from "@/context/AppContext";
import {
  Home,
  Sprout,
  Camera,
  CloudLightning,
  TrendingUp,
  MessageSquare,
  Landmark,
  Settings,
  Menu,
  X,
  Compass
} from "lucide-react";

interface SidebarItem {
  name: ActivePage;
  icon: React.ComponentType<any>;
  tKey: string;
}

const items: SidebarItem[] = [
  { name: "Home", icon: Home, tKey: "home" },
  { name: "My Farm", icon: Sprout, tKey: "myFarm" },
  { name: "Disease Scanner", icon: Camera, tKey: "diseaseScanner" },
  { name: "Weather Alerts", icon: CloudLightning, tKey: "weatherAlerts" },
  { name: "Market Prices", icon: TrendingUp, tKey: "marketPrices" },
  { name: "Ask AgriPilot", icon: MessageSquare, tKey: "askAgriPilot" },
  { name: "Government Benefits", icon: Landmark, tKey: "govBenefits" },
  { name: "Settings", icon: Settings, tKey: "settings" },
];

export default function Sidebar() {
  const { activePage, setActivePage, t } = useApp();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Mobile Header / Top Nav Bar */}
      <header className="md:hidden flex items-center justify-between px-4 py-3 bg-[#032015]/80 backdrop-blur-md border-b border-emerald-900/30 sticky top-0 z-40">
        <div className="flex items-center gap-2">
          <div className="h-9 w-9 rounded-lg bg-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-950/50">
            <Compass className="h-5 w-5 text-white animate-spin-slow" />
          </div>
          <span className="font-bold text-lg tracking-wide bg-gradient-to-r from-emerald-400 to-teal-200 bg-clip-text text-transparent">
            AgriPilot AI
          </span>
        </div>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="p-2 rounded-lg text-emerald-100 hover:bg-[#063824] transition-colors focus:outline-none"
        >
          {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </header>

      {/* Mobile Drawer Menu */}
      {isOpen && (
        <div className="md:hidden fixed inset-0 z-30 bg-black/60 backdrop-blur-sm" onClick={() => setIsOpen(false)}>
          <div
            className="w-64 h-full bg-[#031d12] border-r border-emerald-950 p-5 flex flex-col justify-between"
            onClick={(e) => e.stopPropagation()}
          >
            <div>
              <div className="flex items-center gap-2 mb-8">
                <Compass className="h-6 w-6 text-emerald-400" />
                <span className="font-bold text-lg text-emerald-100">AgriPilot AI</span>
              </div>
              <nav className="space-y-1">
                {items.map((item) => {
                  const Icon = item.icon;
                  const isActive = activePage === item.name;
                  return (
                    <button
                      key={item.name}
                      onClick={() => {
                        setActivePage(item.name);
                        setIsOpen(false);
                      }}
                      className={`w-full flex items-center gap-3.5 px-4 py-3.5 rounded-xl text-sm font-medium transition-all ${
                        isActive
                          ? "bg-gradient-to-r from-emerald-800/80 to-emerald-900/40 text-emerald-200 border-l-4 border-emerald-400 shadow-md"
                          : "text-emerald-100/60 hover:bg-emerald-900/10 hover:text-white"
                      }`}
                    >
                      <Icon className={`h-5 w-5 ${isActive ? "text-emerald-400" : "text-emerald-500/80"}`} />
                      {t(item.tKey)}
                    </button>
                  );
                })}
              </nav>
            </div>
            <div className="text-[10px] text-emerald-600/70 text-center font-mono">
              v1.0.0 • AgriPilot Co-Pilot
            </div>
          </div>
        </div>
      )}

      {/* Desktop Persistent Sidebar */}
      <aside className="hidden md:flex w-72 flex-col bg-[#031d12]/90 backdrop-blur-lg border-r border-emerald-950 h-screen sticky top-0 p-6 shrink-0 justify-between">
        <div>
          {/* Logo Section */}
          <div className="flex items-center gap-3.5 mb-10 px-2">
            <div className="h-10 w-10 rounded-xl bg-emerald-600 flex items-center justify-center shadow-xl shadow-emerald-900/40">
              <Compass className="h-6 w-6 text-white" />
            </div>
            <div>
              <span className="font-bold text-xl tracking-wide bg-gradient-to-r from-emerald-400 to-teal-200 bg-clip-text text-transparent">
                AgriPilot AI
              </span>
              <p className="text-[10px] text-emerald-500 tracking-widest uppercase font-semibold">
                {t("Farmer Co-Pilot")}
              </p>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1.5">
            {items.map((item) => {
              const Icon = item.icon;
              const isActive = activePage === item.name;
              return (
                <button
                  key={item.name}
                  onClick={() => setActivePage(item.name)}
                  className={`w-full flex items-center gap-3.5 px-4.5 py-4 rounded-2xl text-base font-medium transition-all ${
                    isActive
                      ? "bg-[#063824] text-white shadow-lg shadow-emerald-950/50 border-r-4 border-emerald-400 font-semibold"
                      : "text-emerald-100/50 hover:bg-[#052c1c]/40 hover:text-emerald-200"
                  }`}
                >
                  <Icon
                    className={`h-5.5 w-5.5 ${
                      isActive ? "text-emerald-400" : "text-emerald-600"
                    }`}
                  />
                  <span>{t(item.tKey)}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Footer info */}
        <div className="px-2">
          <div className="p-4 rounded-xl bg-[#04281a]/50 border border-emerald-950/40">
            <p className="text-xs text-emerald-400 font-medium">{t("Voice Assistant")}</p>
            <p className="text-[10px] text-emerald-100/40 mt-1">
              En, Te, Hi, Ta, Kn
            </p>
          </div>
          <p className="text-[10px] text-emerald-600/70 font-mono mt-4 text-center">
            Intel Boot Camp v1.0.0
          </p>
        </div>
      </aside>
    </>
  );
}
