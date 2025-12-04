import type { TaskRow, TaskStatus } from "../data/mockTasks";

export function computeStatus(dueIso: string, complianceWindow?: number): TaskStatus {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const due = new Date(dueIso);
  due.setHours(0, 0, 0, 0);
  const diffDays = Math.floor((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

  const window = complianceWindow || 30;
  const urgentThreshold = Math.floor(window * 0.8); // 80% into compliance = urgent

  // Future dates
  if (diffDays > 5) return "Current";      // More than 5 days out
  if (diffDays >= 0) return "Upcoming";    // Within 5 days

  // Past due dates (diffDays is negative)
  const daysOverdue = Math.abs(diffDays);
  
  // If overdue by more than 80% of compliance window OR more than 5 days, it's urgent
  if (daysOverdue > 5 || daysOverdue >= urgentThreshold) return "Urgent";
  
  return "PastDue"; // 1-5 days past due
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
