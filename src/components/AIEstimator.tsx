import React, { useState } from "react";
import { Sparkles, AlertTriangle, ShieldCheck, DollarSign, ArrowRight, Loader2, PlayCircle } from "lucide-react";
import { DiagnosticResult } from "../types";

interface AIEstimatorProps {
  onApplyToForm: (details: { category: string; urgency: "low" | "medium" | "high" | "emergency"; description: string }) => void;
}

const COMMON_ISSUES = [
  {
    title: "Burst Copper Pipe",
    description: "Water is spraying out from a copper pipe behind the laundry wall.",
    icon: "💧"
  },
  {
    title: "Water Heater Leaking",
    description: "The bottom of my gas water heater tank is leaking rusty water and is cold.",
    icon: "🔥"
  },
  {
    title: "Clogged Main Drain",
    description: "Multiple toilets are backing up with sewage when we run the shower.",
    icon: "🚽"
  },
  {
    title: "Slowing Dripping Faucet",
    description: "Kitchen faucet has a steady drip when fully off, wasting water.",
    icon: "🚰"
  }
];

export default function AIEstimator({ onApplyToForm }: AIEstimatorProps) {
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<DiagnosticResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const getLocalDiagnosis = (desc: string): DiagnosticResult => {
    const text = desc.toLowerCase();
    
    if (text.includes("burst") || text.includes("spraying") || text.includes("gush") || text.includes("flood") || (text.includes("leak") && (text.includes("heavy") || text.includes("major")))) {
      return {
        category: "Burst Pipe & Emergency Leak Detection",
        urgency: "emergency",
        steps: [
          "Immediately locate and shut off the main water isolation valve.",
          "Turn off any electrical appliances or power in the flooded area.",
          "Clear all valuable belongings, carpets, and debris from the wet zone."
        ],
        costRange: "$250 - $600",
        explanation: "A high-volume leak or burst pipe is a critical situation. Shutting down the main supply instantly curtails active damage. Our dispatch team is routing a master plumber to you."
      };
    }
    
    if (text.includes("heater") || text.includes("boiler") || text.includes("hot water") || text.includes("cold water") || text.includes("burn")) {
      return {
        category: "Water Heater Malfunction (Gas/Electric)",
        urgency: "high",
        steps: [
          "Shut off the fuel supply (gas valve or circuit breaker for electric).",
          "Close the cold water inlet valve on top of the heater tank.",
          "Do not touch any pressure relief valves; keep children away from the unit."
        ],
        costRange: "$150 - $450",
        explanation: "Water heaters involve high temperature and pressure. Safety is the top priority. We will inspect the thermostat, heating elements, or gas burners to restore hot water."
      };
    }

    if (text.includes("toilet") || text.includes("drain") || text.includes("clog") || text.includes("sew") || text.includes("backup") || text.includes("back up")) {
      return {
        category: "Sewer Line & Drain Clog Remediation",
        urgency: "high",
        steps: [
          "Stop running any water, showers, washing machines, or dishwashers.",
          "Do not pour harsh store-bought chemical drain cleaners down the pipe.",
          "Clear the path to the main sewer cleanout valve for our plumbers."
        ],
        costRange: "$180 - $350",
        explanation: "Active drain backups or toilet blockages can cause severe property contamination. We use advanced camera scopes and snakes to clear the line cleanly."
      };
    }

    // Default fallback for any other query
    return {
      category: "General Plumbing Assessment",
      urgency: "medium",
      steps: [
        "Locate the local shutoff valve near the fixture if it is actively dripping.",
        "Clear the cabinet or floor area to allow rapid inspection access.",
        "Take a quick photo of the dripping area to show our technicians."
      ],
      costRange: "$120 - $250",
      explanation: "This issue appears to be a standard fixture leak, dripping faucet, or general fixture maintenance that is safe to schedule for rapid same-day resolution."
    };
  };

  const handleEstimate = async (textToEstimate: string) => {
    if (!textToEstimate.trim()) return;
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch("/api/estimate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description: textToEstimate }),
      });

      if (!response.ok) {
        throw new Error("Diagnosis failed");
      }

      const data = await response.json();
      setResult(data);
    } catch (err: any) {
      console.warn("Backend AI estimator failed or unconfigured, using local diagnostics model fallback.", err);
      // Fallback local diagnosis
      const localResult = getLocalDiagnosis(textToEstimate);
      setResult(localResult);
    } finally {
      setLoading(false);
    }
  };

  const handleApply = () => {
    if (!result) return;
    
    // Map AI category to standard services
    let mappedService = "General Repair";
    const cat = result.category.toLowerCase();
    if (cat.includes("heater") || cat.includes("hot water")) mappedService = "Water Heaters";
    else if (cat.includes("drain") || cat.includes("clog") || cat.includes("sewer")) mappedService = "Drain Cleaning";
    else if (cat.includes("leak") || cat.includes("drip") || cat.includes("pipe")) mappedService = "Leak Detection & Repair";
    else if (cat.includes("emergency") || cat.includes("burst")) mappedService = "Emergency Plumbing";

    onApplyToForm({
      category: mappedService,
      urgency: result.urgency,
      description: description
    });
  };

  return (
    <div id="ai-estimator" className="bg-slate-900 text-slate-100 rounded-3xl p-6 md:p-8 border border-slate-800 shadow-2xl relative overflow-hidden">
      {/* Absolute ambient glow background decor */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-brand-accent/5 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10">
        <div className="flex items-center gap-3 mb-4">
          <span className="p-2.5 bg-sky-500/10 text-sky-400 rounded-2xl border border-sky-500/20">
            <Sparkles className="w-6 h-6 animate-pulse" />
          </span>
          <div>
            <h3 className="text-xl md:text-2xl font-bold text-white tracking-tight">AI Plumbing Diagnostic Assistant</h3>
            <p className="text-xs text-sky-300 font-medium">Powered by Gemini AI • Real-time Cost Estimation</p>
          </div>
        </div>

        <p className="text-slate-300 text-sm md:text-base mb-6 leading-relaxed">
          Describe your plumbing trouble in your own words (e.g. leaks, noises, locations) or select a common preset.
          Our AI will instantly provide critical safety actions and a transparent price range!
        </p>

        {/* Common Issue Presets */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          {COMMON_ISSUES.map((issue) => (
            <button
              key={issue.title}
              type="button"
              onClick={() => {
                setDescription(issue.description);
                handleEstimate(issue.description);
              }}
              className="flex flex-col items-start text-left p-3.5 bg-slate-800/60 hover:bg-slate-800 border border-slate-700/50 hover:border-sky-500/50 rounded-2xl transition duration-200 group"
            >
              <span className="text-xl mb-1.5">{issue.icon}</span>
              <span className="font-semibold text-xs text-white group-hover:text-sky-400 transition-colors">{issue.title}</span>
              <span className="text-[10px] text-slate-400 line-clamp-1 mt-0.5">{issue.description}</span>
            </button>
          ))}
        </div>

        {/* Diagnostic Input Box */}
        <div className="flex flex-col gap-3">
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Type your plumbing problem here... (e.g., 'There is a small puddle of water pooling under my kitchen sink faucet when the water is turned on.')"
            rows={3}
            className="w-full px-4 py-3 bg-slate-950 border border-slate-800 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 text-slate-100 rounded-2xl outline-none transition duration-200 resize-none text-sm leading-relaxed placeholder-slate-500"
          />

          <div className="flex justify-between items-center mt-1">
            <span className="text-[11px] text-slate-500">
              *AI estimates are informative; a final inspect/quote is 100% free.
            </span>
            <button
              type="button"
              disabled={loading || !description.trim()}
              onClick={() => handleEstimate(description)}
              className="px-6 py-2.5 bg-sky-600 hover:bg-sky-500 disabled:bg-slate-800 disabled:text-slate-600 disabled:border-slate-800 font-semibold text-sm text-white rounded-xl shadow-lg hover:shadow-sky-500/10 border border-sky-500/30 flex items-center gap-2 transition duration-200 hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Analyzing Issue...
                </>
              ) : (
                <>
                  Analyze Issue & Estimate
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </div>

        {/* Error State */}
        {error && (
          <div className="mt-6 p-4 bg-red-950/40 border border-red-900/50 rounded-2xl flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
            <p className="text-xs text-red-300 leading-relaxed">{error}</p>
          </div>
        )}

        {/* AI Results Output Card */}
        {result && (
          <div className="mt-8 bg-slate-950/70 border border-slate-800 rounded-2xl p-5 md:p-6 transition-all duration-300">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-slate-800">
              <div>
                <span className="text-[10px] uppercase tracking-widest text-sky-400 font-bold block mb-1">AI Diagnostics Assessment</span>
                <h4 className="text-lg font-bold text-white leading-tight">{result.category}</h4>
              </div>

              {/* Urgency Badge */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400 font-medium">Urgency:</span>
                {result.urgency === "emergency" && (
                  <span className="px-3 py-1 bg-red-950/80 border border-red-500/30 text-red-400 font-semibold text-xs rounded-full flex items-center gap-1.5 animate-pulse">
                    <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-ping" />
                    Immediate Emergency
                  </span>
                )}
                {result.urgency === "high" && (
                  <span className="px-3 py-1 bg-orange-950/80 border border-orange-500/30 text-orange-400 font-semibold text-xs rounded-full flex items-center gap-1.5">
                    High Priority
                  </span>
                )}
                {result.urgency === "medium" && (
                  <span className="px-3 py-1 bg-amber-950/80 border border-amber-500/30 text-amber-400 font-semibold text-xs rounded-full flex items-center gap-1.5">
                    Medium
                  </span>
                )}
                {result.urgency === "low" && (
                  <span className="px-3 py-1 bg-blue-950/80 border border-blue-500/30 text-blue-400 font-semibold text-xs rounded-full flex items-center gap-1.5">
                    Low / Preventative
                  </span>
                )}
              </div>
            </div>

            {/* Price Estimation */}
            <div className="py-5 grid grid-cols-1 md:grid-cols-2 gap-6 border-b border-slate-800">
              <div className="flex items-start gap-3.5">
                <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-2xl shrink-0 mt-0.5">
                  <DollarSign className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-xs text-slate-400 block mb-0.5">Estimated Plumbing Budget</span>
                  <p className="text-2xl font-bold text-emerald-400 leading-tight">{result.costRange}</p>
                  <p className="text-[10px] text-slate-500 mt-1">Estimations represent normal diagnostic bounds. Free onsite inspection secures final exact pricing.</p>
                </div>
              </div>

              <div className="flex items-start gap-3.5">
                <div className="p-3 bg-sky-500/10 border border-sky-500/20 text-sky-400 rounded-2xl shrink-0 mt-0.5">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-xs text-slate-400 block mb-0.5">AI Professional Explanation</span>
                  <p className="text-xs text-slate-300 leading-relaxed">{result.explanation}</p>
                </div>
              </div>
            </div>

            {/* Critical Actions Checkboxes */}
            <div className="pt-5">
              <h5 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3.5 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-brand-orange shrink-0" />
                Critical Preventative Actions (Do These Now)
              </h5>
              <div className="flex flex-col gap-2.5">
                {result.steps.map((step, idx) => (
                  <label key={idx} className="flex items-start gap-3 p-3 bg-slate-900/80 border border-slate-800/60 rounded-xl cursor-pointer hover:border-slate-700 transition duration-150">
                    <input
                      type="checkbox"
                      className="mt-0.5 h-4.5 w-4.5 rounded border-slate-800 bg-slate-950 text-sky-600 focus:ring-0 cursor-pointer accent-sky-500"
                    />
                    <span className="text-xs text-slate-300 select-none leading-relaxed">{step}</span>
                  </label>
                ))}
              </div>

              {/* Fast Form Action Trigger */}
              <div className="mt-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-sky-950/20 border border-sky-500/10 rounded-2xl">
                <div>
                  <span className="font-semibold text-xs text-white block">Instantly lock in your free on-site quote</span>
                  <p className="text-[10px] text-slate-400">Apply these diagnostic results directly to pre-fill the form.</p>
                </div>
                <button
                  type="button"
                  onClick={handleApply}
                  className="px-5 py-2 bg-brand-accent hover:bg-emerald-500 font-bold text-xs text-white rounded-xl flex items-center justify-center gap-1.5 transition duration-200 shadow-md cursor-pointer hover:-translate-y-0.5"
                >
                  Apply & Lock In Free On-site Quote
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
