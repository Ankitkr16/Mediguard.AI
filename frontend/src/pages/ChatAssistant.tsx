import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { 
  Send, 
  Mic, 
  MicOff, 
  Volume2, 
  VolumeX, 
  Sparkles, 
  Info,
  Loader2,
  AlertTriangle
} from 'lucide-react';

interface ChatMessage {
  sender: 'user' | 'assistant';
  text: string;
}

export const ChatAssistant: React.FC = () => {
  const { fetchWithAuth } = useAuth();
  const { largeText } = useTheme();

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      sender: 'assistant',
      text: "Hello! I am your MediGuard AI safety assistant. You can ask me about medication usage, side effects, precautions, or food/alcohol interactions. (Try asking: 'What is Metformin used for?' or 'Can I take alcohol with Paracetamol?')\n\n*Voice input is supported in Hindi and English. Click the microphone to speak.*"
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  
  // Voice states
  const [isListening, setIsListening] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  
  const chatEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  // Initialize Speech Recognition
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const rec = new SpeechRecognition();
      rec.continuous = false;
      rec.interimResults = false;
      rec.lang = 'en-US'; // Can dynamically set to 'hi-IN' if user wants Hindi

      rec.onstart = () => {
        setIsListening(true);
      };

      rec.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInputText(transcript);
      };

      rec.onerror = (event: any) => {
        console.error("Speech recognition error", event.error);
        setIsListening(false);
      };

      rec.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = rec;
    }
  }, []);

  const handleToggleVoiceInput = () => {
    if (!recognitionRef.current) {
      alert("Speech recognition is not supported in this browser. Try Google Chrome.");
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
    } else {
      // Prompt option to select language
      const langChoice = confirm("Press OK for English, Cancel for Hindi (हिंदी में बोलें)") ? 'en-US' : 'hi-IN';
      recognitionRef.current.lang = langChoice;
      recognitionRef.current.start();
    }
  };

  // Speak text aloud using web speech synthesis
  const speakTextAloud = (text: string) => {
    if (!voiceEnabled || !('speechSynthesis' in window)) return;
    
    // Cancel any ongoing speech
    window.speechSynthesis.cancel();
    
    // Clean markdown flags
    const cleanText = text
      .replace(/\*\*/g, '')
      .replace(/###/g, '')
      .replace(/💊/g, '')
      .replace(/🚨/g, 'Warning: ')
      .replace(/🚨/g, '');
      
    // Truncate to introductory paragraphs & disclaimer to avoid giant speech logs
    const sentences = cleanText.split('\n');
    const introSentences = sentences.filter(s => s.trim() !== '' && !s.includes("Side Effects:") && !s.includes("- *")).slice(0, 3).join(' ');
    
    const utterance = new SpeechSynthesisUtterance(introSentences || cleanText.slice(0, 300));
    utterance.rate = 1.0;
    
    // Auto-detect lang (rough check for Hindi characters)
    if (/[\u0900-\u097F]/.test(text)) {
      utterance.lang = 'hi-IN';
    } else {
      utterance.lang = 'en-US';
    }
    
    window.speechSynthesis.speak(utterance);
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    const userMsg = inputText.trim();
    setMessages(prev => [...prev, { sender: 'user', text: userMsg }]);
    setInputText('');
    setLoading(true);

    try {
      const response = await fetchWithAuth('/assistant/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMsg,
          voice_output: false // We use browser synthesis instead of server TTS to save backend CPU!
        })
      });

      if (response.ok) {
        const data = await response.json();
        setMessages(prev => [...prev, { sender: 'assistant', text: data.response }]);
        // Speak answer
        speakTextAloud(data.response);
      } else {
        setMessages(prev => [...prev, { sender: 'assistant', text: "Sorry, I encountered an error. Please try again." }]);
      }
    } catch (err) {
      console.error(err);
      setMessages(prev => [...prev, { sender: 'assistant', text: "Failed to connect to assistant service. Check server." }]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  return (
    <div className="flex flex-col h-[78vh] premium-card bg-white border border-[#f1f5f9] overflow-hidden animate-slide-up">
      {/* Disclaimer Strip */}
      <div className="p-3 bg-red-50 border-b border-red-100/50 flex items-center gap-2">
        <AlertTriangle className="text-red-500 flex-shrink-0" size={14} />
        <p className="text-[10px] text-red-700 font-bold leading-relaxed">
          MediGuard AI Chatbot provides educational medicine information. It does not prescribe medications, recommend dosages, or replace doctors.
        </p>
      </div>

      {/* Chat Messages */}
      <div className="flex-1 p-6 overflow-y-auto space-y-4 bg-[#f8f9fb]">
        {messages.map((msg, idx) => (
          <div 
            key={idx} 
            className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div className={`max-w-xl p-4 rounded-2xl leading-relaxed whitespace-pre-line text-xs font-semibold shadow-sm ${
              msg.sender === 'user'
                ? 'bg-[#ff5224] text-white rounded-tr-none'
                : 'bg-white border border-[#f1f5f9] text-slate-700 rounded-tl-none'
            }`}>
              {msg.text}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="bg-white border border-[#f1f5f9] p-4 rounded-2xl rounded-tl-none flex items-center gap-2 text-slate-500 text-xs font-semibold shadow-sm">
              <Loader2 className="animate-spin text-[#ff5224]" size={14} />
              <span>MediGuard. is thinking...</span>
            </div>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Inputs Bar - SOMA Styled */}
      <div className="p-4 bg-white border-t border-slate-100 flex items-center gap-3">
        {/* Toggle Audio Output Button */}
        <button
          onClick={() => setVoiceEnabled(!voiceEnabled)}
          title={voiceEnabled ? "Mute Voice Responses" : "Unmute Voice Responses"}
          className={`p-2.5 rounded-full border transition-all ${
            voiceEnabled 
              ? 'bg-[#ff5224]/10 text-[#ff5224] border-[#ff5224]/20' 
              : 'text-slate-400 hover:text-slate-500 border-slate-200'
          }`}
        >
          {voiceEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
        </button>

        {/* Console Prompt Container */}
        <form onSubmit={handleSendMessage} className="flex-1 flex items-center gap-2 px-3 py-1.5 bg-slate-50 border border-slate-200/60 rounded-full">
          {/* Microphone Button */}
          <button
            type="button"
            onClick={handleToggleVoiceInput}
            title="Voice Input (Hindi/English)"
            className={`p-2 rounded-full transition-all ${
              isListening 
                ? 'bg-red-500/10 text-red-500 animate-pulse' 
                : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            {isListening ? <MicOff size={16} /> : <Mic size={16} />}
          </button>

          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Ask anything about medicines..."
            className="flex-1 px-2 py-1 text-xs bg-transparent outline-none text-slate-800 placeholder-slate-400 font-semibold"
          />

          {/* Send Button */}
          <button
            type="submit"
            disabled={!inputText.trim()}
            className="p-2 bg-[#ff5224] text-white rounded-full hover:bg-[#e0451e] transition shadow-sm disabled:opacity-50"
          >
            <Send size={14} />
          </button>
        </form>
      </div>
    </div>
  );
};
