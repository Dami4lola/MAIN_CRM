import { useState } from "react";
import { useApp } from "../appContext";
import Icon from "../components/Icon";
import Pager, { usePaged } from "../components/Pager";
import { PriorityBadge, StatusBadge } from "../components/PaymentBadge";
import SlaChart from "../components/SlaChart";
import { addDays, formatDate, formatHours, formatTime, nowStamp, todayISO } from "../data/dates";
import { isOpen, percent, responseHours, slaByMonth, slaDueBy, slaMet, slaRate } from "../data/ops";
import { plural } from "../data/text";
import type { Job } from "../data/types";

type Filter = "All" | "Open" | "Completed";

const clock = (value: string) => formatTime(value.slice(11));

/** Where a visit is right now, in the customer's terms. */
function liveLine(job: Job, crewName: string | undefined) {
  if (job.status === "Unassigned") return `Waiting for a crew · requested ${clock(job.requestedAt)}`;
  if (job.status === "Scheduled") return `Booked for ${formatTime(job.time)}${crewName ? ` · ${crewName}` : ""}`;
  if (job.status === "En route") return `On the way since ${clock(job.enRouteAt!)}`;
  if (job.status === "On site") return `On site since ${clock(job.arrivedAt!)}`;
  return `Completed at ${clock(job.completedAt!)}`;
}

/** What a commercial account sees: only its own sites and visits. */
function PortalView() {
  const { currentClient, scope, visibleJobs, client, site, crew, openJob, openReport, jobMatchesSearch, search } = useApp();
  const [filter, setFilter] = useState<Filter>("All");
  const [siteFilter, setSiteFilter] = useState("");
  const today = todayISO();
  const now = nowStamp();
  const account = currentClient!;

  const open = visibleJobs.filter(isOpen);
  const completed30 = visibleJobs.filter((job) => job.completedAt && job.date >= addDays(today, -30));
  const last90 = (jobs: Job[]) => jobs.filter((job) => job.date >= addDays(today, -90));
  const sla = slaRate(last90(visibleJobs), client);
  const months = slaByMonth(visibleJobs, client, today);
  const todays = visibleJobs.filter((job) => job.date === today).sort((a, b) => a.time.localeCompare(b.time));
  const latestUpdate = (jobId: string) => scope.jobNotes.filter((note) => note.jobId === jobId).sort((a, b) => b.at.localeCompare(a.at))[0];

  const rows = visibleJobs
    .filter((job) => jobMatchesSearch(job) && (!siteFilter || job.siteId === siteFilter) && (filter === "All" || (filter === "Open") === isOpen(job)))
    .sort((a, b) => `${b.date} ${b.time}`.localeCompare(`${a.date} ${a.time}`));
  const paged = usePaged(rows, 25, `${filter}|${siteFilter}|${search}`);

  return (
    <>
      <div className="metrics">
        <article className="metric-card"><span className="metric-icon blue"><Icon name="building" /></span><span><small>Sites covered</small><strong>{scope.sites.length}</strong></span><em>{account.sla?.contract}</em></article>
        <article className="metric-card"><span className="metric-icon orange"><Icon name="clock" /></span><span><small>Open visits</small><strong>{open.length}</strong></span><em>{plural(open.filter((job) => job.date === today).length, "visit")} today</em></article>
        <article className="metric-card"><span className="metric-icon green"><Icon name="check" /></span><span><small>Completed</small><strong>{completed30.length}</strong></span><em className="positive">last 30 days</em></article>
        <article className="metric-card"><span className="metric-icon purple"><Icon name="shield" /></span><span><small>Within SLA</small><strong>{percent(sla)}</strong></span><em>last 90 days · {account.sla?.responseHours} h response</em></article>
      </div>

      <div className="portal-grid">
        <SlaChart rows={months} responseHours={account.sla?.responseHours} />

        <section className="panel">
          <div className="panel-header">
            <div>
              <h2>Today at your sites</h2>
              <p>Live status. This updates as the crew moves.</p>
            </div>
          </div>
          {todays.length ? (
            <ul className="live-list">
              {todays.map((job) => {
                const due = slaDueBy(job, account);
                const update = latestUpdate(job.id);
                return (
                  <li key={job.id}>
                    <button className="live-main" onClick={() => openJob(job.id)}>
                      <span className="live-top"><StatusBadge job={job} /><PriorityBadge priority={job.priority} /><small>{job.id}</small></span>
                      <strong>{job.title}</strong>
                      <span className="live-site">{site(job.siteId)?.name}</span>
                      <span className="live-status">{liveLine(job, crew(job.crewId)?.name)}</span>
                      {due && isOpen(job) && <span className={due < now ? "live-due is-late" : "live-due"}><Icon name="clock" size={12} />{due < now ? `Past the SLA time (${clock(due)})` : `Arrival due by ${clock(due)}`}</span>}
                      {update && <span className="note-preview"><strong>{update.author.split(" ")[0]}:</strong> {update.body}</span>}
                    </button>
                    {job.status === "Completed" && <button className="secondary-button small" onClick={() => openReport(job.id)}><Icon name="printer" size={13} />Report</button>}
                  </li>
                );
              })}
            </ul>
          ) : (
            <div className="empty-state">No visits today.</div>
          )}
        </section>
      </div>

      <section className="panel">
        <div className="panel-header"><div><h2>Your sites</h2><p>Select a site to filter the visits below.</p></div></div>
        <div className="job-table-wrap">
          <table>
            <thead><tr><th>Site</th><th>Open visits</th><th>Last visit</th><th>Within SLA</th></tr></thead>
            <tbody>
              {scope.sites.map((item) => {
                const siteJobs = visibleJobs.filter((job) => job.siteId === item.id);
                const last = siteJobs.filter((job) => job.status === "Completed").sort((a, b) => b.date.localeCompare(a.date))[0];
                return (
                  <tr key={item.id} className={`clickable ${siteFilter === item.id ? "selected-row" : ""}`} onClick={() => setSiteFilter(siteFilter === item.id ? "" : item.id)}>
                    <td><strong>{item.name}</strong><small><Icon name="pin" size={12} />{item.address}</small></td>
                    <td>{siteJobs.filter(isOpen).length}</td>
                    <td>{last ? formatDate(last.date, { month: "short", day: "numeric", year: "numeric" }) : "—"}</td>
                    <td>{percent(slaRate(last90(siteJobs), client))}<small>last 90 days</small></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      <section className="panel">
        <div className="panel-header">
          <div>
            <h2>Service visits</h2>
            <p>{siteFilter ? `Visits at ${site(siteFilter)?.name}, newest first.` : "Every visit across your sites, newest first."}</p>
          </div>
          <div className="toolbar-inline">
            {siteFilter && <button className="text-button" onClick={() => setSiteFilter("")}>Show all sites</button>}
            <div className="segmented">
              {(["All", "Open", "Completed"] as Filter[]).map((option) => <button key={option} className={filter === option ? "selected" : ""} onClick={() => setFilter(option)}>{option}</button>)}
            </div>
          </div>
        </div>
        <div className="job-table-wrap">
          <table>
            <thead><tr><th>Date</th><th>Visit</th><th>Site</th><th>Trade</th><th>Status</th><th>Response</th><th>Report</th></tr></thead>
            <tbody>
              {paged.items.map((job) => {
                const response = responseHours(job);
                const met = slaMet(job, account);
                return (
                  <tr key={job.id} className="clickable" onClick={() => openJob(job.id)}>
                    <td><strong>{formatDate(job.date, { month: "short", day: "numeric", year: "numeric" })}</strong><small>{formatTime(job.time)}</small></td>
                    <td><strong>{job.title}</strong><small>{job.id}</small></td>
                    <td><strong>{site(job.siteId)?.name ?? "—"}</strong><small><Icon name="pin" size={12} />{job.address}</small></td>
                    <td>{job.trade}</td>
                    <td><StatusBadge job={job} /></td>
                    <td>
                      {response === null ? "—" : <strong>{formatHours(response)}</strong>}
                      {met !== null && <small className={met ? "positive" : "owed"}>{met ? "Within SLA" : "Missed SLA"}</small>}
                    </td>
                    <td>
                      {job.status === "Completed" ? (
                        <button className="secondary-button small" onClick={(event) => { event.stopPropagation(); openReport(job.id); }}><Icon name="printer" size={13} />Report</button>
                      ) : "—"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {rows.length === 0 && <div className="empty-state">{search ? `No visits match “${search}”` : "No visits yet."}</div>}
        </div>
        <Pager paged={paged} />
      </section>
    </>
  );
}

export default PortalView;
