import express from "express";
import { Resend } from "resend";

import fs from "fs";
import path from "path";

const app = express();
app.use(express.json());

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

const DEFAULT_SETTINGS = {
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

// Persistent data file (works locally; Vercel uses /tmp)
const DATA_FILE = process.env.VERCEL ? "/tmp/plumbing_data.json" : path.join(process.cwd(), "plumbing_data.json");

function loadData() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      return JSON.parse(fs.readFileSync(DATA_FILE, "utf-8"));
    }
  } catch (e) {}
  return { settings: DEFAULT_SETTINGS, leads: [], adminPasscode: "admin123" };
}

function saveData(data: any) {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
  } catch (e) {
    console.error("Failed to save data:", e);
  }
}

let db = loadData();

async function sendEmail({ to, subject, text, html }: { to: string; subject: string; text: string; html?: string }) {
  if (resend) {
    try {
      const result = await resend.emails.send({
        from: `${db.settings.companyName} <onboarding@resend.dev>`,
        to,
        subject,
        text,
        html,
      });
      console.log("[Resend] Email sent:", result);
      return { success: true };
    } catch (err: any) {
      console.error("[Resend] Error:", err?.message);
      return { success: false, error: err?.message };
    }
  }
  console.log(`[SIMULATED EMAIL] TO: ${to} | SUBJECT: ${subject}`);
  return { success: true, simulated: true };
}

// ── Settings ──────────────────────────────────────────────────────────────────
app.get("/api/settings", (req, res) => {
  res.json(db.settings);
});

app.post("/api/settings", (req, res) => {
  db.settings = { ...db.settings, ...req.body };
  saveData(db);
  res.json({ success: true, settings: db.settings });
});

// ── Submit Quote ──────────────────────────────────────────────────────────────
app.post("/api/submit-quote", async (req, res) => {
  const { name, phone, email, serviceType, description, urgency } = req.body;
  if (!name || !phone || !email || !serviceType || !description) {
    return res.status(400).json({ error: "Missing required fields." });
  }

  const cleanUrgency = urgency || "medium";
  const notificationEmail = db.settings.email;

  // Save lead
  const lead = {
    id: `quote_${Date.now()}`,
    type: "quote",
    name, phone, email, serviceType, description,
    urgency: cleanUrgency,
    createdAt: new Date().toISOString(),
    status: "dispatched"
  };
  db.leads.unshift(lead);
  saveData(db);

  // Email to business
  await sendEmail({
    to: notificationEmail,
    subject: `[LEAD] ${cleanUrgency.toUpperCase()}: ${serviceType} - ${name}`,
    text: `Nueva solicitud de quote:\n\nCliente: ${name}\nTeléfono: ${phone}\nEmail: ${email}\nServicio: ${serviceType}\nUrgencia: ${cleanUrgency.toUpperCase()}\n\nDescripción:\n${description}`,
  });

  // HTML confirmation to client
  const urgencyColor = cleanUrgency === "emergency" ? "#dc2626" : cleanUrgency === "high" ? "#ea580c" : cleanUrgency === "medium" ? "#d97706" : "#2563eb";
  const clientHtml = `<!DOCTYPE html><html><head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:32px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
        <tr><td style="background:linear-gradient(135deg,#0f172a,#1e3a5f);padding:32px 40px;">
          <h1 style="margin:0;color:#fff;font-size:22px;">🔧 ${db.settings.companyName}</h1>
          <p style="margin:6px 0 0;color:#94a3b8;font-size:14px;">Professional Plumbing Services</p>
        </td></tr>
        <tr><td style="padding:32px 40px;">
          <h2 style="margin:0 0 8px;color:#0f172a;">Quote Request Received ✅</h2>
          <p style="color:#475569;margin:0 0 24px;">Hi <strong>${name}</strong>, we received your request and will contact you at <strong>${phone}</strong> shortly.</p>
          <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;margin-bottom:24px;">
            <tr><td style="padding:20px 24px;">
              <p style="margin:0 0 12px;font-size:13px;font-weight:700;color:#64748b;text-transform:uppercase;">Your Request</p>
              <table width="100%">
                <tr><td style="padding:4px 0;color:#64748b;width:40%;">Service:</td><td style="color:#0f172a;font-weight:600;">${serviceType}</td></tr>
                <tr><td style="padding:4px 0;color:#64748b;">Urgency:</td><td><span style="background:${urgencyColor};color:#fff;font-size:11px;font-weight:700;padding:3px 10px;border-radius:99px;text-transform:uppercase;">${cleanUrgency}</span></td></tr>
                <tr><td style="padding:4px 0;color:#64748b;vertical-align:top;">Description:</td><td style="color:#334155;">${description}</td></tr>
              </table>
            </td></tr>
          </table>
          ${cleanUrgency === "emergency" ? `<div style="background:#fef2f2;border:1px solid #fca5a5;border-radius:8px;padding:16px 20px;margin-bottom:24px;"><p style="margin:0;color:#dc2626;font-weight:700;">🚨 Emergency? Call NOW: <strong>${db.settings.phone}</strong></p></div>` : ""}
          <p style="color:#64748b;font-size:13px;">Questions? Call <strong>${db.settings.phone}</strong> or reply to this email.</p>
        </td></tr>
        <tr><td style="background:#f8fafc;border-top:1px solid #e2e8f0;padding:20px 40px;text-align:center;">
          <p style="margin:0;color:#94a3b8;font-size:12px;">${db.settings.companyName} · ${db.settings.phone} · ${db.settings.email}</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;

  await sendEmail({
    to: email,
    subject: `Quote Request Received - ${db.settings.companyName}`,
    text: `Hi ${name}, we received your quote request for ${serviceType}. We will contact you at ${phone} shortly.\n\n${db.settings.companyName}\n${db.settings.phone}`,
    html: clientHtml,
  });

  res.json({ success: true, message: "Quote request received! We will contact you shortly." });
});

// ── Submit Contact ────────────────────────────────────────────────────────────
app.post("/api/submit-contact", async (req, res) => {
  const { name, email, phone, subject, message } = req.body;
  if (!name || !email || !message) {
    return res.status(400).json({ error: "Missing required fields." });
  }

  const lead = {
    id: `contact_${Date.now()}`,
    type: "contact",
    name, email, phone, subject, message,
    createdAt: new Date().toISOString(),
    status: "dispatched"
  };
  db.leads.unshift(lead);
  saveData(db);

  await sendEmail({
    to: db.settings.email,
    subject: `[CONTACT] ${subject || "New Message"} - ${name}`,
    text: `Name: ${name}\nEmail: ${email}\nPhone: ${phone || "N/A"}\n\n${message}`,
  });

  await sendEmail({
    to: email,
    subject: `We received your message - ${db.settings.companyName}`,
    text: `Hi ${name},\n\nThank you for contacting us. We will get back to you shortly.\n\n${db.settings.companyName}\n${db.settings.phone}`,
  });

  res.json({ success: true, message: "Message received!" });
});

// ── Plumbing AI Chat (RAG) ────────────────────────────────────────────────────
app.post("/api/chat", async (req, res) => {
  const { message, history } = req.body;
  if (!process.env.ANTHROPIC_API_KEY) {
    return res.json({ reply: "I'm sorry, the AI assistant is not configured. Please call us at " + db.settings.phone + " for immediate help." });
  }

  try {
    const systemPrompt = `You are an expert plumbing assistant for ${db.settings.companyName}, a professional plumbing company in NYC.

Your role is to:
1. Answer plumbing questions with expert knowledge and practical advice
2. Help diagnose plumbing issues based on symptoms described
3. Provide safety tips and precautionary measures
4. Give rough cost estimates when asked
5. Recommend when issues are emergencies vs. can wait
6. After helping, naturally suggest the user request a free quote if they need professional service

You have deep knowledge about:
- Pipe types (copper, PVC, PEX, galvanized steel)
- Common issues: leaks, clogs, low pressure, water heater problems, sewer issues
- Emergency situations: burst pipes, gas leaks, sewage backups
- NYC-specific plumbing codes and regulations
- Seasonal plumbing tips (winterizing, etc.)

Keep responses concise (2-4 sentences max unless explaining a complex issue). Be friendly and professional. If it's an emergency, always urge them to call ${db.settings.phone} immediately.

When it's natural, end your response with: "Would you like me to help you request a free quote from our team?"`;

    const anthropicRes = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY || "",
        "anthropic-version": "2023-06-01"
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 400,
        system: systemPrompt,
        messages: [
          ...(history || []).map((h: any) => ({ role: h.role, content: h.content })),
          { role: "user", content: message }
        ]
      })
    });

    const anthropicData = await anthropicRes.json();
    const reply = anthropicData.content?.[0]?.text || "I couldn't process that. Please call us at " + db.settings.phone;
    res.json({ reply });
  } catch (err: any) {
    console.error("[Chat] Error:", err?.message);
    res.json({ reply: `I'm having trouble right now. Please call us at ${db.settings.phone} for immediate assistance.` });
  }
});

// ── AI Estimate ───────────────────────────────────────────────────────────────
app.post("/api/ai-estimate", async (req, res) => {
  const { description } = req.body;
  if (!process.env.ANTHROPIC_API_KEY || !description) {
    return res.json({ category: "General Plumbing", urgency: "medium", estimatedCost: "$150 - $400", precautionaryAction: "Monitor the issue and call a plumber." });
  }

  try {
    const anthropicRes = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY || "",
        "anthropic-version": "2023-06-01"
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 300,
        messages: [{
          role: "user",
          content: `You are a plumbing expert. Analyze this issue and respond ONLY with valid JSON, no markdown: {"category":"...","urgency":"low|medium|high|emergency","estimatedCost":"$X - $Y","precautionaryAction":"..."}\n\nIssue: ${description}`
        }]
      })
    });
    const data = await anthropicRes.json();
    const text = data.content?.[0]?.text || "";
    const clean = text.replace(/```json|```/g, "").trim();
    res.json(JSON.parse(clean));
  } catch (err) {
    res.json({ category: "General Plumbing", urgency: "medium", estimatedCost: "$150 - $400", precautionaryAction: "Monitor the issue and call a plumber." });
  }
});

// ── Leads ─────────────────────────────────────────────────────────────────────
app.get("/api/leads", (req, res) => res.json(db.leads));

app.post("/api/leads/:id/status", (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  const lead = db.leads.find((l: any) => l.id === id);
  if (lead) {
    lead.status = status;
    saveData(db);
    res.json({ success: true });
  } else {
    res.status(404).json({ error: "Lead not found" });
  }
});

// ── Admin Auth ────────────────────────────────────────────────────────────────
app.post("/api/verify-passcode", (req, res) => {
  const { passcode } = req.body;
  if (passcode === db.adminPasscode) {
    res.json({ success: true });
  } else {
    res.status(401).json({ success: false, error: "Incorrect passcode." });
  }
});

app.post("/api/change-passcode", (req, res) => {
  const { currentPasscode, newPasscode } = req.body;
  if (currentPasscode !== db.adminPasscode) {
    return res.status(400).json({ success: false, error: "Current passcode is incorrect." });
  }
  db.adminPasscode = newPasscode;
  saveData(db);
  res.json({ success: true });
});

// ── Email Config ──────────────────────────────────────────────────────────────
app.get("/api/email-config", (req, res) => {
  res.json({
    configured: !!process.env.RESEND_API_KEY,
    provider: process.env.RESEND_API_KEY ? "Resend" : "Simulated",
    notificationEmail: db.settings.email
  });
});

export default app;
