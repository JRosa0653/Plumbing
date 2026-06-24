export interface DiagnosticResult {
  category: string;
  urgency: "low" | "medium" | "high" | "emergency";
  steps: string[];
  costRange: string;
  explanation: string;
}

export interface QuoteLead {
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
}

export interface ContactLead {
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
}

export type Lead = QuoteLead | ContactLead;
