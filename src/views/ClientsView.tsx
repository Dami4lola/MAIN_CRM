import { useMemo, useState } from "react";
import { useApp } from "../appContext";
import Icon from "../components/Icon";
import Pager, { usePaged } from "../components/Pager";
import { formatDate } from "../data/dates";
import { clientTotals } from "../data/money";
import { initials, plural } from "../data/text";
import type { ClientKind, Job } from "../data/types";

type KindFilter = "all" | ClientKind;

function ClientsView({ onNewClient }: { onNewClient: () => void }) {
  const { store, money, openClient, search } = useApp();
  const [kind, setKind] = useState<KindFilter>("all");
  const query = search.toLowerCase().trim();
  const { clients, jobs, sites } = store.state;

  const jobsByClient = useMemo(() => {
    const map = new Map<string, Job[]>();
    for (const job of jobs) {
      const list = map.get(job.clientId);
      if (list) list.push(job);
      else map.set(job.clientId, [job]);
    }
    return map;
  }, [jobs]);

  const rows = clients
    .filter((client) => (kind === "all" || client.kind === kind) && (!query || `${client.name} ${client.contactName} ${client.phone} ${client.email} ${client.address}`.toLowerCase().includes(query)))
    .map((client) => {
      const theirs = jobsByClient.get(client.id) ?? [];
      return { client, jobs: theirs, totals: clientTotals(theirs), lastJob: theirs.reduce((last, job) => (job.date > last ? job.date : last), "") };
    })
    // Commercial accounts first, then alphabetical.
    .sort((a, b) => Number(b.client.kind === "commercial") - Number(a.client.kind === "commercial") || a.client.name.localeCompare(b.client.name));
  const paged = usePaged(rows, 50, `${query}|${kind}`);

  return (
    <section className="panel">
      <div className="panel-header">
        <div>
          <h2>Clients</h2>
          <p>{clients.filter((client) => client.kind === "commercial").length} commercial accounts and {clients.filter((client) => client.kind === "residential").length} homeowners · open a file to see jobs and payments.</p>
        </div>
        <button className="primary-button" onClick={onNewClient}><Icon name="plus" size={16} />New client</button>
      </div>
      <div className="toolbar">
        <span className="segmented">
          {(["all", "commercial", "residential"] as KindFilter[]).map((option) => (
            <button key={option} className={kind === option ? "selected" : ""} onClick={() => setKind(option)}>{option === "all" ? "All" : option === "commercial" ? "Commercial" : "Residential"}</button>
          ))}
        </span>
      </div>
      <div className="job-table-wrap">
        <table>
          <thead><tr><th>Client</th><th>Type</th><th>Contact</th><th>Jobs</th><th>Collected</th><th>Outstanding</th><th>Last job</th><th /></tr></thead>
          <tbody>
            {paged.items.map(({ client, jobs: theirs, totals, lastJob }) => (
              <tr key={client.id} className="clickable" onClick={() => openClient(client.id)}>
                <td>
                  <span className="worker-cell">
                    <span className={`avatar ${client.kind === "commercial" ? "avatar-account" : "avatar-client"}`}>{initials(client.name)}</span>
                    <span><strong>{client.name}</strong><small><Icon name="pin" size={12} />{client.address || "No address"}</small></span>
                  </span>
                </td>
                <td>
                  {client.kind === "commercial" ? <span className="kind kind-commercial">Commercial</span> : <span className="kind">Residential</span>}
                  {client.sla && <small>{plural(sites.filter((site) => site.clientId === client.id).length, "site")} · {client.sla.responseHours} h SLA</small>}
                </td>
                <td><strong>{client.kind === "commercial" ? client.contactName : client.phone || "—"}</strong><small>{client.kind === "commercial" ? client.phone : client.email}</small></td>
                <td>{theirs.length}</td>
                <td>{money(totals.collected)}</td>
                <td>{totals.outstanding ? <strong className="owed">{money(totals.outstanding)}</strong> : "—"}</td>
                <td>{lastJob ? formatDate(lastJob, { month: "short", day: "numeric", year: "numeric" }) : "—"}</td>
                <td><button className="table-menu" aria-label={`Open ${client.name}'s file`}><Icon name="chevronRight" /></button></td>
              </tr>
            ))}
          </tbody>
        </table>
        {rows.length === 0 && <div className="empty-state">{query ? `No clients match “${search}”` : "No clients yet. Add your first one."}</div>}
      </div>
      <Pager paged={paged} />
    </section>
  );
}

export default ClientsView;
