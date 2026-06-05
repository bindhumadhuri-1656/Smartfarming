import logging
from app.services.gemini_service import translate_text

logger = logging.getLogger(__name__)

# Basic dictionary fallback translations for common dashboard labels/phrases
TRANSLATION_DICTIONARY = {
    "te": {
        "Tomato": "టమోటా",
        "Rice (Paddy)": "వరి (వరి పంట)",
        "Cotton": "ప్రత్తి",
        "Groundnut": "వేరుశనగ",
        "Chilli": "మిరపకాయ",
        "Maize": "మొక్కజొన్న",
        "Wheat": "గోధుమ",
        "Heavy rain expected. Delay fertilizer application and avoid irrigation.": "భారీ వర్షం పడే అవకాశం ఉంది. ఎరువులు వేయడం ఆలస్యం చేయండి మరియు నీటి పారుదలని నివారించండి.",
        "Light rain possible. Hold off pesticide application; monitor weather.": "తేలికపాటి వర్షం పడే అవకాశం ఉంది. పురుగుమందుల ప్రయోగాన్ని నిలిపివేయండి; వాతావరణాన్ని గమనించండి.",
        "High temperatures. Provide extra irrigation in the evening.": "అధిక ఉష్ణోగ్రతలు. సాయంత్రం వేళల్లో అదనపు నీటి పారుదల అందించండి.",
        "Standard irrigation and crop monitoring.": "సాధారణ నీటి పారుదల మరియు పంట పర్యవేక్షణ."
    },
    "hi": {
        "Tomato": "टमाटर",
        "Rice (Paddy)": "धान (चावल)",
        "Cotton": "कपास",
        "Groundnut": "मूंगफली",
        "Chilli": "मिर्च",
        "Maize": "मक्का",
        "Wheat": "गेहूं",
        "Heavy rain expected. Delay fertilizer application and avoid irrigation.": "भारी बारिश की संभावना है। उर्वरक छिड़काव टालें और सिंचाई से बचें।",
        "Light rain possible. Hold off pesticide application; monitor weather.": "हल्की बारिश की संभावना। कीटनाशक छिड़काव रोकें; मौसम की निगरानी करें।",
        "High temperatures. Provide extra irrigation in the evening.": "उच्च तापमान। शाम को अतिरिक्त सिंचाई प्रदान करें।",
        "Standard irrigation and crop monitoring.": "सामान्य सिंचाई और फसल की निगरानी।"
    },
    "ta": {
        "Tomato": "தக்காளி",
        "Rice (Paddy)": "நெல் (அரிசி)",
        "Cotton": "பருத்தி",
        "Groundnut": "நிலக்கடலை",
        "Chilli": "மிளகாய்",
        "Maize": "சோளம்",
        "Wheat": "கோதுமை",
        "Heavy rain expected. Delay fertilizer application and avoid irrigation.": "பலத்த மழை எதிர்பார்க்கப்படுகிறது. உரமிடுவதைத் தள்ளிப்போடுங்கள் மற்றும் நீர் பாசனத்தைத் தவிர்க்கவும்.",
        "Light rain possible. Hold off pesticide application; monitor weather.": "லேசான மழைக்கு வாய்ப்பு. பூச்சிக்கொல்லி மருந்துகளைப் பயன்படுத்துவதைத் தவிர்க்கவும்; வானிலை கண்காணிக்கவும்.",
        "High temperatures. Provide extra irrigation in the evening.": "அதிக வெப்பநிலை. மாலையில் கூடுதல் பாசனம் வழங்கவும்.",
        "Standard irrigation and crop monitoring.": "சாதாரண பாசனம் மற்றும் பயிர் கண்காணிப்பு."
    },
    "kn": {
        "Tomato": "ಟೊಮೆಟೊ",
        "Rice (Paddy)": "ಭತ್ತ (ಅಕ್ಕಿ)",
        "Cotton": "ಹತ್ತಿ",
        "Groundnut": "ಕಡಲೆಕಾಯಿ",
        "Chilli": "ಮೆಣಸಿನಕಾಯಿ",
        "Maize": "ಮೆಕ್ಕೆಜೋಳ",
        "Wheat": "ಗೋಧಿ",
        "Heavy rain expected. Delay fertilizer application and avoid irrigation.": "ಭಾರೀ ಮಳೆಯ ನಿರೀಕ್ಷೆಯಿದೆ. ಗೊಬ್ಬರ ಹಾಕುವುದನ್ನು ಮುಂದೂಡಿ ಮತ್ತು ನೀರಾವರಿಯನ್ನು ತಪ್ಪಿಸಿ.",
        "Light rain possible. Hold off pesticide application; monitor weather.": "ಹಗುರ ಮಳೆಯ ಸಾಧ್ಯತೆಯಿದೆ. ಕೀಟನಾಶಕ ಸಿಂಪಡಣೆಯನ್ನು ತಡೆಯಿರಿ; ಹವಾಮಾನವನ್ನು ಗಮನಿಸಿ.",
        "High temperatures. Provide extra irrigation in the evening.": "ಹೆಚ್ಚಿನ ತಾಪಮಾನ. ಸಂಜೆ ಸಮಯದಲ್ಲಿ ಹೆಚ್ಚುವರಿ ನೀರಾವರಿ ಒದಗಿಸಿ.",
        "Standard irrigation and crop monitoring.": "ಸಾಮಾನ್ಯ ನೀರಾವರಿ ಮತ್ತು ಬೆಳೆ ಮೇಲ್ವಿಚಾರಣೆ."
    }
}

async def translate_message(text: str, target_lang: str) -> str:
    """Translates a message to the target language. First checks the static dictionary, then calls Gemini."""
    if not text or target_lang.lower() == "english":
        return text
        
    lang_code = "en"
    if target_lang.lower() == "telugu":
        lang_code = "te"
    elif target_lang.lower() == "hindi":
        lang_code = "hi"
    elif target_lang.lower() == "tamil":
        lang_code = "ta"
    elif target_lang.lower() == "kannada":
        lang_code = "kn"
        
    # Check static cache dictionary first for efficiency
    cached = TRANSLATION_DICTIONARY.get(lang_code, {}).get(text)
    if cached:
        return cached
        
    # Query Gemini API translation fallback
    try:
        translated = await translate_text(text, target_lang)
        return translated
    except Exception as e:
        logger.error(f"Failed translation service: {str(e)}")
        return text
