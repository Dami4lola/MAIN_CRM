import { useState } from "react";
import type { ClientInput } from "../data/store";
import type { Client, ClientKind } from "../data/types";

type Props = {
  client?: Client;
  onSave: (input: ClientInput) => void;
  onCancel: () => void;
};

type FormState = Omit<ClientInput, "sla"> & { responseHours: string; contract: string };

function ClientForm({ client, onSave, onCancel }: Props) {
  const [form, setForm] = useState<FormState>({
    kind: client?.kind ?? "residential",
    name: client?.name ?? "",
    contactName: client?.contactName ?? "",
    phone: client?.phone ?? "",
    email: client?.email ?? "",
    address: client?.address ?? "",
    notes: client?.notes ?? "",
    responseHours: String(client?.sla?.responseHours ?? 8),
    contract: client?.sla?.contract ?? "Service contract",
  });
  const field = (key: keyof FormState) => ({
    value: form[key],
    onChange: (event: { target: { value: string } }) => setForm((current) => ({ ...current, [key]: event.target.value })),
  });
  const commercial = form.kind === "commercial";

  return (
    <div className="modal-backdrop modal-top" onMouseDown={onCancel}>
      <form
        className="modal"
        onMouseDown={(event) => event.stopPropagation()}
        onSubmit={(event) => {
          event.preventDefault();
          event.stopPropagation();
          const { responseHours, contract, ...rest } = form;
          const name = form.name.trim();
          onSave({
            ...rest,
            name,
            contactName: commercial ? form.contactName.trim() || name : name,
            sla: commercial ? { responseHours: Math.max(1, Number(responseHours) || 8), contract: contract.trim() || "Service contract" } : null,
          });
        }}
      >
        <div className="modal-heading">
          <div>
            <p className="eyebrow">{client ? "CLIENT FILE" : "NEW CLIENT"}</p>
            <h2>{client ? "Edit client" : "Add a client"}</h2>
          </div>
          <button type="button" aria-label="Close" onClick={onCancel}>×</button>
        </div>
        <div className="segmented" role="radiogroup" aria-label="Client type">
          {(["residential", "commercial"] as ClientKind[]).map((kind) => (
            <button type="button" role="radio" aria-checked={form.kind === kind} key={kind} className={form.kind === kind ? "selected" : ""} onClick={() => setForm((current) => ({ ...current, kind }))}>
              {kind === "residential" ? "Residential" : "Commercial account"}
            </button>
          ))}
        </div>
        <label>{commercial ? "Company name" : "Full name"}<input required autoFocus placeholder={commercial ? "e.g. Harbourview Property Management" : "e.g. Olivia Martin"} {...field("name")} /></label>
        {commercial && <label>Facilities contact<input placeholder="Who we deal with day to day" {...field("contactName")} /></label>}
        <div className="form-row">
          <label>Phone<input type="tel" placeholder="(555) 000-0000" {...field("phone")} /></label>
          <label>Email<input type="email" placeholder="name@example.com" {...field("email")} /></label>
        </div>
        <label>{commercial ? "Head office address" : "Address"}<input placeholder="Street address" {...field("address")} /></label>
        {commercial && (
          <div className="form-row">
            <label>Contract<input {...field("contract")} /></label>
            <label>SLA response (hours)<input type="number" min="1" step="1" {...field("responseHours")} /></label>
          </div>
        )}
        <label>Notes<textarea rows={3} placeholder="Access codes, preferences, pets..." {...field("notes")} /></label>
        <div className="modal-actions">
          <button type="button" className="secondary-button" onClick={onCancel}>Cancel</button>
          <button className="primary-button">{client ? "Save client" : "Add client"}</button>
        </div>
      </form>
    </div>
  );
}

export default ClientForm;
