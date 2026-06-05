"use client";

import React, { useState, useEffect, useRef } from "react";
import { useApp } from "@/context/AppContext";
import { Mic, MicOff, Send, X, Volume2, VolumeX, Sparkles, HelpCircle } from "lucide-react";

const voiceLocales: Record<string, string> = {
  English: "en-US",
  Telugu: "te-IN",
  Hindi: "hi-IN",
  Tamil: "ta-IN",
  Kannada: "kn-IN",
};

const voiceExamples: Record<string, string[]> = {
  English: [
    "Which crop should I grow?",
    "Will it rain tomorrow?",
    "Check disease in my crop",
    "What is today's tomato price?",
  ],
  Telugu: [
    "నేను ఏ పంట పండించాలి?",
    "రేపు వర్షం పడుతుందా?",
    "నా పంటలో తెగుళ్లను గుర్తించండి",
    "ఈరోజు టమోటా ధర ఎంత?",
  ],
  Hindi: [
    "मुझे कौन सी फसल उगानी चाहिए?",
    "क्या कल बारिश होगी?",
    "मेरी फसल में बीमारी की जांच करें",
    "आज टमाटर का भाव क्या है?",
  ],
  Tamil: [
    "நான் என்ன பயிர் வளர்க்க வேண்டும்?",
    "நாளை மழை பெய்யுமா?",
    "என் பயிரில் நோயை சரிபார்க்கவும்",
    "இன்றைய தக்காளி விலை என்ன?",
  ],
  Kannada: [
    "ನಾನು ಯಾವ ಬೆಳೆ ಬೆಳೆಯಬೇಕು?",
    "ನಾಳೆ ಮಳೆ ಬರುತ್ತಾ?",
    "ನನ್ನ ಬೆಳೆಯಲ್ಲಿ ರೋಗವನ್ನು ಪರೀಕ್ಷಿಸಿ",
    "ಇವತ್ತಿನ ಟೊಮೆಟೊ ಬೆಲೆ ಎಷ್ಟು?",
  ],
};

export default function VoiceAssistant() {
  const { language, t } = useApp();
  const [isOpen, setIsOpen] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [inputText, setInputText] = useState("");
  const [messages, setMessages] = useState<{ role: "user" | "assistant"; text: string }[]>([
    { role: "assistant", text: "Hello! I am AgriPilot. How can I help you on the farm today?" }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const recognitionRef = useRef<any>(null);
  const synthRef = useRef<SpeechSynthesis | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      synthRef.current = window.speechSynthesis;
      
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      
      if (SpeechRecognition) {
        const recog = new SpeechRecognition();
        recog.continuous = false;
        recog.interimResults = false;
        
        recog.onstart = () => {
          setIsListening(true);
          setErrorMsg("");
        };
        
        recog.onerror = (event: any) => {
          console.error("Speech recognition error", event.error);
          setIsListening(false);
          if (event.error === "not-allowed") {
            setErrorMsg("Microphone permission denied.");
          } else {
            setErrorMsg("Speech recognition failed. Please try typing.");
          }
        };
        
        recog.onend = () => {
          setIsListening(false);
        };
        
        recog.onresult = (event: any) => {
          const speechToText = event.results[0][0].transcript;
          setInputText(speechToText);
          handleSubmit(speechToText);
        };
        
        recognitionRef.current = recog;
      }
    }
  }, [language]);

  // Scroll to bottom on new messages
  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Translate greeting when language changes
  useEffect(() => {
    const greetings: Record<string, string> = {
      English: "Hello! I am AgriPilot. How can I help you on the farm today?",
      Telugu: "నమస్కారం! నేను అగ్రిపైలట్. ఈరోజు నేను మీకు ఎలా సహాయపడగలను?",
      Hindi: "नमस्कार! मैं एग्रीपायलट हूँ। आज मैं आपकी क्या सहायता कर सकता हूँ?",
      Tamil: "வணக்கம்! நான் அக்ரிபைலட். இன்று உங்களுக்கு நான் எப்படி உதவ முடியும்?",
      Kannada: "ನಮಸ್ಕಾರ! ನಾನು ಅಗ್ರಿಪೈಲಟ್. ಇಂದು ನಾನು ನಿಮಗೆ ಹೇಗೆ ಸಹಾಯ ಮಾಡಲಿ?"
    };
    setMessages([{ role: "assistant", text: greetings[language] || greetings["English"] }]);
  }, [language]);

  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop();
    } else {
      if (!recognitionRef.current) {
        setErrorMsg("Voice recognition not supported in this browser. Please type below.");
        return;
      }
      
      recognitionRef.current.lang = voiceLocales[language] || "en-US";
      try {
        recognitionRef.current.start();
      } catch (e) {
        console.error(e);
      }
    }
  };

  const speakText = (text: string) => {
    if (isMuted || !synthRef.current) return;
    
    // Cancel any current utterance
    synthRef.current.cancel();
    
    // Strip emojis/markdown for speech
    const cleanText = text.replace(/[🌱🌾💰☔📅⚠🏠📷☁🎤🏛⚙↑↓→*#`[\]()]/g, "").trim();
    
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = voiceLocales[language] || "en-US";
    
    // Find suitable voice matching locale
    const voices = synthRef.current.getVoices();
    const matchingVoice = voices.find(v => v.lang.startsWith(voiceLocales[language].split("-")[0]));
    if (matchingVoice) {
      utterance.voice = matchingVoice;
    }
    
    synthRef.current.speak(utterance);
  };

  const handleSubmit = async (textToSend?: string) => {
    const query = textToSend || inputText;
    if (!query.trim()) return;

    // Add user message to state
    setMessages((prev) => [...prev, { role: "user", text: query }]);
    setInputText("");
    setIsLoading(true);
    setErrorMsg("");

    // Prepare API history format
    const historyFormat = messages.map(m => ({
      role: m.role === "user" ? "user" : "model",
      content: m.text
    }));

    try {
      const response = await fetch("http://localhost:8000/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: query,
          language: language,
          history: historyFormat.slice(-6) // Send last 3 rounds for context
        }),
      });

      if (!response.ok) throw new Error("Server communication failed.");

      const data = await response.json();
      const aiReply = data.response;

      setMessages((prev) => [...prev, { role: "assistant", text: aiReply }]);
      speakText(aiReply);
    } catch (e: any) {
      console.error(e);
      const errReply = t("networkError");
      setMessages((prev) => [...prev, { role: "assistant", text: errReply }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleExampleClick = (example: string) => {
    setInputText(example);
    handleSubmit(example);
  };

  return (
    <>
      {/* Floating Microphone Button */}
      <button
        onClick={() => {
          setIsOpen(true);
          // If browser speaks, quiet it down
          synthRef.current?.cancel();
        }}
        className={`fixed bottom-6 right-6 z-50 flex items-center justify-center gap-2 px-6 py-4.5 rounded-full font-bold shadow-2xl glass-panel border border-emerald-400/40 text-emerald-100 hover:text-white cursor-pointer select-none transition-all ${
          isListening ? "pulse-glow-animation border-emerald-300" : "hover:border-emerald-400 hover:-translate-y-1"
        }`}
      >
        <Mic className={`h-6.5 w-6.5 text-emerald-400 ${isListening ? "animate-pulse" : ""}`} />
        <span>{t("Talk to AgriPilot")}</span>
      </button>

      {/* Voice Assistant Panel Drawer */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-xl bg-[#032015] border border-emerald-800/40 rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[85vh] sm:max-h-[75vh]">
            
            {/* Header */}
            <div className="px-6 py-4.5 border-b border-emerald-950 flex items-center justify-between bg-[#042c1d]/60">
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-emerald-400" />
                <span className="font-bold text-lg text-emerald-200">{t("assistantTitle")}</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setIsMuted(!isMuted);
                    if (!isMuted) synthRef.current?.cancel();
                  }}
                  className="p-2 rounded-xl text-emerald-400 hover:bg-emerald-950/60 transition-colors"
                  title={isMuted ? "Unmute TTS" : "Mute TTS"}
                >
                  {isMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
                </button>
                <button
                  onClick={() => {
                    setIsOpen(false);
                    synthRef.current?.cancel();
                  }}
                  className="p-2 rounded-xl text-emerald-400 hover:bg-emerald-950/60 transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4 min-h-[250px]">
              {messages.map((msg, index) => (
                <div
                  key={index}
                  className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl px-5 py-3.5 text-base leading-relaxed ${
                      msg.role === "user"
                        ? "bg-emerald-600 text-white rounded-br-none shadow-md shadow-emerald-950/40"
                        : "bg-[#04281a] border border-emerald-900/30 text-emerald-100 rounded-bl-none"
                    }`}
                  >
                    {msg.text}
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-[#04281a] border border-emerald-900/30 text-emerald-400 rounded-2xl rounded-bl-none px-5 py-3.5 flex items-center gap-2">
                    <span className="h-2 w-2 bg-emerald-500 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                    <span className="h-2 w-2 bg-emerald-500 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                    <span className="h-2 w-2 bg-emerald-500 rounded-full animate-bounce"></span>
                  </div>
                </div>
              )}
              {errorMsg && (
                <p className="text-center text-xs text-amber-500 bg-amber-950/20 border border-amber-900/30 py-2 rounded-xl">
                  {errorMsg}
                </p>
              )}
              <div ref={scrollRef} />
            </div>

            {/* Voice Examples / Quick Prompts */}
            <div className="px-6 py-3 bg-[#021810]/40 border-t border-emerald-950/60">
              <p className="text-xs text-emerald-500 font-semibold mb-2 flex items-center gap-1">
                <HelpCircle className="h-3.5 w-3.5" /> {t("quickExamples")}:
              </p>
              <div className="flex flex-wrap gap-2 max-h-16 overflow-y-auto">
                {voiceExamples[language]?.map((example, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleExampleClick(example)}
                    className="text-xs px-3 py-1.5 rounded-full bg-emerald-950/30 border border-emerald-900/40 text-emerald-300/80 hover:text-white hover:bg-emerald-900/40 transition-colors"
                  >
                    "{example}"
                  </button>
                ))}
              </div>
            </div>

            {/* Input Controls */}
            <div className="p-4 border-t border-emerald-950 bg-[#04261a]/40 flex items-center gap-3">
              <button
                onClick={toggleListening}
                className={`p-4 rounded-full flex items-center justify-center transition-all ${
                  isListening
                    ? "bg-red-500 text-white pulse-glow-animation"
                    : "bg-[#063824] text-emerald-400 hover:bg-emerald-900"
                }`}
                title="Dictate with voice"
              >
                {isListening ? <MicOff className="h-6 w-6" /> : <Mic className="h-6 w-6" />}
              </button>
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                placeholder={isListening ? t("listeningPlaceholder") : t("askPlaceholder")}
                className="flex-1 bg-[#02130c] border border-emerald-900/50 rounded-2xl px-4 py-3.5 text-emerald-100 placeholder-emerald-600 focus:outline-none"
                disabled={isListening}
              />
              <button
                onClick={() => handleSubmit()}
                disabled={!inputText.trim() || isLoading}
                className="p-4 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 disabled:hover:bg-emerald-600 text-white rounded-full flex items-center justify-center shadow-lg transition-colors cursor-pointer"
              >
                <Send className="h-5 w-5" />
              </button>
            </div>
            
          </div>
        </div>
      )}
    </>
  );
}
