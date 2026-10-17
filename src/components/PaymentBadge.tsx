import { paymentStage } from "../data/money";
import type { Job, JobStatus, PaymentStage, Priority } from "../data/types";

const slug = (value: string) => value.toLowerCase().replace(/\s+/g, "-");

export function stageClass(stage: PaymentStage) {
  return `pay pay-${slug(stage)}`;
}

export function statusClass(status: JobStatus) {
  return `status status-${slug(status)}`;
}

export function StatusBadge({ job }: { job: Job }) {
  return <span className={statusClass(job.status)}>{job.status}</span>;
}

export function PriorityBadge({ priority }: { priority: Priority }) {
  if (priority === "Routine") return null;
  return <span className={`status priority-${slug(priority)}`}>{priority}</span>;
}

function PaymentBadge({ job }: { job: Job }) {
  const stage = paymentStage(job);
  return <span className={stageClass(stage)}>{stage}</span>;
}

export default PaymentBadge;
