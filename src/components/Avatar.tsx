import type { Technician } from "../data/types";

function Avatar({ worker, small = false }: { worker?: Pick<Technician, "color" | "initials">; small?: boolean }) {
  if (!worker) return <span className={`avatar avatar-none ${small ? "avatar-small" : ""}`}>?</span>;
  return <span className={`avatar avatar-${worker.color} ${small ? "avatar-small" : ""}`}>{worker.initials}</span>;
}

export default Avatar;
