import React, { useState, useRef, useEffect } from "react";
import { MessageSquare, X, Send, Loader2, Wrench, Phone, Calendar } from "lucide-react";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface PlumbingChatProps {
  phone?: string;
  onRequestQuote?: () => void;
}

const SUGGESTED_QUESTIONS = [
  "My sink is draining slowly 🚰",
  "I have low water pressure 💧",
  "Water heater not working 🔥",
  "Pipe burst emergency! 🚨",
];

export default function PlumbingChat({ phone = "+1 (212) 555-0199", onRequestQuote }: PlumbingChatProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "Hi! I'm your plumbing expert 🔧 I can help diagnose issues, give advice, and estimate costs. What's going on with your plumbing today?",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async (text: string) => {
    if (!text.trim() || loading) return;
    setShowSuggestions(false);

    const userMessage: Message = { role: "user", content: text };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text,
          history: messages.slice(-6), // send last 6 messages for context
        }),
      });
      const data = await res.json();
      setMessages([...newMessages, { role: "assistant", content: data.reply }]);
    } catch {
      setMessages([...newMessages, {
        role: "assistant",
        content: `Sorry, I'm having trouble connecting. Please call us directly at ${phone} for immediate help.`,
      }]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  const isQuotePrompt = (text: string) =>
    text.toLowerCase().includes("quote") || text.toLowerCase().includes("request") || text.toLowerCase().includes("schedule");

  return (
    <>
      {/* Chat bubble button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-3.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-full shadow-xl transition-all duration-200 cursor-pointer group hover:-translate-y-1 relative"
        title="Chat with Plumbing Expert"
      >
        {isOpen ? <X className="w-5 h-5" /> : <MessageSquare className="w-5 h-5" />}
        {!isOpen && (
          <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-ping" />
        )}
        <span className="absolute right-14 bg-slate-800 text-white text-[10px] font-bold px-2.5 py-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap shadow-sm border border-slate-700">
          Chat with Expert
        </span>
      </button>

      {/* Chat window */}
      {isOpen && (
        <div className="fixed bottom-36 right-4 w-[350px] sm:w-[380px] bg-white rounded-2xl shadow-2xl border border-slate-200 z-50 flex flex-col overflow-hidden"
          style={{ maxHeight: "520px" }}>
          
          {/* Header */}
          <div className="bg-gradient-to-r from-slate-900 to-blue-950 px-4 py-3 flex items-center gap-3">
            <div className="w-9 h-9 bg-emerald-500 rounded-full flex items-center justify-center shrink-0">
              <Wrench className="w-4 h-4 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white font-bold text-sm leading-tight">Plumbing Expert</p>
              <p className="text-emerald-400 text-[11px] flex items-center gap-1">
                <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full inline-block" />
                Online now · AI-powered
              </p>
            </div>
            <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-white transition cursor-pointer">
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-3 space-y-3 bg-slate-50" style={{ minHeight: "280px", maxHeight: "340px" }}>
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                {msg.role === "assistant" && (
                  <div className="w-6 h-6 bg-emerald-100 rounded-full flex items-center justify-center shrink-0 mr-2 mt-0.5">
                    <Wrench className="w-3 h-3 text-emerald-600" />
                  </div>
                )}
                <div className={`max-w-[78%] px-3 py-2 rounded-2xl text-sm leading-relaxed ${
                  msg.role === "user"
                    ? "bg-blue-600 text-white rounded-br-sm"
                    : "bg-white text-slate-800 border border-slate-100 shadow-sm rounded-bl-sm"
                }`}>
                  {msg.content}
                  {msg.role === "assistant" && isQuotePrompt(msg.content) && onRequestQuote && (
                    <button
                      onClick={() => { onRequestQuote(); setIsOpen(false); }}
                      className="mt-2 w-full flex items-center justify-center gap-1.5 bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold py-1.5 px-3 rounded-lg transition cursor-pointer"
                    >
                      <Calendar className="w-3 h-3" /> Request Free Quote
                    </button>
                  )}
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex justify-start">
                <div className="w-6 h-6 bg-emerald-100 rounded-full flex items-center justify-center shrink-0 mr-2">
                  <Wrench className="w-3 h-3 text-emerald-600" />
                </div>
                <div className="bg-white border border-slate-100 shadow-sm px-3 py-2 rounded-2xl rounded-bl-sm">
                  <Loader2 className="w-4 h-4 text-slate-400 animate-spin" />
                </div>
              </div>
            )}

            {/* Suggested questions */}
            {showSuggestions && messages.length === 1 && (
              <div className="space-y-1.5 pt-1">
                {SUGGESTED_QUESTIONS.map((q) => (
                  <button
                    key={q}
                    onClick={() => sendMessage(q)}
                    className="w-full text-left text-xs px-3 py-2 bg-white border border-slate-200 rounded-xl hover:border-blue-300 hover:bg-blue-50 transition cursor-pointer text-slate-700"
                  >
                    {q}
                  </button>
                ))}
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Quick actions */}
          <div className="px-3 py-2 border-t border-slate-100 bg-white flex gap-2">
            <a
              href={`tel:${phone.replace(/[^\d+]/g, "")}`}
              className="flex-1 flex items-center justify-center gap-1 text-xs font-semibold text-slate-600 hover:text-blue-600 py-1.5 rounded-lg hover:bg-blue-50 transition"
            >
              <Phone className="w-3 h-3" /> Call Now
            </a>
            {onRequestQuote && (
              <button
                onClick={() => { onRequestQuote(); setIsOpen(false); }}
                className="flex-1 flex items-center justify-center gap-1 text-xs font-semibold text-orange-600 hover:text-orange-700 py-1.5 rounded-lg hover:bg-orange-50 transition cursor-pointer"
              >
                <Calendar className="w-3 h-3" /> Free Quote
              </button>
            )}
          </div>

          {/* Input */}
          <form onSubmit={handleSubmit} className="px-3 py-2.5 border-t border-slate-100 bg-white flex gap-2">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Describe your plumbing issue..."
              className="flex-1 text-sm bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-400/10 transition"
              disabled={loading}
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="p-2 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-200 text-white rounded-xl transition cursor-pointer disabled:cursor-not-allowed"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}
    </>
  );
}
