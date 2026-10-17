import { useState } from "react";
import { useApp } from "../appContext";
import Pager, { usePaged } from "../components/Pager";
import TextList from "../components/TextList";
import { MESSAGE_LABEL } from "../data/messages";
import type { MessageKind } from "../data/types";

const KINDS = Object.keys(MESSAGE_LABEL) as MessageKind[];

/** The outbox: every customer text the system has created. In the demo nothing is actually sent. */
function MessagesView() {
  const { store, client, search } = useApp();
  const [kinds, setKinds] = useState<MessageKind[]>([]);
  const query = search.toLowerCase().trim();

  const rows = store.state.messages.filter(
    (message) =>
      (kinds.length === 0 || kinds.includes(message.kind)) &&
      (!query || `${message.jobId} ${message.body} ${message.to} ${client(message.clientId)?.name ?? ""}`.toLowerCase().includes(query)),
  );
  const paged = usePaged(rows, 20, `${query}|${kinds.join()}`);

  return (
    <section className="panel">
      <div className="panel-header">
        <div>
          <h2>Customer texts</h2>
          <p>Sent automatically when a job is booked, when the tech is on the way, and when the job is done. In this demo they appear here instead of being sent.</p>
        </div>
      </div>
      <div className="toolbar">
        <div className="chip-row" aria-label="Filter by type">
          {KINDS.map((kind) => (
            <button key={kind} className={`chip ${kinds.includes(kind) ? "selected chip-on" : ""}`} aria-pressed={kinds.includes(kind)} onClick={() => setKinds((current) => (current.includes(kind) ? current.filter((item) => item !== kind) : [...current, kind]))}>
              {MESSAGE_LABEL[kind]}
            </button>
          ))}
          {kinds.length > 0 && <button className="inline-link" onClick={() => setKinds([])}>Clear</button>}
        </div>
      </div>
      <div className="outbox">
        <TextList messages={paged.items} showJob />
        {rows.length === 0 && <div className="empty-state">{query ? `No texts match “${search}”` : "No texts yet."}</div>}
      </div>
      <Pager paged={paged} />
    </section>
  );
}

export default MessagesView;
