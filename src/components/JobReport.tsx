import { useApp } from "../appContext";
import { COMPANY } from "../brand";
import { partById } from "../data/catalog";
import { formatDate, formatHours, formatStamp, formatTime, nowStamp } from "../data/dates";
import { laborHours, responseHours, slaMet, slaTarget } from "../data/ops";
import type { Job } from "../data/types";
import Icon from "./Icon";

/**
 * The customer-facing service report for a completed job, laid out as a printed page.
 * "Save as PDF" uses the browser's print dialog, so no PDF library is needed (Plan_Changes.md #22).
 * Only client-visible updates appear, and no prices, so the same report suits every role.
 */
function JobReport({ job, onClose }: { job: Job; onClose: () => void }) {
  const { scope, client, site, crew, crewMembers } = useApp();
  const owner = client(job.clientId);
  const location = site(job.siteId);
  const members = crewMembers(job.crewId);
  const response = responseHours(job);
  const target = slaTarget(job, owner);
  const met = slaMet(job, owner);
  const report = job.closeOut;
  const updates = scope.jobNotes.filter((note) => note.jobId === job.id && note.visibility === "client").sort((a, b) => a.at.localeCompare(b.at));

  return (
    <div className="report-overlay" role="dialog" aria-label={`Service report ${job.id}`}>
      <div className="report-toolbar">
        <button className="secondary-button" onClick={onClose}><Icon name="chevronLeft" size={15} />Back</button>
        <span className="report-hint">In the print window, choose <strong>Save as PDF</strong> as the destination.</span>
        <button className="primary-button" onClick={() => window.print()}><Icon name="printer" size={15} />Save as PDF</button>
      </div>

      <article className="report-sheet">
        <header className="report-head">
          <div>
            <strong className="report-company">{COMPANY.name}</strong>
            <span>{COMPANY.tagline}</span>
          </div>
          <div className="report-title">
            <span>Service report</span>
            <strong>{job.id}</strong>
          </div>
        </header>

        <section className="report-section report-facts">
          <div><span>Customer</span><strong>{owner?.name ?? "Unknown client"}</strong>{owner && owner.contactName !== owner.name && <small>Attn: {owner.contactName}</small>}</div>
          <div><span>Site</span><strong>{location && location.name !== "Home" ? location.name : "Service address"}</strong><small>{job.address}</small></div>
          <div><span>Service</span><strong>{job.title}</strong><small>{job.trade} · {job.priority}</small></div>
          <div><span>Visit date</span><strong>{formatDate(job.date, { weekday: "short", month: "long", day: "numeric", year: "numeric" })}</strong><small>Booked for {formatTime(job.time)}</small></div>
        </section>

        <section className="report-section">
          <h3>Visit timeline</h3>
          <dl className="report-timeline">
            <div><dt>Requested</dt><dd>{formatStamp(job.requestedAt)}</dd></div>
            {job.enRouteAt && <div><dt>On the way</dt><dd>{formatStamp(job.enRouteAt)}</dd></div>}
            {job.arrivedAt && <div><dt>Arrived</dt><dd>{formatStamp(job.arrivedAt)}</dd></div>}
            {job.completedAt && <div><dt>Completed</dt><dd>{formatStamp(job.completedAt)}</dd></div>}
          </dl>
          <p className="report-line">
            {response !== null && <>Response time <strong>{formatHours(response)}</strong>{target !== null && <> · <strong className={met ? "positive" : "owed"}>{met ? "Within" : "Missed"} the {target} h SLA</strong></>} · </>}
            Time on site <strong>{formatHours(laborHours(job))}</strong>
            {crew(job.crewId) && <> · {crew(job.crewId)?.name}{members.length > 0 && ` (${members.map((member) => member.name).join(", ")})`}</>}
          </p>
        </section>

        <section className="report-section">
          <h3>Work carried out</h3>
          <p className="report-notes">{report?.notes || "No notes recorded."}</p>
          {job.firstTimeFix !== null && <p className="report-line">{job.firstTimeFix ? "Fixed on this visit." : "A return visit is needed to finish the work."}</p>}
        </section>

        {report && report.parts.length > 0 && (
          <section className="report-section">
            <h3>Parts used</h3>
            <table className="report-parts">
              <thead><tr><th>Part</th><th>Qty</th></tr></thead>
              <tbody>{report.parts.map((part) => <tr key={part.partId}><td>{partById(part.partId)?.name ?? part.partId}</td><td>{part.qty}</td></tr>)}</tbody>
            </table>
          </section>
        )}

        {updates.length > 0 && (
          <section className="report-section">
            <h3>Updates during the visit</h3>
            <ul className="report-updates">{updates.map((note) => <li key={note.id}><span>{formatStamp(note.at)} · {note.author}</span>{note.body}</li>)}</ul>
          </section>
        )}

        {report && report.photos.length > 0 && (
          <section className="report-section">
            <h3>Photos</h3>
            <div className="report-photos">{report.photos.map((photo, index) => <img key={index} src={photo} alt={`Job photo ${index + 1}`} />)}</div>
          </section>
        )}

        <section className="report-section report-signoff">
          <div>
            <span>Signed off by</span>
            {report?.signature ? <img src={report.signature} alt={`Signature of ${report.signedBy}`} /> : <em>Signed on site</em>}
            <strong>{report?.signedBy ?? "—"}</strong>
          </div>
          <div>
            <span>Completed</span>
            <strong>{job.completedAt ? formatStamp(job.completedAt) : "—"}</strong>
          </div>
        </section>

        <footer className="report-foot">{COMPANY.name} · Report generated {formatStamp(nowStamp())}</footer>
      </article>
    </div>
  );
}

export default JobReport;
