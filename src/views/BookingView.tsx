import { useState } from "react";
import { COMPANY } from "../brand";
import Icon from "../components/Icon";
import { SERVICES, type Service } from "../data/catalog";
import { addDays, formatDate, fromISO, todayISO } from "../data/dates";
import { formatMoney } from "../data/money";
import type { CrmStore } from "../data/store";
import type { Priority, Trade } from "../data/types";

const TRADES: Trade[] = ["HVAC", "Plumbing", "Electrical"];
const STEPS = ["Service", "Details", "Time", "Contact"];
const EMERGENCY_FEE = 95;
const WINDOWS = [
  { id: "morning", label: "Morning", hours: "8 AM – 12 PM", time: "08:00", endsAt: 12 },
  { id: "afternoon", label: "Afternoon", hours: "12 – 5 PM", time: "13:00", endsAt: 17 },
] as const;

type WindowId = (typeof WINDOWS)[number]["id"];
type Errors = Partial<Record<"service" | "description" | "date" | "window" | "name" | "phone" | "email" | "address", string>>;

/** The next 10 days the company works (no Sundays). */
function bookableDays() {
  const days: string[] = [];
  for (let offset = 0; days.length < 10; offset++) {
    const day = addDays(todayISO(), offset);
    if (fromISO(day).getDay() !== 0) days.push(day);
  }
  return days;
}

function dayLabel(day: string) {
  const today = todayISO();
  if (day === today) return "Today";
  if (day === addDays(today, 1)) return "Tomorrow";
  return formatDate(day, { weekday: "short", month: "short", day: "numeric" });
}

/** Public page where a homeowner books a visit. A booking lands in the office dispatch tray. */
function BookingView({ store }: { store: CrmStore }) {
  const { currency } = store.state;
  const money = (amount: number) => formatMoney(amount, currency);
  const [step, setStep] = useState(0);
  const [trade, setTrade] = useState<Trade>("HVAC");
  const [service, setService] = useState<Service | null>(null);
  const [priority, setPriority] = useState<Priority>("Routine");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState("");
  const [windowId, setWindowId] = useState<WindowId | "">("");
  const [contact, setContact] = useState({ name: "", phone: "", email: "", address: "" });
  const [errors, setErrors] = useState<Errors>({});
  const [booked, setBooked] = useState<{ jobId: string; returning: boolean } | null>(null);

  const days = bookableDays();
  const nowHour = new Date().getHours();
  const extra = priority === "Emergency" ? EMERGENCY_FEE : 0;
  const estimate: [number, number] | null = service ? [service.price[0] + extra, service.price[1] + extra] : null;
  const chosenWindow = WINDOWS.find((item) => item.id === windowId);
  const windowClosed = (item: (typeof WINDOWS)[number]) => date === todayISO() && nowHour >= item.endsAt - 1;

  function validate(index: number): Errors {
    const found: Errors = {};
    if (index === 0 && !service) found.service = "Choose the service you need.";
    if (index === 1 && description.trim().length < 5) found.description = "Tell us a little about the problem.";
    if (index === 2) {
      if (!date) found.date = "Pick a day.";
      if (!chosenWindow) found.window = "Pick a time window.";
      else if (windowClosed(chosenWindow)) found.window = "That window has passed today. Pick another.";
    }
    if (index === 3) {
      if (!contact.name.trim()) found.name = "Enter your name.";
      if (contact.phone.replace(/\D/g, "").length < 10) found.phone = "Enter a phone number we can text, with area code.";
      if (contact.email.trim() && !/^\S+@\S+\.\S+$/.test(contact.email.trim())) found.email = "That email doesn't look right.";
      if (contact.address.trim().length < 5) found.address = "Enter the address where the work is.";
    }
    return found;
  }

  function next() {
    const found = validate(step);
    setErrors(found);
    if (Object.keys(found).length) return;
    if (step < STEPS.length - 1) {
      setStep(step + 1);
      return;
    }
    setBooked(
      store.bookOnline({
        title: service!.title,
        trade: service!.trade,
        priority,
        date,
        time: chosenWindow!.time,
        duration: service!.duration,
        description: `${description.trim()} (Preferred: ${chosenWindow!.label.toLowerCase()})`,
        estimate: estimate!,
        name: contact.name.trim(),
        phone: contact.phone.trim(),
        email: contact.email.trim(),
        address: contact.address.trim(),
      }),
    );
  }

  function restart() {
    setStep(0);
    setService(null);
    setPriority("Routine");
    setDescription("");
    setDate("");
    setWindowId("");
    setContact({ name: "", phone: "", email: "", address: "" });
    setErrors({});
    setBooked(null);
  }

  const contactField = (key: keyof typeof contact) => ({
    value: contact[key],
    onChange: (event: { target: { value: string } }) => setContact((current) => ({ ...current, [key]: event.target.value })),
    "aria-invalid": Boolean(errors[key]),
  });
  const confirmation = booked ? store.state.messages.find((message) => message.jobId === booked.jobId && message.kind === "booking") : undefined;

  return (
    <div className="booking">
      <header className="booking-brand">
        <span className="brand-mark"><Icon name="flame" size={19} /></span>
        <span><strong>{COMPANY.name}</strong><small>Book a visit online · no phone tag</small></span>
      </header>

      {booked ? (
        <section className="panel booking-card booking-done">
          <span className="done-mark"><Icon name="check" size={26} /></span>
          <h1>Request received</h1>
          <p>Your reference is <strong>{booked.jobId}</strong>. We'll text you as soon as a crew is booked{booked.returning ? ", and we've added it to your existing account" : ""}.</p>
          {confirmation && (
            <div className="phone-preview">
              <small>Text to {confirmation.to}</small>
              <p className="sms-bubble">{confirmation.body}</p>
            </div>
          )}
          <div className="booking-actions">
            <button className="secondary-button" onClick={restart}>Book another visit</button>
          </div>
          <p className="demo-note">Demo: this request is now in the office dispatch tray, waiting for a crew.</p>
        </section>
      ) : (
        <div className="booking-layout">
          <section className="panel booking-card">
            <ol className="stepper">
              {STEPS.map((label, index) => (
                <li key={label} className={index === step ? "current" : index < step ? "done" : ""}>
                  <span>{index < step ? <Icon name="check" size={12} /> : index + 1}</span>{label}
                </li>
              ))}
            </ol>

            {step === 0 && (
              <div className="booking-step">
                <h1>What do you need?</h1>
                <div className="segmented booking-trades">
                  {TRADES.map((item) => <button key={item} className={trade === item ? "selected" : ""} onClick={() => setTrade(item)}>{item}</button>)}
                </div>
                <div className="service-grid">
                  {SERVICES.filter((item) => item.trade === trade && item.market !== "commercial").map((item) => (
                    <button key={item.id} className={service?.id === item.id ? "service-option selected" : "service-option"} aria-pressed={service?.id === item.id} onClick={() => setService(item)}>
                      <strong>{item.title}</strong>
                      <span>{money(item.price[0])}{item.price[1] !== item.price[0] ? ` – ${money(item.price[1])}` : ""}</span>
                      <small>About {item.duration} h</small>
                    </button>
                  ))}
                </div>
                {errors.service && <p className="form-error">{errors.service}</p>}
              </div>
            )}

            {step === 1 && (
              <div className="booking-step">
                <h1>Tell us what's going on</h1>
                <label>
                  What's the problem?
                  <textarea rows={4} placeholder="e.g. Furnace starts, then shuts off after a few seconds. It's about 10 years old." value={description} onChange={(event) => setDescription(event.target.value)} aria-invalid={Boolean(errors.description)} />
                </label>
                {errors.description && <p className="form-error">{errors.description}</p>}
                <span className="block-label">How urgent is it?</span>
                <div className="urgency">
                  {([
                    ["Routine", "When it suits", "Book any open day"],
                    ["Urgent", "In the next day or two", "We'll aim for the first open slot"],
                    ["Emergency", "No heat, no water or a leak", `Same-day where possible · ${money(EMERGENCY_FEE)} call-out`],
                  ] as [Priority, string, string][]).map(([value, title, note]) => (
                    <button key={value} className={priority === value ? "service-option selected" : "service-option"} aria-pressed={priority === value} onClick={() => setPriority(value)}>
                      <strong>{value}</strong>
                      <span>{title}</span>
                      <small>{note}</small>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="booking-step">
                <h1>When suits you?</h1>
                <span className="block-label">Day</span>
                <div className="day-chips">
                  {days.map((day) => <button key={day} className={date === day ? "chip selected chip-on" : "chip"} aria-pressed={date === day} onClick={() => setDate(day)}>{dayLabel(day)}</button>)}
                </div>
                {errors.date && <p className="form-error">{errors.date}</p>}
                <span className="block-label">Time window</span>
                <div className="urgency">
                  {WINDOWS.map((item) => (
                    <button key={item.id} disabled={windowClosed(item)} className={windowId === item.id ? "service-option selected" : "service-option"} aria-pressed={windowId === item.id} onClick={() => setWindowId(item.id)}>
                      <strong>{item.label}</strong>
                      <span>{item.hours}</span>
                      {windowClosed(item) && <small>Passed for today</small>}
                    </button>
                  ))}
                </div>
                {errors.window && <p className="form-error">{errors.window}</p>}
              </div>
            )}

            {step === 3 && (
              <div className="booking-step">
                <h1>How do we reach you?</h1>
                <label>Your name<input autoComplete="name" {...contactField("name")} /></label>
                {errors.name && <p className="form-error">{errors.name}</p>}
                <div className="form-row">
                  <label>Mobile number<input type="tel" autoComplete="tel" placeholder="(555) 000-0000" {...contactField("phone")} /></label>
                  <label>Email (optional)<input type="email" autoComplete="email" {...contactField("email")} /></label>
                </div>
                {(errors.phone || errors.email) && <p className="form-error">{errors.phone ?? errors.email}</p>}
                <label>Address of the job<input autoComplete="street-address" placeholder="Street, town" {...contactField("address")} /></label>
                {errors.address && <p className="form-error">{errors.address}</p>}
                <p className="muted-line">We text you when a crew is booked, when they're on the way and when the job is done.</p>
              </div>
            )}

            <div className="booking-actions">
              {step > 0 && <button className="secondary-button" onClick={() => { setErrors({}); setStep(step - 1); }}><Icon name="chevronLeft" size={15} />Back</button>}
              <button className="primary-button" onClick={next}>{step === STEPS.length - 1 ? "Request booking" : "Continue"}<Icon name="chevronRight" size={15} /></button>
            </div>
          </section>

          <aside className="panel booking-summary">
            <p className="eyebrow">YOUR VISIT</p>
            <dl className="detail-list">
              <div><dt>Service</dt><dd>{service ? service.title : "—"}</dd></div>
              <div><dt>Urgency</dt><dd>{priority}</dd></div>
              <div><dt>When</dt><dd>{date ? `${dayLabel(date)}${chosenWindow ? ` · ${chosenWindow.label.toLowerCase()}` : ""}` : "—"}</dd></div>
            </dl>
            <div className="estimate">
              <small>Estimate</small>
              <strong>{estimate ? `${money(estimate[0])} – ${money(estimate[1])}` : "Choose a service"}</strong>
              <p>The final price is confirmed on site before any work starts.</p>
            </div>
          </aside>
        </div>
      )}

      <footer className="signin-footer booking-footer">
        <span>{COMPANY.name} · {COMPANY.tagline}</span>
        <a className="inline-link" href="#/">Demo: back to sign-in</a>
      </footer>
    </div>
  );
}

export default BookingView;
