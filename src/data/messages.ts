import { COMPANY } from "../brand";
import { formatDate, formatTime } from "./dates";
import type { Client, CrmState, Job, Message, MessageKind } from "./types";

export const MESSAGE_LABEL: Record<MessageKind, string> = {
  booking: "Booking received",
  booked: "Crew booked",
  "en-route": "On the way",
  done: "Job done",
};

function firstName(client: Client | undefined) {
  return client?.contactName.split(" ")[0] ?? "there";
}

/** The customer text for a moment in the job, using the crew lead's name where it helps. */
export function composeMessage(kind: MessageKind, job: Job, state: Pick<CrmState, "clients" | "crews" | "technicians">, at: string): Message {
  const client = state.clients.find((item) => item.id === job.clientId);
  const lead = state.technicians.find((tech) => tech.crewId === job.crewId && tech.position === "Lead") ?? state.technicians.find((tech) => tech.crewId === job.crewId);
  const service = job.title.toLowerCase();
  const hi = `Hi ${firstName(client)},`;
  const body = {
    booking: `${hi} thanks for booking a ${service} with ${COMPANY.name}. Your reference is ${job.id}. We'll text you as soon as a crew is booked.`,
    booked: `${hi} your ${service} is booked for ${formatDate(job.date, { weekday: "long", month: "short", day: "numeric" })} at ${formatTime(job.time)}. ${lead ? `${lead.name} will lead the visit.` : ""} Reply C to change the time.`,
    "en-route": `${hi} ${lead?.name.split(" ")[0] ?? "your technician"} from ${COMPANY.short} is on the way to ${job.address.split(",")[0]} and should arrive in about 25 minutes.`,
    done: `${hi} your ${service} is complete. Your job report is ready: northline.example/r/${job.id}. Thanks for choosing ${COMPANY.short}!`,
  }[kind];
  return { id: `SMS-${job.id}-${kind}-${at.replace(/\D/g, "")}`, jobId: job.id, clientId: job.clientId, to: client?.phone ?? "", kind, body: body.replace(/\s+/g, " ").trim(), at };
}
