# Backend Setup for Generator Ops

## Overview
The backend needs to:
1. Store the original Excel file for each team
2. Sync task changes to the Excel file
3. Broadcast changes to all team members in real-time
4. Handle recurring task creation and Excel updates

## Architecture

```
Frontend (React) ←→ Backend API (Node.js/Express) ←→ Database (PostgreSQL)
                                    ↓
                            File Storage (S3 or local)
                                    ↓
                            Excel Files (updated in real-time)
```

## Key Features Needed

### 1. File Upload & Storage
- Accept Excel/CSV upload from Chief
- Store original file in S3 or local storage
- Store file path in database

### 2. Task Sync to Excel
When a task changes:
- Update database
- Update Excel file
- Broadcast to all team members

### 3. Recurring Task Handling
When a recurring task is completed:
- Create new instance with next due date
- Update Excel file with new task
- Remove completed task from Excel (or mark as completed)
- Broadcast to all team members

### 4. Real-time Sync
- WebSocket or Server-Sent Events (SSE)
- All team members see changes instantly
- No need to refresh page

## Database Schema

```sql
-- Teams
CREATE TABLE teams (
  id SERIAL PRIMARY KEY,
  code VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(255),
  brain_file_path VARCHAR(255),
  brain_uploaded BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tasks
CREATE TABLE tasks (
  id SERIAL PRIMARY KEY,
  team_id INTEGER REFERENCES teams(id),
  building_name VARCHAR(255),
  generator_id VARCHAR(255),
  task_title VARCHAR(255),
  task_description TEXT,
  due_date DATE,
  status VARCHAR(50),
  recurrence_type VARCHAR(50),
  recurrence_interval INTEGER,
  recurrence_end_date DATE,
  parent_task_id INTEGER REFERENCES tasks(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Task History (for audit trail)
CREATE TABLE task_history (
  id SERIAL PRIMARY KEY,
  task_id INTEGER REFERENCES tasks(id),
  action VARCHAR(50), -- 'created', 'updated', 'completed', 'escalated'
  changed_by INTEGER,
  changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## API Endpoints Needed

```
POST   /api/teams/:teamCode/upload-brain
       - Upload Excel file
       - Parse and store tasks
       - Save file path

GET    /api/teams/:teamCode/tasks
       - Get all tasks for team

POST   /api/tasks/:taskId/complete
       - Mark task as completed
       - Create recurring instance if needed
       - Update Excel file
       - Broadcast to team

POST   /api/tasks/:taskId/escalate
       - Escalate task
       - Update Excel file
       - Broadcast to team

GET    /api/teams/:teamCode/brain-file
       - Download current Excel file

POST   /api/tasks
       - Add new task
       - Update Excel file
       - Broadcast to team

PUT    /api/tasks/:taskId
       - Update task
       - Update Excel file
       - Broadcast to team
```

## Excel File Format

The Excel file should have columns:
```
BuildingName | GeneratorID | TaskTitle | TaskDescription | TaskType | DueDate | Status | RecurrenceType | RecurrenceInterval | RecurrenceEndDate
```

When updating:
- Add new rows for new tasks
- Update rows for changed tasks
- Remove rows for completed tasks (or mark as "Completed")
- Keep original file as backup

## Implementation Steps

1. **Create Node.js backend** with Express
2. **Set up PostgreSQL** database
3. **Implement file upload** endpoint
4. **Implement task CRUD** endpoints
5. **Add Excel file generation** (using xlsx library)
6. **Add WebSocket** for real-time sync
7. **Deploy to EC2**
8. **Update React frontend** to call backend API

## Next Steps

Once backend is ready:
1. Replace localStorage calls with API calls
2. Add WebSocket listener for real-time updates
3. Test full workflow: upload → complete task → Excel updates → all users see change
