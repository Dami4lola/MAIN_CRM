import { useState, type ReactNode } from "react";
import { useApp } from "../appContext";
import { partById } from "../data/catalog";
import { formatDate, formatHours, formatStamp, formatTime, nowStamp } from "../data/dates";
import { jobBalance } from "../data/money";
import { NEXT_STEP_LABEL, laborHours, nextStatus, responseHours, slaMet, slaTarget } from "../data/ops";
import type { PaymentStep } from "../data/store";
import type { Job } from "../data/types";
import CrewTag from "./CrewTag";
import Icon from "./Icon";
import JobUpdates from "./JobUpdates";
import OnTheJob from "./OnTheJob";
import PaymentBadge, { FlagBadge, PriorityBadge, StatusBadge } from "./PaymentBadge";
import TextList from "./TextList";

function Step({ index, title, done, children }: { index: number; title: string; done: boolean; children?: ReactNode }) {
  return (
    <div className={done ? "payment-step done" : "payment-step"}>
      <span className="step-dot">{done ? <Icon name="check" size={13} /> : index}</span>
      <div className="step-body">
        <strong>{title}</strong>
        {children}
      </div>
    </div>
  );
}

function JobDrawer({ job, onClose }: { job: Job; onClose: () => void }) {
  const { role, isOffice, store, scope, money, client, site, crew, crewMembers, notify, openClient, editJob, removeJob, advanceJob } = useApp();
  const [quoteInput, setQuoteInput] = useState(job.quote.amount ? String(job.quote.amount) : "");
  const [depositInput, setDepositInput] = useState(job.deposit.amount ? String(job.deposit.amount) : "");
  const owner = client(job.clientId);
  const location = site(job.siteId);
  const members = crewMembers(job.crewId);
  const balance = jobBalance(job);
  const next = nextStatus(job);
  const response = responseHours(job);
  const target = slaTarget(job, owner);
  const met = slaMet(job, owner);
  const hours = laborHours(job, nowStamp());
  const pastVisits = scope.siteHistory
    .filter((other) => other.siteId === job.siteId && other.id !== job.id && other.date <= job.date)
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 3);
  const texts = isOffice ? store.state.messages.filter((message) => message.jobId === job.id) : [];

  function undo(step: PaymentStep, message: string) {
    store.undoPayment(job.id, step);
    notify(message);
  }

  return (
    <div className="drawer-backdrop" onMouseDown={onClose}>
      <aside className="drawer" role="dialog" aria-label={job.title} onMouseDown={(event) => event.stopPropagation()}>
        <header className="drawer-header">
          <div>
            <p className="eyebrow">{job.id} · {job.trade.toUpperCase()}</p>
            <h2>{job.title}</h2>
            <div className="badge-row"><StatusBadge job={job} /><PriorityBadge priority={job.priority} />{role.kind !== "client" && job.status !== "Completed" && <FlagBadge job={job} />}{isOffice && <PaymentBadge job={job} />}</div>
          </div>
          <button className="icon-button" aria-label="Close" onClick={onClose}><Icon name="close" size={16} /></button>
        </header>

        <div className="drawer-body">
          <dl className="detail-list">
            <div>
              <dt>Client</dt>
              <dd>{isOffice && owner ? <button className="link-button" onClick={() => openClient(owner.id)}>{owner.name}</button> : (owner?.name ?? "Unknown client")}</dd>
            </div>
            {location && location.name !== "Home" && <div><dt>Site</dt><dd>{location.name}</dd></div>}
            <div><dt>Address</dt><dd>{job.address}</dd></div>
            {role.kind !== "client" && owner?.phone && <div><dt>Phone</dt><dd><a href={`tel:${owner.phone}`}>{owner.phone}</a></dd></div>}
            <div><dt>When</dt><dd>{formatDate(job.date, { weekday: "short", month: "short", day: "numeric" })} · {formatTime(job.time)} · {job.duration} h</dd></div>
            <div><dt>Crew</dt><dd><CrewTag crewId={job.crewId} small />{members.length > 0 && <small className="muted-line">{members.map((member) => member.name).join(", ")}</small>}</dd></div>
            <div><dt>Requested</dt><dd>{formatStamp(job.requestedAt)} · {job.source}</dd></div>
            {response !== null && (
              <div>
                <dt>Response</dt>
                <dd>
                  {formatHours(response)}
                  {target !== null && <span className={met ? "sla sla-met" : "sla sla-missed"}>{met ? "Within" : "Missed"} {target} h SLA</span>}
                </dd>
              </div>
            )}
            {job.notes && <div><dt>Notes</dt><dd>{job.notes}</dd></div>}
          </dl>

          <section className="drawer-section">
            <h3>Progress</h3>
            <Step index={1} title="Requested" done><p>{formatStamp(job.requestedAt)}</p></Step>
            <Step index={2} title={job.crewId ? "Crew assigned" : "Waiting for a crew"} done={Boolean(job.crewId)} />
            <Step index={3} title="En route" done={Boolean(job.enRouteAt)}>{job.enRouteAt && <p>{formatStamp(job.enRouteAt)}</p>}</Step>
            <Step index={4} title="On site" done={Boolean(job.arrivedAt)}>{job.arrivedAt && <p>{formatStamp(job.arrivedAt)}</p>}</Step>
            <Step index={5} title="Completed" done={Boolean(job.completedAt)}>{job.completedAt && <p>{formatStamp(job.completedAt)}</p>}</Step>
            {role.kind !== "client" && next && (
              <button className="primary-button" onClick={() => advanceJob(job.id)}><Icon name="check" size={15} />{NEXT_STEP_LABEL[next]}</button>
            )}
          </section>

          {role.kind !== "client" && <OnTheJob job={job} />}

          <JobUpdates job={job} />

          {job.closeOut && (
            <section className="drawer-section">
              <h3>Job report</h3>
              <p className="report-notes">{job.closeOut.notes}</p>
              {job.closeOut.parts.length > 0 && (
                <ul className="parts-list">
                  {job.closeOut.parts.map((part) => <li key={part.partId}><span>{partById(part.partId)?.name ?? part.partId}</span><strong>× {part.qty}</strong></li>)}
                </ul>
              )}
              {job.closeOut.photos.length > 0 && <div className="photo-row">{job.closeOut.photos.map((photo, index) => <img key={index} src={photo} alt={`Job photo ${index + 1}`} />)}</div>}
              <p className="muted-line">
                Signed off by {job.closeOut.signedBy}
                {job.firstTimeFix !== null && <> · {job.firstTimeFix ? "Fixed on the first visit" : "Return visit needed"}</>}
              </p>
            </section>
          )}

          {role.kind !== "client" && location && location.equipment.length > 0 && (
            <section className="drawer-section">
              <h3>Equipment on site</h3>
              <ul className="parts-list">
                {location.equipment.map((unit, index) => <li key={index}><span>{unit.type} · {unit.make} {unit.model}</span><strong>{unit.installed}</strong></li>)}
              </ul>
              {location.notes && location.name !== "Home" && <p className="muted-line">{location.notes}</p>}
            </section>
          )}

          {role.kind !== "client" && pastVisits.length > 0 && (
            <section className="drawer-section">
              <h3>Past visits at this site</h3>
              <ul className="visit-list">
                {pastVisits.map((visit) => (
                  <li key={visit.id}>
                    <span className="visit-head"><strong>{formatDate(visit.date, { month: "short", day: "numeric", year: "numeric" })} · {visit.title}</strong><small>{crew(visit.crewId)?.name}</small></span>
                    {visit.closeOut && <p>{visit.closeOut.notes}</p>}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {isOffice && (
            <section className="drawer-section">
              <h3>Customer texts</h3>
              {texts.length ? <TextList messages={texts} /> : <p className="muted-line">No texts for this job yet.</p>}
            </section>
          )}

          {isOffice && (
            <section className="drawer-section">
              <h3>Client payment</h3>
              <Step index={1} title="Quote" done={Boolean(job.quote.sentAt)}>
                {job.quote.sentAt ? (
                  <p>Quoted {money(job.quote.amount)} on {formatDate(job.quote.sentAt)} <button className="inline-link" onClick={() => undo("quote", "Quote marked as not sent")}>Undo</button></p>
                ) : (
                  <form className="step-action" onSubmit={(event) => { event.preventDefault(); store.markQuoted(job.id, Number(quoteInput) || 0); notify(`Quote sent to ${owner?.name ?? "client"}`); }}>
                    <input type="number" min="0" step="0.01" required placeholder="Quote amount" aria-label="Quote amount" value={quoteInput} onChange={(event) => setQuoteInput(event.target.value)} />
                    <button className="secondary-button">Mark quote sent</button>
                  </form>
                )}
                {!job.quote.sentAt && <p className="muted">Not quoted yet</p>}
              </Step>
              <Step index={2} title="Deposit" done={Boolean(job.deposit.receivedAt)}>
                {job.deposit.receivedAt ? (
                  <p>Deposit of {money(job.deposit.amount)} received {formatDate(job.deposit.receivedAt)} <button className="inline-link" onClick={() => undo("deposit", "Deposit removed")}>Undo</button></p>
                ) : (
                  <form className="step-action" onSubmit={(event) => { event.preventDefault(); store.recordDeposit(job.id, Number(depositInput) || 0); notify("Deposit recorded"); }}>
                    <input type="number" min="0" step="0.01" required placeholder="Deposit amount" aria-label="Deposit amount" value={depositInput} onChange={(event) => setDepositInput(event.target.value)} />
                    <button className="secondary-button">Record deposit</button>
                  </form>
                )}
                {!job.deposit.receivedAt && <p className="muted">No deposit received</p>}
              </Step>
              <Step index={3} title="Paid in full" done={Boolean(job.paidAt)}>
                {job.paidAt ? (
                  <p>Client paid on {formatDate(job.paidAt)} <button className="inline-link" onClick={() => undo("paid", "Payment confirmation removed")}>Undo</button></p>
                ) : (
                  <>
                    <p>Balance due <strong>{money(job.quote.sentAt || job.deposit.receivedAt ? balance : job.quote.amount)}</strong></p>
                    <button className="primary-button" onClick={() => { store.markPaid(job.id); notify(`${owner?.name ?? "Client"} marked as paid`); }}><Icon name="check" size={15} />Confirm client paid</button>
                  </>
                )}
              </Step>
            </section>
          )}

          {role.kind !== "client" && (
            <section className="drawer-section">
              <h3>Labour</h3>
              <div className="pay-summary">
                <strong>{formatHours(hours)}</strong>
                <span className="muted-line">on site{members.length > 1 ? ` × ${members.length} techs` : ""}</span>
              </div>
              {isOffice && hours > 0 && <p className="muted-line">Labour cost {money(Math.round(hours * members.reduce((sum, member) => sum + member.hourlyRate, 0)))} at crew rates</p>}
            </section>
          )}
        </div>

        {isOffice && (
          <footer className="drawer-footer">
            <button className="secondary-button danger-text" onClick={() => removeJob(job.id)}><Icon name="trash" size={15} />Delete</button>
            <button className="primary-button" onClick={() => editJob(job.id)}><Icon name="edit" size={15} />Edit job</button>
          </footer>
        )}
      </aside>
    </div>
  );
}

export default JobDrawer;
