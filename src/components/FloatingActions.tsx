import React from "react";
import { Phone, Calendar, ArrowUpCircle, MessageSquare } from "lucide-react";

interface FloatingActionsProps {
  phone?: string;
  whatsapp?: string;
  onRequestQuote?: () => void;
}

export default function FloatingActions({
  phone = "+1 (212) 555-0199",
  whatsapp = "18494530811",
  onRequestQuote,
}: FloatingActionsProps) {
  const phoneClean = phone.replace(/[^\d+]/g, "");
  const whatsappClean = whatsapp.replace(/\D/g, "");
  const whatsappLink = `https://wa.me/${whatsappClean}?text=Hi!%20I%20need%20plumbing%20help.`;

  const handleScrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleScrollToQuote = () => {
    const el = document.getElementById("quote-form-section");
    if (el) el.scrollIntoView({ behavior: "smooth" });
    if (onRequestQuote) onRequestQuote();
  };

  return (
    <div className="fixed right-6 bottom-20 z-40 flex flex-col gap-3">
      {/* Scroll to Top */}
      <button
        onClick={handleScrollToTop}
        className="p-3 bg-slate-800/90 hover:bg-slate-700 text-slate-300 hover:text-white rounded-full shadow-lg backdrop-blur-md transition-all duration-200 cursor-pointer group hover:-translate-y-1"
        title="Scroll to Top"
      >
        <ArrowUpCircle className="w-5 h-5" />
        <span className="absolute right-14 bg-slate-800 text-white text-[10px] font-bold px-2.5 py-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap shadow-sm border border-slate-700">
          Back to Top
        </span>
      </button>

      {/* Free Quote */}
      <button
        onClick={handleScrollToQuote}
        className="p-3.5 bg-sky-600 hover:bg-sky-500 text-white rounded-full shadow-xl transition-all duration-200 cursor-pointer group hover:-translate-y-1"
        title="Request Free Quote"
      >
        <Calendar className="w-5 h-5" />
        <span className="absolute right-14 bg-slate-800 text-white text-[10px] font-bold px-2.5 py-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap shadow-sm border border-slate-700">
          Free Quote
        </span>
      </button>

      {/* Call */}
      <a
        href={`tel:${phoneClean}`}
        className="p-3.5 bg-emerald-700 hover:bg-emerald-600 text-white rounded-full shadow-xl transition-all duration-200 cursor-pointer group hover:-translate-y-1"
        title="Call Us"
      >
        <Phone className="w-5 h-5" />
        <span className="absolute right-14 bg-slate-800 text-white text-[10px] font-bold px-2.5 py-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap shadow-sm border border-slate-700">
          Call Now
        </span>
      </a>

      {/* WhatsApp */}
      <a
        href={whatsappLink}
        target="_blank"
        rel="noopener noreferrer"
        className="p-3.5 bg-[#25D366] hover:bg-[#1ebe5d] text-white rounded-full shadow-xl transition-all duration-200 cursor-pointer group hover:-translate-y-1"
        title="Chat on WhatsApp"
      >
        <MessageSquare className="w-5 h-5" />
        <span className="absolute right-14 bg-slate-800 text-white text-[10px] font-bold px-2.5 py-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap shadow-sm border border-slate-700">
          WhatsApp
        </span>
      </a>
    </div>
  );
}
