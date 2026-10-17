import { useApp } from "../appContext";
import DispatchBoard from "../components/DispatchBoard";
import Icon, { type IconName } from "../components/Icon";
import { todayISO } from "../data/dates";

type Metric = { label: string; value: number; note: string; icon: IconName; tone: string; positive?: boolean };

/** Office home: today's numbers and the dispatch board. */
function DispatchView() {
  const { store, navigate } = useApp();
  const { jobs, messages, crews } = store.state;
  const today = todayISO();
  const todays = jobs.filter((job) => job.date === today && job.crewId);
  const unassigned = jobs.filter((job) => job.status === "Unassigned");
  const emergencies = unassigned.filter((job) => job.priority === "Emergency").length;
  const completed = todays.filter((job) => job.status === "Completed").length;
  const textsToday = messages.filter((message) => message.at.startsWith(today)).length;

  const metrics: Metric[] = [
    { label: "Today's jobs", value: todays.length, note: `${todays.filter((job) => job.status === "On site").length} on site · ${todays.filter((job) => job.status === "En route").length} en route · ${new Set(todays.map((job) => job.crewId)).size} of ${crews.length} crews`, icon: "briefcase", tone: "blue" },
    { label: "Waiting for a crew", value: unassigned.length, note: `${emergencies} ${emergencies === 1 ? "emergency" : "emergencies"} · ${unassigned.filter((job) => job.source === "Online").length} booked online`, icon: "clock", tone: "orange" },
    { label: "Completed today", value: completed, note: `${todays.length - completed} still to finish`, icon: "check", tone: "green", positive: completed > 0 },
    { label: "Customer texts today", value: textsToday, note: "booked, on the way, job done", icon: "mail", tone: "purple" },
  ];

  return (
    <>
      <div className="metrics">
        {metrics.map((metric) => (
          <article className="metric-card" key={metric.label}>
            <span className={`metric-icon ${metric.tone}`}><Icon name={metric.icon} /></span>
            <span><small>{metric.label}</small><strong>{metric.value}</strong></span>
            <em className={metric.positive ? "positive" : ""}>{metric.note}</em>
          </article>
        ))}
      </div>

      <DispatchBoard />

      <p className="page-links">
        <a href="#/book" target="_blank" rel="noreferrer"><Icon name="plus" size={14} />Open the customer booking page</a>
        <button className="inline-link" onClick={() => navigate({ area: "office", page: "messages" })}>See all customer texts</button>
      </p>
    </>
  );
}

export default DispatchView;
