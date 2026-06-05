"use client";

import React, { useState, useEffect, useRef } from "react";
import { useApp, ActivePage } from "@/context/AppContext";
import { Mic, MicOff, Send, X, Volume2, VolumeX, Sparkles, HelpCircle } from "lucide-react";
import { API_BASE_URL } from "@/config";

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

const navigationCommands: Record<string, Record<ActivePage, string[]>> = {
  English: {
    "Home": ["home", "dashboard", "go home", "open home", "open dashboard"],
    "My Farm": ["my farm", "crop planner", "crop advisor", "crop recommendations", "analyze soil", "open my farm", "crop prediction", "yield prediction"],
    "Disease Scanner": ["disease scanner", "disease detection", "scan crop", "scan leaf", "open disease detection", "open disease scanner", "check disease"],
    "Weather Alerts": ["weather alerts", "weather", "show weather", "forecast", "open weather", "weather forecast"],
    "Market Prices": ["market prices", "market intelligence", "crop prices", "market", "open market prices", "open market intelligence", "market rate"],
    "Ask AgriPilot": ["ask agripilot", "consult agripilot", "chat", "agripilot", "open ask agripilot", "open chat"],
    "Government Benefits": ["government benefits", "government schemes", "schemes", "benefits", "open government benefits", "government support"],
    "Settings": ["settings", "profile settings", "open settings"]
  },
  Telugu: {
    "Home": ["హోమ్", "డ్యాష్‌బోర్డ్", "హోమ్‌కు వెళ్ళు", "డ్యాష్‌బోర్డ్ తెరువు"],
    "My Farm": ["నా పొలం", "పంట ప్రణాళిక", "పంట సలహాదారు", "నేల విశ్లేషణ", "పొలానికి వెళ్ళు", "దిగుబడి అంచనా"],
    "Disease Scanner": ["వ్యాధి స్కానర్", "తెగుళ్ల గుర్తింపు", "ఆకు స్కానర్", "పంట స్కానర్", "వ్యాధి గుర్తింపు తెరువు", "తెగులు స్కాన్"],
    "Weather Alerts": ["వాతావరణ హెచ్చరికలు", "వాతావరణం", "వాతావరణం చూపించు", "మున్సూచనే", "వాతావరణం తెరువు", "వాతావరణ సూచన"],
    "Market Prices": ["మార్కెట్ ధరలు", "మార్కెట్ సమాచారం", "పంట ధరలు", "మార్కెట్", "మార్కెట్ ధరలు తెరువు"],
    "Ask AgriPilot": ["అగ్రిపైలట్ సహాయం", "అగ్రిపైలట్‌ను అడుగు", "చాట్", "అగ్రిపైలట్", "అగ్రిపైలట్ సహాయం తెరువు"],
    "Government Benefits": ["ప్రభుత్వ పథకాలు", "ప్రభుత్వ ప్రయోజనాలు", "పథకాలు", "ప్రయోజనాలు", "ప్రభుత్వ పథకాలు తెరువు"],
    "Settings": ["సెట్టింగులు", "ప్రొఫైల్ సెట్టింగులు", "సెట్టింగులు తెరువు"]
  },
  Hindi: {
    "Home": ["होम", "डैशबोर्ड", "होम पर जाएं", "डैशबोर्ड खोलें"],
    "My Farm": ["मेरा खेत", "फसल योजनाकार", "फसल सलाहकार", "मिट्टी का विश्लेषण", "खेत पर जाएं", "फसल पूर्वानुमान", "फसल भविष्यवाणी"],
    "Disease Scanner": ["रोग स्कैनर", "बीमारी का पता लगाना", "पत्ता स्कैनर", "फसल स्कैनर", "बीमारी स्कैनर खोलें", "रोग जांच"],
    "Weather Alerts": ["मौसम चेतावनी", "मौसम", "मौसम दिखाएं", "पूर्वानुमान", "मौसम खोलें", "मौसम पूर्वानुमान"],
    "Market Prices": ["बाज़ार भाव", "बाज़ार मूल्य", "बाज़ार खुफिया", "फसल की कीमतें", "बाज़ार भाव खोलें"],
    "Ask AgriPilot": ["एग्रीपायलट से पूछें", "एग्रीपायलट से परामर्श", "चैट", "एग्रीपायलट", "एग्रीपायलट खोलें"],
    "Government Benefits": ["सरकारी योजनाएं", "सरकारी लाभ", "योजनाएं", "लाभ", "सरकारी योजनाएं खोलें"],
    "Settings": ["सेटिंग्स", "प्रोफ़ाइल सेटिंग्स", "सेटिंग्स खोलें"]
  },
  Tamil: {
    "Home": ["ஹோம்", "டேஷ்போர்டு", "ஹோமிற்கு செல்", "டேஷ்போர்டு திற"],
    "My Farm": ["எனது பண்ணை", "பயிர் திட்டமிடுபவர்", "பயிர் ஆலோசகர்", "மண் பகுப்பாய்வு", "பண்ணைக்கு செல்", "விளைச்சல் கணிப்பு"],
    "Disease Scanner": ["நோய் ஸ்கேனர்", "நோய் கண்டறிதல்", "இலை ஸ்கேனர்", "பயிர் ஸ்கேனர்", "நோய் கண்டறிதல் திற", "நோய் ஸ்கேன்"],
    "Weather Alerts": ["வானிலை எச்சரிக்கைகள்", "வானிலை", "வானிலை காட்டு", "முன்னறிவிப்பு", "வானிலை திற", "வானிலை முன்னறிவிப்பு"],
    "Market Prices": ["சந்தை விலைகள்", "சந்தை தகவல்", "பயிர் விலைகள்", "சந்தை", "சந்தை விலைகள் திற"],
    "Ask AgriPilot": ["அக்ரிபைலட்டிடம் கேளுங்கள்", "அக்ரிபைலட் ஆலோசனை", "அட்டை", "அக்ரிபைலட்", "அக்ரிபைலட் திற"],
    "Government Benefits": ["அரசு நன்மைகள்", "அரசு திட்டங்கள்", "திட்டங்கள்", "நன்மைகள்", "அரசு நன்மைகள் திற"],
    "Settings": ["அமைப்புகள்", "சுயவிவர அமைப்புகள்", "அமைப்புகள் திற"]
  },
  Kannada: {
    "Home": ["ಮನೆ", "ಡ್ಯಾಶ್‌ಬೋರ್ಡ್", "ಮನೆಗೆ ಹೋಗು", "ಡ್ಯಾಶ್‌ಬೋರ್ಡ್ ತೆರೆ"],
    "My Farm": ["ನನ್ನ ತೋಟ", "ಬೆಳೆ ಯೋಜಕ", "ಬೆಳೆ ಸಲಹೆಗಾರ", "ಮಣ್ಣಿನ ವಿಶ್ಲೇಷಣೆ", "ತೋಟಕ್ಕೆ ಹೋಗು", "ಇಳುವರಿ ಮುನ್ಸೂಚನೆ"],
    "Disease Scanner": ["ರೋಗ ಸ್ಕ್ಯಾನರ್", "ರೋಗ ಪತ್ತೆ", "ಎಲೆ ಸ್ಕ್ಯಾನರ್", "ಬೆಳೆ ಸ್ಕ್ಯಾನರ್", "ರೋಗ ಪತ್ತೆ ತೆರೆ", "ರೋಗ ಸ್ಕ್ಯಾನ್"],
    "Weather Alerts": ["ಹವಾಮಾನ ಎಚ್ಚರಿಕೆಗಳು", "ಹವಾಮಾನ", "ಹವಾಮಾನ ತೋರಿಸು", "ಮುನ್ಸೂಚನೆ", "ಹವಾಮಾನ ತೆರೆ", "ಹವಾಮಾನ ಮುನ್ಸೂಚನೆ"],
    "Market Prices": ["ಮಾರುಕಟ್ಟೆ ಬೆಲೆಗಳು", "ಮಾರುಕಟ್ಟೆ ಮಾಹಿತಿ", "ಬೆಳೆ ಬೆಲೆಗಳು", "ಮಾರುಕಟ್ಟೆ", "ಮಾರುಕಟ್ಟೆ ಬೆಲೆಗಳು ತೆರೆ"],
    "Ask AgriPilot": ["ಅಗ್ರಿಪೈಲಟ್ ಹತ್ತಿರ ಕೇಳಿ", "ಅಗ್ರಿಪೈಲಟ್ ಸಂಪರ್ಕಿಸು", "ಚಾಟ್", "ಅಗ್ರಿಪೈಲಟ್", "ಅಗ್ರಿಪೈಲಟ್ ತೆರೆ"],
    "Government Benefits": ["ಸರ್ಕಾರಿ ಸೌಲಭ್ಯಗಳು", "ಸರ್ಕಾರಿ ಯೋಜನೆಗಳು", "ಯೋಜನೆಗಳು", "ಸೌಲಭ್ಯಗಳು", "ಸರ್ಕಾರಿ ಸೌಲಭ್ಯಗಳು ತೆರೆ"],
    "Settings": ["ಸಂಯೋಜನೆಗಳು", "ಪ್ರೊಫೈಲ್ ಸಂಯೋಜನೆಗಳು", "ಸಂಯೋಜನೆಗಳು ತೆರೆ"]
  }
};

const confirmations: Record<string, Record<ActivePage, string>> = {
  English: {
    "Home": "Opening Home dashboard",
    "My Farm": "Opening My Farm planner",
    "Disease Scanner": "Opening Disease Scanner",
    "Weather Alerts": "Opening Weather Alerts",
    "Market Prices": "Opening Market Prices panel",
    "Ask AgriPilot": "Opening Ask AgriPilot chat",
    "Government Benefits": "Opening Government Support Schemes",
    "Settings": "Opening settings page"
  },
  Telugu: {
    "Home": "హోమ్ డ్యాష్‌బోర్డ్ తెరుస్తున్నాను",
    "My Farm": "నా పొలం ప్లానర్ తెరుస్తున్నాను",
    "Disease Scanner": "ఆకు వ్యాధి స్కానర్ తెరుస్తున్నాను",
    "Weather Alerts": "వాతావరణ హెచ్చరికలు తెరుస్తున్నాను",
    "Market Prices": "మార్కెట్ ధరల ప్యానల్ తెరుస్తున్నాను",
    "Ask AgriPilot": "అగ్రిపైలట్ చాట్ తెరుస్తున్నాను",
    "Government Benefits": "ప్రభుత్వ పథకాలు తెరుస్తున్నాను",
    "Settings": "సెట్టింగులు తెరుస్తున్నాను"
  },
  Hindi: {
    "Home": "मुख्य डैशबोर्ड खोल रहा हूँ",
    "My Farm": "मेरा खेत प्लानर खोल रहा हूँ",
    "Disease Scanner": "रोग स्कैनर खोल रहा हूँ",
    "Weather Alerts": "मौसम चेतावनी खोल रहा हूँ",
    "Market Prices": "बाज़ार भाव पैनल खोल रहा हूँ",
    "Ask AgriPilot": "एग्रीपायलट चैट खोल रहा हूँ",
    "Government Benefits": "सरकारी योजनाएं खोल रहा हूँ",
    "Settings": "सेटिंग्स पेज खोल रहा हूँ"
  },
  Tamil: {
    "Home": "முகப்புத் திரையைத் திறக்கிறேன்",
    "My Farm": "எனது பண்ணை பக்கத்தைத் திறக்கிறேன்",
    "Disease Scanner": "இலை நோய் ஸ்கேனரைத் திறக்கிறேன்",
    "Weather Alerts": "வானிலை எச்சரிக்கைகளைத் திறக்கிறேன்",
    "Market Prices": "சந்தை விலைகள் பக்கத்தைத் திறக்கிறேன்",
    "Ask AgriPilot": "அக்ரிபைலட் சாட் பக்கத்தைத் திறக்கிறேன்",
    "Government Benefits": "அரசு உதவித் திட்டங்களைத் திறக்கிறேன்",
    "Settings": "அமைப்புகள் பக்கத்தைத் திறக்கிறேன்"
  },
  Kannada: {
    "Home": "ಮುಖಪುಟವನ್ನು ತೆರೆಯುತ್ತಿದ್ದೇನೆ",
    "My Farm": "ನನ್ನ ತೋಟದ ಪುಟವನ್ನು ತೆರೆಯುತ್ತಿದ್ದೇನೆ",
    "Disease Scanner": "ಎಲೆ ರೋಗ ಸ್ಕ್ಯಾನರ್ ತೆರೆಯುತ್ತಿದ್ದೇನೆ",
    "Weather Alerts": "ಹವಾಮಾನ ಎಚ್ಚరిಕೆಗಳನ್ನು ತೆರೆಯುತ್ತಿದ್ದೇನೆ",
    "Market Prices": "ಮಾರುಕಟ್ಟೆ ಬೆಲೆಗಳ ಪುಟವನ್ನು ತೆರೆಯುತ್ತಿದ್ದೇನೆ",
    "Ask AgriPilot": "ಅಗ್ರಿಪೈಲಟ್ ಚಾಟ್ ತೆರೆಯುತ್ತಿದ್ದೇನೆ",
    "Government Benefits": "ಸರ್ಕಾರಿ ಯೋಜನೆಗಳನ್ನು ತೆರೆಯುತ್ತಿದ್ದೇನೆ",
    "Settings": "ಸಂಯೋಜನೆಗಳ ಪುಟವನ್ನು ತೆರೆಯುತ್ತಿದ್ದೇನೆ"
  }
};

const unclearTriggers: Record<string, string[]> = {
  English: ["open", "go to", "show", "navigate", "planner", "scanner", "alert", "price", "scheme", "benefit", "setting"],
  Telugu: ["వెళ్ళు", "తెరు", "తెరువు", "చూపి", "చూపించు", "ఓపెన్", "వెళ్ళాలి", "ప్రణాళిక", "ధర", "పథకం", "సహాయం"],
  Hindi: ["खोलें", "दिखाएं", "जाएं", "ओपन", "खोलना", "योजना", "भाव", "मूल्य", "चेतावनी"],
  Tamil: ["திற", "செல்", "காட்டு", "போ", "திறக்க", "திட்டம்", "விலை", "எச்சரிக்கை", "உதவி"],
  Kannada: ["ತೆರೆ", "ಹೋಗು", "ತೋರಿಸು", "ಯೋಜನೆ", "ಬೆಲೆ", "ಎಚ್ಚರಿಕೆ", "ಸೌಲಭ್ಯ", "ಸಹಾಯ"]
};

const clarificationPrompts: Record<string, string> = {
  English: "I'm not sure which section you want to open. Could you please specify?",
  Telugu: "మీరు ఏ విభాగాన్ని తెరవాలనుకుంటున్నారో నాకు స్పష్టంగా తెలియలేదు. దయచేసి మళ్ళీ చెప్పగలరా?",
  Hindi: "मुझे समझ नहीं आया कि आप कौन सा सेक्शन खोलना चाहते हैं। क्या आप कृपया स्पष्ट कर सकते हैं?",
  Tamil: "நீங்கள் எந்தப் பகுதியைத் திறக்க விரும்புகிறீர்கள் என்று எனக்குத் தெரியவில்லை. தயவுசெய்து தெளிவுபடுத்த முடியுமா?",
  Kannada: "ನೀವು ಯಾವ ವಿಭಾಗವನ್ನು ತೆರೆಯಲು ಬಯಸುತ್ತೀರಿ ಎಂದು ನನಗೆ ಖಚಿತವಿಲ್ಲ. ದಯವಿಟ್ಟು ಸ್ಪಷ್ಟಪಡಿಸಬಹುದೇ?"
};

export default function VoiceAssistant() {
  const { language, activePage, setActivePage, t } = useApp();
  const [isOpen, setIsOpen] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [inputText, setInputText] = useState("");
  const [messages, setMessages] = useState<{ role: "user" | "assistant"; text: string }[]>([
    { role: "assistant", text: "Hello! I am AgriPilot. How can I help you on the farm today?" }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const [isMicActive, setIsMicActive] = useState(false); // User preference state
  const isMicActiveRef = useRef(false);
  const isSpeakingRef = useRef(false);

  const recognitionRef = useRef<any>(null);
  const synthRef = useRef<SpeechSynthesis | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const handleSubmitRef = useRef<any>(null);

  // Sync handleSubmit callback to a ref to avoid stale closures in event listeners
  useEffect(() => {
    handleSubmitRef.current = handleSubmit;
  });

  const checkVoiceNavigation = (transcript: string): ActivePage | null => {
    const text = transcript.toLowerCase().trim();
    const currentLang = language;
    const langCommands = navigationCommands[currentLang] || navigationCommands["English"];
    
    for (const page of Object.keys(langCommands) as ActivePage[]) {
      const commands = langCommands[page];
      for (const cmd of commands) {
        if (text.includes(cmd.toLowerCase())) {
          return page;
        }
      }
    }
    return null;
  };

  const checkUnclearNavigation = (transcript: string): boolean => {
    const text = transcript.toLowerCase().trim();
    const currentLang = language;
    const triggers = unclearTriggers[currentLang] || unclearTriggers["English"];
    
    for (const trigger of triggers) {
      if (text.includes(trigger.toLowerCase())) {
        return true;
      }
    }
    return false;
  };

  useEffect(() => {
    let recog: any = null;
    if (typeof window !== "undefined") {
      synthRef.current = window.speechSynthesis;
      
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      
      if (SpeechRecognition) {
        recog = new SpeechRecognition();
        recog.continuous = true;
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
          // Auto restart continuous listening if mic toggle is ON and we are not speaking
          if (isMicActiveRef.current && !isSpeakingRef.current) {
            try {
              recog.start();
            } catch (e) {
              console.error("Failed to auto restart speech recognition:", e);
            }
          }
        };
        
        recog.onresult = (event: any) => {
          const currentResultIndex = event.resultIndex;
          const speechToText = event.results[currentResultIndex][0].transcript;
          setInputText(speechToText);
          if (handleSubmitRef.current) {
            handleSubmitRef.current(speechToText);
          }
        };
        
        recognitionRef.current = recog;

        // Auto start if user previously had the mic toggled ON
        if (isMicActiveRef.current) {
          recog.lang = voiceLocales[language] || "en-US";
          try {
            recog.start();
          } catch (e) {
            console.error("Failed to start speech recognition:", e);
          }
        }
      }
    }

    return () => {
      if (recog) {
        try {
          recog.abort();
        } catch (e) {
          // ignore
        }
      }
    };
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
    if (isMicActiveRef.current) {
      isMicActiveRef.current = false;
      setIsMicActive(false);
      recognitionRef.current?.stop();
    } else {
      if (!recognitionRef.current) {
        setErrorMsg("Voice recognition not supported in this browser. Please type below.");
        return;
      }
      
      if (synthRef.current) {
        synthRef.current.cancel();
      }
      
      isMicActiveRef.current = true;
      setIsMicActive(true);
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
    
    isSpeakingRef.current = true;
    
    // Stop listening before starting speech synthesis to prevent feedback loop
    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort();
      } catch (e) {
        console.error(e);
      }
    }
    
    synthRef.current.cancel();
    
    const cleanText = text.replace(/[🌱🌾💰☔📅⚠🏠📷☁🎤🏛⚙↑↓→*#`[\]()]/g, "").trim();
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = voiceLocales[language] || "en-US";
    
    const voices = synthRef.current.getVoices();
    const matchingVoice = voices.find(v => v.lang.startsWith(voiceLocales[language].split("-")[0]));
    if (matchingVoice) {
      utterance.voice = matchingVoice;
    }
    
    const handleSpeechEnd = () => {
      isSpeakingRef.current = false;
      if (isMicActiveRef.current && recognitionRef.current) {
        try {
          recognitionRef.current.start();
        } catch (e) {
          console.error("Failed to restart after speech:", e);
        }
      }
    };
    
    utterance.onend = handleSpeechEnd;
    utterance.onerror = handleSpeechEnd;
    
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

    // Check voice navigation match
    const navMatch = checkVoiceNavigation(query);
    if (navMatch) {
      setActivePage(navMatch);
      const confirmText = confirmations[language]?.[navMatch] || confirmations["English"][navMatch];
      setMessages((prev) => [...prev, { role: "assistant", text: confirmText }]);
      speakText(confirmText);
      setIsLoading(false);
      return;
    }

    // Check unclear navigation commands
    const isNavTrigger = checkUnclearNavigation(query);
    if (isNavTrigger) {
      const clarifyText = clarificationPrompts[language] || clarificationPrompts["English"];
      setMessages((prev) => [...prev, { role: "assistant", text: clarifyText }]);
      speakText(clarifyText);
      setIsLoading(false);
      return;
    }

    // Prepare API history format
    const historyFormat = messages.map(m => ({
      role: m.role === "user" ? "user" : "model",
      content: m.text
    }));

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);

    try {
      const response = await fetch(`${API_BASE_URL}/api/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: query,
          language: language,
          history: historyFormat.slice(-6)
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) throw new Error("Server communication failed.");

      const data = await response.json();
      const aiReply = data.response;

      setMessages((prev) => [...prev, { role: "assistant", text: aiReply }]);
      speakText(aiReply);
    } catch (e: any) {
      clearTimeout(timeoutId);
      console.error(e);
      const errReply = e.name === "AbortError" 
        ? "AgriPilot connection timed out. Please try again." 
        : t("networkError");
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
          synthRef.current?.cancel();
          // If not active, turn on mic preference when opening the assistant
          if (!isMicActiveRef.current) {
            toggleListening();
          }
        }}
        className={`fixed bottom-6 right-6 z-50 flex items-center justify-center gap-2 px-6 py-4.5 rounded-full font-bold shadow-2xl glass-panel border border-emerald-400/40 text-emerald-100 hover:text-white cursor-pointer select-none transition-all ${
          isListening ? "pulse-glow-animation border-emerald-300" : "hover:border-emerald-400 hover:-translate-y-1"
        }`}
      >
        {isListening ? (
          <Mic className="h-6.5 w-6.5 text-emerald-400 animate-pulse" />
        ) : (
          <MicOff className="h-6.5 w-6.5 text-emerald-500" />
        )}
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
                  title={isMuted ? t("unmuteTts") : t("muteTts")}
                >
                  {isMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
                </button>
                <button
                  onClick={() => {
                    setIsOpen(false);
                    // Turn off mic preference when closing assistant
                    if (isMicActiveRef.current) {
                      toggleListening();
                    }
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
                  isMicActive
                    ? "bg-red-500 text-white pulse-glow-animation"
                    : "bg-[#063824] text-emerald-400 hover:bg-emerald-900"
                }`}
                title="Dictate with voice"
              >
                {isMicActive ? <MicOff className="h-6 w-6" /> : <Mic className="h-6 w-6" />}
              </button>
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                placeholder={isListening ? t("listeningPlaceholder") : t("askPlaceholder")}
                className="flex-1 bg-[#02130c] border border-emerald-900/50 rounded-2xl px-4 py-3.5 text-emerald-100 placeholder-emerald-600 focus:outline-none"
                disabled={isMicActive && !isListening}
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
