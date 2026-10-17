import { useRef } from "react";
import { useApp } from "../appContext";
import Icon from "../components/Icon";
import Pager, { usePaged } from "../components/Pager";
import { formatStamp, todayISO } from "../data/dates";
import { CURRENCIES } from "../data/money";

function SettingsView() {
  const { store, notify } = useApp();
  const fileInput = useRef<HTMLInputElement>(null);
  const audit = usePaged(store.state.audit, 15, "");

  function exportData() {
    const blob = new Blob([JSON.stringify(store.state, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `northline-backup-${todayISO()}.json`;
    link.click();
    URL.revokeObjectURL(url);
    notify("Backup downloaded");
  }

  async function importData(file: File) {
    try {
      const ok = store.importData(JSON.parse(await file.text()));
      notify(ok ? "Backup restored" : "That file isn't a Northline backup");
    } catch {
      notify("Couldn't read that file");
    }
  }

  return (
    <>
      <section className="panel settings-panel">
        <div className="panel-header"><div><h2>Settings</h2><p>Demo data is saved in this browser only. Export a backup to move it to another device.</p></div></div>

        {store.saveFailed && (
          <div className="setting-row warning-row">
            <div><strong>Changes aren't being saved</strong><p>This browser's storage is full or blocked, so changes will be lost on reload. Export a backup or reset the demo data.</p></div>
          </div>
        )}

        <div className="setting-row">
          <div><strong>Currency</strong><p>Used for quotes, deposits, balances and payroll.</p></div>
          <select value={store.state.currency} onChange={(event) => store.setCurrency(event.target.value)}>
            {CURRENCIES.map((code) => <option key={code} value={code}>{code}</option>)}
          </select>
        </div>

        <div className="setting-row">
          <div><strong>"On the way" text</strong><p>When the customer is told the crew is coming. Sending it when the tech taps On my way matches when they actually leave.</p></div>
          <select value={store.state.settings.enRouteText} onChange={(event) => store.setSettings({ enRouteText: event.target.value as "assign" | "on-my-way" })}>
            <option value="on-my-way">When the tech taps On my way</option>
            <option value="assign">As soon as a crew is assigned</option>
          </select>
        </div>

        <div className="setting-row">
          <div><strong>Export backup</strong><p>Download every client, site, job and payment as a JSON file.</p></div>
          <button className="secondary-button" onClick={exportData}><Icon name="file" size={15} />Export</button>
        </div>

        <div className="setting-row">
          <div><strong>Import backup</strong><p>Replace the current data with a backup file.</p></div>
          <button className="secondary-button" onClick={() => fileInput.current?.click()}>Import…</button>
          <input
            ref={fileInput}
            type="file"
            accept="application/json,.json"
            hidden
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file && window.confirm("Replace all current data with this backup?")) importData(file);
              event.target.value = "";
            }}
          />
        </div>

        <div className="setting-row">
          <div><strong>Reset demo data</strong><p>Restore Northline Mechanical to its starting point. Do this before every sales call.</p></div>
          <button
            className="secondary-button danger-text"
            onClick={() => {
              if (window.confirm("Delete all changes and restore the demo data?")) {
                store.resetData();
                notify("Demo data restored");
              }
            }}
          >
            <Icon name="trash" size={15} />Reset
          </button>
        </div>
      </section>

      <section className="panel settings-panel">
        <div className="panel-header"><div><h2>Activity log</h2><p>Every change, who made it and when. Keeps the latest 500 entries.</p></div></div>
        <div className="job-table-wrap">
          <table>
            <thead><tr><th>When</th><th>Who</th><th>What</th></tr></thead>
            <tbody>
              {audit.items.map((entry) => (
                <tr key={entry.id}>
                  <td>{formatStamp(entry.at)}</td>
                  <td>{entry.actor}</td>
                  <td><strong>{entry.action}</strong></td>
                </tr>
              ))}
            </tbody>
          </table>
          {audit.total === 0 && <div className="empty-state">No changes yet. Edits made in any role show up here.</div>}
        </div>
        <Pager paged={audit} />
      </section>
    </>
  );
}

export default SettingsView;
