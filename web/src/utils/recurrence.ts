import type { TaskRow } from "../data/mockTasks";

/**
 * Calculate the next due date based on recurrence settings
 */
export function calculateNextDueDate(
  currentDueDate: string,
  recurrenceType?: string | null,
  recurrenceInterval?: number | null
): string | null {
  if (!recurrenceType || !recurrenceInterval) return null;

  const date = new Date(currentDueDate);
  if (isNaN(date.getTime())) return null;

  switch (recurrenceType) {
    case "DAILY":
      date.setDate(date.getDate() + recurrenceInterval);
      break;
    case "WEEKLY":
      date.setDate(date.getDate() + recurrenceInterval * 7);
      break;
    case "MONTHLY":
      date.setMonth(date.getMonth() + recurrenceInterval);
      break;
    case "QUARTERLY":
      date.setMonth(date.getMonth() + recurrenceInterval * 3);
      break;
    case "YEARLY":
      date.setFullYear(date.getFullYear() + recurrenceInterval);
      break;
    default:
      return null;
  }

  return date.toISOString().split("T")[0];
}

/**
 * Create a new recurring task instance when the current one is completed
 */
export function createRecurringTaskInstance(
  completedTask: TaskRow
): TaskRow | null {
  if (!completedTask.RecurrenceType || !completedTask.RecurrenceInterval) {
    return null; // Not a recurring task
  }

  // Check if we've passed the recurrence end date
  if (completedTask.RecurrenceEndDate) {
    const nextDate = calculateNextDueDate(
      completedTask.DueDate,
      completedTask.RecurrenceType,
      completedTask.RecurrenceInterval
    );
    if (nextDate && nextDate > completedTask.RecurrenceEndDate) {
      return null; // Recurrence has ended
    }
  }

  const nextDueDate = calculateNextDueDate(
    completedTask.DueDate,
    completedTask.RecurrenceType,
    completedTask.RecurrenceInterval
  );

  if (!nextDueDate) return null;

  // Create new task instance
  const newTask: TaskRow = {
    ...completedTask,
    TaskID: `${completedTask.TaskID}-${Date.now()}`, // unique ID
    DueDate: nextDueDate,
    Status: "Current",
    AssignedToUserID: null,
    AssignedToUserName: null,
    ClaimedByUserID: null,
    ClaimedByUserName: null,
    CommentsJSON: null,
    ParentTaskID: completedTask.ParentTaskID || completedTask.TaskID,
  };

  return newTask;
}
