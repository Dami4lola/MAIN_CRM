import { useState } from "react";
import { useApp } from "../appContext";
import CrewTag from "../components/CrewTag";
import Icon from "../components/Icon";
import JobMenu from "../components/JobMenu";
import Pager, { usePaged } from "../components/Pager";
import PaymentBadge, { StatusBadge } from "../components/PaymentBadge";
import SlaChart from "../components/SlaChart";
import { addDays, formatDate, formatTime, todayISO } from "../data/dates";
import { clientTotals, jobBalance } from "../data/money";
import { isOpen, percent, slaByMonth, slaRate } from "../data/ops";
import { initials, plural } from "../data/text";

type Props = { clientId: string; onBack: () => void; onEdit: () => void };

function ClientFile({ clientId, onBack, onEdit }: Props) {
  const { store, client, site, money, notify, openJob, newJob } = useApp();
  const [siteFilter, setSiteFilter] = useState("");
  const record = client(clientId);

  const jobs = store.state.jobs.filter((job) => job.clientId === clientId).sort((a, b) => `${b.date} ${b.time}`.localeCompare(`${a.date} ${a.time}`));
  const history = siteFilter ? jobs.filter((job) => job.siteId === siteFilter) : jobs;
  const paged = usePaged(history, 25, `${clientId}|${siteFilter}`);

  if (!record) {
    return (
      <section className="panel">
        <div className="empty-state">This client no longer exists. <button className="inline-link" onClick={onBack}>Back to clients</button></div>
      </section>
    );
  }

  const commercial = record.kind === "commercial";
  const sites = store.state.sites.filter((item) => item.clientId === clientId);
  const totals = clientTotals(jobs);
  const completed = jobs.filter((job) => job.status === "Completed").length;
  const sla = slaRate(jobs.filter((job) => job.date >= addDays(todayISO(), -90)), client);

  function remove() {
    if (jobs.length > 0) {
      notify("Delete or move this client's jobs first");
      return;
    }
    if (window.confirm(`Delete ${record!.name}? This can't be undone.`)) {
      store.deleteClient(clientId);
      notify("Client deleted");
      onBack();
    }
  }

  return (
    <>
      <button className="back-link" onClick={onBack}><Icon name="chevronLeft" size={16} />All clients</button>

      <section className="panel client-card">
        <span className={`avatar avatar-large ${commercial ? "avatar-account" : "avatar-client"}`}>{initials(record.name)}</span>
        <div className="client-info">
          <p className="eyebrow">{commercial ? "COMMERCIAL ACCOUNT" : "CLIENT FILE"} · SINCE {formatDate(record.createdAt, { month: "short", year: "numeric" }).toUpperCase()}</p>
          <h2>{record.name}</h2>
          <div className="contact-row">
            {commercial && <span><Icon name="user" size={14} />{record.contactName}</span>}
            {record.phone && <a href={`tel:${record.phone}`}><Icon name="phone" size={14} />{record.phone}</a>}
            {record.email && <a href={`mailto:${record.email}`}><Icon name="mail" size={14} />{record.email}</a>}
            {record.address && <span><Icon name="pin" size={14} />{record.address}</span>}
            {record.sla && <span><Icon name="shield" size={14} />{record.sla.contract} · {record.sla.responseHours} h response</span>}
          </div>
          {record.notes && <p className="client-notes">{record.notes}</p>}
        </div>
        <div className="client-actions">
          <button className="secondary-button" onClick={onEdit}><Icon name="edit" size={15} />Edit</button>
          <button className="secondary-button danger-text" onClick={remove} aria-label="Delete client"><Icon name="trash" size={15} /></button>
          <button className="primary-button" onClick={() => newJob(clientId)}><Icon name="plus" size={16} />Schedule job</button>
        </div>
      </section>

      <div className="metrics">
        <article className="metric-card"><span className="metric-icon blue"><Icon name="briefcase" /></span><span><small>Jobs</small><strong>{jobs.length}</strong></span><em>{completed} completed · {jobs.filter(isOpen).length} open</em></article>
        {commercial ? (
          <article className="metric-card"><span className="metric-icon orange"><Icon name="shield" /></span><span><small>Within SLA</small><strong>{percent(sla)}</strong></span><em>last 90 days</em></article>
        ) : (
          <article className="metric-card"><span className="metric-icon orange"><Icon name="file" /></span><span><small>Quoted</small><strong>{money(totals.quoted)}</strong></span><em>{plural(jobs.filter((job) => job.quote.sentAt).length, "quote")} sent</em></article>
        )}
        <article className="metric-card"><span className="metric-icon green"><Icon name="check" /></span><span><small>Collected</small><strong>{money(totals.collected)}</strong></span><em className="positive">{plural(jobs.filter((job) => job.paidAt).length, "job")} paid in full</em></article>
        <article className="metric-card"><span className="metric-icon purple"><Icon name="dollar" /></span><span><small>Outstanding</small><strong>{money(totals.outstanding)}</strong></span><em>{plural(jobs.filter((job) => jobBalance(job) > 0).length, "job")} awaiting payment</em></article>
      </div>

      {commercial && <SlaChart rows={slaByMonth(jobs, client, todayISO())} responseHours={record.sla?.responseHours} />}

      {commercial && (
        <section className="panel">
          <div className="panel-header"><div><h2>Sites</h2><p>Select a site to filter the job history.</p></div></div>
          <div className="job-table-wrap">
            <table>
              <thead><tr><th>Site</th><th>Equipment</th><th>Jobs</th><th>Open</th><th>Last visit</th></tr></thead>
              <tbody>
                {sites.map((item) => {
                  const siteJobs = jobs.filter((job) => job.siteId === item.id);
                  const last = siteJobs.find((job) => job.status === "Completed");
                  return (
                    <tr key={item.id} className={`clickable ${siteFilter === item.id ? "selected-row" : ""}`} onClick={() => setSiteFilter(siteFilter === item.id ? "" : item.id)}>
                      <td><strong>{item.name}</strong><small><Icon name="pin" size={12} />{item.address}</small></td>
                      <td>{item.equipment.map((unit) => unit.type).join(", ") || "—"}</td>
                      <td>{siteJobs.length}</td>
                      <td>{siteJobs.filter(isOpen).length}</td>
                      <td>{last ? formatDate(last.date, { month: "short", day: "numeric", year: "numeric" }) : "—"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      )}

      <section className="panel">
        <div className="panel-header">
          <div>
            <h2>Job history</h2>
            <p>{siteFilter ? `Jobs at ${site(siteFilter)?.name}, newest first.` : `Every job for ${record.name}, newest first.`}</p>
          </div>
          {siteFilter && <button className="text-button" onClick={() => setSiteFilter("")}>Show all sites</button>}
        </div>
        <div className="job-table-wrap">
          <table>
            <thead><tr><th>Date</th><th>Job</th>{commercial && <th>Site</th>}<th>Crew</th><th>Status</th><th>Payment</th><th>Quote</th><th>Balance</th><th /></tr></thead>
            <tbody>
              {paged.items.map((job) => (
                <tr key={job.id} className="clickable" onClick={() => openJob(job.id)}>
                  <td><strong>{formatDate(job.date, { month: "short", day: "numeric", year: "numeric" })}</strong><small>{formatTime(job.time)}</small></td>
                  <td><strong>{job.title}</strong><small>{job.id}</small></td>
                  {commercial && <td>{site(job.siteId)?.name ?? "—"}</td>}
                  <td><CrewTag crewId={job.crewId} small /></td>
                  <td><StatusBadge job={job} /></td>
                  <td><PaymentBadge job={job} /></td>
                  <td>{job.quote.sentAt ? money(job.quote.amount) : "—"}</td>
                  <td><strong>{jobBalance(job) ? money(jobBalance(job)) : "—"}</strong></td>
                  <td><JobMenu job={job} /></td>
                </tr>
              ))}
            </tbody>
          </table>
          {history.length === 0 && <div className="empty-state">No jobs yet. <button className="inline-link" onClick={() => newJob(clientId)}>Schedule the first one</button></div>}
        </div>
        <Pager paged={paged} />
      </section>
    </>
  );
}

export default ClientFile;
