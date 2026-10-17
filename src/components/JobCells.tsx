import { useApp } from "../appContext";
import { NEXT_STEP_LABEL, nextStatus } from "../data/ops";
import type { Job } from "../data/types";
import { StatusBadge } from "./PaymentBadge";

export function ClientLink({ clientId }: { clientId: string }) {
  const { isOffice, client, openClient } = useApp();
  const name = client(clientId)?.name ?? "Unknown client";
  if (!isOffice) return <strong>{name}</strong>;
  return (
    <button className="link-button" onClick={(event) => { event.stopPropagation(); openClient(clientId); }}>
      {name}
    </button>
  );
}

/** The job's status, plus a button that moves it to the next step when there is one. */
export function StatusButton({ job }: { job: Job }) {
  const { advanceJob } = useApp();
  const next = nextStatus(job);
  return (
    <span className="status-cell">
      <StatusBadge job={job} />
      {next && (
        <button className="secondary-button small" onClick={(event) => { event.stopPropagation(); advanceJob(job.id); }}>
          {NEXT_STEP_LABEL[next]}
        </button>
      )}
    </span>
  );
}
