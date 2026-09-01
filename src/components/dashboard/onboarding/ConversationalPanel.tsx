"use client";

import { useState, useRef, useEffect } from "react";
import {
  Link2,
  Mic,
  MicOff,
  Send,
  Sparkles,
  Bot,
  User,
  ArrowRight,
  Globe,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Zap,
} from "lucide-react";
import { ExtractedPropertyPayload } from "@/lib/kb-extractor";

interface Message {
  id: string;
  role: "assistant" | "user" | "system";
  content: string;
  timestamp: string;
}

interface ConversationalPanelProps {
  onIngestUrl: (url: string) => Promise<void>;
  onSendMessage: (text: string) => Promise<void>;
  isProcessing: boolean;
  activePipelineStep: string | null;
}

export function ConversationalPanel({
  onIngestUrl,
  onSendMessage,
  isProcessing,
  activePipelineStep,
}: ConversationalPanelProps) {
  const [activeMode, setActiveMode] = useState<"url" | "chat">("url");
  const [urlInput, setUrlInput] = useState("");
  const [chatInput, setChatInput] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [speechError, setSpeechError] = useState<string | null>(null);

  const [messages, setMessages] = useState<Message[]>([
    {
      id: "msg-1",
      role: "assistant",
      content:
        "Hello! I am your AI Property Onboarding Assistant. Paste an existing listing URL above, or tell me about the property you'd like to list (Rent/Sale, price, location, amenities, and concession rules).",
      timestamp: "Just now",
    },
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isProcessing]);

  // Handle Web Speech API for voice dictation
  const toggleSpeechRecognition = () => {
    if (isListening) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setIsListening(false);
      return;
    }

    setSpeechError(null);
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setSpeechError("Speech recognition is not supported in this browser. Please type your message.");
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = "en-US";

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        if (transcript) {
          setChatInput((prev) => (prev ? `${prev} ${transcript}` : transcript));
        }
      };

      recognition.onerror = (event: any) => {
        console.warn("Speech recognition error:", event.error);
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err: any) {
      setSpeechError("Microphone access denied or error occurred.");
      setIsListening(false);
    }
  };

  const handleUrlSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!urlInput.trim() || isProcessing) return;

    const url = urlInput.trim();
    setMessages((prev) => [
      ...prev,
      {
        id: `user-${Date.now()}`,
        role: "user",
        content: `Import listing from URL: ${url}`,
        timestamp: "Just now",
      },
    ]);

    await onIngestUrl(url);

    setMessages((prev) => [
      ...prev,
      {
        id: `bot-${Date.now()}`,
        role: "assistant",
        content:
          "I successfully crawled the listing, extracted the photo gallery, and synthesized the knowledge base! You can review and adjust the specs or concession rules in the live inspector on the right.",
        timestamp: "Just now",
      },
    ]);
  };

  const handleChatSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || isProcessing) return;

    const userText = chatInput.trim();
    setChatInput("");
    setMessages((prev) => [
      ...prev,
      {
        id: `user-${Date.now()}`,
        role: "user",
        content: userText,
        timestamp: "Just now",
      },
    ]);

    await onSendMessage(userText);

    setMessages((prev) => [
      ...prev,
      {
        id: `bot-${Date.now()}`,
        role: "assistant",
        content:
          "Updated the property specifications and knowledge base! Check the live card on the right.",
        timestamp: "Just now",
      },
    ]);
  };

  const handleQuickPrompt = (text: string) => {
    setChatInput(text);
  };

  const handleQuickUrlSample = (url: string) => {
    setUrlInput(url);
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-3xl border border-slate-200/90 shadow-lg shadow-slate-100 overflow-hidden text-slate-900">
      {/* Top Mode Switcher */}
      <div className="p-4 border-b border-slate-100 bg-slate-50/70 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs">
            <Bot className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-slate-900 leading-tight">
              AI Onboarding Studio
            </h3>
            <p className="text-[11px] text-slate-500">
              Voice, text, or 1-click URL scraping
            </p>
          </div>
        </div>

        {/* Dual Mode Switcher Pills */}
        <div className="flex bg-slate-200/70 p-1 rounded-xl">
          <button
            type="button"
            onClick={() => setActiveMode("url")}
            className={`px-3 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
              activeMode === "url"
                ? "bg-white text-blue-700 shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Globe className="w-3.5 h-3.5" />
            <span>URL Import</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveMode("chat")}
            className={`px-3 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
              activeMode === "chat"
                ? "bg-white text-blue-700 shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Mic className="w-3.5 h-3.5" />
            <span>Voice & Chat</span>
          </button>
        </div>
      </div>

      {/* URL Import Mode Card */}
      {activeMode === "url" && (
        <div className="p-5 border-b border-slate-100 bg-blue-50/30">
          <form onSubmit={handleUrlSubmit} className="space-y-3">
            <label className="text-xs font-bold text-slate-800 flex items-center justify-between">
              <span>Paste Listing URL (Zillow, Broker site, Portal)</span>
              <span className="text-[11px] text-blue-700 font-semibold flex items-center gap-1">
                <Zap className="w-3 h-3" />
                <span>Apify Crawler Active</span>
              </span>
            </label>

            <div className="flex gap-2">
              <div className="relative flex-1">
                <Link2 className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="url"
                  required
                  placeholder="https://www.zillow.com/homedetails/..."
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-white border border-slate-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-2xs"
                />
              </div>

              <button
                type="submit"
                disabled={isProcessing || !urlInput.trim()}
                className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs font-bold transition-all shadow-md shadow-blue-600/20 flex items-center gap-1.5 shrink-0 disabled:opacity-60 cursor-pointer"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Extracting...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Extract</span>
                  </>
                )}
              </button>
            </div>

            {/* Quick Test Samples */}
            <div className="pt-1">
              <span className="text-[11px] font-semibold text-slate-500 mr-2">
                Quick Test Samples:
              </span>
              <div className="flex flex-wrap gap-1.5 mt-1.5">
                <button
                  type="button"
                  onClick={() =>
                    handleQuickUrlSample(
                      "https://www.zillow.com/homedetails/250-Marina-Blvd-San-Francisco-CA-94123/20938472_zpid/"
                    )
                  }
                  className="px-2.5 py-1 text-[11px] font-medium bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-lg transition-colors cursor-pointer"
                >
                  🏡 Marina Luxury Loft ($3,450/mo)
                </button>
                <button
                  type="button"
                  onClick={() =>
                    handleQuickUrlSample(
                      "https://www.realtor.com/realestateandhomes-detail/1850-Sunset-Blvd-Los-Angeles-CA-90026"
                    )
                  }
                  className="px-2.5 py-1 text-[11px] font-medium bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-lg transition-colors cursor-pointer"
                >
                  🌆 Sunset Modern Condo ($895,000)
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* Chat Transcript Area */}
      <div className="flex-1 overflow-y-auto p-5 space-y-4">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex gap-3 text-xs leading-relaxed animate-in fade-in duration-200 ${
              msg.role === "user" ? "flex-row-reverse" : "flex-row"
            }`}
          >
            <div
              className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 text-xs font-bold shadow-2xs ${
                msg.role === "user"
                  ? "bg-slate-900 text-white"
                  : "bg-blue-600 text-white"
              }`}
            >
              {msg.role === "user" ? <User className="w-3.5 h-3.5" /> : <Bot className="w-3.5 h-3.5" />}
            </div>

            <div
              className={`p-3.5 rounded-2xl max-w-[82%] shadow-2xs ${
                msg.role === "user"
                  ? "bg-blue-600 text-white rounded-tr-xs"
                  : "bg-slate-50 border border-slate-200/80 text-slate-800 rounded-tl-xs"
              }`}
            >
              <p className="whitespace-pre-wrap">{msg.content}</p>
            </div>
          </div>
        ))}

        {/* Real-time Extraction Pipeline Feedback */}
        {isProcessing && activePipelineStep && (
          <div className="flex items-center gap-2.5 p-3 rounded-2xl bg-blue-50/80 border border-blue-200 text-blue-900 text-xs font-medium animate-pulse">
            <Loader2 className="w-4 h-4 animate-spin text-blue-600 shrink-0" />
            <span>{activePipelineStep}</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Quick Prompt Chips */}
      <div className="px-5 py-2 border-t border-slate-100 bg-slate-50/50 flex items-center gap-1.5 overflow-x-auto text-[11px]">
        <span className="text-slate-400 font-semibold shrink-0">Quick prompts:</span>
        <button
          type="button"
          onClick={() => handleQuickPrompt("Set listing for Rent at $3,450/month with 18-month lease option")}
          className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-slate-700 hover:text-blue-700 hover:border-blue-300 transition-colors whitespace-nowrap cursor-pointer shadow-2xs"
        >
          💰 Rent $3,450/mo
        </button>
        <button
          type="button"
          onClick={() => handleQuickPrompt("Allow 5% discount for 18mo lease and free parking for move-in under 7 days")}
          className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-slate-700 hover:text-blue-700 hover:border-blue-300 transition-colors whitespace-nowrap cursor-pointer shadow-2xs"
        >
          🎯 Concession Rules
        </button>
        <button
          type="button"
          onClick={() => handleQuickPrompt("Cats and small dogs allowed with $500 pet deposit")}
          className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-slate-700 hover:text-blue-700 hover:border-blue-300 transition-colors whitespace-nowrap cursor-pointer shadow-2xs"
        >
          🐾 Pet Policy
        </button>
      </div>

      {/* Error Alert if Speech fails */}
      {speechError && (
        <div className="mx-4 mb-2 p-2 bg-amber-50 border border-amber-200 rounded-xl text-[11px] text-amber-800 flex items-center gap-2">
          <AlertCircle className="w-3.5 h-3.5 shrink-0 text-amber-600" />
          <span>{speechError}</span>
        </div>
      )}

      {/* Bottom Chat & Voice Input Bar */}
      <div className="p-4 border-t border-slate-200 bg-white">
        <form onSubmit={handleChatSubmit} className="flex items-center gap-2">
          {/* Microphone Recording Button */}
          <button
            type="button"
            onClick={toggleSpeechRecognition}
            className={`p-2.5 rounded-xl border transition-all cursor-pointer ${
              isListening
                ? "bg-red-500 text-white border-red-600 animate-pulse shadow-md shadow-red-500/25"
                : "bg-slate-50 text-slate-600 hover:text-slate-900 border-slate-200 hover:bg-slate-100"
            }`}
            title={isListening ? "Stop listening" : "Click to speak"}
          >
            {isListening ? (
              <MicOff className="w-4 h-4 animate-bounce" />
            ) : (
              <Mic className="w-4 h-4" />
            )}
          </button>

          {/* Text Input */}
          <input
            type="text"
            placeholder={
              isListening
                ? "Listening to your voice..."
                : "Type property specs, rules, or questions..."
            }
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            disabled={isProcessing}
            className="flex-1 px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-2xs"
          />

          {/* Send Button */}
          <button
            type="submit"
            disabled={isProcessing || !chatInput.trim()}
            className="p-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold transition-all shadow-md shadow-blue-600/20 disabled:opacity-50 cursor-pointer"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
}
