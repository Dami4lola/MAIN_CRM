import { useState } from "react";
import { todayISO } from "../data/dates";
import type { ClientInput, JobInput } from "../data/store";
import type { Client, Crew, Job, Priority, Site, Trade } from "../data/types";
import ClientForm from "./ClientForm";
import Icon from "./Icon";

type Props = {
  job?: Job;
  presetClientId?: string;
  clients: Client[];
  sites: Site[];
  crews: Crew[];
  onSave: (input: JobInput) => void;
  onCreateClient: (input: ClientInput) => string;
  onCancel: () => void;
};

type FormState = Omit<JobInput, "duration" | "quoteAmount" | "crewId"> & { duration: string; quoteAmount: string; crewId: string };

const TRADES: Trade[] = ["HVAC", "Plumbing", "Electrical"];
const PRIORITIES: Priority[] = ["Routine", "Urgent", "Emergency"];

function JobForm({ job, presetClientId, clients, sites, crews, onSave, onCreateClient, onCancel }: Props) {
  const initialClientId = clients.some((client) => client.id === (job?.clientId ?? presetClientId)) ? (job?.clientId ?? presetClientId)! : "";
  const [form, setForm] = useState<FormState>({
    title: job?.title ?? "",
    trade: job?.trade ?? "HVAC",
    priority: job?.priority ?? "Routine",
    clientId: initialClientId,
    siteId: job?.siteId ?? "",
    date: job?.date ?? todayISO(),
    time: job?.time ?? "09:00",
    duration: String(job?.duration ?? 2),
    crewId: job?.crewId ?? "",
    quoteAmount: job ? String(job.quote.amount) : "",
    notes: job?.notes ?? "",
  });
  const [addingClient, setAddingClient] = useState(false);

  const set = (key: keyof FormState, value: string) => setForm((current) => ({ ...current, [key]: value }));
  const field = (key: keyof FormState) => ({ value: form[key], onChange: (event: { target: { value: string } }) => set(key, event.target.value) });

  const clientSites = sites.filter((site) => site.clientId === form.clientId);
  // A new or changed client falls back to its first site.
  const siteId = clientSites.some((site) => site.id === form.siteId) ? form.siteId : (clientSites[0]?.id ?? "");
  const address = clientSites.find((site) => site.id === siteId)?.address;
  const sortedClients = [...clients].sort((a, b) => a.name.localeCompare(b.name));
  const tradeCrews = crews.filter((crew) => crew.trade === form.trade);
  const otherCrews = crews.filter((crew) => crew.trade !== form.trade);

  return (
    <>
      <div className="modal-backdrop" onMouseDown={onCancel}>
        <form
          className="modal"
          onMouseDown={(event) => event.stopPropagation()}
          onSubmit={(event) => {
            event.preventDefault();
            if (!siteId) return;
            onSave({
              ...form,
              siteId,
              title: form.title.trim(),
              crewId: form.crewId || null,
              duration: Math.max(0.5, Number(form.duration) || 1),
              quoteAmount: Number(form.quoteAmount) || 0,
            });
          }}
        >
          <div className="modal-heading">
            <div>
              <p className="eyebrow">{job ? job.id : "NEW WORK ORDER"}</p>
              <h2>{job ? "Edit job" : "Schedule a job"}</h2>
            </div>
            <button type="button" aria-label="Close" onClick={onCancel}>×</button>
          </div>
          <label>Job title<input required autoFocus placeholder="e.g. Furnace repair" {...field("title")} /></label>
          <div className="form-row">
            <label>Trade<select {...field("trade")}>{TRADES.map((trade) => <option key={trade}>{trade}</option>)}</select></label>
            <label>Priority<select {...field("priority")}>{PRIORITIES.map((priority) => <option key={priority}>{priority}</option>)}</select></label>
          </div>
          <label>
            <span className="label-row">Client<button type="button" className="inline-link" onClick={() => setAddingClient(true)}>+ New client</button></span>
            <select required {...field("clientId")}>
              <option value="" disabled>Select a client</option>
              <optgroup label="Commercial accounts">
                {sortedClients.filter((client) => client.kind === "commercial").map((client) => <option value={client.id} key={client.id}>{client.name}</option>)}
              </optgroup>
              <optgroup label="Residential">
                {sortedClients.filter((client) => client.kind === "residential").map((client) => <option value={client.id} key={client.id}>{client.name}</option>)}
              </optgroup>
            </select>
          </label>
          {clientSites.length > 1 ? (
            <label>Site<select value={siteId} onChange={(event) => set("siteId", event.target.value)}>{clientSites.map((site) => <option value={site.id} key={site.id}>{site.name} · {site.address}</option>)}</select></label>
          ) : (
            address && <p className="form-hint"><Icon name="pin" size={13} />{address}</p>
          )}
          <label>
            Crew
            <select {...field("crewId")}>
              <option value="">Unassigned (dispatch later)</option>
              <optgroup label={`${form.trade} crews`}>{tradeCrews.map((crew) => <option value={crew.id} key={crew.id}>{crew.name}</option>)}</optgroup>
              <optgroup label="Other crews">{otherCrews.map((crew) => <option value={crew.id} key={crew.id}>{crew.name}</option>)}</optgroup>
            </select>
          </label>
          <div className="form-row form-row-3">
            <label>Date<input required type="date" {...field("date")} /></label>
            <label>Start time<input required type="time" {...field("time")} /></label>
            <label>Hours<input required type="number" min="0.5" step="0.5" {...field("duration")} /></label>
          </div>
          <label>Quote to client<input type="number" min="0" step="0.01" placeholder="0" {...field("quoteAmount")} /></label>
          <label>Notes<textarea rows={2} placeholder="Access, parts to bring, special requests..." {...field("notes")} /></label>
          <div className="modal-actions">
            <button type="button" className="secondary-button" onClick={onCancel}>Cancel</button>
            <button className="primary-button"><Icon name="calendar" size={16} />{job ? "Save changes" : "Add to schedule"}</button>
          </div>
        </form>
      </div>
      {addingClient && (
        <ClientForm
          onCancel={() => setAddingClient(false)}
          onSave={(input) => {
            const id = onCreateClient(input);
            setForm((current) => ({ ...current, clientId: id, siteId: "" }));
            setAddingClient(false);
          }}
        />
      )}
    </>
  );
}

export default JobForm;
