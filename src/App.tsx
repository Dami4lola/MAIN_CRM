import { useEffect, useMemo, useRef, useState } from "react";
import { AppContext, type AppContextValue } from "./appContext";
import { OFFICE_USER } from "./brand";
import Avatar from "./components/Avatar";
import ClientForm from "./components/ClientForm";
import CloseOutSheet from "./components/CloseOutSheet";
import Icon from "./components/Icon";
import JobDrawer from "./components/JobDrawer";
import JobForm from "./components/JobForm";
import ProfileMenu, { type Identity } from "./components/ProfileMenu";
import Sidebar, { type NavItem } from "./components/Sidebar";
import { scopeFor } from "./data/access";
import { todayISO } from "./data/dates";
import { formatMoney } from "./data/money";
import { isOpen, nextStatus } from "./data/ops";
import { useCrmStore } from "./data/store";
import { plural } from "./data/text";
import type { Role } from "./data/types";
import { useRoute } from "./router";
import ClientFile from "./views/ClientFile";
import BookingView from "./views/BookingView";
import ClientsView from "./views/ClientsView";
import DispatchView from "./views/DispatchView";
import JobsView from "./views/JobsView";
import MessagesView from "./views/MessagesView";
import PortalView from "./views/PortalView";
import ReportsView from "./views/ReportsView";
import ScheduleView from "./views/ScheduleView";
import SettingsView from "./views/SettingsView";
import SignIn from "./views/SignIn";
import TeamView from "./views/TeamView";
import TechJobsView from "./views/TechJobsView";

function greeting() {
  const hour = new Date().getHours();
  return hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
}

function App() {
  const [route, navigate] = useRoute();
  const store = useCrmStore();
  const { crews, technicians, clients, sites, jobs, currency } = store.state;

  const lookup = useMemo(
    () => ({
      clients: new Map(clients.map((item) => [item.id, item])),
      sites: new Map(sites.map((item) => [item.id, item])),
      crews: new Map(crews.map((item) => [item.id, item])),
      techs: new Map(technicians.map((item) => [item.id, item])),
    }),
    [clients, sites, crews, technicians],
  );

  // The URL names the role; unknown technicians or accounts fall back to sign-in.
  let role: Role | null = null;
  if (route.area === "office") role = { kind: "office" };
  else if (route.area === "tech" && lookup.techs.has(route.techId)) role = { kind: "tech", techId: route.techId };
  else if (route.area === "portal" && lookup.clients.get(route.clientId)?.kind === "commercial") role = { kind: "client", clientId: route.clientId };
  const roleKey = role ? JSON.stringify(role) : "";

  const currentTech = role?.kind === "tech" ? lookup.techs.get(role.techId) : undefined;
  const currentClient = role?.kind === "client" ? lookup.clients.get(role.clientId) : undefined;
  const scope = useMemo(() => (role ? scopeFor(role, store.state) : null), [roleKey, store.state]);

  const [search, setSearch] = useState("");
  const [toast, setToast] = useState("");
  const [openJobId, setOpenJobId] = useState<string | null>(null);
  const [jobForm, setJobForm] = useState<{ jobId?: string; clientId?: string } | null>(null);
  const [clientForm, setClientForm] = useState<{ clientId?: string } | null>(null);
  const [closeOutId, setCloseOutId] = useState<string | null>(null);
  const toastTimer = useRef<number | undefined>(undefined);

  const identity: Identity = currentTech
    ? { name: currentTech.name, subtitle: `${currentTech.position} · ${lookup.crews.get(currentTech.crewId)?.name ?? "No crew"}`, avatar: <Avatar worker={currentTech} /> }
    : currentClient
      ? { name: currentClient.contactName, subtitle: currentClient.name, avatar: <span className="profile-avatar">{currentClient.contactName.split(" ").map((part) => part[0]).join("")}</span> }
      : { name: OFFICE_USER.name, subtitle: `Office · ${OFFICE_USER.title}`, avatar: <span className="profile-avatar">{OFFICE_USER.initials}</span> };
  const actorName = route.area === "book" ? "Customer (online booking)" : currentTech ? `${currentTech.name} (tech)` : currentClient ? `${currentClient.contactName} (${currentClient.name})` : `${OFFICE_USER.name} (office)`;

  const { setActor } = store;
  useEffect(() => setActor(actorName), [setActor, actorName]);

  // A new sign-in starts with a clean slate.
  useEffect(() => {
    setSearch("");
    setOpenJobId(null);
    setJobForm(null);
    setClientForm(null);
    setCloseOutId(null);
  }, [roleKey]);

  function notify(message: string) {
    setToast(message);
    window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToast(""), 2400);
  }

  if (route.area === "book") return <BookingView store={store} />;

  if (!role || !scope) {
    return (
      <SignIn
        crews={crews}
        technicians={technicians}
        accounts={clients.filter((client) => client.kind === "commercial")}
        onSignIn={navigate}
        onReset={() => {
          store.resetData();
          notify("Demo data reset");
        }}
        toast={toast}
      />
    );
  }

  const isOffice = role.kind === "office";
  const visibleJobs = scope.jobs;
  const today = todayISO();
  const unassigned = jobs.filter((job) => job.status === "Unassigned").length;

  const navItems: NavItem[] =
    role.kind === "office"
      ? [
          { key: "dispatch", label: "Dispatch", icon: "calendar", count: unassigned },
          { key: "jobs", label: "Jobs", icon: "briefcase" },
          { key: "clients", label: "Clients", icon: "users" },
          { key: "team", label: "Crews", icon: "user" },
          { key: "messages", label: "Texts", icon: "mail" },
          { key: "reports", label: "Reports", icon: "chart" },
        ]
      : role.kind === "tech"
        ? [
            { key: "jobs", label: "My jobs", icon: "briefcase", count: visibleJobs.filter((job) => job.date === today && isOpen(job)).length },
            { key: "schedule", label: "Schedule", icon: "calendar" },
          ]
        : [{ key: "visits", label: "Visits", icon: "briefcase" }];
  const activeKey = route.area === "office" || route.area === "tech" ? route.page : "visits";

  function selectSection(key: string) {
    if (route.area === "office") navigate({ area: "office", page: key as typeof route.page });
    else if (route.area === "tech") navigate({ area: "tech", techId: route.techId, page: key as typeof route.page });
  }

  const context: AppContextValue = {
    store,
    role,
    search,
    isOffice,
    currentTech,
    currentClient,
    scope,
    visibleJobs,
    notify,
    navigate,
    money: (amount) => formatMoney(amount, currency),
    client: (id) => lookup.clients.get(id),
    site: (id) => lookup.sites.get(id),
    crew: (id) => (id ? lookup.crews.get(id) : undefined),
    tech: (id) => lookup.techs.get(id),
    crewMembers: (crewId) => technicians.filter((tech) => tech.crewId === crewId),
    jobMatchesSearch(job) {
      const query = search.toLowerCase().trim();
      if (!query) return true;
      const owner = lookup.clients.get(job.clientId);
      const contact = isOffice ? `${owner?.phone ?? ""} ${owner?.email ?? ""}` : "";
      const crewName = job.crewId ? (lookup.crews.get(job.crewId)?.name ?? "") : "unassigned";
      return `${job.title} ${job.id} ${job.address} ${owner?.name ?? ""} ${lookup.sites.get(job.siteId)?.name ?? ""} ${crewName} ${contact}`.toLowerCase().includes(query);
    },
    openJob: (id) => setOpenJobId(id),
    openClient(id) {
      if (!isOffice) return;
      navigate({ area: "office", page: "clients", clientId: id });
      setOpenJobId(null);
    },
    newJob: (clientId) => setJobForm({ clientId }),
    editJob: (id) => setJobForm({ jobId: id }),
    removeJob(id) {
      const job = jobs.find((item) => item.id === id);
      if (!job || !window.confirm(`Delete ${job.id} · ${job.title}?`)) return;
      store.deleteJob(id);
      if (openJobId === id) setOpenJobId(null);
      notify("Job deleted");
    },
    advanceJob(id) {
      const job = jobs.find((item) => item.id === id);
      if (!job) return;
      const next = nextStatus(job);
      if (!next) {
        if (job.status === "Unassigned") notify("Assign a crew first");
        return;
      }
      // Finishing a job always goes through the close-out report.
      if (next === "Completed") {
        setCloseOutId(id);
        return;
      }
      store.advanceStatus(id);
      const texted = next === "En route" && store.state.settings.enRouteText === "on-my-way";
      notify(`${job.id} is now ${next.toLowerCase()}${texted ? " · customer texted" : ""}`);
    },
  };

  const drawerJob = visibleJobs.find((job) => job.id === openJobId);
  const closeOutJob = role.kind !== "client" ? visibleJobs.find((job) => job.id === closeOutId && job.status === "On site") : undefined;
  const editingJob = jobs.find((job) => job.id === jobForm?.jobId);
  const editingClient = clients.find((client) => client.id === clientForm?.clientId);
  const firstName = identity.name.split(" ")[0];

  let title: string;
  let content;
  if (route.area === "tech") {
    title = route.page === "jobs" ? `${greeting()}, ${firstName}` : "My schedule";
    content = route.page === "jobs" ? <TechJobsView /> : <ScheduleView />;
  } else if (route.area === "portal") {
    title = `${greeting()}, ${firstName}`;
    content = <PortalView />;
  } else {
    const page = route.area === "office" ? route.page : "dispatch";
    const clientId = route.area === "office" ? route.clientId : undefined;
    title = { dispatch: `${greeting()}, ${firstName}`, jobs: "Jobs", clients: clientId ? "Client file" : "Clients", team: "Crews & timesheets", messages: "Customer texts", reports: "Reports", settings: "Settings" }[page];
    if (page === "jobs") content = <JobsView />;
    else if (page === "clients")
      content = clientId ? (
        <ClientFile clientId={clientId} onBack={() => navigate({ area: "office", page: "clients" })} onEdit={() => setClientForm({ clientId })} />
      ) : (
        <ClientsView onNewClient={() => setClientForm({})} />
      );
    else if (page === "team") content = <TeamView />;
    else if (page === "messages") content = <MessagesView />;
    else if (page === "reports") content = <ReportsView />;
    else if (page === "settings") content = <SettingsView />;
    else content = <DispatchView />;
  }

  const bellMessage = isOffice
    ? `${plural(unassigned, "job")} waiting for a crew`
    : role.kind === "tech"
      ? `You have ${plural(visibleJobs.filter((job) => job.date === today).length, "job")} today`
      : `${plural(visibleJobs.filter(isOpen).length, "visit")} open`;
  const signOut = () => navigate({ area: "signin" });
  const openSettings = isOffice ? () => navigate({ area: "office", page: "settings" }) : undefined;

  return (
    <AppContext.Provider value={context}>
      <div className="app-shell">
        <Sidebar items={navItems} active={activeKey} identity={identity} onSelect={selectSection} onSwitchRole={signOut} onSettings={openSettings} settingsActive={route.area === "office" && route.page === "settings"} />

        <main className="workspace">
          <header className="topbar">
            <div>
              <p className="eyebrow">{new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" }).toUpperCase()}</p>
              <h1>{title}</h1>
            </div>
            <div className="top-actions">
              <label className="search-box">
                <Icon name="search" size={17} />
                <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder={isOffice ? "Search jobs, clients, sites..." : role.kind === "tech" ? "Search my jobs..." : "Search visits or sites..."} />
                {search && <button className="clear-search" aria-label="Clear search" onClick={() => setSearch("")}><Icon name="close" size={14} /></button>}
              </label>
              <button className="icon-button notification" aria-label="Notifications" onClick={() => notify(bellMessage)}>
                <Icon name="bell" />{isOffice && unassigned > 0 && <span />}
              </button>
              <span className="mobile-only">
                <ProfileMenu identity={identity} onSwitchRole={signOut} onSettings={openSettings} placement="down" compact />
              </span>
              {isOffice && <button className="primary-button" onClick={() => setJobForm({})}><Icon name="plus" size={17} /><span>Schedule job</span></button>}
            </div>
          </header>

          <section className="content">{content}</section>
        </main>

        {drawerJob && <JobDrawer key={drawerJob.id} job={drawerJob} onClose={() => setOpenJobId(null)} />}

        {closeOutJob && <CloseOutSheet key={closeOutJob.id} job={closeOutJob} onClose={() => setCloseOutId(null)} />}

        {jobForm && isOffice && (
          <JobForm
            job={editingJob}
            presetClientId={jobForm.clientId}
            clients={clients}
            sites={sites}
            crews={crews}
            onCancel={() => setJobForm(null)}
            onCreateClient={(input) => {
              const id = store.addClient(input);
              notify(`${input.name} added to clients`);
              return id;
            }}
            onSave={(input) => {
              if (editingJob) store.updateJob(editingJob.id, input);
              else store.addJob(input);
              setJobForm(null);
              notify(editingJob ? "Job updated" : input.crewId ? "New job added to the schedule" : "New job added; it needs a crew");
            }}
          />
        )}

        {clientForm && isOffice && (
          <ClientForm
            client={editingClient}
            onCancel={() => setClientForm(null)}
            onSave={(input) => {
              if (editingClient) {
                store.updateClient(editingClient.id, input);
              } else {
                context.openClient(store.addClient(input));
              }
              setClientForm(null);
              notify(editingClient ? "Client updated" : `${input.name} added to clients`);
            }}
          />
        )}

        {toast && <div className="toast" role="status"><Icon name="check" size={17} />{toast}</div>}
      </div>
    </AppContext.Provider>
  );
}

export default App;
