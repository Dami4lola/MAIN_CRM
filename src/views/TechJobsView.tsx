import { useState } from "react";
import { useApp } from "../appContext";
import Icon from "../components/Icon";
import Pager, { usePaged } from "../components/Pager";
import { PriorityBadge, StatusBadge } from "../components/PaymentBadge";
import { addDays, formatDate, formatHours, formatTime, startOfWeek, todayISO } from "../data/dates";
import { NEXT_STEP_LABEL, firstTimeFixRate, isOpen, nextStatus, percent, timesheet } from "../data/ops";
import type { Job } from "../data/types";

type Tab = "Today" | "Upcoming" | "Done";

const mapsLink = (address: string) => `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(address)}`;

function JobCard({ job }: { job: Job }) {
  const { client, site, scope, openJob, advanceJob } = useApp();
  const owner = client(job.clientId);
  const location = site(job.siteId);
  const next = nextStatus(job);
  const history = scope.siteHistory.filter((other) => other.siteId === job.siteId && other.id !== job.id && other.date <= job.date).sort((a, b) => b.date.localeCompare(a.date));
  const today = todayISO();

  return (
    <article className={`tech-card tech-${job.status.toLowerCase().replace(" ", "-")}`}>
      <button className="tech-card-main" onClick={() => openJob(job.id)}>
        <span className="tech-card-top">
          <span className="tech-time">{job.date === today ? "" : `${formatDate(job.date, { weekday: "short", month: "short", day: "numeric" })} · `}{formatTime(job.time)} · {job.duration} h</span>
          <StatusBadge job={job} />
          <PriorityBadge priority={job.priority} />
        </span>
        <strong className="tech-title">{job.title}</strong>
        <span className="tech-client">{owner?.name}{location && location.name !== "Home" ? ` · ${location.name}` : ""}</span>
        <span className="tech-address"><Icon name="pin" size={13} />{job.address}</span>
        {job.notes && <span className="tech-note">{job.notes}</span>}
      </button>

      {isOpen(job) && (
        <div className="tech-actions">
          <a className="secondary-button" href={mapsLink(job.address)} target="_blank" rel="noreferrer"><Icon name="truck" size={15} />Directions</a>
          {owner?.phone && <a className="secondary-button" href={`tel:${owner.phone}`}><Icon name="phone" size={15} />Call</a>}
          {next && <button className="primary-button" onClick={() => advanceJob(job.id)}>{NEXT_STEP_LABEL[next]}</button>}
        </div>
      )}

      {isOpen(job) && (history.length > 0 || (location?.equipment.length ?? 0) > 0) && (
        <details className="tech-history">
          <summary>Site history · {history.length} past {history.length === 1 ? "visit" : "visits"} · {location?.equipment.length ?? 0} units</summary>
          {location && location.equipment.length > 0 && (
            <ul className="parts-list">
              {location.equipment.map((unit, index) => <li key={index}><span>{unit.type} · {unit.make} {unit.model}</span><strong>{unit.installed}</strong></li>)}
            </ul>
          )}
          {(location?.notes || owner?.notes) && <p className="tech-note">{location?.notes || owner?.notes}</p>}
          <ul className="visit-list">
            {history.slice(0, 3).map((visit) => (
              <li key={visit.id}>
                <span className="visit-head"><strong>{formatDate(visit.date, { month: "short", day: "numeric", year: "numeric" })} · {visit.title}</strong></span>
                {visit.closeOut && <p>{visit.closeOut.notes}</p>}
              </li>
            ))}
          </ul>
        </details>
      )}
    </article>
  );
}

/** A technician's day, built for a phone: one card per job with the next step one tap away. */
function TechJobsView() {
  const { currentTech, visibleJobs, money, jobMatchesSearch, search } = useApp();
  const [tab, setTab] = useState<Tab>("Today");
  const today = todayISO();
  const weekStart = startOfWeek(today);
  const week = currentTech ? timesheet(currentTech, visibleJobs, weekStart, addDays(weekStart, 6)) : { hours: 0, gross: 0 };
  const todays = visibleJobs.filter((job) => job.date === today);

  const rows = visibleJobs
    .filter((job) => {
      if (!jobMatchesSearch(job)) return false;
      if (tab === "Today") return job.date === today;
      if (tab === "Upcoming") return isOpen(job) && job.date > today;
      return !isOpen(job);
    })
    .sort((a, b) => {
      const order = `${a.date} ${a.time}`.localeCompare(`${b.date} ${b.time}`);
      return tab === "Done" ? -order : order;
    });
  const paged = usePaged(rows, 10, `${tab}|${search}`);

  return (
    <div className="tech-view">
      <div className="tech-stats">
        <span><small>Today</small><strong>{todays.filter(isOpen).length} of {todays.length}</strong><em>jobs left</em></span>
        <span><small>This week</small><strong>{formatHours(week.hours)}</strong><em>{money(Math.round(week.gross))} earned</em></span>
        <span><small>First-time fix</small><strong>{percent(firstTimeFixRate(visibleJobs.filter((job) => job.date >= addDays(today, -90))))}</strong><em>crew, 90 days</em></span>
      </div>

      <div className="segmented tech-tabs">
        {(["Today", "Upcoming", "Done"] as Tab[]).map((option) => <button key={option} className={tab === option ? "selected" : ""} onClick={() => setTab(option)}>{option}</button>)}
      </div>

      <div className="tech-list">
        {paged.items.map((job) => <JobCard key={job.id} job={job} />)}
        {rows.length === 0 && <div className="panel empty-state">{search ? `No jobs match “${search}”` : tab === "Today" ? "No jobs today." : tab === "Upcoming" ? "Nothing booked yet." : "No finished jobs yet."}</div>}
      </div>
      {paged.pages > 1 && <div className="panel"><Pager paged={paged} /></div>}
    </div>
  );
}

export default TechJobsView;
