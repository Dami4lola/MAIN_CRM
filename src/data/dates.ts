export function pad(value: number) {
  return String(value).padStart(2, "0");
}

export function toISO(date: Date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function fromISO(iso: string) {
  const [year, month, day] = iso.split("-").map(Number);
  return new Date(year, month - 1, day);
}

export function todayISO() {
  return toISO(new Date());
}

export function addDays(iso: string, days: number) {
  const date = fromISO(iso);
  date.setDate(date.getDate() + days);
  return toISO(date);
}

export function startOfWeek(iso: string) {
  const date = fromISO(iso);
  date.setDate(date.getDate() - ((date.getDay() + 6) % 7));
  return toISO(date);
}

export function formatDate(iso: string, options: Intl.DateTimeFormatOptions = { month: "short", day: "numeric" }) {
  return fromISO(iso).toLocaleDateString("en-US", options);
}

export function formatTime(time: string) {
  const [hours, minutes] = time.split(":").map(Number);
  return `${hours % 12 || 12}:${pad(minutes)} ${hours >= 12 ? "PM" : "AM"}`;
}

export function timeToHours(time: string) {
  const [hours, minutes] = time.split(":").map(Number);
  return hours + minutes / 60;
}

export function formatWeekRange(startIso: string, endIso: string) {
  const start = fromISO(startIso);
  const end = fromISO(endIso);
  const startLabel = formatDate(startIso);
  const endLabel = start.getMonth() === end.getMonth() ? String(end.getDate()) : formatDate(endIso);
  return `${startLabel} – ${endLabel}, ${end.getFullYear()}`;
}

/** Hours as a decimal (9.5) to a time string ("09:30"). */
export function hoursToTime(hours: number) {
  const minutes = Math.round(hours * 60);
  return `${pad(Math.floor(minutes / 60))}:${pad(minutes % 60)}`;
}

/** A local timestamp in the form YYYY-MM-DDTHH:MM. */
export function stamp(date: string, hours: number) {
  const minutes = Math.round(hours * 60);
  const days = Math.floor(minutes / 1440);
  return `${addDays(date, days)}T${hoursToTime((minutes - days * 1440) / 60)}`;
}

export function nowStamp() {
  const now = new Date();
  return `${toISO(now)}T${pad(now.getHours())}:${pad(now.getMinutes())}`;
}

export function fromStamp(value: string) {
  const [date, time = "00:00"] = value.split("T");
  const result = fromISO(date);
  const [hours, minutes] = time.split(":").map(Number);
  result.setHours(hours, minutes);
  return result;
}

export function hoursBetween(from: string, to: string) {
  return (fromStamp(to).getTime() - fromStamp(from).getTime()) / 3_600_000;
}

export function formatStamp(value: string) {
  const [date, time] = value.split("T");
  return `${formatDate(date)}, ${formatTime(time)}`;
}

export function formatHours(hours: number) {
  if (hours < 1) return `${Math.round(hours * 60)} min`;
  return `${Math.round(hours * 10) / 10} h`;
}
