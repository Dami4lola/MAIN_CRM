import { useApp } from "../appContext";
import Icon from "../components/Icon";
import { StatusButton } from "../components/JobCells";
import { PriorityBadge } from "../components/PaymentBadge";
import WeekCalendar from "../components/WeekCalendar";
import { formatDate, formatTime, todayISO } from "../data/dates";
import { isOpen } from "../data/ops";

/** A technician's week: their crew's calendar and every job still open. */
function ScheduleView() {
  const { visibleJobs, client, openJob, jobMatchesSearch, search } = useApp();
  const today = todayISO();
  const open = visibleJobs
    .filter((job) => isOpen(job) && job.date >= today && jobMatchesSearch(job))
    .sort((a, b) => `${a.date} ${a.time}`.localeCompare(`${b.date} ${b.time}`));

  return (
    <>
      <WeekCalendar jobs={visibleJobs} />

      <section className="panel jobs-panel">
        <div className="panel-header">
          <div>
            <h2>Coming up</h2>
            <p>Your crew's open jobs from today on.</p>
          </div>
        </div>
        <div className="job-table-wrap">
          <table>
            <thead><tr><th>When</th><th>Job</th><th>Where</th><th>Status</th></tr></thead>
            <tbody>
              {open.slice(0, 15).map((job) => (
                <tr key={job.id} className="clickable" onClick={() => openJob(job.id)}>
                  <td><strong>{formatDate(job.date, { weekday: "short", month: "short", day: "numeric" })}</strong><small>{formatTime(job.time)} · {job.duration} h</small></td>
                  <td><strong>{job.title} <PriorityBadge priority={job.priority} /></strong><small>{job.id}</small></td>
                  <td><strong>{client(job.clientId)?.name ?? "—"}</strong><small><Icon name="pin" size={12} />{job.address}</small></td>
                  <td><StatusButton job={job} /></td>
                </tr>
              ))}
            </tbody>
          </table>
          {open.length === 0 && <div className="empty-state">{search ? `No open jobs match “${search}”` : "Nothing booked. Nice work!"}</div>}
        </div>
      </section>
    </>
  );
}

export default ScheduleView;
