import { useState } from "react";
import { useApp } from "../appContext";
import { OFFICE_USER } from "../brand";
import { formatStamp } from "../data/dates";
import type { Job, JobNote } from "../data/types";
import Icon from "./Icon";

/**
 * A job's notes feed. The crew and the office post here, either for each other or
 * also for the client (which texts the customer too). A client sees only the
 * updates written for them; data/access.ts keeps internal notes out of their scope.
 */
function JobUpdates({ job }: { job: Job }) {
  const { role, scope, currentTech, client, store, notify } = useApp();
  const [body, setBody] = useState("");
  const [visibility, setVisibility] = useState<JobNote["visibility"]>("internal");
  const owner = client(job.clientId);
  const canPost = role.kind !== "client";
  const notes = scope.jobNotes.filter((note) => note.jobId === job.id).sort((a, b) => b.at.localeCompare(a.at));

  if (!canPost && notes.length === 0) return null;

  function post() {
    if (!body.trim()) return;
    store.addJobNote(job.id, body, visibility, currentTech ? { name: currentTech.name, role: "tech" } : { name: OFFICE_USER.name, role: "office" });
    setBody("");
    notify(visibility === "client" ? `Update sent to ${owner?.contactName ?? "the client"}` : "Note added");
  }

  return (
    <section className="drawer-section">
      <h3>{canPost ? "Notes and updates" : "Updates from the crew"}</h3>

      {canPost && (
        <form
          className="note-composer"
          onSubmit={(event) => {
            event.preventDefault();
            post();
          }}
        >
          <textarea
            rows={2}
            aria-label="New note"
            placeholder={currentTech ? "What's happening on site? e.g. Found a leak at the valve, replacing it now" : "Leave a note for the crew"}
            value={body}
            onChange={(event) => setBody(event.target.value)}
          />
          <div className="segmented" role="radiogroup" aria-label="Who can see this">
            <button type="button" role="radio" aria-checked={visibility === "internal"} className={visibility === "internal" ? "selected" : ""} onClick={() => setVisibility("internal")}>Crew and office</button>
            <button type="button" role="radio" aria-checked={visibility === "client"} className={visibility === "client" ? "selected" : ""} onClick={() => setVisibility("client")}>Also tell the client</button>
          </div>
          {visibility === "client" && <p className="muted-line">Also sent as a text to {owner?.contactName ?? "the customer"} · {owner?.phone || "no phone"}</p>}
          <button className="primary-button" disabled={!body.trim()}><Icon name="check" size={15} />{visibility === "client" ? "Send update" : "Post note"}</button>
        </form>
      )}

      {notes.length > 0 ? (
        <ul className="note-list">
          {notes.map((note) => (
            <li key={note.id} className={note.visibility === "client" ? "is-client" : ""}>
              <div className="note-meta">
                <strong>{note.author}</strong>
                {canPost && <span>{note.authorRole === "tech" ? "Crew" : "Office"}</span>}
                <span>{formatStamp(note.at)}</span>
                {canPost && note.visibility === "client" && <span className="note-tag">Client can see</span>}
              </div>
              <p>{note.body}</p>
            </li>
          ))}
        </ul>
      ) : (
        <p className="muted-line">No notes yet.</p>
      )}
    </section>
  );
}

export default JobUpdates;
