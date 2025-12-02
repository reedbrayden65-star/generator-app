import type { TaskRow, TaskStatus } from "../data/mockTasks";

export function computeStatus(dueIso: string): TaskStatus {
  const now = new Date();
  const due = new Date(dueIso);
  const diffDays = (due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);

  const X = 14; // upcoming threshold
  const Y = 7;  // urgent overdue threshold

  if (diffDays > X) return "Current";
  if (diffDays >= 0) return "Upcoming";
  if (diffDays >= -Y) return "PastDue";
  return "Urgent";
}

export function statusColor(status: TaskStatus): string {
  switch (status) {
    case "Current": return "#9ca3af";   // grey
    case "Upcoming": return "#facc15";  // yellow
    case "PastDue": return "#fb923c";   // orange
    case "Urgent": return "#ef4444";    // red
    case "Escalated": return "#dc2626"; // deep red
    case "Completed": return "#22c55e"; // green
    default: return "#9ca3af";
  }
}

export function generatorWorstStatus(tasks: TaskRow[]): TaskStatus {
  const order: TaskStatus[] = ["Urgent", "PastDue", "Upcoming", "Current"];
  for (const s of order) {
    if (tasks.some(t => t.Status === s)) return s;
  }
  return "Current";
}
