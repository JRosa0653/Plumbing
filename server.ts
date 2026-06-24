import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import nodemailer from "nodemailer";
import { google } from "googleapis";
import { Resend } from "resend";

// Initialize Resend if API key is available
const resendClient = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

// Initialize express app
const app = express();
const PORT = 3000;

// Middleware for body parsing
app.use(express.json());

// In-memory databases for capturing leads
interface QuoteLead {
  id: string;
  type: "quote";
  name: string;
  phone: string;
  email: string;
  serviceType: string;
  description: string;
  urgency: "low" | "medium" | "high" | "emergency";
  createdAt: string;
  emailSentTo: string;
  emailStatus: "delivered" | "failed";
  emailSubject: string;
  simulatedNotification: string;
  status?: "not dispatched" | "dispatched" | "in progress";
  aiDiagnostic?: {
    suggestedCategory: string;
    precautionaryAction: string;
    estimatedCostRange: string;
  };
}

interface ContactLead {
  id: string;
  type: "contact";
  name: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
  createdAt: string;
  emailSentTo: string;
  emailStatus: "delivered" | "failed";
  emailSubject: string;
  simulatedNotification: string;
  status?: "not dispatched" | "dispatched" | "in progress";
}

const leads: (QuoteLead | ContactLead)[] = [];

// Dynamic content settings database
interface AppSettings {
  companyName: string;
  phone: string;
  email: string;
  whatsapp: string;
  emergencyAlert: string;
  heroTitle: string;
  heroSubtitle: string;
  mapLatitude: number;
  mapLongitude: number;
  mapZoom: number;
  mapAddress: string;
  mapMarkerTitle: string;
}

let adminPasscode = "admin123";

let appSettings: AppSettings = {
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

let smtpSettings = {
  host: process.env.SMTP_HOST || "",
  port: process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT, 10) : 587,
  secure: process.env.SMTP_SECURE === "true",
  user: process.env.SMTP_USER || "",
  pass: process.env.SMTP_PASS || "",
  from: process.env.EMAIL_FROM || ""
};

// ─── Gmail OAuth2 Settings ────────────────────────────────────────────────────
// Set in .env: GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REFRESH_TOKEN, GMAIL_USER
const gmailOAuth2Settings = {
  clientId: process.env.GOOGLE_CLIENT_ID || "",
  clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
  refreshToken: process.env.GOOGLE_REFRESH_TOKEN || "",
  user: process.env.GMAIL_USER || process.env.SMTP_USER || "",
};

function isGmailOAuth2Configured() {
  return !!(
    gmailOAuth2Settings.clientId &&
    gmailOAuth2Settings.clientSecret &&
    gmailOAuth2Settings.refreshToken &&
    gmailOAuth2Settings.user
  );
}

async function getGmailAccessToken(): Promise<string> {
  const oauth2Client = new google.auth.OAuth2(
    gmailOAuth2Settings.clientId,
    gmailOAuth2Settings.clientSecret,
    "https://developers.google.com/oauthplayground"
  );
  oauth2Client.setCredentials({ refresh_token: gmailOAuth2Settings.refreshToken });
  const { token } = await oauth2Client.getAccessToken();
  if (!token) throw new Error("Failed to retrieve Gmail OAuth2 access token");
  return token;
}

async function sendGmailOAuth2({ to, subject, text, html }: { to: string; subject: string; text: string; html?: string }) {
  const accessToken = await getGmailAccessToken();
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      type: "OAuth2",
      user: gmailOAuth2Settings.user,
      clientId: gmailOAuth2Settings.clientId,
      clientSecret: gmailOAuth2Settings.clientSecret,
      refreshToken: gmailOAuth2Settings.refreshToken,
      accessToken,
    },
  } as any);

  const from = `"${appSettings.companyName}" <${gmailOAuth2Settings.user}>`;
  const info = await transporter.sendMail({ from, to, subject, text, html });
  console.log(`[Gmail OAuth2] Email sent to ${to}: MessageID=${info.messageId}`);
  return { success: true, messageId: info.messageId };
}
// ──────────────────────────────────────────────────────────────────────────────


let mailTransporter: any = null;

function getMailTransporter(forceRecreate = false) {
  if (mailTransporter === null || forceRecreate) {
    const host = smtpSettings.host || process.env.SMTP_HOST;
    const port = smtpSettings.port || (process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT, 10) : 587);
    const user = smtpSettings.user || process.env.SMTP_USER;
    const pass = smtpSettings.pass || process.env.SMTP_PASS;
    const secure = smtpSettings.secure !== undefined ? smtpSettings.secure : (process.env.SMTP_SECURE === "true");

    if (host && user && pass) {
      console.log(`Initializing SMTP mail transporter: ${host}:${port} (user: ${user}, secure: ${secure})`);
      mailTransporter = nodemailer.createTransport({
        host,
        port: typeof port === 'string' ? parseInt(port, 10) : port,
        secure: String(secure) === "true",
        auth: {
          user,
          pass,
        },
      });
    } else {
      mailTransporter = false; // Flag that SMTP is unconfigured
      console.log("SMTP Mail parameters are not configured. Emails will be logged to console and simulated.");
    }
  }
  return mailTransporter;
}

async function sendRealEmail({ to, subject, text, html, forceRecreate = false }: { to: string; subject: string; text: string; html?: string; forceRecreate?: boolean }) {
  // ── Prefer Resend if API key is configured ──
  if (resendClient) {
    try {
      const from = `${appSettings.companyName} <onboarding@resend.dev>`;
      const result = await resendClient.emails.send({ from, to, subject, text, html });
      console.log(`[Resend] Email sent to ${to}:`, result);
      return { success: true, messageId: result.data?.id };
    } catch (err: any) {
      console.error("[Resend] Failed, falling back:", err?.message);
    }
  }

  // ── Fallback: Gmail OAuth2 ──
  if (isGmailOAuth2Configured()) {
    try {
      return await sendGmailOAuth2({ to, subject, text, html });
    } catch (err: any) {
      console.error("[Gmail OAuth2] Failed, falling back to SMTP:", err?.message);
    }
  }

  // ── Fallback: SMTP transporter / Simulated ──
  const transporter = getMailTransporter(forceRecreate);
  const from = smtpSettings.from || process.env.EMAIL_FROM || `"${appSettings.companyName}" <no-reply@nyceliteplumbing.com>`;
  
  if (transporter) {
    try {
      const info = await transporter.sendMail({
        from,
        to,
        subject,
        text,
        html,
      });
      console.log(`Email successfully sent to ${to}: MessageID=${info.messageId}`);
      return { success: true, messageId: info.messageId };
    } catch (err: any) {
      console.error(`Failed to send email to ${to}:`, err);
      return { success: false, error: err?.message || err?.toString() || "Unknown mail error" };
    }
  } else {
    console.log(`[SIMULATED EMAIL DELIVERY]
========================================
FROM: ${from}
TO: ${to}
SUBJECT: ${subject}
----------------------------------------
${text}
========================================`);
    return { success: true, simulated: true };
  }
}


const IS_VERCEL = !!process.env.VERCEL;
const ORIGINAL_DATA_FILE = path.join(process.cwd(), "persistent_data.json");
const DATA_FILE = IS_VERCEL ? path.join("/tmp", "persistent_data.json") : ORIGINAL_DATA_FILE;

function loadData() {
  try {
    // If on Vercel and the /tmp data file doesn't exist yet, try to copy the original file to /tmp
    if (IS_VERCEL && !fs.existsSync(DATA_FILE)) {
      if (fs.existsSync(ORIGINAL_DATA_FILE)) {
        try {
          fs.copyFileSync(ORIGINAL_DATA_FILE, DATA_FILE);
          console.log("[STORAGE] Successfully copied original persistent_data.json to writable /tmp");
        } catch (copyErr) {
          console.error("[STORAGE] Failed to copy original persistent_data.json to /tmp:", copyErr);
        }
      }
    }

    if (fs.existsSync(DATA_FILE)) {
      const data = JSON.parse(fs.readFileSync(DATA_FILE, "utf-8"));
      if (data.adminPasscode) {
        adminPasscode = data.adminPasscode;
      }
      if (data.appSettings) {
        appSettings = { ...appSettings, ...data.appSettings };
      }
      if (data.smtpSettings) {
        smtpSettings = { ...smtpSettings, ...data.smtpSettings };
      }
      if (Array.isArray(data.leads)) {
        leads.length = 0;
        leads.push(...data.leads);
      }
      console.log(`[STORAGE] Persistent data loaded successfully from: ${DATA_FILE}`);
    }
  } catch (err) {
    console.error("[STORAGE] Error loading persistent data:", err);
  }
}

function saveData() {
  try {
    const data = {
      adminPasscode,
      appSettings,
      smtpSettings,
      leads
    };
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), "utf-8");
    console.log(`[STORAGE] Persistent data saved successfully to: ${DATA_FILE}`);
  } catch (err) {
    console.error("[STORAGE] Error saving persistent data:", err);
  }
}

// Hydrate state from file
loadData();

// Lazy-initialized Gemini AI client
let aiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.warn("GEMINI_API_KEY environment variable is not defined. AI features will run in simulation mode.");
    }
    aiClient = new GoogleGenAI({
      apiKey: apiKey || "MOCK_KEY",
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return aiClient;
}

// 1. API: Estimate plumbing cost & diagnose problem using Gemini
app.post("/api/estimate", async (req, res) => {
  const { description } = req.body;

  if (!description || typeof description !== "string") {
    return res.status(400).json({ error: "Please provide a valid problem description." });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    // Graceful mock mode if API key is not available
    return res.json({
      category: "General Plumbing Care",
      urgency: "medium",
      steps: [
        "Locate your nearest water isolation valve.",
        "Clear the surrounding area to allow our plumbers quick access.",
        "Do not apply heavy chemicals which might damage pipes further."
      ],
      costRange: "$150 - $350",
      explanation: "This is a pre-estimate for general plumbing troubleshooting. Please request a full free quote for exact pricing."
    });
  }

  try {
    const ai = getGeminiClient();
    const prompt = `You are an expert plumbing diagnostics assistant for 'Your Plumbing Company'. 
Analyze the customer's plumbing issue described below:
"${description}"

Provide:
1. The most likely category of the plumbing problem (e.g. Clogged Drain, Burst Pipe, Water Heater Malfunction, Faucet Leak, Sewer Line).
2. The urgency level of the issue (low, medium, high, emergency).
3. 3 immediate, clear action steps the customer should take to prevent property damage before the plumber arrives.
4. A realistic plumbing cost range (e.g. "$120 - $250", "$800 - $1,500") based on US national averages for this type of service.
5. A brief, reassuring explanation of the diagnosis.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            category: { type: Type.STRING, description: "Problem category" },
            urgency: { type: Type.STRING, description: "low, medium, high, or emergency" },
            steps: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "3 simple, actionable preventative steps"
            },
            costRange: { type: Type.STRING, description: "Estimated price range e.g. $150 - $300" },
            explanation: { type: Type.STRING, description: "Short customer-friendly explanation" }
          },
          required: ["category", "urgency", "steps", "costRange", "explanation"]
        }
      }
    });

    const resultText = response.text;
    if (!resultText) {
      throw new Error("No response text from Gemini API.");
    }

    const parsed = JSON.parse(resultText.trim());
    res.json(parsed);

  } catch (error: any) {
    console.error("Gemini diagnostics error:", error);
    res.status(500).json({
      error: "AI estimation failed. Please use our standard free quote request form directly.",
      details: error.message
    });
  }
});

// 2. API: Submit a Free Quote Request
app.post("/api/submit-quote", async (req, res) => {
  const { name, phone, email, serviceType, description, urgency } = req.body;

  if (!name || !phone || !email || !serviceType || !description) {
    return res.status(400).json({ error: "Missing required fields for a quote request." });
  }

  const cleanUrgency = urgency || "medium";
  const notificationEmail = "rosariojorge0607@gmail.com";
  const subject = "New Plumbing Quote Request";

  // Using Gemini to draft a professional, instant email payload that notifies the business
  let simulatedNotification = "";
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey) {
      const ai = getGeminiClient();
      const emailPrompt = `Create a professional notification email for Your Plumbing Company.
A new quote request has been received on the website.
Details:
- Customer Name: ${name}
- Phone: ${phone}
- Email: ${email}
- Service Type: ${serviceType}
- Urgency: ${cleanUrgency}
- Customer Description: ${description}

Write a concise email body summarizing this lead, alerting the team that this requires urgent follow up (if emergency/high). Include a link to reply. Keep it in plain text format.`;
      
      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: emailPrompt
      });
      simulatedNotification = response.text || "";
    }
  } catch (e) {
    console.warn("Failed to generate AI email text, using backup template:", e);
  }

  if (!simulatedNotification) {
    simulatedNotification = `[ALERT: NEW WEBSITE LEAD]
Hello Team,
You have received a new plumbing quote request.

--- CUSTOMER DETAILS ---
Name: ${name}
Phone: ${phone}
Email: ${email}
Requested Service: ${serviceType}
Urgency Level: ${cleanUrgency.toUpperCase()}

--- CUSTOMER DESCRIPTION ---
${description}

Please follow up with this customer immediately.
- Your Plumbing Company Lead Center`;
  }

  // Save lead in memory
  const newLead: QuoteLead = {
    id: `quote_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
    type: "quote",
    name,
    phone,
    email,
    serviceType,
    description,
    urgency: cleanUrgency,
    createdAt: new Date().toISOString(),
    emailSentTo: notificationEmail,
    emailStatus: "delivered",
    emailSubject: subject,
    simulatedNotification,
    status: "dispatched"
  };

  leads.unshift(newLead);
  saveData();

  // Send email to business/plumber (rosariojorge0607@gmail.com)
  const businessSubject = `[PLUMBING LEAD] ${cleanUrgency.toUpperCase()} Urgency: ${serviceType} from ${name}`;
  const bizResult = await sendRealEmail({
    to: notificationEmail,
    subject: businessSubject,
    text: simulatedNotification
  });

  if (bizResult && !bizResult.success) {
    newLead.emailStatus = "failed";
  }

  // Send confirmation email to the client (plain text + HTML)
  const clientSubject = `Free Quote Request Received - ${appSettings.companyName}`;
  const clientText = `Hello ${name},

Thank you for choosing ${appSettings.companyName}. We have received your request for a free plumbing quote.

Our team of professional dispatchers is currently reviewing your details, and one of our master plumbers will contact you shortly at ${phone} to discuss your request or schedule a visit.

--- YOUR REQUEST DETAILS ---
Service Type: ${serviceType}
Urgency Level: ${cleanUrgency.toUpperCase()}
Description: ${description}

If this is an active, uncontrolled emergency, please call us immediately at our 24/7 hotline: ${appSettings.phone}

Best regards,
${appSettings.companyName}
Dispatch & Support Team
Tel: ${appSettings.phone}
Email: ${appSettings.email}`;

  const urgencyColor = cleanUrgency === "emergency" ? "#dc2626" : cleanUrgency === "high" ? "#ea580c" : cleanUrgency === "medium" ? "#d97706" : "#2563eb";
  const clientHtml = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:32px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
        <!-- Header -->
        <tr><td style="background:linear-gradient(135deg,#0f172a 0%,#1e3a5f 100%);padding:32px 40px;">
          <h1 style="margin:0;color:#fff;font-size:22px;font-weight:700;">🔧 ${appSettings.companyName}</h1>
          <p style="margin:6px 0 0;color:#94a3b8;font-size:14px;">Professional Plumbing Services — NYC</p>
        </td></tr>
        <!-- Body -->
        <tr><td style="padding:32px 40px;">
          <h2 style="margin:0 0 8px;color:#0f172a;font-size:20px;">Quote Request Received ✅</h2>
          <p style="color:#475569;margin:0 0 24px;font-size:15px;">Hi <strong>${name}</strong>, thank you for reaching out! We've received your request and our team will contact you shortly at <strong>${phone}</strong>.</p>
          <!-- Details Card -->
          <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;margin-bottom:24px;">
            <tr><td style="padding:20px 24px;">
              <p style="margin:0 0 12px;font-size:13px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:0.05em;">Your Request Details</p>
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding:6px 0;font-size:14px;color:#64748b;width:40%;">Service:</td>
                  <td style="padding:6px 0;font-size:14px;color:#0f172a;font-weight:600;">${serviceType}</td>
                </tr>
                <tr>
                  <td style="padding:6px 0;font-size:14px;color:#64748b;">Urgency:</td>
                  <td style="padding:6px 0;"><span style="background:${urgencyColor};color:#fff;font-size:11px;font-weight:700;padding:3px 10px;border-radius:99px;text-transform:uppercase;">${cleanUrgency}</span></td>
                </tr>
                <tr>
                  <td style="padding:6px 0;font-size:14px;color:#64748b;vertical-align:top;">Description:</td>
                  <td style="padding:6px 0;font-size:14px;color:#334155;">${description}</td>
                </tr>
              </table>
            </td></tr>
          </table>
          ${cleanUrgency === "emergency" ? `<div style="background:#fef2f2;border:1px solid #fca5a5;border-radius:8px;padding:16px 20px;margin-bottom:24px;">
            <p style="margin:0;color:#dc2626;font-weight:700;font-size:14px;">🚨 Emergency? Call us NOW:</p>
            <p style="margin:4px 0 0;font-size:22px;font-weight:900;color:#dc2626;">${appSettings.phone}</p>
          </div>` : ""}
          <p style="color:#64748b;font-size:13px;margin:0;">Questions? Reply to this email or call <strong>${appSettings.phone}</strong>.</p>
        </td></tr>
        <!-- Footer -->
        <tr><td style="background:#f8fafc;border-top:1px solid #e2e8f0;padding:20px 40px;text-align:center;">
          <p style="margin:0;color:#94a3b8;font-size:12px;">${appSettings.companyName} · ${appSettings.phone} · ${appSettings.email}</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

  await sendRealEmail({
    to: email,
    subject: clientSubject,
    text: clientText,
    html: clientHtml
  });

  // Re-save since we might have updated emailStatus to "failed"
  saveData();

  console.log(`[EMAIL DISPATCHED] Instant quote lead email sent to business (${notificationEmail}) and confirmation to client (${email}). Status: ${newLead.emailStatus}`);

  res.json({
    success: true,
    message: "Thank you! Your quote request has been received. A member of our team will contact you shortly.",
    lead: newLead
  });
});

// 3. API: Submit Contact Form Request
app.post("/api/submit-contact", async (req, res) => {
  const { name, email, phone, subject, message } = req.body;

  if (!name || !email || !message) {
    return res.status(400).json({ error: "Missing required fields for contact request." });
  }

  const notificationEmail = "rosariojorge0607@gmail.com";
  const emailSubject = "New Website Contact Request";

  // Draft a simulated email notification using Gemini
  let simulatedNotification = "";
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey) {
      const ai = getGeminiClient();
      const emailPrompt = `Create a professional contact form notification email.
A user has submitted the general contact form.
Details:
- Name: ${name}
- Email: ${email}
- Phone: ${phone || "Not provided"}
- Subject: ${subject || "General Inquiry"}
- Message: ${message}

Write a professional notification message. Keep it concise, professional, and in plain text format.`;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: emailPrompt
      });
      simulatedNotification = response.text || "";
    }
  } catch (e) {
    console.warn("Failed to generate AI contact email text:", e);
  }

  if (!simulatedNotification) {
    simulatedNotification = `[ALERT: GENERAL INQUIRY]
Hello Team,
A customer has reached out via the website contact form.

--- INQUIRY DETAILS ---
Name: ${name}
Email: ${email}
Phone: ${phone || "Not provided"}
Subject: ${subject || "General Inquiry"}

--- MESSAGE ---
${message}

- Your Plumbing Company Website Support`;
  }

  const newLead: ContactLead = {
    id: `contact_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
    type: "contact",
    name,
    email,
    phone: phone || "",
    subject: subject || "General Inquiry",
    message,
    createdAt: new Date().toISOString(),
    emailSentTo: notificationEmail,
    emailStatus: "delivered",
    emailSubject,
    simulatedNotification,
    status: "dispatched"
  };

  leads.unshift(newLead);
  saveData();

  // Send email to business/plumber (rosariojorge0607@gmail.com)
  const businessSubject = `[CONTACT INQUIRY] Subject: ${subject || "General Inquiry"} from ${name}`;
  const bizResult = await sendRealEmail({
    to: notificationEmail,
    subject: businessSubject,
    text: simulatedNotification
  });

  if (bizResult && !bizResult.success) {
    newLead.emailStatus = "failed";
  }

  // Send confirmation email to client
  const clientSubject = `Contact Request Received - ${appSettings.companyName}`;
  const clientText = `Hello ${name},

Thank you for reaching out to ${appSettings.companyName}. We have received your message regarding: "${subject || "General Inquiry"}".

Our team is reviewing your message, and we will get back to you as soon as possible via email (${email}) or phone (${phone || "N/A"}).

--- YOUR MESSAGE ---
Subject: ${subject || "General Inquiry"}
Message:
${message}

If this is an active plumbing emergency, please do not wait for an email reply. Call us immediately at our 24/7 emergency hotline: ${appSettings.phone}

Best regards,
${appSettings.companyName}
Customer Support Team
Tel: ${appSettings.phone}
Email: ${appSettings.email}`;

  await sendRealEmail({
    to: email,
    subject: clientSubject,
    text: clientText
  });

  // Re-save since we might have updated emailStatus to "failed"
  saveData();

  console.log(`[EMAIL DISPATCHED] Instant contact lead email sent to business (${notificationEmail}) and confirmation to client (${email}). Status: ${newLead.emailStatus}`);

  res.json({
    success: true,
    message: "Thank you for contacting us. We will get back to you as soon as possible.",
    lead: newLead
  });
});

// 4. API: Retrieve All Captured Leads (For the Real-time Lead Tracker Dashboard)
app.get("/api/leads", (req, res) => {
  res.json({ leads });
});

// 4.5 API: Update single lead status
app.post("/api/leads/:id/status", (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  
  if (!["not dispatched", "dispatched", "in progress"].includes(status)) {
    return res.status(400).json({ success: false, message: "Invalid status value" });
  }

  const lead = leads.find(l => l.id === id);
  if (lead) {
    lead.status = status;
    saveData();
    res.json({ success: true, message: `Status updated to ${status}`, lead });
  } else {
    res.status(404).json({ success: false, message: "Lead not found" });
  }
});

// 5. API: Reset leads array (for clean testing)
app.post("/api/leads/clear", (req, res) => {
  leads.length = 0;
  saveData();
  res.json({ success: true, message: "Lead database cleared successfully." });
});

// 6. API: Get Application Settings
app.get("/api/settings", (req, res) => {
  res.json(appSettings);
});

// 7. API: Update Application Settings
app.post("/api/settings", (req, res) => {
  const { 
    companyName, 
    phone, 
    email, 
    whatsapp, 
    emergencyAlert, 
    heroTitle, 
    heroSubtitle,
    mapLatitude,
    mapLongitude,
    mapZoom,
    mapAddress,
    mapMarkerTitle
  } = req.body;
  
  if (companyName !== undefined) appSettings.companyName = companyName;
  if (phone !== undefined) appSettings.phone = phone;
  if (email !== undefined) appSettings.email = email;
  if (whatsapp !== undefined) appSettings.whatsapp = whatsapp;
  if (emergencyAlert !== undefined) appSettings.emergencyAlert = emergencyAlert;
  if (heroTitle !== undefined) appSettings.heroTitle = heroTitle;
  if (heroSubtitle !== undefined) appSettings.heroSubtitle = heroSubtitle;
  if (mapLatitude !== undefined) appSettings.mapLatitude = parseFloat(mapLatitude);
  if (mapLongitude !== undefined) appSettings.mapLongitude = parseFloat(mapLongitude);
  if (mapZoom !== undefined) appSettings.mapZoom = parseInt(mapZoom, 10);
  if (mapAddress !== undefined) appSettings.mapAddress = mapAddress;
  if (mapMarkerTitle !== undefined) appSettings.mapMarkerTitle = mapMarkerTitle;
  
  saveData();
  res.json({ success: true, message: "Application settings updated successfully.", settings: appSettings });
});

// 8. API: Verify Admin Passcode
app.post("/api/verify-passcode", (req, res) => {
  const { passcode } = req.body;
  if (passcode === adminPasscode) {
    res.json({ success: true, message: "Passcode is valid." });
  } else {
    res.status(401).json({ success: false, error: "Incorrect passcode. Please try again." });
  }
});

// 9. API: Change Admin Passcode
app.post("/api/change-passcode", (req, res) => {
  const { currentPasscode, newPasscode } = req.body;
  
  if (currentPasscode !== adminPasscode) {
    return res.status(400).json({ success: false, error: "The current passcode is incorrect." });
  }
  
  if (!newPasscode || newPasscode.trim().length < 4) {
    return res.status(400).json({ success: false, error: "New passcode must be at least 4 characters long." });
  }
  
  adminPasscode = newPasscode;
  saveData();
  console.log("[SECURITY] Administrative passcode changed successfully.");
  res.json({ success: true, message: "Administrative passcode changed successfully." });
});

// 10. API: Email Configuration Status
app.get("/api/email-config", (req, res) => {
  res.json({
    host: smtpSettings.host || process.env.SMTP_HOST || "",
    port: smtpSettings.port || process.env.SMTP_PORT || "587",
    user: smtpSettings.user || process.env.SMTP_USER || "",
    hasPass: !!(smtpSettings.pass || process.env.SMTP_PASS),
    secure: smtpSettings.secure !== undefined ? String(smtpSettings.secure) : (process.env.SMTP_SECURE || "false"),
    from: smtpSettings.from || process.env.EMAIL_FROM || "",
    configured: !!((smtpSettings.host || process.env.SMTP_HOST) && (smtpSettings.user || process.env.SMTP_USER) && (smtpSettings.pass || process.env.SMTP_PASS)),
    notificationEmail: "rosariojorge0607@gmail.com"
  });
});

// 10.5 API: Save Email Configuration
app.post("/api/email-config", (req, res) => {
  const { host, port, user, pass, secure, from } = req.body;

  if (host !== undefined) smtpSettings.host = host;
  if (port !== undefined) smtpSettings.port = typeof port === 'string' ? parseInt(port, 10) : port;
  if (user !== undefined) smtpSettings.user = user;
  if (pass !== undefined) smtpSettings.pass = pass;
  if (secure !== undefined) smtpSettings.secure = secure === "true" || secure === true;
  if (from !== undefined) smtpSettings.from = from;

  saveData();
  
  // Force recreation of transporter on next send
  mailTransporter = null;

  res.json({
    success: true,
    message: "SMTP configuration updated successfully.",
    config: {
      host: smtpSettings.host,
      port: smtpSettings.port,
      user: smtpSettings.user,
      hasPass: !!smtpSettings.pass,
      secure: smtpSettings.secure,
      from: smtpSettings.from,
      configured: !!(smtpSettings.host && smtpSettings.user && smtpSettings.pass)
    }
  });
});

// 11. API: Test Email sending
app.post("/api/test-email", async (req, res) => {
  const { testEmail } = req.body;
  const target = testEmail || "rosariojorge0607@gmail.com";
  
  console.log(`[SMTP TEST] Request to send test email to ${target}`);
  
  const result = await sendRealEmail({
    to: target,
    subject: `Test Email Connection - ${appSettings.companyName}`,
    text: `This is a test email from the ${appSettings.companyName} Administrative Panel.
If you are reading this message, your SMTP settings are configured 100% CORRECTLY and email delivery is fully functional!

Tested at: ${new Date().toISOString()}
Tested Email: ${target}`,
    forceRecreate: true // Force recreation of the transporter to ensure we use the latest environment variables
  });

  if (result.success) {
    res.json({ 
      success: true, 
      simulated: result.simulated || false,
      message: result.simulated 
        ? "El email se ha SIMULADO en la consola del servidor (SMTP no está configurado)." 
        : `¡Email de prueba enviado exitosamente a ${target}!`
    });
  } else {
    res.status(500).json({ 
      success: false, 
      error: result.error || "Unknown SMTP error occurred." 
    });
  }
});

// Serve generated images statically for Favicon & Social Meta Tags (both dev & production)
app.use("/assets/images", express.static(path.join(process.cwd(), "public/assets/images")));

// Serve frontend assets
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    // In development mode, mount the Vite development middleware
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
    console.log("Vite development server middleware loaded.");
  } else {
    // In production mode, serve built static assets
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
    console.log("Production static files serving from:", distPath);
  }

  // Bind to 0.0.0.0 and port 3000 as required by the Cloud Run environment
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT} at http://0.0.0.0:${PORT}`);
  });
}

if (!process.env.VERCEL) {
  startServer().catch((err) => {
    console.error("Failed to start full-stack server:", err);
  });
}

export default app;
