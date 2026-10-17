import { useState } from "react";
import { useApp } from "../appContext";
import { OFFICE_USER } from "../brand";
import { formatTime, hoursToTime, timeToHours, todayISO } from "../data/dates";
import { updateSender } from "../data/messages";
import { conflictsFor } from "../data/ops";
import type { Job, JobFlag } from "../data/types";

const FLAGS: JobFlag[] = ["Waiting on parts", "Needs office help"];
const LATE_MINUTES = [15, 30, 60];
const EXTRA_MINUTES = [30, 60, 120];

const minutesLabel = (minutes: number) => (minutes < 60 ? `+${minutes} min` : `+${minutes / 60} h`);

/**
 * What the crew can change while out on a job: flag a problem for the office, say
 * they're running late (before arrival, today only) or that the job needs more time
 * (once on site). The board picks up the new times and flags any clash it causes.
 */
function OnTheJob({ job }: { job: Job }) {
  const { currentTech, crew, store, notify } = useApp();
  const [textCustomer, setTextCustomer] = useState(true);
  const assigned = crew(job.crewId);
  if (!assigned || job.status === "Completed" || job.status === "Unassigned") return null;

  const start = timeToHours(job.time);
  const canRunLate = (job.status === "Scheduled" || job.status === "En route") && job.date === todayISO();
  const canExtend = job.status === "On site";
  const issues = conflictsFor(job, assigned, store.state.jobs);
  const from = currentTech ? updateSender(currentTech.name, "tech") : updateSender(OFFICE_USER.name, "office");

  function flag(next: JobFlag | null) {
    store.setJobFlag(job.id, next);
    notify(next ? `${job.id} flagged: ${next.toLowerCase()}` : `Flag cleared on ${job.id}`);
  }

  function late(minutes: number) {
    store.adjustJobTime(job.id, "late", minutes, textCustomer ? from : null);
    notify(`Arrival moved to ${formatTime(hoursToTime(start + minutes / 60))}${textCustomer ? " · customer texted" : ""}`);
  }

  function extend(minutes: number) {
    store.adjustJobTime(job.id, "extend", minutes, textCustomer ? from : null);
    notify(`Now finishing around ${formatTime(hoursToTime(start + job.duration + minutes / 60))}${textCustomer ? " · customer texted" : ""}`);
  }

  return (
    <section className="drawer-section">
      <h3>On the job</h3>

      <div className="job-controls">
        <span className="block-label">Flag a problem</span>
        <div className="chip-row">
          {FLAGS.map((option) => (
            <button key={option} type="button" className={job.flag === option ? "secondary-button small is-flagged" : "secondary-button small"} aria-pressed={job.flag === option} onClick={() => flag(job.flag === option ? null : option)}>
              {option}
            </button>
          ))}
          {job.flag && <button type="button" className="inline-link" onClick={() => flag(null)}>Clear flag</button>}
        </div>
      </div>

      {(canRunLate || canExtend) && (
        <div className="job-controls">
          <span className="block-label">{canRunLate ? `Running late · arriving ${formatTime(job.time)}` : `Need more time · finishing ${formatTime(hoursToTime(start + job.duration))}`}</span>
          <div className="chip-row">
            {(canRunLate ? LATE_MINUTES : EXTRA_MINUTES).map((minutes) => (
              <button key={minutes} type="button" className="secondary-button small" disabled={canRunLate && start + minutes / 60 > 23.5} onClick={() => (canRunLate ? late(minutes) : extend(minutes))}>
                {minutesLabel(minutes)}
              </button>
            ))}
          </div>
          <label className="check-line">
            <input type="checkbox" checked={textCustomer} onChange={(event) => setTextCustomer(event.target.checked)} />
            Text the customer the new time
          </label>
        </div>
      )}

      {issues.length > 0 && <p className="form-error" role="alert">{issues.join(". ")}. Dispatch sees this flagged on the board.</p>}
    </section>
  );
}

export default OnTheJob;
