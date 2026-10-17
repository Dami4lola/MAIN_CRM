import { useState } from "react";
import { useApp } from "../appContext";
import Icon from "../components/Icon";
import Pager, { usePaged } from "../components/Pager";
import { StatusBadge } from "../components/PaymentBadge";
import { addDays, formatDate, formatHours, formatTime, todayISO } from "../data/dates";
import { isOpen, percent, responseHours, slaMet, slaRate } from "../data/ops";
import { plural } from "../data/text";

type Filter = "All" | "Open" | "Completed";

/** What a commercial account sees: only its own sites and visits. */
function PortalView() {
  const { currentClient, scope, visibleJobs, client, site, openJob, jobMatchesSearch, search } = useApp();
  const [filter, setFilter] = useState<Filter>("All");
  const today = todayISO();
  const account = currentClient!;

  const open = visibleJobs.filter(isOpen);
  const completed30 = visibleJobs.filter((job) => job.completedAt && job.date >= addDays(today, -30));
  const sla = slaRate(visibleJobs.filter((job) => job.date >= addDays(today, -90)), client);

  const rows = visibleJobs
    .filter((job) => jobMatchesSearch(job) && (filter === "All" || (filter === "Open") === isOpen(job)))
    .sort((a, b) => `${b.date} ${b.time}`.localeCompare(`${a.date} ${a.time}`));
  const paged = usePaged(rows, 25, `${filter}|${search}`);

  return (
    <>
      <div className="metrics">
        <article className="metric-card"><span className="metric-icon blue"><Icon name="building" /></span><span><small>Sites covered</small><strong>{scope.sites.length}</strong></span><em>{account.sla?.contract}</em></article>
        <article className="metric-card"><span className="metric-icon orange"><Icon name="clock" /></span><span><small>Open visits</small><strong>{open.length}</strong></span><em>{plural(open.filter((job) => job.date === today).length, "visit")} today</em></article>
        <article className="metric-card"><span className="metric-icon green"><Icon name="check" /></span><span><small>Completed</small><strong>{completed30.length}</strong></span><em className="positive">last 30 days</em></article>
        <article className="metric-card"><span className="metric-icon purple"><Icon name="shield" /></span><span><small>Within SLA</small><strong>{percent(sla)}</strong></span><em>last 90 days · {account.sla?.responseHours} h response</em></article>
      </div>

      <section className="panel">
        <div className="panel-header">
          <div>
            <h2>Service visits</h2>
            <p>Every visit across your sites, newest first.</p>
          </div>
          <div className="segmented">
            {(["All", "Open", "Completed"] as Filter[]).map((option) => <button key={option} className={filter === option ? "selected" : ""} onClick={() => setFilter(option)}>{option}</button>)}
          </div>
        </div>
        <div className="job-table-wrap">
          <table>
            <thead><tr><th>Date</th><th>Visit</th><th>Site</th><th>Trade</th><th>Status</th><th>Response</th></tr></thead>
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
