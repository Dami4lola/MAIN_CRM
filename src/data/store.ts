import { useEffect, useMemo, useRef, useState } from "react";
import { nowStamp, todayISO } from "./dates";
import { composeMessage } from "./messages";
import { nextStatus } from "./ops";
import { createSeed } from "./seed";
import type { Client, CloseOut, CrmState, Job, JobStatus, Message, MessageKind, Settings } from "./types";

const STORAGE_KEY = "northline-field-ops-v3";
const AUDIT_LIMIT = 500;

export type ClientInput = Omit<Client, "id" | "createdAt">;

export type JobInput = Pick<Job, "title" | "trade" | "priority" | "clientId" | "siteId" | "date" | "time" | "duration" | "crewId" | "notes"> & {
  quoteAmount: number;
};

/** What a customer fills in on the online booking page. */
export type BookingInput = Pick<Job, "title" | "trade" | "priority" | "date" | "time" | "duration"> & {
  description: string;
  estimate: [number, number];
  name: string;
  phone: string;
  email: string;
  address: string;
};

export type PaymentStep = "quote" | "deposit" | "paid";

export function isCrmState(value: unknown): value is CrmState {
  const state = value as CrmState;
  return (
    Boolean(state) &&
    state.version === 3 &&
    [state.crews, state.technicians, state.clients, state.sites, state.jobs, state.messages, state.audit].every(Array.isArray) &&
    Boolean(state.settings) &&
    typeof state.currency === "string"
  );
}

function load(): CrmState {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed: unknown = JSON.parse(raw);
      if (isCrmState(parsed)) return parsed;
    }
  } catch {
    // Storage unavailable or corrupt: fall back to demo data.
  }
  return createSeed();
}

function newId(prefix: string) {
  return `${prefix}-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}`;
}

function nextJobId(jobs: Job[]) {
  const highest = jobs.reduce((max, job) => Math.max(max, Number(job.id.replace(/\D/g, "")) || 0), 10000);
  return `JB-${highest + 1}`;
}

const digits = (value: string) => value.replace(/\D/g, "");

/** Keep the status in step with whether a crew is assigned. */
function statusForCrew(status: JobStatus, crewId: string | null): JobStatus {
  if (!crewId && status === "Scheduled") return "Unassigned";
  if (crewId && status === "Unassigned") return "Scheduled";
  return status;
}

function text(state: CrmState, job: Job, kind: MessageKind): Message {
  return { ...composeMessage(kind, job, state, nowStamp()), id: newId("SMS") };
}

/** Texts owed when a job is booked onto a crew, or moved to a new crew, day or time. */
function bookingTexts(state: CrmState, before: Job | undefined, after: Job): Message[] {
  if (!after.crewId || after.status !== "Scheduled") return [];
  const changed = !before || before.crewId !== after.crewId || before.date !== after.date || before.time !== after.time;
  if (!changed) return [];
  const texts = [text(state, after, "booked")];
  if (state.settings.enRouteText === "assign") texts.push(text(state, after, "en-route"));
  return texts;
}

export function useCrmStore() {
  const [state, setState] = useState<CrmState>(load);
  const [saveFailed, setSaveFailed] = useState(false);
  const actor = useRef("System");
  // The latest state, for ids that callers need back straight away.
  const latest = useRef(state);
  latest.current = state;
  // What this window last wrote, so changes that arrive from another window aren't written back.
  const written = useRef("");
  // The last job number handed out, so two jobs created before a re-render never share a number.
  const lastJobNumber = useRef(0);

  useEffect(() => {
    const raw = JSON.stringify(state);
    if (raw === written.current) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, raw);
      written.current = raw;
      setSaveFailed(false);
    } catch {
      // Storage full or unavailable: keep working in memory.
      setSaveFailed(true);
    }
  }, [state]);

  // Live updates: another window of this browser saved a change, so show it here too.
  useEffect(() => {
    const receive = (event: StorageEvent) => {
      if (event.key !== STORAGE_KEY || !event.newValue) return;
      try {
        const parsed: unknown = JSON.parse(event.newValue);
        if (!isCrmState(parsed)) return;
        written.current = event.newValue;
        setState(parsed);
      } catch {
        // Ignore a partial or corrupt write.
      }
    };
    window.addEventListener("storage", receive);
    return () => window.removeEventListener("storage", receive);
  }, []);

  const actions = useMemo(() => {
    /** Apply a change and record who made it. Returning the same state skips the audit entry. */
    const commit = (describe: (current: CrmState) => string, change: (current: CrmState) => CrmState) =>
      setState((current) => {
        const next = change(current);
        if (next === current) return current;
        const entry = { id: newId("AU"), at: nowStamp(), actor: actor.current, action: describe(current) };
        return { ...next, audit: [entry, ...next.audit].slice(0, AUDIT_LIMIT) };
      });

    /** Change one job, plus any texts the change should send. */
    const patchJob = (id: string, describe: (job: Job) => string, change: (job: Job, current: CrmState) => Job, texts?: (before: Job, after: Job, current: CrmState) => Message[]) =>
      commit(
        (current) => {
          const job = current.jobs.find((item) => item.id === id);
          return job ? describe(job) : id;
        },
        (current) => {
          const job = current.jobs.find((item) => item.id === id);
          const changed = job && change(job, current);
          if (!job || !changed || changed === job) return current;
          const sent = texts ? texts(job, changed, current) : [];
          // The outbox is newest first, so later texts go on top.
          return { ...current, jobs: current.jobs.map((item) => (item.id === id ? changed : item)), messages: sent.length ? [...sent.reverse(), ...current.messages] : current.messages };
        },
      );

    const label = (job: Job) => `${job.id} · ${job.title}`;

    const claimJobId = () => {
      const number = Math.max(Number(nextJobId(latest.current.jobs).slice(3)), lastJobNumber.current + 1);
      lastJobNumber.current = number;
      return `JB-${number}`;
    };

    return {
      /** Name recorded against every change, e.g. "Jordan Carter (office)". */
      setActor(name: string) {
        actor.current = name;
      },
      addClient(input: ClientInput) {
        const id = newId("CL");
        commit(
          () => `Added client ${input.name}`,
          (current) => ({
            ...current,
            clients: [...current.clients, { ...input, id, createdAt: todayISO() }],
            sites: [...current.sites, { id: `${id}-home`, clientId: id, name: input.kind === "commercial" ? "Head office" : "Home", address: input.address, equipment: [], notes: "" }],
          }),
        );
        return id;
      },
      updateClient(id: string, input: ClientInput) {
        commit(
          () => `Updated client ${input.name}`,
          (current) => ({
            ...current,
            clients: current.clients.map((client) => (client.id === id ? { ...client, ...input } : client)),
            sites: current.sites.map((site) => (site.id === `${id}-home` || (site.clientId === id && site.name === "Home") ? { ...site, address: input.address } : site)),
          }),
        );
      },
      deleteClient(id: string) {
        commit(
          (current) => `Deleted client ${current.clients.find((client) => client.id === id)?.name ?? id}`,
          (current) =>
            current.jobs.some((job) => job.clientId === id)
              ? current
              : { ...current, clients: current.clients.filter((client) => client.id !== id), sites: current.sites.filter((site) => site.clientId !== id) },
        );
      },
      addJob(input: JobInput) {
        const { quoteAmount, ...fields } = input;
        const id = claimJobId();
        commit(
          () => `Created job ${id} · ${input.title}`,
          (current) => {
            const site = current.sites.find((item) => item.id === fields.siteId);
            const job: Job = {
              ...fields,
              id,
              address: site?.address ?? "",
              source: "Phone",
              requestedAt: nowStamp(),
              status: fields.crewId ? "Scheduled" : "Unassigned",
              enRouteAt: null,
              arrivedAt: null,
              completedAt: null,
              firstTimeFix: null,
              closeOut: null,
              quote: { amount: quoteAmount, sentAt: null },
              deposit: { amount: 0, receivedAt: null },
              paidAt: null,
            };
            return { ...current, jobs: [...current.jobs, job], messages: [...bookingTexts(current, undefined, job).reverse(), ...current.messages] };
          },
        );
        return id;
      },
      updateJob(id: string, input: JobInput) {
        const { quoteAmount, ...fields } = input;
        patchJob(
          id,
          () => `Updated job ${id} · ${input.title}`,
          (job, current) => {
            const site = current.sites.find((item) => item.id === fields.siteId);
            return { ...job, ...fields, address: site?.address ?? job.address, status: statusForCrew(job.status, fields.crewId), quote: { ...job.quote, amount: quoteAmount } };
          },
          (before, after, current) => bookingTexts(current, before, after),
        );
      },
      /** Dispatch: put a job on a crew at a day and time, or back in the tray with crewId null. */
      assignJob(id: string, crewId: string | null, date?: string, time?: string) {
        patchJob(
          id,
          (job) => {
            const crew = latest.current.crews.find((item) => item.id === crewId);
            return crew ? `Dispatched ${label(job)} to ${crew.name}${time ? ` at ${time}` : ""}${date ? ` on ${date}` : ""}` : `Unassigned ${label(job)}`;
          },
          (job) => {
            if (job.status !== "Unassigned" && job.status !== "Scheduled") return job;
            const next = { ...job, crewId, date: date ?? job.date, time: time ?? job.time };
            const status = statusForCrew(job.status, crewId);
            return next.crewId === job.crewId && next.date === job.date && next.time === job.time ? job : { ...next, status };
          },
          (before, after, current) => bookingTexts(current, before, after),
        );
      },
      /** Customer booking from the public page. Reuses the customer record when the phone or email matches. */
      bookOnline(input: BookingInput) {
        const current = latest.current;
        const id = claimJobId();
        const existing = current.clients.find(
          (client) =>
            client.kind === "residential" &&
            ((digits(input.phone).length >= 7 && digits(client.phone) === digits(input.phone)) || (input.email.trim() !== "" && client.email.toLowerCase() === input.email.trim().toLowerCase())),
        );
        const clientId = existing?.id ?? newId("CL");
        commit(
          () => `Online booking ${id} · ${input.title} from ${input.name}${existing ? " (returning customer)" : " (new customer)"}`,
          (state) => {
            const site = existing ? state.sites.find((item) => item.clientId === existing.id) : undefined;
            const siteId = site?.id ?? `${clientId}-home`;
            const clients = existing
              ? state.clients
              : [...state.clients, { id: clientId, kind: "residential" as const, name: input.name, contactName: input.name, phone: input.phone, email: input.email, address: input.address, notes: "", sla: null, createdAt: todayISO() }];
            const sites = site ? state.sites : [...state.sites, { id: siteId, clientId, name: "Home", address: input.address, equipment: [], notes: "" }];
            const movedAddress = site && site.address.toLowerCase() !== input.address.trim().toLowerCase() ? ` Customer entered address: ${input.address}.` : "";
            const job: Job = {
              id,
              title: input.title,
              trade: input.trade,
              priority: input.priority,
              source: "Online",
              clientId,
              siteId,
              address: site?.address ?? input.address,
              requestedAt: nowStamp(),
              date: input.date,
              time: input.time,
              duration: input.duration,
              crewId: null,
              status: "Unassigned",
              enRouteAt: null,
              arrivedAt: null,
              completedAt: null,
              firstTimeFix: null,
              closeOut: null,
              quote: { amount: Math.round((input.estimate[0] + input.estimate[1]) / 2 / 5) * 5, sentAt: null },
              deposit: { amount: 0, receivedAt: null },
              paidAt: null,
              notes: `Booked online. Estimate shown: ${input.estimate[0]}–${input.estimate[1]}.${input.description ? ` Customer says: “${input.description.trim()}”` : ""}${movedAddress}`,
            };
            const next = { ...state, clients, sites, jobs: [...state.jobs, job] };
            return { ...next, messages: [text(next, job, "booking"), ...state.messages] };
          },
        );
        return { jobId: id, returning: Boolean(existing) };
      },
      deleteJob(id: string) {
        commit(
          (current) => `Deleted job ${id} · ${current.jobs.find((job) => job.id === id)?.title ?? ""}`,
          (current) => ({ ...current, jobs: current.jobs.filter((job) => job.id !== id) }),
        );
      },
      /** Move a job to En route or On site. Completing goes through closeOutJob. */
      advanceStatus(id: string) {
        patchJob(
          id,
          (job) => `${label(job)} → ${nextStatus(job) ?? job.status}`,
          (job) => {
            const status = nextStatus(job);
            if (status === "En route") return { ...job, status, enRouteAt: nowStamp() };
            if (status === "On site") return { ...job, status, arrivedAt: nowStamp() };
            return job;
          },
          (_before, after, current) => (after.status === "En route" && current.settings.enRouteText === "on-my-way" ? [text(current, after, "en-route")] : []),
        );
      },
      /** Finish a job with the tech's report and the customer's sign-off. */
      closeOutJob(id: string, closeOut: CloseOut, firstTimeFix: boolean) {
        patchJob(
          id,
          (job) => `Closed out ${label(job)}${firstTimeFix ? "" : " (return visit needed)"}`,
          (job) => {
            if (job.status === "Completed" || job.status === "Unassigned") return job;
            const now = nowStamp();
            return { ...job, status: "Completed", enRouteAt: job.enRouteAt ?? now, arrivedAt: job.arrivedAt ?? now, completedAt: now, firstTimeFix, closeOut };
          },
          (_before, after, current) => [text(current, after, "done")],
        );
      },
      markQuoted(id: string, amount: number) {
        patchJob(id, (job) => `Sent quote for ${label(job)}`, (job) => ({ ...job, quote: { amount, sentAt: todayISO() } }));
      },
      recordDeposit(id: string, amount: number) {
        patchJob(id, (job) => `Recorded deposit on ${label(job)}`, (job) => ({ ...job, deposit: { amount, receivedAt: todayISO() } }));
      },
      markPaid(id: string) {
        patchJob(id, (job) => `Marked ${label(job)} paid`, (job) => ({ ...job, paidAt: todayISO() }));
      },
      undoPayment(id: string, step: PaymentStep) {
        patchJob(
          id,
          (job) => `Undid ${step} on ${label(job)}`,
          (job) => {
            if (step === "quote") return { ...job, quote: { ...job.quote, sentAt: null } };
            if (step === "deposit") return { ...job, deposit: { ...job.deposit, receivedAt: null } };
            return { ...job, paidAt: null };
          },
        );
      },
      setSettings(change: Partial<Settings>) {
        commit(
          () => `Changed settings: ${Object.entries(change).map(([key, value]) => `${key} = ${value}`).join(", ")}`,
          (current) => ({ ...current, settings: { ...current.settings, ...change } }),
        );
      },
      setCurrency(currency: string) {
        commit(() => `Changed currency to ${currency}`, (current) => ({ ...current, currency }));
      },
      resetData() {
        commit(() => "Reset demo data", () => createSeed());
      },
      importData(data: unknown) {
        if (!isCrmState(data)) return false;
        commit(() => "Imported a backup", () => data);
        return true;
      },
    };
  }, []);

  return { state, saveFailed, ...actions };
}

export type CrmStore = ReturnType<typeof useCrmStore>;
