import { useState } from "react";
import { COMPANY, OFFICE_USER } from "../brand";
import Icon from "../components/Icon";
import type { Client, Crew, Technician } from "../data/types";
import type { Route } from "../router";

type Props = {
  crews: Crew[];
  technicians: Technician[];
  accounts: Client[];
  onSignIn: (route: Route) => void;
  onReset: () => void;
  toast: string;
};

/** Demo sign-in: pick a role. Each role then sees only the records it is allowed to. */
function SignIn({ crews, technicians, accounts, onSignIn, onReset, toast }: Props) {
  const [techId, setTechId] = useState(technicians[0]?.id ?? "");
  const [accountId, setAccountId] = useState(accounts[0]?.id ?? "");

  return (
    <div className="signin">
      <header className="signin-brand">
        <span className="brand-mark"><Icon name="flame" size={19} /></span>
        <span><strong>{COMPANY.name}</strong><small>{COMPANY.tagline}</small></span>
      </header>

      <div className="signin-intro">
        <h1>Field operations</h1>
        <p>Choose a role to sign in. Each role only sees the jobs and customers it is allowed to.</p>
      </div>

      <div className="signin-grid">
        <article className="panel signin-card">
          <span className="metric-icon blue"><Icon name="calendar" /></span>
          <h2>Office &amp; dispatch</h2>
          <p>Book jobs, dispatch crews, and track payments and payroll.</p>
          <p className="signin-user"><span className="profile-avatar">{OFFICE_USER.initials}</span>{OFFICE_USER.name} · {OFFICE_USER.title}</p>
          <button className="primary-button" onClick={() => onSignIn({ area: "office", page: "dispatch" })}>Sign in to the office</button>
        </article>

        <article className="panel signin-card">
          <span className="metric-icon orange"><Icon name="truck" /></span>
          <h2>Technician</h2>
          <p>Today's jobs for your crew, site history and close-out, built for a phone.</p>
          <label>
            Technician
            <select value={techId} onChange={(event) => setTechId(event.target.value)}>
              {crews.map((crew) => (
                <optgroup label={crew.name} key={crew.id}>
                  {technicians.filter((tech) => tech.crewId === crew.id).map((tech) => <option key={tech.id} value={tech.id}>{tech.name} ({tech.position})</option>)}
                </optgroup>
              ))}
            </select>
          </label>
          <button className="primary-button" disabled={!techId} onClick={() => onSignIn({ area: "tech", techId, page: "jobs" })}>Sign in as technician</button>
        </article>

        <article className="panel signin-card">
          <span className="metric-icon green"><Icon name="building" /></span>
          <h2>Client portal</h2>
          <p>Commercial accounts check visit status, SLA performance and job reports.</p>
          <label>
            Account
            <select value={accountId} onChange={(event) => setAccountId(event.target.value)}>
              {accounts.map((account) => <option key={account.id} value={account.id}>{account.name}</option>)}
            </select>
          </label>
          <button className="primary-button" disabled={!accountId} onClick={() => onSignIn({ area: "portal", clientId: accountId })}>Open the client portal</button>
        </article>
      </div>

      <a className="panel signin-booking" href="#/book" target="_blank" rel="noreferrer">
        <span className="metric-icon purple"><Icon name="plus" /></span>
        <span><strong>Customer booking page</strong><small>What a homeowner sees when they book online. Opens in a new tab; bookings land in the dispatch tray.</small></span>
        <Icon name="chevronRight" />
      </a>

      <footer className="signin-footer">
        <span>Built by {COMPANY.builtBy} · demo company, sample data only</span>
        <button className="inline-link" onClick={() => window.confirm("Reset all demo data to the starting point?") && onReset()}>Reset demo data</button>
      </footer>

      {toast && <div className="toast" role="status"><Icon name="check" size={17} />{toast}</div>}
    </div>
  );
}

export default SignIn;
