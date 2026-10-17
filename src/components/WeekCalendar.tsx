import { useState, type CSSProperties } from "react";
import { useApp } from "../appContext";
import { addDays, formatDate, formatTime, formatWeekRange, fromISO, startOfWeek, timeToHours, todayISO } from "../data/dates";
import type { Job } from "../data/types";
import Icon from "./Icon";

const START_HOUR = 7;
const END_HOUR = 19;
const ROW_HEIGHT = 40;

function timezoneLabel() {
  const offset = -new Date().getTimezoneOffset() / 60;
  return `GMT${offset >= 0 ? "+" : "−"}${Math.abs(offset)}`;
}

function hourLabel(hour: number) {
  return `${hour % 12 || 12} ${hour >= 12 ? "PM" : "AM"}`;
}

/** Assign overlapping jobs to side-by-side lanes. */
function layoutDay(jobs: Job[]) {
  const laneEnds: number[] = [];
  const placed = [...jobs]
    .sort((a, b) => timeToHours(a.time) - timeToHours(b.time))
    .map((job) => {
      const start = timeToHours(job.time);
      let lane = laneEnds.findIndex((end) => end <= start);
      if (lane === -1) lane = laneEnds.push(0) - 1;
      laneEnds[lane] = start + job.duration;
      return { job, lane };
    });
  return { placed, lanes: Math.max(1, laneEnds.length) };
}

/** A technician's week or day; the office plans on the dispatch board instead. */
function WeekCalendar({ jobs }: { jobs: Job[] }) {
  const { crew, client, openJob } = useApp();
  const today = todayISO();
  const [view, setView] = useState<"Day" | "Week">("Week");
  const [anchor, setAnchor] = useState(today);

  const weekStart = startOfWeek(anchor);
  const days = view === "Week" ? Array.from({ length: 7 }, (_, index) => addDays(weekStart, index)) : [anchor];
  const step = view === "Week" ? 7 : 1;
  const label = view === "Week" ? formatWeekRange(days[0], days[6]) : formatDate(anchor, { weekday: "long", month: "long", day: "numeric" });
  const hours = Array.from({ length: END_HOUR - START_HOUR }, (_, index) => START_HOUR + index);
  const now = new Date();
  const nowHours = now.getHours() + now.getMinutes() / 60;

  return (
    <section className="panel schedule-panel">
      <div className="panel-header">
        <div>
          <h2>My schedule</h2>
          <p>Your crew’s visits.</p>
        </div>
        <div className="schedule-controls">
          <button className="secondary-button small" onClick={() => setAnchor(today)} disabled={days.includes(today)}>Today</button>
          <div className="segmented">
            {(["Day", "Week"] as const).map((option) => <button key={option} className={view === option ? "selected" : ""} onClick={() => setView(option)}>{option}</button>)}
          </div>
          <div className="date-switch">
            <button aria-label={`Previous ${view.toLowerCase()}`} onClick={() => setAnchor(addDays(anchor, -step))}><Icon name="chevronLeft" size={17} /></button>
            <strong>{label}</strong>
            <button aria-label={`Next ${view.toLowerCase()}`} onClick={() => setAnchor(addDays(anchor, step))}><Icon name="chevronRight" size={17} /></button>
          </div>
        </div>
      </div>
      <div className="calendar-scroll">
        <div className={view === "Week" ? "calendar week-view" : "calendar"} style={{ "--days": days.length, "--row": `${ROW_HEIGHT}px` } as CSSProperties}>
          <div className="calendar-head">
            <div className="time-head">{timezoneLabel()}</div>
            {days.map((day) => (
              <button
                className={day === today ? "day-head today" : "day-head"}
                key={day}
                onClick={() => { setAnchor(day); setView("Day"); }}
                title="Open day view"
              >
                <span>{fromISO(day).toLocaleDateString("en-US", { weekday: "short" }).toUpperCase()}</span>
                <strong>{fromISO(day).getDate()}</strong>
              </button>
            ))}
          </div>
          <div className="calendar-body" style={{ height: hours.length * ROW_HEIGHT }}>
            <div className="time-col">
              {hours.map((hour) => <span key={hour} style={{ top: (hour - START_HOUR) * ROW_HEIGHT }}>{hourLabel(hour)}</span>)}
            </div>
            {days.map((day) => {
              const { placed, lanes } = layoutDay(jobs.filter((job) => job.date === day));
              return (
                <div className={day === today ? "day-col today" : "day-col"} key={day}>
                  {placed.map(({ job, lane }) => {
                    const start = Math.min(Math.max(timeToHours(job.time), START_HOUR), END_HOUR - 0.5);
                    const height = Math.min(Math.max(job.duration, 0.75), END_HOUR - start) * ROW_HEIGHT - 4;
                    const assigned = crew(job.crewId);
                    return (
                      <button
                        key={job.id}
                        className={`calendar-job job-${assigned?.color ?? "blue"} ${job.status === "Completed" ? "is-done" : ""}`}
                        style={{ top: (start - START_HOUR) * ROW_HEIGHT + 2, height, left: `calc(${(lane / lanes) * 100}% + 3px)`, width: `calc(${100 / lanes}% - 6px)` }}
                        onClick={() => openJob(job.id)}
                      >
                        <span className="job-time">{formatTime(job.time)}</span>
                        <strong>{job.title}</strong>
                        <span className="job-worker">{client(job.clientId)?.name}</span>
                      </button>
                    );
                  })}
                  {day === today && nowHours >= START_HOUR && nowHours <= END_HOUR && <div className="now-line" style={{ top: (nowHours - START_HOUR) * ROW_HEIGHT }} />}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}

export default WeekCalendar;
