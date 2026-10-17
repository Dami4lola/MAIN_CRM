import { formatTime, hoursBetween, hoursToTime, timeToHours } from "./dates";
import type { Client, Crew, Job, JobStatus, Technician } from "./types";

export const STATUS_FLOW: JobStatus[] = ["Unassigned", "Scheduled", "En route", "On site", "Completed"];

export function isOpen(job: Job) {
  return job.status !== "Completed";
}

/** The status a crew moves the job to next, or null if it needs a crew or is done. */
export function nextStatus(job: Job): JobStatus | null {
  if (job.status === "Unassigned" || job.status === "Completed") return null;
  return STATUS_FLOW[STATUS_FLOW.indexOf(job.status) + 1];
}

export const NEXT_STEP_LABEL: Partial<Record<JobStatus, string>> = {
  "En route": "On my way",
  "On site": "Arrived",
  Completed: "Close out",
};

/** Hours on site, from arrival to completion (or to now if still on site). */
export function laborHours(job: Job, now?: string) {
  if (!job.arrivedAt) return 0;
  const end = job.completedAt ?? (job.status === "On site" ? now : undefined);
  return end ? Math.max(0, hoursBetween(job.arrivedAt, end)) : 0;
}

/** Timesheet lines for one technician: every completed job their crew worked in the date range. */
export function timesheet(tech: Technician, jobs: Job[], from: string, to: string) {
  const lines = jobs
    .filter((job) => job.crewId === tech.crewId && job.completedAt && job.date >= from && job.date <= to)
    .map((job) => ({ job, hours: laborHours(job) }));
  const hours = lines.reduce((sum, line) => sum + line.hours, 0);
  return { lines, hours, gross: hours * tech.hourlyRate };
}

/** Hours from the customer's request to the crew arriving. */
export function responseHours(job: Job) {
  return job.arrivedAt ? hoursBetween(job.requestedAt, job.arrivedAt) : null;
}

/** The contract response target, for reactive (non-routine) calls on commercial accounts. */
export function slaTarget(job: Job, client: Client | undefined) {
  return client?.sla && job.priority !== "Routine" ? client.sla.responseHours : null;
}

export function slaMet(job: Job, client: Client | undefined) {
  const target = slaTarget(job, client);
  const response = responseHours(job);
  return target === null || response === null ? null : response <= target;
}

/** Share of SLA-tracked jobs that met their target, or null when none were tracked. */
export function slaRate(jobs: Job[], client: (id: string) => Client | undefined) {
  const results = jobs.map((job) => slaMet(job, client(job.clientId))).filter((result) => result !== null);
  return results.length ? results.filter(Boolean).length / results.length : null;
}

export function firstTimeFixRate(jobs: Job[]) {
  const rated = jobs.filter((job) => job.firstTimeFix !== null);
  return rated.length ? rated.filter((job) => job.firstTimeFix).length / rated.length : null;
}

export function percent(rate: number | null) {
  return rate === null ? "—" : `${Math.round(rate * 100)}%`;
}

export function shiftLabel(crew: Crew) {
  return `${formatTime(hoursToTime(crew.shift[0]))}–${formatTime(hoursToTime(crew.shift[1]))}`;
}

/**
 * Why a job doesn't fit on a crew at its date and time: wrong trade, outside the
 * crew's shift, or overlapping another of the crew's jobs. Empty means it fits.
 */
export function conflictsFor(job: Pick<Job, "id" | "trade" | "date" | "time" | "duration">, crew: Crew, jobs: Job[]) {
  const reasons: string[] = [];
  const start = timeToHours(job.time);
  const end = start + job.duration;
  if (crew.trade !== job.trade) reasons.push(`${job.trade} job on a ${crew.trade} crew`);
  if (start < crew.shift[0] || end > crew.shift[1]) reasons.push(`Outside the crew's shift (${shiftLabel(crew)})`);
  const clash = jobs.find((other) => {
    if (other.id === job.id || other.crewId !== crew.id || other.date !== job.date) return false;
    const otherStart = timeToHours(other.time);
    return start < otherStart + other.duration && otherStart < end;
  });
  if (clash) reasons.push(`Overlaps ${clash.id} (${clash.title}) at ${formatTime(clash.time)}`);
  return reasons;
}
