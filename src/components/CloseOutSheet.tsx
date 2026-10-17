import { useState } from "react";
import { useApp } from "../appContext";
import { PARTS, partById } from "../data/catalog";
import { STORAGE_LIMIT_CHARS, shrinkPhoto } from "../data/images";
import type { Job, PartUsed } from "../data/types";
import Icon from "./Icon";
import SignaturePad from "./SignaturePad";

const MAX_PHOTOS = 4;

/** The tech's end-of-job report: what was done, parts, photos, and the customer's sign-off. */
function CloseOutSheet({ job, onClose }: { job: Job; onClose: () => void }) {
  const { store, client, money, notify } = useApp();
  const owner = client(job.clientId);
  const [notes, setNotes] = useState("");
  const [parts, setParts] = useState<PartUsed[]>([]);
  const [partId, setPartId] = useState("");
  const [photos, setPhotos] = useState<string[]>([]);
  const [processing, setProcessing] = useState(false);
  const [fixed, setFixed] = useState<boolean | null>(null);
  const [signedBy, setSignedBy] = useState(owner?.contactName ?? "");
  const [signature, setSignature] = useState<string | null>(null);
  const [error, setError] = useState("");

  const tradeParts = PARTS.filter((part) => part.trade === job.trade);
  const otherParts = PARTS.filter((part) => part.trade !== job.trade);
  const partsTotal = parts.reduce((sum, part) => sum + (partById(part.partId)?.price ?? 0) * part.qty, 0);

  function addPart() {
    if (!partId) return;
    setParts((current) => (current.some((part) => part.partId === partId) ? current.map((part) => (part.partId === partId ? { ...part, qty: part.qty + 1 } : part)) : [...current, { partId, qty: 1 }]));
    setPartId("");
  }

  function changeQty(id: string, delta: number) {
    setParts((current) => current.map((part) => (part.partId === id ? { ...part, qty: Math.min(99, part.qty + delta) } : part)).filter((part) => part.qty > 0));
  }

  async function addPhotos(files: FileList | null) {
    if (!files?.length) return;
    const room = MAX_PHOTOS - photos.length;
    if (room <= 0) {
      setError(`Up to ${MAX_PHOTOS} photos per job. Remove one to add another.`);
      return;
    }
    setProcessing(true);
    setError(files.length > room ? `Only the first ${room} added: up to ${MAX_PHOTOS} photos per job.` : "");
    try {
      const shrunk = await Promise.all([...files].slice(0, room).map(shrinkPhoto));
      setPhotos((current) => [...current, ...shrunk].slice(0, MAX_PHOTOS));
    } catch {
      setError("That file couldn't be read as a photo.");
    } finally {
      setProcessing(false);
    }
  }

  function submit() {
    if (!notes.trim()) return setError("Add a note on the work done.");
    if (fixed === null) return setError("Say whether the job was fixed on this visit.");
    if (!signedBy.trim() || !signature) return setError("The customer needs to sign off.");
    const added = photos.join("").length + signature.length + notes.length;
    if (JSON.stringify(store.state).length + added > STORAGE_LIMIT_CHARS) {
      return setError("The demo's browser storage is full. Remove a photo, or reset the demo data in Settings.");
    }
    store.closeOutJob(job.id, { notes: notes.trim(), parts, photos, signedBy: signedBy.trim(), signature }, fixed);
    notify(`${job.id} closed out · ${owner?.contactName.split(" ")[0] ?? "Customer"} has been texted`);
    onClose();
  }

  return (
    // No close on outside tap: on a phone that would throw away the signature and photos.
    <div className="modal-backdrop">
      <form
        className="modal closeout"
        onSubmit={(event) => {
          event.preventDefault();
          submit();
        }}
      >
        <div className="modal-heading">
          <div>
            <p className="eyebrow">{job.id} · CLOSE OUT</p>
            <h2>{job.title}</h2>
            <p className="modal-sub">{owner?.name} · {job.address}</p>
          </div>
          <button type="button" aria-label="Close" onClick={onClose}>×</button>
        </div>

        <label>Work done<textarea required rows={3} autoFocus placeholder="What you found, what you fixed, anything the customer should know" value={notes} onChange={(event) => setNotes(event.target.value)} /></label>

        <div className="closeout-block">
          <span className="block-label">Parts used</span>
          <div className="step-action">
            <select aria-label="Add a part" value={partId} onChange={(event) => setPartId(event.target.value)}>
              <option value="">Choose a part…</option>
              <optgroup label={`${job.trade} parts`}>{tradeParts.map((part) => <option key={part.id} value={part.id}>{part.name} · {money(part.price)}</option>)}</optgroup>
              <optgroup label="Other parts">{otherParts.map((part) => <option key={part.id} value={part.id}>{part.name} · {money(part.price)}</option>)}</optgroup>
            </select>
            <button type="button" className="secondary-button" disabled={!partId} onClick={addPart}><Icon name="plus" size={14} />Add</button>
          </div>
          {parts.length > 0 && (
            <ul className="parts-list">
              {parts.map((part) => (
                <li key={part.partId}>
                  <span>{partById(part.partId)?.name}</span>
                  <span className="qty">
                    <button type="button" aria-label="One fewer" onClick={() => changeQty(part.partId, -1)}>−</button>
                    <strong>{part.qty}</strong>
                    <button type="button" aria-label="One more" onClick={() => changeQty(part.partId, 1)}>+</button>
                  </span>
                </li>
              ))}
              <li className="parts-total"><span>Parts total</span><strong>{money(partsTotal)}</strong></li>
            </ul>
          )}
        </div>

        <div className="closeout-block">
          <span className="block-label">Photos <small>{photos.length}/{MAX_PHOTOS}</small></span>
          <div className="photo-row">
            {photos.map((photo, index) => (
              <span className="photo-thumb" key={index}>
                <img src={photo} alt={`Photo ${index + 1}`} />
                <button type="button" aria-label={`Remove photo ${index + 1}`} onClick={() => setPhotos((current) => current.filter((_, i) => i !== index))}><Icon name="close" size={12} /></button>
              </span>
            ))}
            {photos.length < MAX_PHOTOS && (
              <label className="photo-add">
                <Icon name="plus" size={18} />
                <span>{processing ? "Adding…" : "Add photo"}</span>
                <input type="file" accept="image/*" capture="environment" multiple hidden disabled={processing} onChange={(event) => { void addPhotos(event.target.files); event.target.value = ""; }} />
              </label>
            )}
          </div>
        </div>

        <div className="closeout-block">
          <span className="block-label">Fixed on this visit?</span>
          <div className="segmented" role="radiogroup" aria-label="Fixed on this visit">
            <button type="button" role="radio" aria-checked={fixed === true} className={fixed === true ? "selected" : ""} onClick={() => setFixed(true)}>Yes, all fixed</button>
            <button type="button" role="radio" aria-checked={fixed === false} className={fixed === false ? "selected" : ""} onClick={() => setFixed(false)}>No, return visit needed</button>
          </div>
        </div>

        <div className="closeout-block">
          <label>Customer name<input value={signedBy} onChange={(event) => setSignedBy(event.target.value)} /></label>
          <SignaturePad onChange={setSignature} />
        </div>

        {error && <p className="form-error" role="alert">{error}</p>}

        <div className="modal-actions">
          <button type="button" className="secondary-button" onClick={onClose}>Cancel</button>
          <button className="primary-button" disabled={processing}><Icon name="check" size={16} />Complete job</button>
        </div>
      </form>
    </div>
  );
}

export default CloseOutSheet;
