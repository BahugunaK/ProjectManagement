export function PriorityBadge({ priority }) {
  return <span className={`badge ${priority?.toLowerCase()}`}>{priority}</span>;
}

export function StatusBadge({ status }) {
  const cls = status === 'InProgress' ? 'inprogress' : status?.toLowerCase();
  const label = status === 'ToDo' ? 'To Do' : status === 'InProgress' ? 'In Progress' : status;
  return <span className={`badge ${cls}`}>{label}</span>;
}
