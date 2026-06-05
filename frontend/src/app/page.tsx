"use client";

import React, { useState, useEffect, useRef } from "react";
import { useApp, ActivePage, FarmState } from "@/context/AppContext";
import Sidebar from "@/components/Sidebar";
import LanguageSelector from "@/components/LanguageSelector";
import VoiceAssistant from "@/components/VoiceAssistant";
import {
  Sprout,
  DollarSign,
  CloudSun,
  Activity,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  TrendingUp,
  FileText,
  ShieldCheck,
  Brain,
  Camera,
  Upload,
  Calendar,
  Layers,
  Thermometer,
  Droplets,
  Wind,
  MapPin,
  ExternalLink,
  CheckCircle,
  HelpCircle,
  Play,
  Sparkles,
  Mic
} from "lucide-react";

// Map ActivePage values to camelCase locale keys
const pageKeyMap: Record<string, string> = {
  "Home": "home",
  "My Farm": "myFarm",
  "Disease Scanner": "diseaseScanner",
  "Weather Alerts": "weatherAlerts",
  "Market Prices": "marketPrices",
  "Ask AgriPilot": "askAgriPilot",
  "Government Benefits": "govBenefits",
  "Settings": "settings",
};

export default function Dashboard() {
  const {
    language,
    mode,
    setMode,
    activePage,
    setActivePage,
    farmState,
    updateFarmState,
    t,
  } = useApp();

  // State for modules
  const [weatherData, setWeatherData] = useState<any>(null);
  const [weatherLoading, setWeatherLoading] = useState(false);
  const [marketPrices, setMarketPrices] = useState<any[]>([]);
  const [marketLoading, setMarketLoading] = useState(false);
  const [schemes, setSchemes] = useState<any[]>([]);
  const [schemesLoading, setSchemesLoading] = useState(false);
  const [schemeExplaining, setSchemeExplaining] = useState<string | null>(null);
  const [schemeExplanation, setSchemeExplanation] = useState<string>("");

  // Disease scanner states
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [scanResult, setScanResult] = useState<any>(null);
  const [scanLoading, setScanLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Crop recommendation states
  const [recommendationResult, setRecommendationResult] = useState<any[]>([]);
  const [recommendationLoading, setRecommendationLoading] = useState(false);

  // General state for manual task checklist
  const [tasks, setTasks] = useState<{ id: number; text: string; done: boolean; priority: string }[]>([
    { id: 1, text: "Irrigate south-end tomato patch", done: false, priority: "High" },
    { id: 2, text: "Apply nitrogen-rich fertilizer before tomorrow's showers", done: true, priority: "High" },
    { id: 3, text: "Examine leaves for yellow spots in greenhouse", done: false, priority: "Medium" },
    { id: 4, text: "Sell harvested tomatoes at Madanapalle Market", done: false, priority: "Low" },
  ]);

  // Fetch weather and market data on load / location change / language change
  useEffect(() => {
    fetchWeather();
    fetchMarketPrices();
    fetchSchemes();
  }, [farmState.location, language]);

  const fetchWeather = async () => {
    setWeatherLoading(true);
    try {
      const res = await fetch(
        `http://localhost:8000/api/weather?location=${encodeURIComponent(
          farmState.location
        )}&language=${language}`
      );
      if (res.ok) {
        const data = await res.json();
        setWeatherData(data);
        // Sync summary to top dashboard
        updateFarmState({
          temperature: data.temperature,
          rainChance: `${data.rain_probability}%`,
          humidity: data.humidity,
          rainAlert: data.rain_warning
            ? "Heavy Rain Expected Tomorrow"
            : "No Heavy Rain Expected",
          recommendedAction: data.recommended_action,
        });
      }
    } catch (e) {
      console.error("Failed to fetch weather", e);
    } finally {
      setWeatherLoading(false);
    }
  };

  const fetchMarketPrices = async () => {
    setMarketLoading(true);
    try {
      const res = await fetch(`http://localhost:8000/api/market-prices?language=${language}`);
      if (res.ok) {
        const data = await res.json();
        setMarketPrices(data);
        // Sync active crop price
        const cropPrice = data.find(
          (p: any) => p.crop.toLowerCase().includes(farmState.activeCrop.toLowerCase())
        );
        if (cropPrice) {
          updateFarmState({ marketPrice: cropPrice.current_price });
        }
      }
    } catch (e) {
      console.error("Failed to fetch prices", e);
    } finally {
      setMarketLoading(false);
    }
  };

  const fetchSchemes = async () => {
    setSchemesLoading(true);
    try {
      const res = await fetch(`http://localhost:8000/api/government-schemes?language=${language}`);
      if (res.ok) {
        const data = await res.json();
        setSchemes(data);
      }
    } catch (e) {
      console.error("Failed to fetch schemes", e);
    } finally {
      setSchemesLoading(false);
    }
  };

  const handleExplainScheme = async (schemeName: string) => {
    setSchemeExplaining(schemeName);
    setSchemeExplanation("");
    try {
      const res = await fetch(`http://localhost:8000/api/government-schemes/explain`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scheme_name: schemeName, language }),
      });
      if (res.ok) {
        const data = await res.json();
        setSchemeExplanation(data.explanation);
        
        // Read explanation aloud using Web Speech API
        if (typeof window !== "undefined" && window.speechSynthesis) {
          window.speechSynthesis.cancel();
          const utterance = new SpeechSynthesisUtterance(data.explanation);
          const voiceLocales: Record<string, string> = {
            English: "en-US", Telugu: "te-IN", Hindi: "hi-IN", Tamil: "ta-IN", Kannada: "kn-IN"
          };
          utterance.lang = voiceLocales[language] || "en-US";
          window.speechSynthesis.speak(utterance);
        }
      }
    } catch (e) {
      console.error(e);
      setSchemeExplanation("Failed to generate AI explanation. Please check backend.");
    }
  };

  const handleCropRecommendation = async (e: React.FormEvent) => {
    e.preventDefault();
    setRecommendationLoading(true);
    try {
      const res = await fetch(`http://localhost:8000/api/crop-recommendation`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          location: farmState.location,
          soil_type: farmState.soilType,
          water_availability: farmState.waterAvailability,
          budget: farmState.budget,
          experience: farmState.experience,
          language: language,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setRecommendationResult(data);
        // Automatically set the top recommended crop as the active crop
        if (data.length > 0) {
          updateFarmState({
            activeCrop: data[0].crop_name,
            expectedProfit: data[0].expected_profit,
          });
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setRecommendationLoading(false);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
      setScanResult(null);
    }
  };

  const handleDiseaseScan = async () => {
    if (!selectedImage) return;
    setScanLoading(true);
    const formData = new FormData();
    formData.append("file", selectedImage);
    formData.append("language", language);

    try {
      const res = await fetch(`http://localhost:8000/api/disease-detection`, {
        method: "POST",
        body: formData,
      });
      if (res.ok) {
        const data = await res.json();
        setScanResult(data);
        
        // Update top bar disease alert status if disease is found
        if (data.disease_name && !data.disease_name.toLowerCase().includes("healthy")) {
          updateFarmState({
            riskAlert: `${data.severity} Risk: ${data.disease_name}`,
          });
        } else {
          updateFarmState({
            riskAlert: "Healthy crop condition",
          });
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setScanLoading(false);
    }
  };

  const toggleTask = (id: number) => {
    setTasks(
      tasks.map((t) => (t.id === id ? { ...t, done: !t.done } : t))
    );
  };

  return (
    <div className="flex flex-col md:flex-row min-h-screen">
      {/* Sidebar Navigation */}
      <Sidebar />

      {/* Main Dashboard Panel */}
      <main className="flex-1 flex flex-col min-w-0">
        
        {/* Header Bar */}
        <header className="px-6 py-4.5 bg-[#031d12]/40 backdrop-blur-md border-b border-emerald-950/60 flex items-center justify-between z-10">
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-white tracking-tight flex items-center gap-2">
              <span>{t(pageKeyMap[activePage])}</span>
              {activePage === "Home" && (
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium">
                  {t("Farmer Co-Pilot")}
                </span>
              )}
            </h1>
            <p className="text-xs text-emerald-600 font-mono mt-0.5 hidden sm:block">
              📍 {farmState.location} • {farmState.soilType} Soil
            </p>
          </div>

          <div className="flex items-center gap-4">
            {/* Mode Toggle Switch */}
            <div className="flex items-center bg-[#02130c]/80 border border-emerald-950/80 p-1.25 rounded-2xl">
              <button
                onClick={() => setMode("Farmer")}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  mode === "Farmer"
                    ? "bg-emerald-600 text-white shadow-lg"
                    : "text-emerald-100/50 hover:text-emerald-200"
                }`}
              >
                {t("farmerMode")}
              </button>
              <button
                onClick={() => setMode("Expert")}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  mode === "Expert"
                    ? "bg-emerald-600 text-white shadow-lg"
                    : "text-emerald-100/50 hover:text-emerald-200"
                }`}
              >
                {t("expertMode")}
              </button>
            </div>

            {/* Language Selector */}
            <LanguageSelector />
          </div>
        </header>

        {/* Top Mini-Dashboard Summary Cards */}
        <section className="px-6 py-5 grid grid-cols-2 lg:grid-cols-5 gap-4 bg-[#02140e]/20">
          {/* Active Crop */}
          <div className="glass-panel p-4.5 rounded-2xl flex flex-col justify-between">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-emerald-500/80 uppercase font-bold tracking-wider">{t("activeCrop")}</span>
              <Sprout className="h-4.5 w-4.5 text-emerald-400" />
            </div>
            <p className="text-lg md:text-xl font-bold text-white leading-none">{t(farmState.activeCrop)}</p>
          </div>

          {/* Expected Profit */}
          <div className="glass-panel p-4.5 rounded-2xl flex flex-col justify-between">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-emerald-500/80 uppercase font-bold tracking-wider">{t("expectedProfit")}</span>
              <DollarSign className="h-4.5 w-4.5 text-amber-500" />
            </div>
            <p className="text-lg md:text-xl font-bold text-amber-400 leading-none">{farmState.expectedProfit}</p>
          </div>

          {/* Rain Alert */}
          <div className="glass-panel p-4.5 rounded-2xl flex flex-col justify-between col-span-2 lg:col-span-1">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-emerald-500/80 uppercase font-bold tracking-wider">{t("rainAlert")}</span>
              <CloudSun className="h-4.5 w-4.5 text-blue-400" />
            </div>
            <p className="text-xs md:text-sm font-bold text-blue-300 leading-tight">
              {t(farmState.rainAlert)}
            </p>
          </div>

          {/* Next Activity */}
          <div className="glass-panel p-4.5 rounded-2xl flex flex-col justify-between">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-emerald-500/80 uppercase font-bold tracking-wider">{t("nextActivity")}</span>
              <Activity className="h-4.5 w-4.5 text-teal-400" />
            </div>
            <p className="text-xs md:text-sm font-bold text-teal-300 leading-tight">
              {t(farmState.nextActivity)}
            </p>
          </div>

          {/* Risk Alert */}
          <div className="glass-panel p-4.5 rounded-2xl flex flex-col justify-between border-l-4 border-l-amber-500">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-amber-500 uppercase font-bold tracking-wider">{t("riskAlert")}</span>
              <AlertTriangle className="h-4.5 w-4.5 text-amber-500" />
            </div>
            <p className="text-xs md:text-sm font-bold text-amber-300 leading-tight">
              {t(farmState.riskAlert)}
            </p>
          </div>
        </section>

        {/* Tab Route Rendering */}
        <div className="flex-1 p-6 space-y-6 overflow-y-auto">
          
          {/* TAB 1: HOME PAGE */}
          {activePage === "Home" && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Left & Middle Column */}
              <div className="lg:col-span-2 space-y-6">
                
                {/* Farmer Mode vs Expert Mode Display */}
                {mode === "Farmer" ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    {/* Crop Recommendation shortcut card */}
                    <div className="glass-panel p-6 rounded-3xl glass-panel-hover flex flex-col justify-between min-h-[180px]">
                      <div>
                        <div className="h-10 w-10 bg-emerald-950/60 rounded-xl flex items-center justify-center border border-emerald-800/30 mb-4">
                          <Sprout className="h-6 w-6 text-emerald-400" />
                        </div>
                        <h3 className="font-bold text-lg text-emerald-200">{t("cropRecommendations")}</h3>
                        <p className="text-xs text-emerald-100/50 mt-1">
                          {t("cropRecDesc")}
                        </p>
                      </div>
                      <button
                        onClick={() => setActivePage("My Farm")}
                        className="mt-6 text-xs text-emerald-400 font-bold flex items-center gap-1 hover:text-white"
                      >
                        {t("startRecommendation")} <ArrowUpRight className="h-4 w-4" />
                      </button>
                    </div>

                    {/* Disease Scanner Shortcut */}
                    <div className="glass-panel p-6 rounded-3xl glass-panel-hover flex flex-col justify-between min-h-[180px]">
                      <div>
                        <div className="h-10 w-10 bg-emerald-950/60 rounded-xl flex items-center justify-center border border-emerald-800/30 mb-4">
                          <Camera className="h-6 w-6 text-teal-400" />
                        </div>
                        <h3 className="font-bold text-lg text-teal-200">{t("diseaseScannerTitle")}</h3>
                        <p className="text-xs text-teal-100/50 mt-1">
                          {t("diseaseScannerDesc")}
                        </p>
                      </div>
                      <button
                        onClick={() => setActivePage("Disease Scanner")}
                        className="mt-6 text-xs text-teal-400 font-bold flex items-center gap-1 hover:text-white"
                      >
                        {t("scanCropDisease")} <ArrowUpRight className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ) : (
                  /* Expert Mode Details (Metrics, Charts, Models) */
                  <div className="glass-panel p-6 rounded-3xl space-y-6">
                    <div className="flex items-center justify-between border-b border-emerald-950/60 pb-3">
                      <div>
                        <h3 className="font-bold text-lg text-emerald-200">Forecast Analytics & Models</h3>
                        <p className="text-xs text-emerald-100/40">Model specifications and system logs.</p>
                      </div>
                      <div className="flex items-center gap-1 text-[10px] font-mono px-2 py-1 bg-emerald-950/80 border border-emerald-900/40 rounded-lg text-emerald-400">
                        <Brain className="h-3 w-3" />
                        Gemini 2.5 Flash
                      </div>
                    </div>

                    {/* Analytical Metrics */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                      <div className="bg-[#02140d]/60 border border-emerald-950/50 p-4 rounded-2xl">
                        <span className="text-[10px] text-emerald-600 uppercase font-bold">Confidence Metric</span>
                        <p className="text-xl font-bold text-white mt-1">94.2%</p>
                      </div>
                      <div className="bg-[#02140d]/60 border border-emerald-950/50 p-4 rounded-2xl">
                        <span className="text-[10px] text-emerald-600 uppercase font-bold">Geocoding Resolution</span>
                        <p className="text-xl font-bold text-white mt-1">High (1.2m)</p>
                      </div>
                      <div className="bg-[#02140d]/60 border border-emerald-950/50 p-4 rounded-2xl">
                        <span className="text-[10px] text-emerald-600 uppercase font-bold">API Latency</span>
                        <p className="text-xl font-bold text-white mt-1">210ms</p>
                      </div>
                      <div className="bg-[#02140d]/60 border border-emerald-950/50 p-4 rounded-2xl">
                        <span className="text-[10px] text-emerald-600 uppercase font-bold">Temp. Threshold</span>
                        <p className="text-xl font-bold text-white mt-1">0.2</p>
                      </div>
                    </div>

                    {/* Custom SVG Temperature trend Chart */}
                    <div className="bg-[#02100a]/50 p-4 rounded-2xl border border-emerald-950/50">
                      <span className="text-xs text-emerald-500 font-bold mb-3 block">Weekly Temperature Analytics (°C)</span>
                      <div className="h-32 w-full flex items-end justify-between px-2 pt-2 border-b border-l border-emerald-900/50 relative">
                        {/* Bars representing temperatures */}
                        {[27, 29, 32, 28, 26, 30, 31].map((temp, idx) => (
                          <div key={idx} className="flex flex-col items-center w-1/8 group">
                            <div className="text-[10px] text-emerald-400 opacity-0 group-hover:opacity-100 transition-opacity mb-1 font-bold">
                              {temp}°
                            </div>
                            <div
                              style={{ height: `${(temp / 40) * 80}px` }}
                              className="w-4 sm:w-6 bg-gradient-to-t from-emerald-800 to-emerald-400 rounded-t-md hover:from-emerald-700 hover:to-emerald-300 transition-all shadow-lg"
                            />
                            <span className="text-[9px] text-emerald-600 font-mono mt-1">D{idx+1}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* TODAY'S RECOMMENDATIONS (Farmer & Expert generic block) */}
                <div className="glass-panel p-6 rounded-3xl space-y-4">
                  <div className="flex items-center justify-between pb-2 border-b border-emerald-950/60">
                    <h3 className="font-bold text-lg text-emerald-200">
                      {t("todayAiRecommendations")}
                    </h3>
                    <Sparkles className="h-5 w-5 text-amber-500 animate-pulse" />
                  </div>

                  <div className="space-y-3.5">
                    {/* Recommendation Card 1 */}
                    <div className="p-4 rounded-2xl bg-[#032317]/50 border border-emerald-950 flex items-start gap-4 hover:border-emerald-800/40 transition-colors">
                      <div className="px-2.5 py-1 rounded-lg bg-red-950/60 border border-red-800/30 text-red-400 font-bold text-xs">
                        {t("priorityLabel")} 1
                      </div>
                      <div className="flex-1">
                        <p className="font-bold text-emerald-100 text-sm md:text-base">
                          Delay fertilizer application until tomorrow afternoon.
                        </p>
                        <p className="text-xs text-emerald-100/40 mt-1">
                          <strong className="text-emerald-500">{t("reasonLabel")}:</strong> Open-Meteo forecasts heavy rain (85% probability) tomorrow morning. Sprayed fertilizer will wash off.
                        </p>
                        <p className="text-xs text-emerald-400 font-medium mt-2">
                          👉 <strong className="font-bold">{t("actionLabel")}:</strong> Lock fertilization tanks. Spray next Tuesday instead.
                        </p>
                      </div>
                    </div>

                    {/* Recommendation Card 2 */}
                    <div className="p-4 rounded-2xl bg-[#032317]/50 border border-emerald-950 flex items-start gap-4 hover:border-emerald-800/40 transition-colors">
                      <div className="px-2.5 py-1 rounded-lg bg-amber-950/60 border border-amber-800/30 text-amber-400 font-bold text-xs">
                        {t("priorityLabel")} 2
                      </div>
                      <div className="flex-1">
                        <p className="font-bold text-emerald-100 text-sm md:text-base">
                          Check lower tomato leaves for brown circles.
                        </p>
                        <p className="text-xs text-emerald-100/40 mt-1">
                          <strong className="text-emerald-500">{t("reasonLabel")}:</strong> Higher humidity levels (80%) reported in your area create conditions for Early Blight.
                        </p>
                        <p className="text-xs text-emerald-400 font-medium mt-2">
                          👉 <strong className="font-bold">{t("actionLabel")}:</strong> Prune bottom 3 inches of leaves. Scan suspect leaves using the Disease Scanner.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

              </div>

              {/* Right Column: Interactive Tasks / Farmer Checklist */}
              <div className="space-y-6">
                <div className="glass-panel p-6 rounded-3xl space-y-4">
                  <h3 className="font-bold text-lg text-emerald-200">{t("todayTasks")}</h3>
                  <p className="text-xs text-emerald-100/40">{t("tasksDesc")}</p>
                  
                  <div className="space-y-2.5">
                    {tasks.map((task) => (
                      <button
                        key={task.id}
                        onClick={() => toggleTask(task.id)}
                        className={`w-full flex items-center gap-3.5 p-3.5 rounded-2xl text-left border transition-all ${
                          task.done
                            ? "bg-[#031c11]/40 border-emerald-950 text-emerald-100/40 line-through"
                            : "bg-[#042a1b]/60 border-emerald-900/30 text-emerald-100 hover:bg-[#063321]"
                        }`}
                      >
                        <div
                          className={`h-5 w-5 rounded-md flex items-center justify-center shrink-0 ${
                            task.done
                              ? "bg-emerald-600 text-white"
                              : "border-2 border-emerald-700 bg-[#02130c]"
                          }`}
                        >
                          {task.done && <CheckCircle className="h-4.5 w-4.5" />}
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium">{task.text}</p>
                          <span
                            className={`inline-block text-[9px] font-bold px-1.5 py-0.5 rounded-md mt-1 ${
                              task.priority === "High"
                                ? "bg-red-500/10 text-red-400 border border-red-500/20"
                                : task.priority === "Medium"
                                ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                                : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                            }`}
                          >
                            {task.priority}
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Weather card summary */}
                <div className="glass-panel p-6 rounded-3xl bg-gradient-to-b from-[#032317] to-[#01140e] border border-emerald-800/30 flex flex-col justify-between min-h-[220px]">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-bold text-base text-emerald-300">{t("weatherAlertCard")}</h4>
                      <p className="text-xs text-emerald-100/40">{t("openMeteoUpdate")}</p>
                    </div>
                    <span className="text-2xl font-bold text-white">{farmState.temperature}</span>
                  </div>
                  <div className="my-4">
                    <p className="text-xs text-emerald-100/80 leading-relaxed">
                      {farmState.recommendedAction}
                    </p>
                  </div>
                  <div className="flex items-center justify-between border-t border-emerald-950 pt-3">
                    <div className="flex items-center gap-1.5 text-xs text-emerald-400">
                      <Droplets className="h-4 w-4" /> {farmState.humidity} {t("homeWeatherHumidity")}
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-emerald-400">
                      <Wind className="h-4 w-4" /> {farmState.rainChance} {t("homeWeatherRain")}
                    </div>
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* TAB 2: MY FARM & RECOMMENDATIONS */}
          {activePage === "My Farm" && (
            <div className="space-y-6">
              
              {/* Summary Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
                <div className="bg-[#032317]/50 border border-emerald-900/30 p-4.5 rounded-2xl">
                  <span className="text-[10px] text-emerald-500 uppercase font-bold tracking-wider">{t("temperature")}</span>
                  <p className="text-lg font-bold text-white mt-1">{farmState.temperature}</p>
                </div>
                <div className="bg-[#032317]/50 border border-emerald-900/30 p-4.5 rounded-2xl">
                  <span className="text-[10px] text-emerald-500 uppercase font-bold tracking-wider">{t("rainChance")}</span>
                  <p className="text-lg font-bold text-white mt-1">{farmState.rainChance}</p>
                </div>
                <div className="bg-[#032317]/50 border border-emerald-900/30 p-4.5 rounded-2xl">
                  <span className="text-[10px] text-emerald-500 uppercase font-bold tracking-wider">{t("humidity")}</span>
                  <p className="text-lg font-bold text-white mt-1">{farmState.humidity}</p>
                </div>
                <div className="bg-[#032317]/50 border border-emerald-900/30 p-4.5 rounded-2xl">
                  <span className="text-[10px] text-emerald-500 uppercase font-bold tracking-wider">{t("marketPrice")}</span>
                  <p className="text-lg font-bold text-amber-400 mt-1">{farmState.marketPrice}</p>
                </div>
                <div className="bg-[#032317]/50 border border-emerald-900/30 p-4.5 rounded-2xl">
                  <span className="text-[10px] text-emerald-500 uppercase font-bold tracking-wider">{t("cropHealth")}</span>
                  <p className="text-lg font-bold text-emerald-400 mt-1">{t(farmState.cropHealth)}</p>
                </div>
                <div className="bg-[#032317]/50 border border-emerald-900/30 p-4.5 rounded-2xl">
                  <span className="text-[10px] text-emerald-500 uppercase font-bold tracking-wider">{t("waterRequirement")}</span>
                  <p className="text-lg font-bold text-white mt-1">{t(farmState.waterRequirement)}</p>
                </div>
                <div className="bg-[#032317]/50 border border-emerald-900/30 p-4.5 rounded-2xl col-span-2 md:col-span-1">
                  <span className="text-[10px] text-amber-500 uppercase font-bold tracking-wider">{t("actionLabel")}</span>
                  <p className="text-xs text-amber-200 mt-1 line-clamp-2 leading-tight">{farmState.recommendedAction}</p>
                </div>
              </div>

              {/* Crop recommendation input form and output */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Form */}
                <div className="glass-panel p-6 rounded-3xl space-y-4">
                  <h3 className="font-bold text-lg text-emerald-200">{t("cropAdvisorInput")}</h3>
                  <p className="text-xs text-emerald-100/40">{t("cropAdvisorDesc")}</p>

                  <form onSubmit={handleCropRecommendation} className="space-y-4">
                    <div className="flex flex-col space-y-1.5">
                      <label className="text-xs text-emerald-400 font-semibold">{t("locationCol")}</label>
                      <input
                        type="text"
                        value={farmState.location}
                        onChange={(e) => updateFarmState({ location: e.target.value })}
                        required
                      />
                    </div>

                    <div className="flex flex-col space-y-1.5">
                      <label className="text-xs text-emerald-400 font-semibold">{t("soilType")}</label>
                      <select
                        value={farmState.soilType}
                        onChange={(e) => updateFarmState({ soilType: e.target.value })}
                      >
                        <option value="Red">{t("Red Soil")}</option>
                        <option value="Black">{t("Black Soil")}</option>
                        <option value="Sandy">{t("Sandy Soil")}</option>
                        <option value="Clayey">{t("Clayey Soil")}</option>
                        <option value="Alluvial">{t("Alluvial Soil")}</option>
                        <option value="Loamy">{t("Loamy Soil")}</option>
                      </select>
                    </div>

                    <div className="flex flex-col space-y-1.5">
                      <label className="text-xs text-emerald-400 font-semibold">{t("waterAvailability")}</label>
                      <select
                        value={farmState.waterAvailability}
                        onChange={(e) => updateFarmState({ waterAvailability: e.target.value })}
                      >
                        <option value="Low">{t("Low (Rainfed / Dry)")}</option>
                        <option value="Medium">{t("Medium (Borewell / Tube)")}</option>
                        <option value="High">{t("High (Canal / River)")}</option>
                      </select>
                    </div>

                    <div className="flex flex-col space-y-1.5">
                      <label className="text-xs text-emerald-400 font-semibold">{t("budgetLimit")}</label>
                      <select
                        value={farmState.budget}
                        onChange={(e) => updateFarmState({ budget: e.target.value })}
                      >
                        <option value="Low">{t("Low Budget")}</option>
                        <option value="Medium">{t("Medium Budget")}</option>
                        <option value="High">{t("High Budget")}</option>
                      </select>
                    </div>

                    <div className="flex flex-col space-y-1.5">
                      <label className="text-xs text-emerald-400 font-semibold">{t("farmingExperience")}</label>
                      <select
                        value={farmState.experience}
                        onChange={(e) => updateFarmState({ experience: e.target.value })}
                      >
                        <option value="Beginner">{t("Beginner Farmer")}</option>
                        <option value="Intermediate">{t("Intermediate Farmer")}</option>
                        <option value="Expert">{t("Expert Farmer")}</option>
                      </select>
                    </div>

                    <button
                      type="submit"
                      disabled={recommendationLoading}
                      className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-500 font-bold text-white rounded-2xl shadow-lg cursor-pointer transition-colors"
                    >
                      {recommendationLoading ? t("analyzingLabel") : t("findBestCrops")}
                    </button>
                  </form>
                </div>

                {/* Recommendation output details */}
                <div className="lg:col-span-2 space-y-4">
                  <div className="glass-panel p-6 rounded-3xl h-full flex flex-col justify-between">
                    <div>
                      <h3 className="font-bold text-lg text-emerald-200 mb-4 flex items-center justify-between">
                        <span>{t("recommendedCrops")}</span>
                        {recommendationResult.length > 0 && (
                          <span className="text-xs font-normal text-emerald-500">
                            {t("basedOnGemini")}
                          </span>
                        )}
                      </h3>

                      {recommendationResult.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-16 text-emerald-600 text-center">
                          <Sprout className="h-16 w-16 mb-4 animate-bounce text-emerald-800" />
                          <p className="font-semibold text-base">{t("noAnalysisYet")}</p>
                          <p className="text-xs text-emerald-700 max-w-[280px] mt-1">
                            {t("submitAdvisorForm")}
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {recommendationResult.map((crop, idx) => (
                            <div
                              key={idx}
                              className="p-5 rounded-2xl bg-[#032317]/50 border border-emerald-950 flex flex-col sm:flex-row justify-between items-start gap-4 hover:border-emerald-800/40 transition-colors"
                            >
                              <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                  <h4 className="font-bold text-base text-white">{crop.crop_name}</h4>
                                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                    {t("yieldLabel")}
                                  </span>
                                </div>
                                <p className="text-xs text-emerald-200/80 leading-relaxed italic">
                                  "{crop.why_recommended}"
                                </p>
                              </div>

                              <div className="w-full sm:w-auto flex sm:flex-col justify-between items-end gap-1 border-t border-emerald-950 sm:border-none pt-2 sm:pt-0 shrink-0">
                                <span className="text-xs text-emerald-500 uppercase font-bold">{t("estimatedProfit")}</span>
                                <span className="text-base font-extrabold text-amber-400">{crop.expected_profit}</span>
                                <span className="text-[10px] text-emerald-100/50 mt-1">
                                  {t("difficulty")}: {crop.growing_difficulty}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="text-[10px] text-emerald-600/70 border-t border-emerald-950 pt-4 mt-6">
                      {t("yieldDisclaimer")}
                    </div>
                  </div>
                </div>

              </div>

            </div>
          )}

          {/* TAB 3: DISEASE SCANNER */}
          {activePage === "Disease Scanner" && (
            <div className="max-w-4xl mx-auto space-y-6">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Upload card */}
                <div className="glass-panel p-6 rounded-3xl space-y-5 flex flex-col justify-between">
                  <div className="space-y-2">
                    <h3 className="font-bold text-lg text-emerald-200">{t("leafScanner")}</h3>
                    <p className="text-xs text-emerald-100/40">
                      {t("leafScannerDesc")}
                    </p>
                  </div>

                  {/* Image Preview Container */}
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className={`h-64 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center p-4 cursor-pointer transition-all ${
                      imagePreview
                        ? "border-emerald-600 bg-black/30"
                        : "border-emerald-900/60 bg-[#02130c]/40 hover:bg-[#031d12]/50 hover:border-emerald-700"
                    }`}
                  >
                    {imagePreview ? (
                      <div className="relative w-full h-full">
                        <img
                          src={imagePreview}
                          alt="Crop leaf preview"
                          className="w-full h-full object-contain rounded-xl"
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center rounded-xl">
                          <p className="text-xs font-bold text-white bg-emerald-600 px-3 py-1.5 rounded-lg">{t("changeImage")}</p>
                        </div>
                      </div>
                    ) : (
                      <>
                        <Upload className="h-10 w-10 text-emerald-500 mb-2.5 animate-pulse" />
                        <p className="text-sm font-bold text-emerald-200">{t("clickToUpload")}</p>
                        <p className="text-[10px] text-emerald-600/70 mt-1">{t("uploadFormat")}</p>
                      </>
                    )}
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={() => {
                        setSelectedImage(null);
                        setImagePreview(null);
                        setScanResult(null);
                      }}
                      disabled={!selectedImage || scanLoading}
                      className="flex-1 py-3 border border-emerald-800/40 hover:bg-emerald-950/40 rounded-xl font-medium text-xs text-emerald-400 cursor-pointer disabled:opacity-40 transition-colors"
                    >
                      {t("clear")}
                    </button>
                    <button
                      onClick={handleDiseaseScan}
                      disabled={!selectedImage || scanLoading}
                      className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 disabled:hover:bg-emerald-600 rounded-xl font-bold text-xs text-white shadow-lg cursor-pointer transition-colors"
                    >
                      {scanLoading ? t("analyzingLeaf") : t("scanDisease")}
                    </button>
                  </div>
                </div>

                {/* Results Card */}
                <div className="glass-panel p-6 rounded-3xl">
                  <h3 className="font-bold text-lg text-emerald-200 mb-4 border-b border-emerald-950 pb-2">
                    {t("analysisReport")}
                  </h3>

                  {scanLoading ? (
                    <div className="flex flex-col items-center justify-center py-20 text-emerald-400">
                      <div className="h-12 w-12 rounded-full border-4 border-emerald-500/20 border-t-emerald-500 animate-spin mb-4" />
                      <p className="font-bold text-sm">{t("queryingGemini")}</p>
                      <p className="text-[10px] text-emerald-600 mt-1">{t("secondsWarning")}</p>
                    </div>
                  ) : scanResult ? (
                    <div className="space-y-4">
                      
                      {/* Name & Confidence */}
                      <div className="flex items-start justify-between bg-[#04281a]/50 p-4.5 border border-emerald-950/80 rounded-2xl">
                        <div>
                          <span className="text-[10px] text-emerald-500 uppercase font-bold">{t("identifiedConditionLabel")}</span>
                          <h4 className="text-lg font-bold text-white mt-1">{scanResult.disease_name}</h4>
                        </div>
                        <div className="text-right shrink-0">
                          <span className="text-[10px] text-emerald-500 uppercase font-bold">{t("confidence")}</span>
                          <p className="text-base font-extrabold text-emerald-400 mt-1">{scanResult.confidence}</p>
                        </div>
                      </div>

                      {/* Severity indicator */}
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-emerald-400/80 font-medium">{t("severityLevelLabel")}</span>
                        <span
                          className={`text-xs font-bold px-3 py-1 rounded-full border ${
                            scanResult.severity?.toLowerCase() === "high"
                              ? "bg-red-500/10 text-red-400 border-red-500/20"
                              : scanResult.severity?.toLowerCase() === "medium"
                              ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
                              : "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                          }`}
                        >
                          {scanResult.severity}
                        </span>
                      </div>

                      {/* Details */}
                      <div className="space-y-3.5 pt-2">
                        <div>
                          <h5 className="text-xs text-emerald-400 font-bold uppercase tracking-wider mb-1">
                            {t("treatment")}
                          </h5>
                          <p className="text-sm text-emerald-200/90 leading-relaxed whitespace-pre-line bg-[#02130c]/30 p-3.5 rounded-xl border border-emerald-950/40">
                            {scanResult.treatment}
                          </p>
                        </div>

                        <div>
                          <h5 className="text-xs text-emerald-400 font-bold uppercase tracking-wider mb-1">
                            {t("preventiveMeasures")}
                          </h5>
                          <p className="text-sm text-emerald-200/90 leading-relaxed bg-[#02130c]/30 p-3.5 rounded-xl border border-emerald-950/40">
                            {scanResult.preventive_measures}
                          </p>
                        </div>
                      </div>

                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-20 text-emerald-600/70 text-center">
                      <Camera className="h-14 w-14 mb-4 text-emerald-800" />
                      <p className="font-semibold text-sm">{t("noReportsYet")}</p>
                      <p className="text-xs text-emerald-700 max-w-[240px] mt-1">
                        {t("uploadPrompt")}
                      </p>
                    </div>
                  )}
                </div>

              </div>

            </div>
          )}

          {/* TAB 4: WEATHER ALERTS */}
          {activePage === "Weather Alerts" && (
            <div className="space-y-6">
              
              {/* Weather service loader */}
              {weatherLoading ? (
                <div className="flex flex-col items-center justify-center py-32 text-emerald-400">
                  <div className="h-10 w-10 rounded-full border-4 border-emerald-500/20 border-t-emerald-400 animate-spin mb-4" />
                  <p className="font-semibold text-sm">{t("fetchingForecast")}</p>
                </div>
              ) : weatherData ? (
                <div className="space-y-6">
                  
                  {/* Current weather glass board */}
                  <div className="glass-panel p-6 rounded-3xl bg-gradient-to-r from-[#032317] to-[#01140e] flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <MapPin className="h-5 w-5 text-emerald-400" />
                        <h3 className="font-bold text-xl text-white">{weatherData.location_name}</h3>
                      </div>
                      <p className="text-sm text-emerald-300 max-w-xl font-medium">
                        Alert: {weatherData.recommended_action}
                      </p>
                    </div>

                    <div className="flex items-center gap-6 shrink-0 border-t border-emerald-950 md:border-none pt-4 md:pt-0 w-full md:w-auto">
                      <div>
                        <span className="text-[10px] text-emerald-500 uppercase font-bold">Temperature</span>
                        <p className="text-3xl font-extrabold text-white">{weatherData.temperature}</p>
                      </div>
                      <div className="h-8 w-px bg-emerald-950" />
                      <div>
                        <span className="text-[10px] text-emerald-500 uppercase font-bold">Humidity</span>
                        <p className="text-xl font-bold text-emerald-100">{weatherData.humidity}</p>
                      </div>
                      <div className="h-8 w-px bg-emerald-950" />
                      <div>
                        <span className="text-[10px] text-emerald-500 uppercase font-bold">Wind</span>
                        <p className="text-xl font-bold text-emerald-100">{weatherData.wind_speed}</p>
                      </div>
                    </div>
                  </div>

                  {/* 7-Day Forecast Grid */}
                  <div>
                    <h4 className="font-bold text-lg text-emerald-200 mb-4">{t("weeklyForecastTitle")}</h4>
                    <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-4">
                      {weatherData.forecast?.map((day: any, idx: number) => (
                        <div key={idx} className="glass-panel p-4.5 rounded-2xl flex flex-col justify-between text-center min-h-[140px] hover:border-emerald-700 transition-colors">
                          <span className="text-xs text-emerald-400 font-bold block mb-2">{day.date}</span>
                          
                          <div className="my-2">
                            <span className="text-lg font-bold text-white block">{day.temp_max}°</span>
                            <span className="text-[10px] text-emerald-500 block">{day.temp_min}° Min</span>
                          </div>

                          <div className="mt-2 text-[10px] text-blue-300 font-bold flex items-center justify-center gap-1">
                            <Droplets className="h-3 w-3" /> {day.rain_probability}%
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                </div>
              ) : (
                <div className="text-center py-20 text-emerald-600">
                  <p>{t("failedWeather")}</p>
                </div>
              )}

            </div>
          )}

          {/* TAB 5: MARKET PRICES */}
          {activePage === "Market Prices" && (
            <div className="space-y-6">
              
              <div className="glass-panel rounded-3xl overflow-hidden">
                <div className="p-6 border-b border-emerald-950 flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-lg text-emerald-200">{t("marketPanelTitle")}</h3>
                    <p className="text-xs text-emerald-100/40">{t("marketPanelDesc")}</p>
                  </div>
                  <TrendingUp className="h-5 w-5 text-emerald-400" />
                </div>

                {marketLoading ? (
                  <div className="flex flex-col items-center justify-center py-32 text-emerald-400">
                    <div className="h-8 w-8 rounded-full border-4 border-emerald-500/20 border-t-emerald-500 animate-spin mb-4" />
                    <p className="font-semibold text-xs">{t("queryingPrices")}</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-emerald-950 bg-emerald-950/10 text-xs text-emerald-400 font-bold uppercase tracking-wider">
                          <th className="p-5">{t("cropCol")}</th>
                          <th className="p-5">{t("marketCol")}</th>
                          <th className="p-5">{t("priceCol")}</th>
                          <th className="p-5">{t("trendCol")}</th>
                          <th className="p-5">{t("predictionCol")}</th>
                          <th className="p-5">{t("bestOutletCol")}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-emerald-950/40 text-sm">
                        {marketPrices.map((item, idx) => (
                          <tr key={idx} className="hover:bg-[#032015]/40 transition-colors">
                            <td className="p-5 font-bold text-white">{item.crop}</td>
                            <td className="p-5 text-emerald-100/80">{item.market}</td>
                            <td className="p-5 font-bold text-white">{item.current_price}</td>
                            <td className="p-5">
                              <span
                                className={`inline-flex items-center gap-1 text-xs font-bold px-3 py-1 rounded-full border ${
                                  item.trend?.toLowerCase() === "increasing"
                                    ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                                    : item.trend?.toLowerCase() === "decreasing"
                                    ? "bg-red-500/10 text-red-400 border-red-500/20"
                                    : "bg-gray-500/10 text-gray-400 border-gray-500/20"
                                }`}
                              >
                                {item.trend?.toLowerCase() === "increasing" && <ArrowUpRight className="h-3.5 w-3.5" />}
                                {item.trend?.toLowerCase() === "decreasing" && <ArrowDownRight className="h-3.5 w-3.5" />}
                                {item.trend}
                              </span>
                            </td>
                            <td className="p-5 text-xs text-emerald-200/90 leading-normal max-w-xs">
                              {item.prediction}
                            </td>
                            <td className="p-5 font-medium text-amber-400">{item.best_selling_market}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

            </div>
          )}

          {/* TAB 6: ASK AGRIPILOT */}
          {activePage === "Ask AgriPilot" && (
            <div className="max-w-4xl mx-auto space-y-6">
              
              <div className="glass-panel p-6 rounded-3xl space-y-4">
                <div className="flex items-center gap-3 border-b border-emerald-950 pb-4">
                  <div className="h-10 w-10 rounded-xl bg-emerald-600 flex items-center justify-center">
                    <Brain className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg text-emerald-200">{t("consultTitle")}</h3>
                    <p className="text-xs text-emerald-100/40">{t("consultDesc")}</p>
                  </div>
                </div>

                <div className="p-4 bg-emerald-950/20 border border-emerald-900/40 rounded-2xl text-sm leading-relaxed text-emerald-200">
                  <p className="font-bold mb-1 text-emerald-100">{t("tipsTitle")}</p>
                  <ul className="list-disc pl-5 space-y-1 text-xs">
                    <li>{t("tip1")}</li>
                    <li>{t("tip2")}</li>
                  </ul>
                </div>

                <div className="flex justify-center py-8">
                  <button
                    onClick={() => {
                      // Click assistant trigger
                      const button = document.querySelector(".fixed.bottom-6.right-6") as HTMLButtonElement;
                      if (button) button.click();
                    }}
                    className="flex items-center gap-3 px-8 py-5.5 rounded-full bg-emerald-600 hover:bg-emerald-500 font-bold text-white shadow-xl shadow-emerald-950/80 cursor-pointer animate-pulse transition-all"
                  >
                    <Mic className="h-6.5 w-6.5" />
                    <span>{t("startVoiceButton")}</span>
                  </button>
                </div>
              </div>

            </div>
          )}

          {/* TAB 7: GOVERNMENT BENEFITS */}
          {activePage === "Government Benefits" && (
            <div className="space-y-6">
              
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-lg text-emerald-200">{t("govSchemesTitle")}</h3>
                  <p className="text-xs text-emerald-100/40">{t("govSchemesDesc")}</p>
                </div>
              </div>

              {schemesLoading ? (
                <div className="flex flex-col items-center justify-center py-32 text-emerald-400">
                  <div className="h-8 w-8 rounded-full border-4 border-emerald-500/20 border-t-emerald-500 animate-spin mb-4" />
                  <p className="font-semibold text-xs">{t("fetchingSchemes")}</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {schemes.map((scheme, idx) => (
                    <div key={idx} className="glass-panel p-6 rounded-3xl space-y-4 flex flex-col justify-between hover:border-emerald-800 transition-colors">
                      <div className="space-y-3">
                        <div className="flex items-start justify-between gap-4">
                          <h4 className="font-bold text-base text-white">{scheme.scheme_name}</h4>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shrink-0">
                            {t("centralGov")}
                          </span>
                        </div>

                        <div className="space-y-2 text-xs md:text-sm">
                          <p className="text-emerald-100/60 leading-normal">
                            <strong className="text-emerald-400">{t("eligibility")}:</strong> {scheme.eligibility}
                          </p>
                          <p className="text-emerald-100/60 leading-normal">
                            <strong className="text-emerald-400">{t("benefits")}:</strong> {scheme.benefits}
                          </p>
                          <p className="text-emerald-100/60 font-medium">
                            <strong className="text-emerald-500">{t("deadline")}:</strong> {scheme.deadline}
                          </p>
                        </div>
                      </div>

                      {/* AI Explain and Apply links */}
                      <div className="border-t border-emerald-950/60 pt-4 flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3">
                        <button
                          onClick={() => handleExplainScheme(scheme.scheme_name)}
                          className="px-4 py-2 border border-emerald-800/40 rounded-xl text-xs font-semibold text-emerald-400 hover:text-white hover:bg-emerald-950/40 transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                        >
                          <Brain className="h-3.5 w-3.5" /> {t("explainAI")}
                        </button>

                        <a
                          href={scheme.application_link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 rounded-xl text-xs font-bold text-white shadow-md text-center transition-colors flex items-center justify-center gap-1.5"
                        >
                          {t("applyNow")} <ExternalLink className="h-3.5 w-3.5" />
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Explaining overlay dialogue */}
              {schemeExplaining && (
                <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
                  <div className="bg-[#032015] border border-emerald-800/40 p-6 rounded-3xl w-full max-w-lg shadow-2xl space-y-4">
                    <div className="flex items-center justify-between border-b border-emerald-950 pb-2">
                      <h4 className="font-bold text-emerald-200">{t("schemeExplTitle")}</h4>
                      <button
                        onClick={() => {
                          setSchemeExplaining(null);
                          if (typeof window !== "undefined") window.speechSynthesis.cancel();
                        }}
                        className="text-emerald-500 hover:text-emerald-200"
                      >
                        ✕
                      </button>
                    </div>

                    <p className="text-sm font-semibold text-emerald-400">{schemeExplaining}</p>

                    <div className="bg-[#02130c]/50 p-4.5 rounded-2xl border border-emerald-950/80 min-h-[100px] flex items-center justify-center">
                      {!schemeExplanation ? (
                        <div className="flex items-center gap-2 text-xs text-emerald-500">
                          <span className="h-2 w-2 bg-emerald-500 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                          <span className="h-2 w-2 bg-emerald-500 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                          <span className="h-2 w-2 bg-emerald-500 rounded-full animate-bounce"></span>
                          {t("generatingAudio")}
                        </div>
                      ) : (
                        <div className="space-y-3 w-full">
                          <p className="text-sm text-emerald-100 leading-relaxed font-medium">
                            {schemeExplanation}
                          </p>
                          <div className="flex items-center gap-2 text-[10px] text-emerald-500">
                            <Play className="h-3 w-3 text-emerald-400 fill-emerald-400" /> {t("playingAudio")} {language}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

            </div>
          )}

          {/* TAB 8: SETTINGS */}
          {activePage === "Settings" && (
            <div className="max-w-xl mx-auto space-y-6">
              
              <div className="glass-panel p-6 rounded-3xl space-y-5">
                <h3 className="font-bold text-lg text-emerald-200 border-b border-emerald-950 pb-2">{t("profileSettingsTitle")}</h3>

                <div className="space-y-4">
                  <div className="flex flex-col space-y-1.5">
                    <label className="text-xs text-emerald-400 font-semibold">{t("locationLabel")}</label>
                    <input
                      type="text"
                      value={farmState.location}
                      onChange={(e) => updateFarmState({ location: e.target.value })}
                      placeholder={t("locationPlaceholder")}
                    />
                    <p className="text-[10px] text-emerald-600">{t("locationWarning")}</p>
                  </div>

                  <div className="flex flex-col space-y-1.5">
                    <label className="text-xs text-emerald-400 font-semibold">{t("cropLabel")}</label>
                    <input
                      type="text"
                      value={farmState.activeCrop}
                      onChange={(e) => updateFarmState({ activeCrop: e.target.value })}
                      placeholder={t("cropPlaceholder")}
                    />
                  </div>

                  <div className="flex flex-col space-y-1.5">
                    <label className="text-xs text-emerald-400 font-semibold">{t("profitLabel")}</label>
                    <input
                      type="text"
                      value={farmState.expectedProfit}
                      onChange={(e) => updateFarmState({ expectedProfit: e.target.value })}
                      placeholder={t("profitPlaceholder")}
                    />
                  </div>

                  <div className="flex flex-col space-y-1.5">
                    <label className="text-xs text-emerald-400 font-semibold">{t("soilLabel")}</label>
                    <select
                      value={farmState.soilType}
                      onChange={(e) => updateFarmState({ soilType: e.target.value })}
                    >
                      <option value="Red">{t("Red Soil")}</option>
                      <option value="Black">{t("Black Soil")}</option>
                      <option value="Sandy">{t("Sandy Soil")}</option>
                      <option value="Clayey">{t("Clayey Soil")}</option>
                      <option value="Alluvial">{t("Alluvial Soil")}</option>
                      <option value="Loamy">{t("Loamy Soil")}</option>
                    </select>
                  </div>

                  <div className="flex flex-col space-y-1.5">
                    <label className="text-xs text-emerald-400 font-semibold">{t("healthLabel")}</label>
                    <select
                      value={farmState.cropHealth}
                      onChange={(e) => updateFarmState({ cropHealth: e.target.value })}
                    >
                      <option value="Excellent">{t("Excellent")}</option>
                      <option value="Good">{t("Good")}</option>
                      <option value="Moderate">{t("Moderate")}</option>
                      <option value="Needs Attention">{t("Needs Attention")}</option>
                    </select>
                  </div>

                  <button
                    onClick={() => {
                      fetchWeather();
                      fetchMarketPrices();
                      setActivePage("Home");
                    }}
                    className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-500 font-bold text-white rounded-2xl shadow-lg cursor-pointer transition-colors"
                  >
                    {t("saveButton")}
                  </button>
                </div>
              </div>

            </div>
          )}

        </div>

      </main>

      {/* Floating Multilingual AI Voice Co-Pilot Microphone */}
      <VoiceAssistant />
    </div>
  );
}
