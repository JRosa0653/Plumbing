import React, { useState, useEffect } from "react";
import { 
  Phone, 
  MessageSquare, 
  ShieldCheck, 
  Clock, 
  MapPin, 
  Sparkles, 
  Star, 
  Droplet, 
  Flame, 
  Wrench, 
  Menu, 
  X, 
  CheckCircle2, 
  HelpCircle,
  Award
} from "lucide-react";

import { APIProvider, Map, AdvancedMarker, Pin } from "@vis.gl/react-google-maps";

const API_KEY =
  process.env.GOOGLE_MAPS_PLATFORM_KEY ||
  (import.meta as any).env?.VITE_GOOGLE_MAPS_PLATFORM_KEY ||
  (globalThis as any).GOOGLE_MAPS_PLATFORM_KEY ||
  '';
const hasValidKey = Boolean(API_KEY) && API_KEY !== 'YOUR_API_KEY';

// Components
import AIEstimator from "./components/AIEstimator";
import QuoteForm from "./components/QuoteForm";
import ContactForm from "./components/ContactForm";
import FloatingActions from "./components/FloatingActions";
import AdminPanel from "./components/AdminPanel";

// Assets
const heroImage = "/assets/images/plumbing_hero_1782315154139.jpg";

export default function App() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [prefilledDetails, setPrefilledDetails] = useState<{
    category: string;
    urgency: "low" | "medium" | "high" | "emergency";
    description: string;
  } | null>(null);

  // Settings State matching our Backend API schema
  const [settings, setSettings] = useState(() => {
    const defaultVals = {
      companyName: "NYC Elite Plumbing Specialists",
      phone: "+1 (212) 555-0199",
      email: "rosariojorge0607@gmail.com",
      whatsapp: "12125550199",
      emergencyAlert: "24/7 EMERGENCY NYC PLUMBING SERVICES AVAILABLE",
      heroTitle: "Expert NYC Plumbing\nWhen You Need It.",
      heroSubtitle: "Fast, reliable, and professional solutions for New York homes & businesses. Handling leaks, clogs, boiler repairs, and 24/7 emergencies across all five boroughs.",
      mapLatitude: 40.7128,
      mapLongitude: -74.0060,
      mapZoom: 12,
      mapAddress: "Empire State Building, 350 5th Ave, New York, NY 10118, USA",
      mapMarkerTitle: "NYC Elite Plumbing HQ"
    };
    try {
      const saved = localStorage.getItem("nyc_elite_plumbing_settings");
      if (saved) {
        return { ...defaultVals, ...JSON.parse(saved) };
      }
    } catch (e) {
      console.error("Error reading settings from localStorage:", e);
    }
    return defaultVals;
  });

  // Fetch settings on mount or when refreshTrigger fires
  useEffect(() => {
    fetch("/api/settings")
      .then(res => res.json())
      .then(data => {
        if (data && data.companyName) {
          setSettings(data);
          try {
            localStorage.setItem("nyc_elite_plumbing_settings", JSON.stringify(data));
          } catch (e) {
            console.error("Error saving settings to localStorage:", e);
          }
        }
      })
      .catch(err => {
        console.warn("Backend API not available or error, using local settings:", err);
      });
  }, [refreshTrigger]);

  const handleFormSubmitSuccess = () => {
    // Increment trigger to force components to fetch new submissions instantly
    setRefreshTrigger(prev => prev + 1);
  };

  const handleApplyAIDiagnostics = (details: {
    category: string;
    urgency: "low" | "medium" | "high" | "emergency";
    description: string;
  }) => {
    setPrefilledDetails(details);
  };

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
    setMobileMenuOpen(false);
  };

  return (
    <div className="min-h-screen flex flex-col font-sans bg-slate-50 text-slate-900 antialiased">
      
      {/* 1. TOP STICKY CONTACT BAR */}
      <div className="sticky top-0 z-40">
        <div className="bg-blue-950 text-white px-4 md:px-8 py-2.5 flex flex-col sm:flex-row justify-between items-center text-xs sm:text-sm font-semibold tracking-wide shadow-md gap-2">
          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 rounded-full bg-red-500 animate-pulse shrink-0"></span>
            {settings.emergencyAlert}
          </div>
          <div className="flex items-center gap-4 sm:gap-6">
            <a href={`tel:${settings.phone}`} className="hover:underline flex items-center gap-1 font-bold">
              <Phone className="w-3.5 h-3.5 fill-current" /> Tel: {settings.phone}
            </a>
            <span className="opacity-70 hidden sm:inline">|</span>
            <span className="opacity-75">{settings.email}</span>
          </div>
        </div>

        {/* 2. HEADER NAVIGATION */}
        <header className="bg-white border-b border-slate-200 px-4 md:px-8 py-4">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            {/* Logo/Brand */}
            <div className="flex items-center gap-3 cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>
              <div className="bg-blue-600 p-2 rounded-lg text-white">
                <Wrench className="w-6 h-6" />
              </div>
              <span className="text-xl md:text-2xl font-black tracking-tight text-blue-900 uppercase">{settings.companyName}</span>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-8 text-sm font-semibold text-slate-600">
              <button onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })} className="hover:text-blue-600 transition">Home</button>
              <button onClick={() => scrollToSection("ai-diagnostics-section")} className="hover:text-blue-600 transition flex items-center gap-1">
                AI Diagnostics <span className="px-1.5 py-0.5 bg-blue-100 text-blue-600 text-[9px] font-bold rounded-md">NEW</span>
              </button>
              <button onClick={() => scrollToSection("services-section")} className="hover:text-blue-600 transition">Services</button>
              <button onClick={() => scrollToSection("about-section")} className="hover:text-blue-600 transition">Why Us</button>
              <button onClick={() => scrollToSection("quote-form-section")} className="hover:text-blue-600 transition">Request Quote</button>
              <button onClick={() => scrollToSection("contact-section")} className="hover:text-blue-600 transition">Contact</button>
            </nav>

            {/* Desktop Call/WhatsApp Actions */}
            <div className="hidden lg:flex items-center gap-4">
              <a 
                href={`tel:${settings.phone}`} 
                className="flex items-center gap-2 bg-slate-100 px-4 py-2 rounded-full text-blue-900 font-bold border border-slate-200 hover:bg-slate-200 transition"
              >
                <Phone className="w-4 h-4 text-blue-600" />
                {settings.phone}
              </a>
              <a 
                href={`https://wa.me/${settings.whatsapp}`} 
                target="_blank" 
                rel="noopener noreferrer"
                className="bg-emerald-500 text-white px-5 py-2 rounded-xl font-bold text-sm shadow-md shadow-emerald-100 hover:bg-emerald-600 flex items-center gap-2 transition"
              >
                <MessageSquare className="w-4 h-4 fill-white/10" />
                WhatsApp Us
              </a>
            </div>

            {/* Mobile Menu Toggle Button */}
            <button 
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)} 
              className="md:hidden p-2 text-slate-600 hover:text-slate-900 focus:outline-none"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </header>

        {/* Mobile menu panel */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-white border-b border-slate-200 px-6 py-4 space-y-4 shadow-xl">
            <div className="flex flex-col gap-3 font-semibold text-slate-700">
              <button onClick={() => { window.scrollTo({ top: 0, behavior: "smooth" }); setMobileMenuOpen(false); }} className="text-left py-2 border-b border-slate-100 hover:text-sky-600">Home</button>
              <button onClick={() => scrollToSection("ai-diagnostics-section")} className="text-left py-2 border-b border-slate-100 hover:text-sky-600 flex items-center justify-between">
                AI Diagnostics <span className="px-1.5 py-0.5 bg-sky-100 text-sky-600 text-[9px] font-bold rounded-md">NEW</span>
              </button>
              <button onClick={() => scrollToSection("services-section")} className="text-left py-2 border-b border-slate-100 hover:text-sky-600">Services</button>
              <button onClick={() => scrollToSection("about-section")} className="text-left py-2 border-b border-slate-100 hover:text-sky-600">Why Us</button>
              <button onClick={() => scrollToSection("quote-form-section")} className="text-left py-2 border-b border-slate-100 hover:text-sky-600">Request Quote</button>
              <button onClick={() => scrollToSection("contact-section")} className="text-left py-2 hover:text-sky-600">Contact</button>
            </div>

            <div className="pt-2 flex flex-col gap-3.5">
              <a 
                href={`tel:${settings.phone}`} 
                className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm rounded-xl text-center flex items-center justify-center gap-2"
              >
                <Phone className="w-4 h-4 text-sky-400" />
                Call: {settings.phone}
              </a>
              <a 
                href={`https://wa.me/${settings.whatsapp}`} 
                target="_blank" 
                rel="noopener noreferrer"
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm rounded-xl text-center flex items-center justify-center gap-2"
              >
                <MessageSquare className="w-4 h-4 fill-white/10" />
                WhatsApp Us
              </a>
            </div>
          </div>
        )}
      </div>

      {/* 3. HERO SECTION */}
      <section className="bg-gradient-to-br from-white to-slate-50 py-12 md:py-20 px-4 md:px-8 overflow-hidden">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* Hero text (Left 7 cols) */}
          <div className="lg:col-span-7 space-y-6 md:space-y-8 text-left">
            <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 px-3.5 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider border border-blue-100">
              <Award className="w-4 h-4 shrink-0" />
              <span>Licensed & Insured • Master Plumbers</span>
            </div>

            <h2 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-slate-900 leading-[1.1] tracking-tight whitespace-pre-line">
              {settings.heroTitle}
            </h2>

            <p className="text-xl text-slate-600 leading-relaxed max-w-xl whitespace-pre-line">
              {settings.heroSubtitle}
            </p>

            {/* Prominent CTAs */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 pt-2">
              <button 
                onClick={() => scrollToSection("quote-form-section")}
                className="px-8 py-4 bg-orange-500 hover:bg-orange-600 text-white font-black text-sm rounded-xl shadow-lg shadow-orange-100 uppercase tracking-widest transition duration-200 hover:-translate-y-0.5 text-center cursor-pointer"
              >
                Request Free Quote
              </button>
              
              <a 
                href={`tel:${settings.phone}`} 
                className="px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold text-lg rounded-xl shadow-lg shadow-blue-200 transition duration-200 hover:-translate-y-0.5 text-center flex items-center justify-center gap-2"
              >
                <Phone className="w-5 h-5 text-white" />
                Call Now
              </a>

              <a 
                href={`https://wa.me/${settings.whatsapp}`} 
                target="_blank" 
                rel="noopener noreferrer"
                className="px-8 py-4 bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-lg rounded-xl shadow-lg shadow-emerald-100 transition duration-200 hover:-translate-y-0.5 text-center flex items-center justify-center gap-2"
              >
                <MessageSquare className="w-5 h-5 fill-white/10" />
                WhatsApp Us
              </a>
            </div>

            {/* Value Badges */}
            <div className="mt-12 grid grid-cols-2 sm:grid-cols-3 gap-6 pt-4 border-t border-slate-100">
              <div className="flex items-center gap-3 text-slate-500">
                <div className="bg-blue-100 p-2 rounded-full">
                  <CheckCircle2 className="w-5 h-5 text-blue-600" />
                </div>
                <span className="font-semibold uppercase tracking-wider text-xs">Licensed & Insured</span>
              </div>
              <div className="flex items-center gap-3 text-slate-500">
                <div className="bg-blue-100 p-2 rounded-full">
                  <CheckCircle2 className="w-5 h-5 text-blue-600" />
                </div>
                <span className="font-semibold uppercase tracking-wider text-xs">Upfront Pricing</span>
              </div>
              <div className="flex items-center gap-3 text-slate-500">
                <div className="bg-blue-100 p-2 rounded-full">
                  <CheckCircle2 className="w-5 h-5 text-blue-600" />
                </div>
                <span className="font-semibold uppercase tracking-wider text-xs">24/7 Availability</span>
              </div>
            </div>
          </div>

          {/* Hero Image Block (Right 5 cols) */}
          <div className="lg:col-span-5 relative mt-6 lg:mt-0">
            {/* Visual Frame Decor */}
            <div className="absolute -top-4 -left-4 w-72 h-72 bg-blue-500/10 rounded-3xl blur-2xl pointer-events-none" />
            <div className="absolute -bottom-4 -right-4 w-72 h-72 bg-emerald-500/5 rounded-3xl blur-2xl pointer-events-none" />

            {/* Main Image */}
            <div className="relative rounded-3xl overflow-hidden shadow-2xl border-4 border-white aspect-[4/3] sm:aspect-[16:9] lg:aspect-[4/3] group">
              <img 
                src={heroImage} 
                alt="Your Plumbing Company - Master Plumber" 
                className="w-full h-full object-cover group-hover:scale-102 transition duration-700"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/60 via-transparent to-transparent pointer-events-none" />
              
              {/* Dynamic Badge overlay */}
              <div className="absolute bottom-5 left-5 bg-white/95 backdrop-blur-md p-4 rounded-2xl shadow-xl flex items-center gap-3 border border-slate-100 max-w-xs animate-bounce-slow">
                <span className="p-2.5 bg-blue-500/10 text-blue-600 rounded-xl">
                  <Star className="w-5 h-5 fill-current" />
                </span>
                <div>
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wide">On-Demand Dispatch</h4>
                  <p className="text-[10px] text-slate-500 mt-0.5">Plumbers are live and dispatched nearest to your location now.</p>
                </div>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* 4. AI ESTIMATOR & ASSISTANT SECTION */}
      <section id="ai-diagnostics-section" className="py-16 md:py-24 px-4 md:px-8 bg-slate-950 relative overflow-hidden">
        {/* Background cosmic plumbing details */}
        <div className="absolute top-1/2 left-1/4 w-96 h-96 bg-sky-500/5 rounded-full blur-3xl pointer-events-none" />
        
        <div className="max-w-4xl mx-auto text-center space-y-4 mb-12 relative z-10">
          <span className="px-3.5 py-1 bg-sky-500/10 text-sky-400 text-xs font-bold uppercase tracking-widest rounded-full border border-sky-500/20">
            Smart Plumbing Tool
          </span>
          <h3 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight">
            Diagnose Your Issue Instantly
          </h3>
          <p className="text-slate-400 text-sm md:text-base max-w-xl mx-auto leading-relaxed">
            Not sure how much a repair will cost or what emergency steps you need to take? Use our Gemini AI Assistant to assess your problem, estimate budgets, and prep the quote form in seconds!
          </p>
        </div>

        <div className="max-w-4xl mx-auto relative z-10">
          <AIEstimator onApplyToForm={handleApplyAIDiagnostics} />
        </div>
      </section>

      {/* 5. SERVICES CATALOG SECTION */}
      <section id="services-section" className="py-16 md:py-24 px-4 md:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          
          <div className="text-center space-y-3 mb-16">
            <span className="text-xs uppercase tracking-widest font-extrabold text-sky-600">Professional Services</span>
            <h3 className="text-3xl md:text-4xl font-extrabold text-slate-950 tracking-tight">
              Comprehensive Plumbing Solutions
            </h3>
            <p className="text-slate-500 text-sm md:text-base max-w-xl mx-auto leading-relaxed">
              We handle all residential and commercial plumbing jobs with licensed mastery and modern high-tech tooling.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            
            {/* Service 1 */}
            <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200/50 hover:border-sky-500/30 hover:bg-white transition-all duration-300 group shadow-sm hover:shadow-xl">
              <span className="w-12 h-12 bg-red-100 text-red-600 rounded-xl flex items-center justify-center mb-5 border border-red-200">
                <Clock className="w-6 h-6 animate-pulse" />
              </span>
              <h4 className="text-lg font-bold text-slate-900 group-hover:text-sky-600 transition-colors">Emergency Plumbing</h4>
              <p className="text-slate-500 text-xs leading-relaxed mt-2.5">
                Burst pipes, active water leaks, back-ups, and flooding. Our emergency plumbers are on-call 24/7 to secure your home.
              </p>
              <button onClick={() => scrollToSection("quote-form-section")} className="text-xs font-bold text-sky-600 hover:text-sky-500 flex items-center gap-1 mt-4 cursor-pointer">
                Book Repair <span className="group-hover:translate-x-1 transition-transform inline-block">→</span>
              </button>
            </div>

            {/* Service 2 */}
            <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200/50 hover:border-sky-500/30 hover:bg-white transition-all duration-300 group shadow-sm hover:shadow-xl">
              <span className="w-12 h-12 bg-sky-100 text-sky-600 rounded-xl flex items-center justify-center mb-5 border border-sky-200">
                <Flame className="w-6 h-6" />
              </span>
              <h4 className="text-lg font-bold text-slate-900 group-hover:text-sky-600 transition-colors">Water Heater Services</h4>
              <p className="text-slate-500 text-xs leading-relaxed mt-2.5">
                Repair, maintenance, and installations of gas, electric, and high-efficiency tankless water heaters. Enjoy hot water today.
              </p>
              <button onClick={() => scrollToSection("quote-form-section")} className="text-xs font-bold text-sky-600 hover:text-sky-500 flex items-center gap-1 mt-4 cursor-pointer">
                Get Hot Water <span className="group-hover:translate-x-1 transition-transform inline-block">→</span>
              </button>
            </div>

            {/* Service 3 */}
            <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200/50 hover:border-sky-500/30 hover:bg-white transition-all duration-300 group shadow-sm hover:shadow-xl">
              <span className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-xl flex items-center justify-center mb-5 border border-emerald-200">
                <Droplet className="w-6 h-6" />
              </span>
              <h4 className="text-lg font-bold text-slate-900 group-hover:text-sky-600 transition-colors">Drain & Sewer Cleaning</h4>
              <p className="text-slate-500 text-xs leading-relaxed mt-2.5">
                Slow draining or stubborn clogs cleared using high-pressure hydro-jetting and professional line snake machinery.
              </p>
              <button onClick={() => scrollToSection("quote-form-section")} className="text-xs font-bold text-sky-600 hover:text-sky-500 flex items-center gap-1 mt-4 cursor-pointer">
                Clear Clogs <span className="group-hover:translate-x-1 transition-transform inline-block">→</span>
              </button>
            </div>

            {/* Service 4 */}
            <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200/50 hover:border-sky-500/30 hover:bg-white transition-all duration-300 group shadow-sm hover:shadow-xl">
              <span className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center mb-5 border border-indigo-200">
                <Droplet className="w-6 h-6" />
              </span>
              <h4 className="text-lg font-bold text-slate-900 group-hover:text-sky-600 transition-colors">Leak Detection & Pipe Repair</h4>
              <p className="text-slate-500 text-xs leading-relaxed mt-2.5">
                Pinpoint hidden pipeline leaks inside walls, concrete slabs, or underground using acoustic and thermal technology.
              </p>
              <button onClick={() => scrollToSection("quote-form-section")} className="text-xs font-bold text-sky-600 hover:text-sky-500 flex items-center gap-1 mt-4 cursor-pointer">
                Find Leaks <span className="group-hover:translate-x-1 transition-transform inline-block">→</span>
              </button>
            </div>

            {/* Service 5 */}
            <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200/50 hover:border-sky-500/30 hover:bg-white transition-all duration-300 group shadow-sm hover:shadow-xl">
              <span className="w-12 h-12 bg-amber-100 text-amber-600 rounded-xl flex items-center justify-center mb-5 border border-amber-200">
                <Wrench className="w-6 h-6" />
              </span>
              <h4 className="text-lg font-bold text-slate-900 group-hover:text-sky-600 transition-colors">Kitchen & Bath Remodeling</h4>
              <p className="text-slate-500 text-xs leading-relaxed mt-2.5">
                Upgrading faucets, master sinks, customized luxury showers, modern bathtubs, garbage disposals, and kitchen fixtures.
              </p>
              <button onClick={() => scrollToSection("quote-form-section")} className="text-xs font-bold text-sky-600 hover:text-sky-500 flex items-center gap-1 mt-4 cursor-pointer">
                Design Remodel <span className="group-hover:translate-x-1 transition-transform inline-block">→</span>
              </button>
            </div>

            {/* Service 6 */}
            <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200/50 hover:border-sky-500/30 hover:bg-white transition-all duration-300 group shadow-sm hover:shadow-xl">
              <span className="w-12 h-12 bg-slate-100 text-slate-600 rounded-xl flex items-center justify-center mb-5 border border-slate-200">
                <ShieldCheck className="w-6 h-6" />
              </span>
              <h4 className="text-lg font-bold text-slate-900 group-hover:text-sky-600 transition-colors">Preventative Inspections</h4>
              <p className="text-slate-500 text-xs leading-relaxed mt-2.5">
                Detailed pipeline video scoping, water pressure testing, and multi-point security inspections to catch plumbing failures early.
              </p>
              <button onClick={() => scrollToSection("quote-form-section")} className="text-xs font-bold text-sky-600 hover:text-sky-500 flex items-center gap-1 mt-4 cursor-pointer">
                Schedule Checkup <span className="group-hover:translate-x-1 transition-transform inline-block">→</span>
              </button>
            </div>

          </div>
        </div>
      </section>

      {/* 6. TRUST / ABOUT SECTION */}
      <section id="about-section" className="py-16 md:py-24 px-4 md:px-8 bg-slate-50 border-y border-slate-200/80">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          
          <div className="space-y-6">
            <span className="text-xs uppercase tracking-widest font-extrabold text-sky-600">The Local Standard</span>
            <h3 className="text-3xl md:text-4xl font-extrabold text-slate-950 tracking-tight leading-tight">
              Why Homeowners Trust Your Plumbing Company
            </h3>
            <p className="text-slate-600 text-sm md:text-base leading-relaxed">
              We are a locally-owned, full-service plumbing company serving our community with reliable, friendly, and expert support. Our master technicians treat your home with the highest level of care and clean-up after every job.
            </p>

            <div className="space-y-4">
              <div className="flex items-start gap-3.5">
                <span className="p-1.5 bg-sky-100 text-sky-600 rounded-lg mt-0.5">
                  <CheckCircle2 className="w-5 h-5" />
                </span>
                <div>
                  <h5 className="font-bold text-slate-950 text-sm">Upfront Pricing - No Surprises</h5>
                  <p className="text-slate-500 text-xs mt-0.5">We diagnose the problem and provide a transparent, flat-rate quote before any work begins.</p>
                </div>
              </div>

              <div className="flex items-start gap-3.5">
                <span className="p-1.5 bg-sky-100 text-sky-600 rounded-lg mt-0.5">
                  <CheckCircle2 className="w-5 h-5" />
                </span>
                <div>
                  <h5 className="font-bold text-slate-950 text-sm">Rapid On-Time Response</h5>
                  <p className="text-slate-500 text-xs mt-0.5">We understand that a plumbing leak can damage your property. We arrive within our scheduled window, guaranteed.</p>
                </div>
              </div>

              <div className="flex items-start gap-3.5">
                <span className="p-1.5 bg-sky-100 text-sky-600 rounded-lg mt-0.5">
                  <CheckCircle2 className="w-5 h-5" />
                </span>
                <div>
                  <h5 className="font-bold text-slate-950 text-sm">Licensed, Insured & Background Checked</h5>
                  <p className="text-slate-500 text-xs mt-0.5">Your safety and comfort is our top priority. All plumbers undergo background screening and rigorous training.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Stats grid */}
          <div className="grid grid-cols-2 gap-4 md:gap-6">
            <div className="bg-white p-6 md:p-8 rounded-3xl border border-slate-200/60 shadow-sm text-center">
              <span className="text-3xl md:text-4xl font-extrabold text-sky-600 tracking-tight">4.9/5</span>
              <h5 className="text-xs font-bold text-slate-800 uppercase tracking-wider mt-2">Google Reviews</h5>
              <p className="text-slate-500 text-[10px] mt-1">Hundreds of local 5-star reviews</p>
            </div>

            <div className="bg-white p-6 md:p-8 rounded-3xl border border-slate-200/60 shadow-sm text-center">
              <span className="text-3xl md:text-4xl font-extrabold text-brand-orange tracking-tight">&lt; 45m</span>
              <h5 className="text-xs font-bold text-slate-800 uppercase tracking-wider mt-2">Arrival Time</h5>
              <p className="text-slate-500 text-[10px] mt-1">Average emergency response dispatch</p>
            </div>

            <div className="bg-white p-6 md:p-8 rounded-3xl border border-slate-200/60 shadow-sm text-center">
              <span className="text-3xl md:text-4xl font-extrabold text-emerald-600 tracking-tight">10k+</span>
              <h5 className="text-xs font-bold text-slate-800 uppercase tracking-wider mt-2">Drains Unclogged</h5>
              <p className="text-slate-500 text-[10px] mt-1">Expert clog clearing services</p>
            </div>

            <div className="bg-white p-6 md:p-8 rounded-3xl border border-slate-200/60 shadow-sm text-center">
              <span className="text-3xl md:text-4xl font-extrabold text-indigo-600 tracking-tight">100%</span>
              <h5 className="text-xs font-bold text-slate-800 uppercase tracking-wider mt-2">Satisfaction Guarantee</h5>
              <p className="text-slate-500 text-[10px] mt-1">If it's not right, we make it right</p>
            </div>
          </div>

        </div>
      </section>

      {/* 7. CONVERSION FORMS GRID SECTION */}
      <section className="py-16 md:py-24 px-4 md:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
            
            {/* Free Quote Form (Left 7 cols) */}
            <div className="lg:col-span-7">
              <QuoteForm 
                prefilledDetails={prefilledDetails} 
                onFormSubmitSuccess={handleFormSubmitSuccess} 
              />
            </div>

            {/* General Contact Form & Info (Right 5 cols) */}
            <div className="lg:col-span-5 space-y-8">
              
              {/* Direct message contact form */}
              <ContactForm onFormSubmitSuccess={handleFormSubmitSuccess} />

              {/* Direct Business Contact Info Details */}
              <div className="bg-slate-900 text-slate-100 rounded-3xl p-6 md:p-8 border border-slate-800 shadow-xl space-y-6">
                <div>
                  <h4 className="text-lg font-bold text-white tracking-tight">Business Contact details</h4>
                  <p className="text-xs text-sky-400 font-medium">Have a direct question? Reach our coordinators instantly.</p>
                </div>

                <div className="space-y-4 text-xs md:text-sm">
                  
                  <div className="flex items-start gap-3">
                    <span className="p-2 bg-slate-800 text-sky-400 rounded-xl shrink-0 mt-0.5">
                      <Phone className="w-4 h-4" />
                    </span>
                    <div>
                      <span className="text-[10px] text-slate-400 block">CALL EMERGENCY DISPATCH</span>
                      <a href={`tel:${settings.phone.replace(/[^+\d]/g, "")}`} className="font-extrabold text-white text-base hover:underline hover:text-sky-400 transition">
                        {settings.phone}
                      </a>
                      <span className="text-[10px] text-emerald-400 block mt-1">● Live dispatch operators 24/7/365</span>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <span className="p-2 bg-slate-800 text-emerald-400 rounded-xl shrink-0 mt-0.5">
                      <MessageSquare className="w-4 h-4 fill-emerald-500/10" />
                    </span>
                    <div>
                      <span className="text-[10px] text-slate-400 block">WHATSAPP CHAT</span>
                      <a 
                        href={`https://wa.me/${settings.whatsapp.replace(/\D/g, "")}`} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="font-bold text-white hover:underline hover:text-emerald-400 transition"
                      >
                        {settings.phone}
                      </a>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <span className="p-2 bg-slate-800 text-sky-400 rounded-xl shrink-0 mt-0.5">
                      <Clock className="w-4 h-4" />
                    </span>
                    <div>
                      <span className="text-[10px] text-slate-400 block">EMAIL ENQUIRIES</span>
                      <a href={`mailto:${settings.email}`} className="font-bold text-white hover:underline transition">
                        {settings.email}
                      </a>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <span className="p-2 bg-slate-800 text-sky-400 rounded-xl shrink-0 mt-0.5">
                      <MapPin className="w-4 h-4" />
                    </span>
                    <div>
                      <span className="text-[10px] text-slate-400 block">SERVICE REGION</span>
                      <p className="font-bold text-white">Serving Your Metro & Surrounding Counties</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">Full coverage, rapid truck dispatch to your door.</p>
                    </div>
                  </div>

                </div>
              </div>

            </div>

          </div>

        </div>
      </section>

      {/* 7.5 GOOGLE MAPS & COVERAGE AREA SECTION */}
      <section id="map-section" className="py-16 md:py-24 px-4 md:px-8 bg-slate-50 border-t border-slate-200">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-12 space-y-4">
            <span className="text-xs uppercase tracking-widest font-extrabold text-blue-600 bg-blue-50 px-3 py-1 rounded-full">
              Our Location & Service Coverage
            </span>
            <h3 className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight leading-tight">
              Where We Work & How to Find Us
            </h3>
            <p className="text-slate-600 text-sm md:text-base leading-relaxed">
              We provide rapid 24/7 plumbing response across our main service territory. Check our coordinates and operational hub below.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
            {/* Left side: Information and dispatch details (5 columns) */}
            <div className="lg:col-span-5 flex flex-col justify-between bg-white rounded-3xl p-6 md:p-8 border border-slate-200/80 shadow-sm space-y-6">
              <div className="space-y-5">
                <div className="flex items-center gap-2">
                  <span className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                    <MapPin className="w-5 h-5" />
                  </span>
                  <h4 className="text-lg font-bold text-slate-950">Company Headquarters</h4>
                </div>
                
                <p className="text-sm font-semibold text-slate-800 leading-relaxed bg-slate-50 border border-slate-100 p-4 rounded-2xl">
                  {settings.mapAddress}
                </p>

                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <span className="p-1 text-emerald-600 mt-0.5">
                      <CheckCircle2 className="w-4 h-4" />
                    </span>
                    <div>
                      <h5 className="text-xs font-bold text-slate-900">25-Mile Service Radius</h5>
                      <p className="text-[11px] text-slate-500 mt-0.5">We dispatch our equipped trucks directly to your residential or commercial location within our service bounds.</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <span className="p-1 text-emerald-600 mt-0.5">
                      <CheckCircle2 className="w-4 h-4" />
                    </span>
                    <div>
                      <h5 className="text-xs font-bold text-slate-900">GPS Fleet Tracking</h5>
                      <p className="text-[11px] text-slate-500 mt-0.5">Our service coordinators track active units in real-time to dispatch the absolute closest specialist to you.</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <span className="p-1 text-emerald-600 mt-0.5">
                      <CheckCircle2 className="w-4 h-4" />
                    </span>
                    <div>
                      <h5 className="text-xs font-bold text-slate-900 font-sans">Fully Licensed & Certified Hub</h5>
                      <p className="text-[11px] text-slate-500 mt-0.5">Our physical office handles material staging, emergency inventory, and dispatcher support.</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Emergency CTA Card */}
              <div className="bg-gradient-to-br from-blue-900 to-slate-950 text-white rounded-2xl p-5 border border-slate-800 space-y-3">
                <h5 className="font-bold text-sm text-sky-400">Need Immediate Help?</h5>
                <p className="text-[11px] text-slate-300 font-sans">
                  Don't wait! Emergency technicians are on standby. Our average dispatch time is under 45 minutes from your call.
                </p>
                <div className="flex flex-wrap gap-2.5 pt-1">
                  <a href={`tel:${settings.phone}`} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 transition">
                    <Phone className="w-3.5 h-3.5" /> Call Now
                  </a>
                  <a href={`https://wa.me/${settings.whatsapp}`} target="_blank" rel="noopener noreferrer" className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 transition">
                    <MessageSquare className="w-3.5 h-3.5" /> WhatsApp
                  </a>
                </div>
              </div>
            </div>

            {/* Right side: Google Map Canvas or setup splash screen (7 columns) */}
            <div className="lg:col-span-7 bg-white rounded-3xl p-4 border border-slate-200/80 shadow-sm min-h-[420px] flex flex-col">
              <div className="relative flex-1 w-full rounded-2xl overflow-hidden bg-slate-100 min-h-[380px] flex items-center justify-center">
                {hasValidKey ? (
                  <APIProvider apiKey={API_KEY} version="weekly">
                    <Map
                      defaultCenter={{ lat: settings.mapLatitude, lng: settings.mapLongitude }}
                      center={{ lat: settings.mapLatitude, lng: settings.mapLongitude }}
                      zoom={settings.mapZoom}
                      mapId="DEMO_MAP_ID"
                      internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
                      style={{ width: '100%', height: '400px' }}
                    >
                      <AdvancedMarker position={{ lat: settings.mapLatitude, lng: settings.mapLongitude }} title={settings.mapMarkerTitle}>
                        <Pin background="#2563EB" glyphColor="#fff" borderColor="#1D4ED8" />
                      </AdvancedMarker>
                    </Map>
                  </APIProvider>
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center p-6 bg-slate-900 text-white rounded-2xl">
                    <div className="text-center max-w-md space-y-4">
                      <div className="p-3.5 bg-slate-800 text-amber-500 inline-block rounded-full animate-pulse border border-slate-700">
                        <MapPin className="w-8 h-8" />
                      </div>
                      <h4 className="text-sm font-black tracking-wider text-white uppercase font-sans">Google Maps API Key Required</h4>
                      <p className="text-xs text-slate-300 leading-relaxed">
                        To activate this real-time interactive map, please configure a Google Maps API key in your AI Studio Environment.
                      </p>
                      
                      <div className="text-left bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2 text-[11px] font-mono leading-normal text-slate-300">
                        <p><strong>Step 1:</strong> <a href="https://console.cloud.google.com/google/maps-apis/start?utm_campaign=gmp-code-assist-ais" target="_blank" rel="noopener noreferrer" className="text-sky-400 hover:underline">Get an API Key</a></p>
                        <p><strong>Step 2:</strong> Open <strong>Settings</strong> (⚙️ gear icon, top-right corner) → <strong>Secrets</strong></p>
                        <p><strong>Step 3:</strong> Name the secret <code>GOOGLE_MAPS_PLATFORM_KEY</code> and paste your key</p>
                      </div>
                      
                      <p className="text-[10px] text-slate-500 font-mono">
                        The interactive map of Santo Domingo will automatically render once the secret is applied.
                      </p>
                      
                      {/* Hidden or subtle reference to process.env for standard IDE variable scanner detection */}
                      <span className="hidden">{process.env.GOOGLE_MAPS_PLATFORM_KEY}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 8. FOOTER */}
      <footer className="bg-slate-950 text-slate-400 py-12 px-4 md:px-8 border-t border-slate-900">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12 pb-8 border-b border-slate-900 text-left">
          
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <span className="p-1.5 bg-blue-600 text-white rounded-lg">
                <Wrench className="w-5 h-5" />
              </span>
              <h4 className="text-white font-bold text-lg">{settings.companyName}</h4>
            </div>
            <p className="text-xs leading-relaxed text-slate-500">
              Your professional, highly rated local plumbing company. On-call 24/7/365 to handle burst pipes, leak repairs, and major water heater installs.
            </p>
          </div>

          <div className="space-y-3">
            <h5 className="text-white font-bold text-sm tracking-wide uppercase">Services We Offer</h5>
            <ul className="text-xs space-y-2 text-slate-500">
              <li>• 24/7 Emergency Diagnostics & Leak repair</li>
              <li>• Gas & Electric Water Heater Refitting</li>
              <li>• Commercial High-Pressure Drain jetting</li>
              <li>• Slab leak location & acoustic testing</li>
              <li>• Custom Bathroom & Kitchen fixture upgrades</li>
            </ul>
          </div>

          <div className="space-y-3">
            <h5 className="text-white font-bold text-sm tracking-wide uppercase">Direct Contact Details</h5>
            <ul className="text-xs space-y-2 text-slate-500">
              <li className="flex items-center gap-2">
                <Phone className="w-3.5 h-3.5 text-sky-500 shrink-0" />
                <a href={`tel:${settings.phone}`} className="hover:text-white transition">Phone: {settings.phone}</a>
              </li>
              <li className="flex items-center gap-2">
                <MessageSquare className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                <a href={`https://wa.me/${settings.whatsapp}`} target="_blank" rel="noopener noreferrer" className="hover:text-white transition">WhatsApp: {settings.phone}</a>
              </li>
              <li className="flex items-center gap-2">
                <Clock className="w-3.5 h-3.5 text-sky-500 shrink-0" />
                <span>Email: {settings.email}</span>
              </li>
            </ul>
          </div>

        </div>

        <div className="max-w-7xl mx-auto pt-6 text-center text-[10px] text-slate-600 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <p>© {new Date().getFullYear()} {settings.companyName}. All rights reserved.</p>
          <div className="flex justify-center gap-4">
            <span>Licensed Master Plumber Lic #78423-PL</span>
            <span>•</span>
            <span>24/7 Dispatch Center</span>
          </div>
        </div>
      </footer>

      {/* 9. FLOATING ACTIONS & ADMINISTRATIVE CONTROL PANEL */}
      <FloatingActions phone={settings.phone} whatsapp="18494530811" onRequestQuote={() => { const el = document.getElementById("quote-form-section"); if (el) el.scrollIntoView({ behavior: "smooth" }); }} />
      <AdminPanel refreshTrigger={refreshTrigger} onSettingsUpdated={handleFormSubmitSuccess} />

    </div>
  );
}
