import type { CrmState, Role } from "./types";

/**
 * The single place that decides which records a role can see.
 * Mirrors the row-level security policies the Supabase backend will enforce:
 * office sees everything, a technician sees their crew's jobs, and a client
 * account sees only its own jobs and sites.
 *
 * siteHistory is the completed work a role may look back on at a site. A tech
 * can see past visits by any crew at the sites they are booked into, since
 * that history is what they need on the job.
 *
 * jobNotes follow the jobs: office and crew see every note on a job, while a
 * client sees only the updates written for them, never internal notes.
 */
export function scopeFor(role: Role, state: CrmState) {
  if (role.kind === "office") return { jobs: state.jobs, clients: state.clients, sites: state.sites, siteHistory: state.jobs.filter((job) => job.status === "Completed"), jobNotes: state.jobNotes };

  if (role.kind === "tech") {
    const crewId = state.technicians.find((tech) => tech.id === role.techId)?.crewId;
    const jobs = state.jobs.filter((job) => job.crewId !== null && job.crewId === crewId);
    const clientIds = new Set(jobs.map((job) => job.clientId));
    const siteIds = new Set(jobs.map((job) => job.siteId));
    const jobIds = new Set(jobs.map((job) => job.id));
    return {
      jobs,
      clients: state.clients.filter((client) => clientIds.has(client.id)),
      sites: state.sites.filter((site) => siteIds.has(site.id)),
      siteHistory: state.jobs.filter((job) => job.status === "Completed" && siteIds.has(job.siteId)),
      jobNotes: state.jobNotes.filter((note) => jobIds.has(note.jobId)),
    };
  }

  const jobs = state.jobs.filter((job) => job.clientId === role.clientId);
  const jobIds = new Set(jobs.map((job) => job.id));
  return {
    jobs,
    clients: state.clients.filter((client) => client.id === role.clientId),
    sites: state.sites.filter((site) => site.clientId === role.clientId),
    siteHistory: jobs.filter((job) => job.status === "Completed"),
    jobNotes: state.jobNotes.filter((note) => note.visibility === "client" && jobIds.has(note.jobId)),
  };
}

export type Scope = ReturnType<typeof scopeFor>;
