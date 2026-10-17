import { useMemo } from "react";
import { useApp } from "../appContext";
import Icon from "../components/Icon";
import { stageClass } from "../components/PaymentBadge";
import { addDays, startOfWeek, todayISO } from "../data/dates";
import { PAYMENT_STAGES, clientTotals, paymentStage } from "../data/money";
import { timesheet } from "../data/ops";
import { plural } from "../data/text";
import type { Job } from "../data/types";

function ReportsView() {
  const { store, money, openClient } = useApp();
  const { jobs, clients, technicians } = store.state;
  const totals = clientTotals(jobs);
  const weekStart = startOfWeek(todayISO());
  const payroll = technicians.reduce((sum, tech) => sum + timesheet(tech, jobs, weekStart, addDays(weekStart, 6)).gross, 0);

  const jobsByClient = useMemo(() => {
    const map = new Map<string, Job[]>();
    for (const job of jobs) {
      const list = map.get(job.clientId);
      if (list) list.push(job);
      else map.set(job.clientId, [job]);
    }
    return map;
  }, [jobs]);

  const topClients = clients
    .map((client) => ({ client, totals: clientTotals(jobsByClient.get(client.id) ?? []) }))
    .filter((row) => row.totals.jobCount > 0)
    .sort((a, b) => b.totals.collected - a.totals.collected || b.totals.outstanding - a.totals.outstanding)
    .slice(0, 8);

  return (
    <>
      <div className="metrics">
        <article className="metric-card"><span className="metric-icon orange"><Icon name="file" /></span><span><small>Total quoted</small><strong>{money(totals.quoted)}</strong></span><em>{plural(jobs.filter((job) => job.quote.sentAt).length, "quote")} sent</em></article>
        <article className="metric-card"><span className="metric-icon green"><Icon name="check" /></span><span><small>Collected</small><strong>{money(totals.collected)}</strong></span><em className="positive">deposits + full payments</em></article>
        <article className="metric-card"><span className="metric-icon blue"><Icon name="dollar" /></span><span><small>Outstanding</small><strong>{money(totals.outstanding)}</strong></span><em>owed by clients</em></article>
        <article className="metric-card"><span className="metric-icon purple"><Icon name="users" /></span><span><small>Payroll this week</small><strong>{money(Math.round(payroll))}</strong></span><em>from technician timesheets</em></article>
      </div>

      <div className="report-grid">
        <section className="panel">
          <div className="panel-header"><div><h2>Jobs by payment stage</h2><p>Where every job sits in the quote → deposit → paid flow.</p></div></div>
          <ul className="stage-list">
            {PAYMENT_STAGES.map((stage) => {
              const count = jobs.filter((job) => paymentStage(job) === stage).length;
              return (
                <li key={stage}>
                  <span className={stageClass(stage)}>{stage}</span>
                  <span className="stage-bar"><span className={stageClass(stage)} style={{ width: `${jobs.length ? (count / jobs.length) * 100 : 0}%` }} /></span>
                  <strong>{count}</strong>
                </li>
              );
            })}
          </ul>
        </section>

        <section className="panel">
          <div className="panel-header"><div><h2>Top clients</h2><p>Ranked by money collected.</p></div></div>
          <div className="job-table-wrap">
            <table>
              <thead><tr><th>Client</th><th>Jobs</th><th>Collected</th><th>Outstanding</th></tr></thead>
              <tbody>
                {topClients.map(({ client, totals: row }) => (
                  <tr key={client.id} className="clickable" onClick={() => openClient(client.id)}>
                    <td><strong>{client.name}</strong></td>
                    <td>{row.jobCount}</td>
                    <td>{money(row.collected)}</td>
                    <td>{row.outstanding ? <strong className="owed">{money(row.outstanding)}</strong> : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {topClients.length === 0 && <div className="empty-state">No client jobs yet.</div>}
          </div>
        </section>
      </div>
    </>
  );
}

export default ReportsView;
