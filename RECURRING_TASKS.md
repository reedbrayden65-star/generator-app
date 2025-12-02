# Recurring Tasks Implementation

## Overview
This app now supports recurring tasks. When a task is marked as completed, if it has recurrence settings, a new instance is automatically created with the next due date.

## CSV/Excel Format for Recurring Tasks

Add these columns to your upload file:

| Column | Type | Example | Description |
|--------|------|---------|-------------|
| BuildingName | string | "SBN 100" | Building name |
| GeneratorID | string | "GEN-001" | Generator ID |
| TaskTitle | string | "Oil Change" | Task name |
| TaskDescription | string | "Change oil filter" | Details |
| TaskType | string | "3Month" | Standalone, 3Month, 6Month, 12Month |
| DueDate | date | "2025-03-15" | YYYY-MM-DD format |
| Status | string | "Current" | Current, Upcoming, PastDue, Urgent, Escalated, Completed |
| RecurrenceType | string | "MONTHLY" | DAILY, WEEKLY, MONTHLY, QUARTERLY, YEARLY |
| RecurrenceInterval | number | 3 | Repeat every N periods (e.g., 3 = every 3 months) |
| RecurrenceEndDate | date | "2026-12-31" | Optional: when to stop recurring |

## Example CSV

```csv
BuildingName,GeneratorID,TaskTitle,TaskDescription,TaskType,DueDate,Status,RecurrenceType,RecurrenceInterval,RecurrenceEndDate
SBN 100,GEN-001,Oil Change,Change oil filter,3Month,2025-03-15,Current,MONTHLY,3,2026-12-31
SBN 100,GEN-001,Filter Replacement,Replace air filter,6Month,2025-06-15,Current,MONTHLY,6,
SBN 101,GEN-002,Weekly Inspection,Check generator status,Standalone,2025-03-17,Current,WEEKLY,1,2025-12-31
```

## How It Works

1. **Upload File**: Chief uploads CSV with recurring task data
2. **Task Created**: Task appears on dashboard with recurrence settings
3. **Complete Task**: User marks task as completed
4. **Auto-Create**: System automatically creates next instance:
   - New due date = current due date + recurrence interval
   - Status reset to "Current"
   - Assignments cleared
   - Linked to parent task via `ParentTaskID`
5. **Repeat**: Process continues until `RecurrenceEndDate` is reached

## Recurrence Types

- **DAILY**: Repeats every N days
- **WEEKLY**: Repeats every N weeks
- **MONTHLY**: Repeats every N months
- **QUARTERLY**: Repeats every N quarters (3-month periods)
- **YEARLY**: Repeats every N years

## Server Implementation (Next Steps)

To make this production-ready, you'll need:

### Backend (Node.js/Express example)

```typescript
// POST /api/tasks/complete
app.post("/api/tasks/complete", async (req, res) => {
  const { taskId, userId } = req.body;
  
  // 1. Mark task as completed
  const task = await Task.findByIdAndUpdate(taskId, { status: "Completed" });
  
  // 2. Check if recurring
  if (task.recurrenceType && task.recurrenceInterval) {
    // 3. Calculate next due date
    const nextDueDate = calculateNextDueDate(
      task.dueDate,
      task.recurrenceType,
      task.recurrenceInterval
    );
    
    // 4. Check if past end date
    if (task.recurrenceEndDate && nextDueDate > task.recurrenceEndDate) {
      return res.json({ success: true });
    }
    
    // 5. Create new instance
    const newTask = new Task({
      ...task.toObject(),
      _id: undefined,
      dueDate: nextDueDate,
      status: "Current",
      parentTaskId: task._id,
      assignedTo: null,
      claimedBy: null,
    });
    
    await newTask.save();
  }
  
  res.json({ success: true });
});
```

### Database Schema

```typescript
interface Task {
  _id: ObjectId;
  teamId: ObjectId;
  buildingName: string;
  generatorId: string;
  taskTitle: string;
  taskDescription?: string;
  dueDate: Date;
  status: TaskStatus;
  
  // Recurrence fields
  recurrenceType?: "DAILY" | "WEEKLY" | "MONTHLY" | "QUARTERLY" | "YEARLY";
  recurrenceInterval?: number;
  recurrenceEndDate?: Date;
  parentTaskId?: ObjectId; // Link to original recurring task
  
  // Other fields
  assignedTo?: ObjectId;
  claimedBy?: ObjectId;
  comments?: Comment[];
  createdAt: Date;
  updatedAt: Date;
}
```

## Testing Recurring Tasks

1. Create a CSV with a recurring task (e.g., monthly oil change)
2. Upload to SBN-TEST team
3. Mark task as completed
4. Verify new task appears with due date 1 month later
5. Check that new task has `ParentTaskID` linking to original

## Future Enhancements

- [ ] Bulk export completed tasks to Excel
- [ ] Recurring task templates
- [ ] Skip/reschedule next occurrence
- [ ] Recurring task analytics (completion rate, etc.)
- [ ] Webhook notifications for upcoming recurring tasks
