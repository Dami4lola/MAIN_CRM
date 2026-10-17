import { useState } from "react";
import { useApp } from "../appContext";
import Avatar from "../components/Avatar";
import Icon from "../components/Icon";
import { addDays, formatHours, formatWeekRange, startOfWeek, todayISO } from "../data/dates";
import { firstTimeFixRate, isOpen, laborHours, percent, timesheet } from "../data/ops";
import { plural } from "../data/text";

function TeamView() {
  const { store, money, navigate } = useApp();
  const { crews, technicians, jobs } = store.state;
  const today = todayISO();
  const [weekStart, setWeekStart] = useState(startOfWeek(today));
  const weekEnd = addDays(weekStart, 6);
  const isThisWeek = weekStart === startOfWeek(today);
  const since90 = addDays(today, -90);

  const sheets = technicians.map((tech) => ({ tech, crew: crews.find((item) => item.id === tech.crewId), ...timesheet(tech, jobs, weekStart, weekEnd) }));
  const payroll = sheets.reduce((sum, sheet) => sum + sheet.gross, 0);
  const totalHours = sheets.reduce((sum, sheet) => sum + sheet.hours, 0);

  return (
    <>
      <div className="team-grid">
        {crews.map((crew) => {
          const theirs = jobs.filter((job) => job.crewId === crew.id);
          const week = theirs.filter((job) => job.date >= weekStart && job.date <= weekEnd);
          return (
            <article className="panel worker-card" key={crew.id}>
              <div className="worker-card-head">
                <Avatar worker={{ color: crew.color, initials: crew.code }} />
                <span><strong>{crew.name}</strong><small>{crew.trade}</small></span>
              </div>
              <dl className="stat-list">
                <div><dt>{isThisWeek ? "This week" : "That week"}</dt><dd>{plural(week.length, "job")}</dd></div>
                <div><dt>Open jobs</dt><dd>{theirs.filter((job) => isOpen(job) && job.date >= today).length}</dd></div>
                <div><dt>Hours on site</dt><dd>{formatHours(week.reduce((sum, job) => sum + laborHours(job), 0))}</dd></div>
                <div><dt>First-time fix</dt><dd>{percent(firstTimeFixRate(theirs.filter((job) => job.date >= since90)))}</dd></div>
              </dl>
              <ul className="crew-members">
                {technicians.filter((tech) => tech.crewId === crew.id).map((tech) => (
                  <li key={tech.id}>
                    <Avatar worker={tech} small />
                    <span>{tech.name}<small>{tech.position}</small></span>
                    <button className="text-button" onClick={() => navigate({ area: "tech", techId: tech.id, page: "jobs" })}><Icon name="swap" size={13} />View as</button>
                  </li>
                ))}
              </ul>
            </article>
          );
        })}
      </div>

      <section className="panel">
        <div className="panel-header">
          <div>
            <h2>Timesheets</h2>
            <p>Hours on site from completed jobs, at each technician's rate. This feeds payroll.</p>
          </div>
          <div className="schedule-controls">
            <div className="date-switch">
              <button aria-label="Previous week" onClick={() => setWeekStart(addDays(weekStart, -7))}><Icon name="chevronLeft" size={17} /></button>
              <strong>{formatWeekRange(weekStart, weekEnd)}</strong>
              <button aria-label="Next week" disabled={isThisWeek} onClick={() => setWeekStart(addDays(weekStart, 7))}><Icon name="chevronRight" size={17} /></button>
            </div>
            <strong className="owed">{money(Math.round(payroll))}</strong>
          </div>
        </div>
        <div className="job-table-wrap">
          <table>
            <thead><tr><th>Technician</th><th>Crew</th><th>Jobs</th><th>Hours</th><th>Rate</th><th>Gross pay</th></tr></thead>
            <tbody>
              {sheets.map(({ tech, crew, lines, hours, gross }) => (
                <tr key={tech.id}>
                  <td><span className="worker-cell"><Avatar worker={tech} small /><span><strong>{tech.name}</strong><small>{tech.position}</small></span></span></td>
                  <td>{crew?.name}</td>
                  <td>{lines.length}</td>
                  <td>{formatHours(hours)}</td>
                  <td>{money(tech.hourlyRate)}/h</td>
                  <td><strong>{money(Math.round(gross))}</strong></td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr><td colSpan={3}><strong>Total</strong></td><td><strong>{formatHours(totalHours)}</strong></td><td /><td><strong>{money(Math.round(payroll))}</strong></td></tr>
            </tfoot>
          </table>
        </div>
      </section>
    </>
  );
}

export default TeamView;
