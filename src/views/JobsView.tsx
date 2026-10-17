import { useState } from "react";
import { useApp } from "../appContext";
import CrewTag from "../components/CrewTag";
import Icon from "../components/Icon";
import { ClientLink, StatusButton } from "../components/JobCells";
import JobMenu from "../components/JobMenu";
import Pager, { usePaged } from "../components/Pager";
import PaymentBadge, { PriorityBadge, stageClass, statusClass } from "../components/PaymentBadge";
import { formatDate, formatTime } from "../data/dates";
import { PAYMENT_STAGES, clientTotals, jobBalance, paymentStage } from "../data/money";
import { STATUS_FLOW } from "../data/ops";
import type { Job, JobStatus, PaymentStage } from "../data/types";

type GroupBy = "None" | "Client" | "Crew" | "Status";
type SortBy = "date-desc" | "date-asc" | "client" | "balance";

const PAGE_SIZE = 50;

function JobsView() {
  const { store, visibleJobs, client, crew, money, openJob, openClient, newJob, jobMatchesSearch, search } = useApp();
  const [groupBy, setGroupBy] = useState<GroupBy>("None");
  const [sortBy, setSortBy] = useState<SortBy>("date-desc");
  const [crewFilter, setCrewFilter] = useState("");
  const [statuses, setStatuses] = useState<JobStatus[]>([]);
  const [stages, setStages] = useState<PaymentStage[]>([]);
  const [collapsed, setCollapsed] = useState<string[]>([]);

  const clientName = (job: Job) => client(job.clientId)?.name ?? "";
  const filtered = visibleJobs
    .filter(
      (job) =>
        jobMatchesSearch(job) &&
        (!crewFilter || (crewFilter === "none" ? !job.crewId : job.crewId === crewFilter)) &&
        (statuses.length === 0 || statuses.includes(job.status)) &&
        (stages.length === 0 || stages.includes(paymentStage(job))),
    )
    .sort((a, b) => {
      if (sortBy === "client") return clientName(a).localeCompare(clientName(b)) || b.date.localeCompare(a.date);
      if (sortBy === "balance") return jobBalance(b) - jobBalance(a);
      const order = `${a.date} ${a.time}`.localeCompare(`${b.date} ${b.time}`);
      return sortBy === "date-asc" ? order : -order;
    });

  const groupKey = (job: Job) => (groupBy === "Client" ? job.clientId : groupBy === "Crew" ? (job.crewId ?? "none") : groupBy === "Status" ? job.status : "all");
  const groupLabel = (job: Job) => (groupBy === "Client" ? clientName(job) || "Unknown client" : groupBy === "Crew" ? (crew(job.crewId)?.name ?? "Unassigned") : job.status);

  // Group totals cover every matching job; the rows shown are the current page.
  const groupTotals = new Map<string, Job[]>();
  if (groupBy !== "None") {
    for (const job of filtered) {
      const list = groupTotals.get(groupKey(job));
      if (list) list.push(job);
      else groupTotals.set(groupKey(job), [job]);
    }
  }

  const sorted =
    groupBy === "None"
      ? filtered
      : [...filtered].sort((a, b) =>
          groupBy === "Status" ? STATUS_FLOW.indexOf(a.status) - STATUS_FLOW.indexOf(b.status) : groupLabel(a).localeCompare(groupLabel(b)),
        );
  const paged = usePaged(sorted, PAGE_SIZE, [search, groupBy, sortBy, crewFilter, statuses.join(), stages.join()].join("|"));

  const groups: { key: string; label: string; clientId?: string; jobs: Job[] }[] = [];
  for (const job of paged.items) {
    const key = groupKey(job);
    const last = groups[groups.length - 1];
    if (last?.key === key) last.jobs.push(job);
    else groups.push({ key, label: groupLabel(job), clientId: groupBy === "Client" ? job.clientId : undefined, jobs: [job] });
  }

  const toggle = <T,>(list: T[], value: T) => (list.includes(value) ? list.filter((item) => item !== value) : [...list, value]);
  const filtersOn = statuses.length > 0 || stages.length > 0 || crewFilter;

  return (
    <section className="panel">
      <div className="panel-header">
        <div>
          <h2>All jobs</h2>
          <p>{filtered.length.toLocaleString()} of {visibleJobs.length.toLocaleString()} jobs{search ? ` matching “${search}”` : ""}</p>
        </div>
        <button className="primary-button" onClick={() => newJob()}><Icon name="plus" size={16} />New job</button>
      </div>

      <div className="toolbar">
        <label>Group by
          <span className="segmented">
            {(["None", "Client", "Crew", "Status"] as GroupBy[]).map((option) => <button key={option} className={groupBy === option ? "selected" : ""} onClick={() => setGroupBy(option)}>{option}</button>)}
          </span>
        </label>
        <label>Sort
          <select value={sortBy} onChange={(event) => setSortBy(event.target.value as SortBy)}>
            <option value="date-desc">Newest first</option>
            <option value="date-asc">Oldest first</option>
            <option value="client">Client A–Z</option>
            <option value="balance">Balance owed</option>
          </select>
        </label>
        <label>Crew
          <select value={crewFilter} onChange={(event) => setCrewFilter(event.target.value)}>
            <option value="">All crews</option>
            <option value="none">Unassigned</option>
            {store.state.crews.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
          </select>
        </label>
        <div className="chip-row" aria-label="Filter by status">
          {STATUS_FLOW.map((status) => (
            <button key={status} className={`chip ${statuses.includes(status) ? `${statusClass(status)} selected` : ""}`} aria-pressed={statuses.includes(status)} onClick={() => setStatuses(toggle(statuses, status))}>{status}</button>
          ))}
        </div>
        <div className="chip-row" aria-label="Filter by payment">
          {PAYMENT_STAGES.map((stage) => (
            <button key={stage} className={`chip ${stages.includes(stage) ? `${stageClass(stage)} selected` : ""}`} aria-pressed={stages.includes(stage)} onClick={() => setStages(toggle(stages, stage))}>{stage}</button>
          ))}
          {filtersOn && <button className="inline-link" onClick={() => { setStatuses([]); setStages([]); setCrewFilter(""); }}>Clear</button>}
        </div>
      </div>

      <div className="job-table-wrap">
        <table>
          <thead>
            <tr><th>Job</th><th>Client</th><th>Date</th><th>Crew</th><th>Status</th><th>Payment</th><th>Quote</th><th>Balance</th><th /></tr>
          </thead>
          {groups.map((group, index) => {
            const isCollapsed = collapsed.includes(group.key);
            const all = groupTotals.get(group.key) ?? group.jobs;
            return (
              <tbody key={`${group.key}-${index}`}>
                {groupBy !== "None" && (
                  <tr className="group-row">
                    <td colSpan={9}>
                      <button className="group-toggle" aria-expanded={!isCollapsed} onClick={() => setCollapsed(toggle(collapsed, group.key))}>
                        <Icon name={isCollapsed ? "chevronRight" : "chevronDown"} size={14} />
                        <strong>{group.label}</strong>
                        <span>{all.length.toLocaleString()} {all.length === 1 ? "job" : "jobs"}</span>
                        <span>{money(clientTotals(all).outstanding)} outstanding</span>
                      </button>
                      {group.clientId && <button className="inline-link" onClick={() => openClient(group.clientId!)}>Open client file</button>}
                    </td>
                  </tr>
                )}
                {!isCollapsed && group.jobs.map((job) => (
                  <tr key={job.id} className="clickable" onClick={() => openJob(job.id)}>
                    <td><strong>{job.title} <PriorityBadge priority={job.priority} /></strong><small>{job.id} · {job.trade}</small></td>
                    <td><ClientLink clientId={job.clientId} /><small><Icon name="pin" size={12} />{job.address}</small></td>
                    <td><strong>{formatDate(job.date, { month: "short", day: "numeric", year: "numeric" })}</strong><small>{formatTime(job.time)}</small></td>
                    <td><CrewTag crewId={job.crewId} /></td>
                    <td><StatusButton job={job} /></td>
                    <td><PaymentBadge job={job} /></td>
                    <td>{job.quote.amount ? money(job.quote.amount) : "—"}</td>
                    <td><strong>{jobBalance(job) ? money(jobBalance(job)) : "—"}</strong></td>
                    <td><JobMenu job={job} /></td>
                  </tr>
                ))}
              </tbody>
            );
          })}
        </table>
        {filtered.length === 0 && <div className="empty-state">No jobs match these filters.</div>}
      </div>
      <Pager paged={paged} />
    </section>
  );
}

export default JobsView;
