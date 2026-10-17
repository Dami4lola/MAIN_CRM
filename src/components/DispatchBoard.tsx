import { useState, type CSSProperties, type DragEvent, type MouseEvent } from "react";
import { useApp } from "../appContext";
import { addDays, formatDate, formatStamp, formatTime, hoursToTime, timeToHours, todayISO } from "../data/dates";
import { conflictsFor, shiftLabel } from "../data/ops";
import type { Crew, Job, Priority } from "../data/types";
import Avatar from "./Avatar";
import Icon from "./Icon";
import { PriorityBadge, StatusBadge } from "./PaymentBadge";

const START = 7;
const END = 19;
const SPAN = END - START;
const HOURS = Array.from({ length: SPAN }, (_, index) => START + index);
const PRIORITY_ORDER: Priority[] = ["Emergency", "Urgent", "Routine"];

type Drag = { jobId: string; duration: number; grab: number };
type Preview = { crewId: string; hours: number };

const percentOf = (hours: number) => `${((hours - START) / SPAN) * 100}%`;
const widthOf = (hours: number) => `${(hours / SPAN) * 100}%`;
/** Only jobs that haven't started can be moved. */
const movable = (job: Job) => job.status === "Unassigned" || job.status === "Scheduled";

function hourLabel(hour: number) {
  return `${hour % 12 || 12} ${hour >= 12 ? "PM" : "AM"}`;
}

function DispatchBoard() {
  const { store, client, crewMembers, openJob, notify, jobMatchesSearch } = useApp();
  const { crews, jobs } = store.state;
  const today = todayISO();
  const [date, setDate] = useState(today);
  const [drag, setDrag] = useState<Drag | null>(null);
  const [preview, setPreview] = useState<Preview | null>(null);
  const [placing, setPlacing] = useState<string | null>(null);

  const dayJobs = jobs.filter((job) => job.date === date && job.crewId);
  const crewById = new Map(crews.map((crew) => [crew.id, crew]));
  const conflicts = new Map(dayJobs.map((job) => [job.id, conflictsFor(job, crewById.get(job.crewId!)!, dayJobs)]));
  const conflictCount = [...conflicts.values()].filter((reasons) => reasons.length > 0).length;
  const tray = jobs
    .filter((job) => job.status === "Unassigned" && jobMatchesSearch(job))
    .sort((a, b) => PRIORITY_ORDER.indexOf(a.priority) - PRIORITY_ORDER.indexOf(b.priority) || a.requestedAt.localeCompare(b.requestedAt));
  const placingJob = jobs.find((job) => job.id === placing);
  const draggingJob = jobs.find((job) => job.id === drag?.jobId);
  const now = new Date();
  const nowHours = now.getHours() + now.getMinutes() / 60;

  /** The start time under the pointer, snapped to the half hour and kept on the board. */
  function hoursAt(event: { clientX: number; currentTarget: HTMLElement }, duration: number, grab: number) {
    const rect = event.currentTarget.getBoundingClientRect();
    const raw = START + ((event.clientX - rect.left) / rect.width) * SPAN - grab;
    return Math.min(Math.max(Math.round(raw * 2) / 2, START), END - Math.min(duration, SPAN));
  }

  function place(job: Job, crew: Crew, hours: number) {
    const time = hoursToTime(hours);
    if (job.crewId === crew.id && job.date === date && job.time === time) return;
    const issues = conflictsFor({ ...job, date, time }, crew, jobs);
    store.assignJob(job.id, crew.id, date, time);
    notify(issues.length ? `Booked with a conflict: ${issues[0]}` : `${job.id} booked on ${crew.name} at ${formatTime(time)} · customer texted`);
  }

  function startDrag(event: DragEvent<HTMLElement>, job: Job, onBoard: boolean) {
    event.dataTransfer.setData("text/plain", job.id);
    event.dataTransfer.effectAllowed = "move";
    // Keep the point you grabbed under the pointer, so a block doesn't jump when picked up.
    const rect = event.currentTarget.getBoundingClientRect();
    const grab = onBoard ? ((event.clientX - rect.left) / rect.width) * job.duration : 0;
    setDrag({ jobId: job.id, duration: job.duration, grab });
    setPlacing(null);
  }

  function endDrag() {
    setDrag(null);
    setPreview(null);
  }

  function overRow(event: DragEvent<HTMLDivElement>, crew: Crew) {
    if (!drag) return;
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
    const hours = hoursAt(event, drag.duration, drag.grab);
    if (preview?.crewId !== crew.id || preview.hours !== hours) setPreview({ crewId: crew.id, hours });
  }

  function dropOnRow(event: DragEvent<HTMLDivElement>, crew: Crew) {
    event.preventDefault();
    if (draggingJob && drag) place(draggingJob, crew, hoursAt(event, drag.duration, drag.grab));
    endDrag();
  }

  function clickRow(event: MouseEvent<HTMLDivElement>, crew: Crew) {
    if (!placingJob) return;
    place(placingJob, crew, hoursAt(event, placingJob.duration, 0));
    setPlacing(null);
  }

  function dropOnTray(event: DragEvent<HTMLElement>) {
    event.preventDefault();
    if (draggingJob?.crewId) {
      store.assignJob(draggingJob.id, null);
      notify(`${draggingJob.id} moved back to the tray`);
    }
    endDrag();
  }

  const previewIssues = preview && draggingJob ? conflictsFor({ ...draggingJob, date, time: hoursToTime(preview.hours) }, crewById.get(preview.crewId)!, jobs) : [];

  return (
    <section className="panel dispatch">
      <div className="panel-header">
        <div>
          <h2>Dispatch board</h2>
          <p>Drag a request onto a crew at the time you want. On a touch screen, tap Place and then tap the board.</p>
        </div>
        <div className="schedule-controls">
          <span className={conflictCount ? "conflict-count has-conflicts" : "conflict-count"}>
            <Icon name={conflictCount ? "bell" : "check"} size={14} />
            {conflictCount ? `${conflictCount} ${conflictCount === 1 ? "conflict" : "conflicts"}` : "No conflicts"}
          </span>
          <button className="secondary-button small" onClick={() => setDate(today)} disabled={date === today}>Today</button>
          <div className="date-switch">
            <button aria-label="Previous day" onClick={() => setDate(addDays(date, -1))}><Icon name="chevronLeft" size={17} /></button>
            <strong>{formatDate(date, { weekday: "long", month: "short", day: "numeric" })}</strong>
            <button aria-label="Next day" onClick={() => setDate(addDays(date, 1))}><Icon name="chevronRight" size={17} /></button>
          </div>
        </div>
      </div>

      {placingJob && (
        <div className="placing-banner" role="status">
          <span>Placing <strong>{placingJob.id} · {placingJob.title}</strong>. Tap a crew's row at the start time you want.</span>
          <button className="inline-link" onClick={() => setPlacing(null)}>Cancel</button>
        </div>
      )}

      <div className="dispatch-layout">
        <aside className={drag && draggingJob?.crewId ? "tray is-target" : "tray"} onDragOver={(event) => draggingJob?.crewId && event.preventDefault()} onDrop={dropOnTray} aria-label="Unassigned jobs">
          <div className="tray-head">
            <strong>Waiting for a crew</strong>
            <span className="nav-count">{tray.length}</span>
          </div>
          {drag && draggingJob?.crewId && <p className="tray-hint">Drop here to unassign</p>}
          {tray.map((job) => {
            const owner = client(job.clientId);
            return (
              <article key={job.id} className={`tray-card ${placing === job.id ? "is-placing" : ""} ${job.priority === "Emergency" ? "is-emergency" : ""}`} draggable onDragStart={(event) => startDrag(event, job, false)} onDragEnd={endDrag}>
                <div className="tray-card-top">
                  <span className="tray-trade">{job.trade}</span>
                  <PriorityBadge priority={job.priority} />
                  <span className="tray-source">{job.source}</span>
                </div>
                <button className="link-button" onClick={() => openJob(job.id)}>{job.title}</button>
                <small>{owner?.name} · {job.address.split(",")[0]}</small>
                <small>Wants {job.date === today ? "today" : formatDate(job.date, { weekday: "short", month: "short", day: "numeric" })} {formatTime(job.time)} · {job.duration} h</small>
                <small className="muted">Requested {formatStamp(job.requestedAt)}</small>
                <button className={placing === job.id ? "primary-button small" : "secondary-button small"} onClick={() => setPlacing(placing === job.id ? null : job.id)}>
                  {placing === job.id ? "Tap the board…" : "Place"}
                </button>
              </article>
            );
          })}
          {tray.length === 0 && <p className="tray-empty">Every request has a crew.</p>}
        </aside>

        <div className="board-scroll">
          <div className="board" style={{ "--hours": SPAN } as CSSProperties}>
            <div className="board-head">
              <div className="crew-cell" />
              <div className="hour-scale">
                {HOURS.map((hour) => <span key={hour} style={{ left: percentOf(hour) }}>{hourLabel(hour)}</span>)}
              </div>
            </div>
            {crews.map((crew) => {
              const rowJobs = dayJobs.filter((job) => job.crewId === crew.id);
              const members = crewMembers(crew.id);
              const showPreview = preview?.crewId === crew.id && draggingJob;
              return (
                <div className="board-row" key={crew.id}>
                  <div className="crew-cell">
                    <Avatar worker={{ color: crew.color, initials: crew.code }} />
                    <span>
                      <strong>{crew.name}</strong>
                      <small>{members.map((member) => member.name.split(" ")[0]).join(" & ")} · {shiftLabel(crew)}</small>
                    </span>
                  </div>
                  <div
                    className={`board-track ${placingJob ? "is-placing" : ""}`}
                    onDragOver={(event) => overRow(event, crew)}
                    onDrop={(event) => dropOnRow(event, crew)}
                    onClick={(event) => clickRow(event, crew)}
                  >
                    <span className="off-shift" style={{ left: 0, width: widthOf(crew.shift[0] - START) }} />
                    <span className="off-shift" style={{ left: percentOf(crew.shift[1]), right: 0 }} />
                    {rowJobs.map((job) => {
                      const issues = conflicts.get(job.id) ?? [];
                      const start = Math.max(timeToHours(job.time), START);
                      return (
                        <div
                          key={job.id}
                          role="button"
                          tabIndex={0}
                          className={`board-job job-${crew.color} ${job.status === "Completed" ? "is-done" : ""} ${issues.length ? "has-conflict" : ""} ${drag?.jobId === job.id ? "is-dragging" : ""} ${movable(job) ? "is-movable" : ""}`}
                          style={{ left: percentOf(start), width: `calc(${widthOf(Math.min(job.duration, END - start))} - 3px)` }}
                          draggable={movable(job)}
                          onDragStart={(event) => startDrag(event, job, true)}
                          onDragEnd={endDrag}
                          onClick={(event) => {
                            if (placingJob) return;
                            event.stopPropagation();
                            openJob(job.id);
                          }}
                          onKeyDown={(event) => event.key === "Enter" && openJob(job.id)}
                          title={[`${job.id} · ${job.title}`, `${client(job.clientId)?.name ?? ""}`, movable(job) ? "Drag to move" : `${job.status}: can't be moved`, ...issues].join("\n")}
                        >
                          <span className="board-job-top">
                            <span>{formatTime(job.time)}</span>
                            {issues.length > 0 && <span className="conflict-flag" aria-label={issues.join("; ")}>!</span>}
                          </span>
                          <strong>{job.title}</strong>
                          <span className="board-job-client">{client(job.clientId)?.name}</span>
                          {job.status !== "Scheduled" && <StatusBadge job={job} />}
                        </div>
                      );
                    })}
                    {showPreview && (
                      <div
                        className={`board-preview ${previewIssues.length ? "has-conflict" : ""}`}
                        style={{ left: percentOf(preview.hours), width: `calc(${widthOf(Math.min(draggingJob.duration, END - preview.hours))} - 3px)` }}
                      >
                        <strong>{formatTime(hoursToTime(preview.hours))}</strong>
                        <span>{previewIssues[0] ?? "Fits"}</span>
                      </div>
                    )}
                    {date === today && nowHours >= START && nowHours <= END && <span className="board-now" style={{ left: percentOf(nowHours) }} />}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}

export default DispatchBoard;
