import { useState } from "react";
import { formatDate } from "../data/dates";
import { percent, type SlaMonth } from "../data/ops";

/** The SLA rule in the words customers see (see Plan_Changes.md #9). */
export const SLA_DEFINITION = "Urgent and emergency calls, request to arrival";

const monthLabel = (month: string, options: Intl.DateTimeFormatOptions = { month: "short" }) => formatDate(`${month}-01`, options);

/**
 * Within-SLA share per month as columns on a 0–100% axis. One series, so no legend:
 * the latest month is labelled on its cap, every month has a hover/focus tooltip,
 * and the table view lists every number for checking against the visit list.
 */
function SlaChart({ rows, responseHours }: { rows: SlaMonth[]; responseHours: number | undefined }) {
  const [view, setView] = useState<"chart" | "table">("chart");
  const [active, setActive] = useState<number | null>(null);
  const last = rows.length - 1;
  const current = rows[last]?.month;

  return (
    <section className="panel">
      <div className="panel-header">
        <div>
          <h2>SLA performance, last 6 months</h2>
          <p>{SLA_DEFINITION}{responseHours ? ` · ${responseHours} h target` : ""}</p>
        </div>
        <div className="segmented" role="radiogroup" aria-label="Show as">
          <button type="button" role="radio" aria-checked={view === "chart"} className={view === "chart" ? "selected" : ""} onClick={() => setView("chart")}>Chart</button>
          <button type="button" role="radio" aria-checked={view === "table"} className={view === "table" ? "selected" : ""} onClick={() => setView("table")}>Table</button>
        </div>
      </div>

      {view === "chart" ? (
        <div className="sla-chart">
          <div className="sla-plot">
            {[100, 50, 0].map((tick) => (
              <span key={tick} className="sla-grid" style={{ bottom: `${tick}%` }}><span>{tick}%</span></span>
            ))}
            <div className="sla-columns">
              {rows.map((row, index) => (
                <div
                  key={row.month}
                  className={`sla-column ${active === index ? "is-active" : ""}`}
                  tabIndex={0}
                  aria-label={`${monthLabel(row.month, { month: "long", year: "numeric" })}: ${row.rate === null ? "no tracked calls" : `${percent(row.rate)} within SLA, ${row.met} of ${row.tracked} calls`}`}
                  onPointerEnter={() => setActive(index)}
                  onPointerLeave={() => setActive(null)}
                  onFocus={() => setActive(index)}
                  onBlur={() => setActive(null)}
                >
                  {row.rate === null ? (
                    <span className="sla-none">No calls</span>
                  ) : (
                    <span className="sla-bar" style={{ height: `${row.rate * 100}%` }}>
                      {index === last && <span className="sla-cap">{percent(row.rate)}</span>}
                    </span>
                  )}
                  {active === index && (
                    <span className="sla-tooltip" role="tooltip" style={{ bottom: `calc(${(row.rate ?? 0) * 100}% + ${index === last ? 26 : 8}px)` }}>
                      <strong>{row.rate === null ? "—" : percent(row.rate)}</strong>
                      <span>{monthLabel(row.month, { month: "long", year: "numeric" })}</span>
                      <span>{row.tracked ? `${row.met} of ${row.tracked} calls within SLA` : "No urgent or emergency calls"}</span>
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
          <div className="sla-axis">
            {rows.map((row) => <span key={row.month}>{monthLabel(row.month)}{row.month === current ? " (so far)" : ""}</span>)}
          </div>
        </div>
      ) : (
        <div className="job-table-wrap">
          <table className="compact-table">
            <thead><tr><th>Month</th><th>Tracked calls</th><th>Within SLA</th><th>Missed</th><th>Rate</th></tr></thead>
            <tbody>
              {[...rows].reverse().map((row) => (
                <tr key={row.month}>
                  <td><strong>{monthLabel(row.month, { month: "long", year: "numeric" })}</strong>{row.month === current && <small>so far</small>}</td>
                  <td>{row.tracked}</td>
                  <td>{row.met}</td>
                  <td>{row.tracked - row.met}</td>
                  <td><strong>{percent(row.rate)}</strong></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

export default SlaChart;
