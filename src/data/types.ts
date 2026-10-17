export type Trade = "HVAC" | "Plumbing" | "Electrical";

export type CrewColor = "blue" | "orange" | "green" | "purple" | "teal" | "rose";

export type Crew = {
  id: string;
  name: string;
  /** Two-letter code shown in avatars and on the schedule. */
  code: string;
  trade: Trade;
  color: CrewColor;
  /** Working hours as decimal hours, e.g. [7.5, 16.5]. */
  shift: [number, number];
};

export type Technician = {
  id: string;
  name: string;
  initials: string;
  crewId: string;
  color: CrewColor;
  position: "Lead" | "Apprentice";
  phone: string;
  hourlyRate: number;
};

export type ClientKind = "residential" | "commercial";

/** Service contract terms for commercial accounts. */
export type Sla = { responseHours: number; contract: string };

export type Client = {
  id: string;
  kind: ClientKind;
  name: string;
  /** The person we deal with: the homeowner, or the account's facilities contact. */
  contactName: string;
  phone: string;
  email: string;
  address: string;
  notes: string;
  sla: Sla | null;
  createdAt: string;
};

export type Equipment = { type: string; make: string; model: string; installed: number };

export type Site = {
  id: string;
  clientId: string;
  name: string;
  address: string;
  equipment: Equipment[];
  notes: string;
};

export type JobStatus = "Unassigned" | "Scheduled" | "En route" | "On site" | "Completed";

export type Priority = "Emergency" | "Urgent" | "Routine";

export type JobSource = "Online" | "Phone" | "Contract";

export type PartUsed = { partId: string; qty: number };

export type CloseOut = {
  notes: string;
  parts: PartUsed[];
  /** Photo data URLs captured on site. */
  photos: string[];
  signedBy: string;
  /** Signature image data URL, if captured. */
  signature: string | null;
};

/** Timestamps use local time in the form YYYY-MM-DDTHH:MM. */
export type Job = {
  id: string;
  title: string;
  trade: Trade;
  priority: Priority;
  source: JobSource;
  clientId: string;
  siteId: string;
  address: string;
  requestedAt: string;
  date: string;
  time: string;
  duration: number;
  crewId: string | null;
  status: JobStatus;
  enRouteAt: string | null;
  arrivedAt: string | null;
  completedAt: string | null;
  firstTimeFix: boolean | null;
  closeOut: CloseOut | null;
  quote: { amount: number; sentAt: string | null };
  deposit: { amount: number; receivedAt: string | null };
  paidAt: string | null;
  notes: string;
};

export type MessageKind = "booking" | "booked" | "en-route" | "done";

/** A text message to a customer. The demo shows these in an outbox instead of sending them. */
export type Message = { id: string; jobId: string; clientId: string; to: string; kind: MessageKind; body: string; at: string };

export type Settings = {
  /** When the customer gets the "on the way" text: when a crew is assigned, or when the tech taps On my way. */
  enRouteText: "assign" | "on-my-way";
};

export type AuditEntry = { id: string; at: string; actor: string; action: string };

export type Role = { kind: "office" } | { kind: "tech"; techId: string } | { kind: "client"; clientId: string };

export type PaymentStage = "Not quoted" | "Quoted" | "Deposit paid" | "Paid";

export type CrmState = {
  version: 3;
  crews: Crew[];
  technicians: Technician[];
  clients: Client[];
  sites: Site[];
  jobs: Job[];
  messages: Message[];
  audit: AuditEntry[];
  settings: Settings;
  currency: string;
};
