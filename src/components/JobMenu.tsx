import { useApp } from "../appContext";
import type { Job } from "../data/types";
import RowMenu from "./RowMenu";

function JobMenu({ job }: { job: Job }) {
  const { isOffice, openJob, editJob, removeJob, openClient } = useApp();
  const items = [{ label: "Open job", onSelect: () => openJob(job.id) }];
  if (isOffice) {
    items.push({ label: "Open client file", onSelect: () => openClient(job.clientId) }, { label: "Edit job", onSelect: () => editJob(job.id) });
  }

  return <RowMenu label={`More options for ${job.title}`} items={isOffice ? [...items, { label: "Delete job", onSelect: () => removeJob(job.id), danger: true }] : items} />;
}

export default JobMenu;
