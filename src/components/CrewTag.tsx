import { useApp } from "../appContext";
import Avatar from "./Avatar";

/** A crew's colour badge and name, or "Unassigned". */
function CrewTag({ crewId, small = false }: { crewId: string | null; small?: boolean }) {
  const { crew } = useApp();
  const record = crew(crewId);
  return (
    <span className="worker-cell">
      <Avatar worker={record ? { color: record.color, initials: record.code } : undefined} small={small} />
      {record ? record.name : <span className="unassigned">Unassigned</span>}
    </span>
  );
}

export default CrewTag;
