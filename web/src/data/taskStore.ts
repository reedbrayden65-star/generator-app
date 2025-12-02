import { mockTasks } from "./mockTasks";
import type { TaskRow, TaskStatus } from "./mockTasks";
import { computeStatus } from "../utils/status";
import { hasPermission } from "../utils/permissions";
import { createRecurringTaskInstance } from "../utils/recurrence";
import type { User } from "./users";

/* ------------------ IndexedDB tiny wrapper ------------------ */

const DB_NAME = "generatorAppDB";
const STORE = "kv";
const TASKS_KEY = "tasks.v4";

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE);
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function idbGet<T>(key: string): Promise<T | null> {
  const db = await openDB();
  return new Promise((resolve) => {
    const tx = db.transaction(STORE, "readonly");
    const st = tx.objectStore(STORE);
    const req = st.get(key);
    req.onsuccess = () => resolve((req.result as T) ?? null);
    req.onerror = () => resolve(null);
  });
}

async function idbSet<T>(key: string, value: T): Promise<void> {
  const db = await openDB();
  return new Promise((resolve) => {
    const tx = db.transaction(STORE, "readwrite");
    const st = tx.objectStore(STORE);
    st.put(value as any, key);
    tx.oncomplete = () => resolve();
    tx.onerror = () => resolve();
  });
}

/* ------------------ localStorage backup ------------------ */

const LS_KEY = "generatorApp.tasks.backup.v4";

const safeLS = {
  get() {
    try {
      return localStorage.getItem(LS_KEY);
    } catch {
      return null;
    }
  },
  set(v: string) {
    try {
      localStorage.setItem(LS_KEY, v);
    } catch {}
  },
};

/* ------------------ normalize/load/persist ------------------ */

function normalize(rows: TaskRow[]): TaskRow[] {
  return rows.map((t) => ({
    ...t,
    Status: (t.Status as TaskStatus) ?? computeStatus(t.DueDate),
  }));
}

let tasks: TaskRow[] = []; // start empty

async function loadInitialTasks() {
  // 1) try IndexedDB
  const fromIdb = await idbGet<TaskRow[]>(TASKS_KEY);
  if (fromIdb && Array.isArray(fromIdb)) {
    tasks = normalize(fromIdb);
    notify(false);
    return;
  }

  // 2) try localStorage backup
  const raw = safeLS.get();
  if (raw) {
    try {
      const parsed = JSON.parse(raw) as TaskRow[];
      tasks = normalize(parsed);
      // seed IDB for next time
      await idbSet(TASKS_KEY, tasks);
      notify(false);
      return;
    } catch {}
  }

  // 3) start empty (teams upload their own brain)
  tasks = [];
  await idbSet(TASKS_KEY, tasks);
  safeLS.set(JSON.stringify(tasks));
  notify(false);
}

// kick off load once in browser
if (typeof window !== "undefined") {
  loadInitialTasks().then(() => {
    // If no tasks loaded, seed SBN-OPS with mock data
    if (tasks.length === 0) {
      tasks = normalize(mockTasks.map(t => ({ ...t, TeamCode: "SBN-OPS" })));
      persistNow(tasks);
      notify(false);
    }
  });
}

async function persistNow(rows: TaskRow[]) {
  // write IDB (primary)
  await idbSet(TASKS_KEY, rows);
  // mirror LS (backup)
  safeLS.set(JSON.stringify(rows));
}

/* ------------------ realtime listeners ------------------ */

const listeners = new Set<(tasks: TaskRow[]) => void>();

function notify(doPersist = true) {
  if (doPersist) persistNow(tasks);
  for (const l of listeners) l(tasks);
}

export function subscribe(listener: (tasks: TaskRow[]) => void) {
  listeners.add(listener);
  listener(tasks);
  return () => {
    listeners.delete(listener);
  };
}

export function getTasks() {
  return tasks;
}

export async function addTasks(newTasks: TaskRow[]) {
  tasks = [...tasks, ...newTasks];
  await persistNow(tasks);
  notify(false);
}

export function resetToMockTasks() {
  tasks = normalize(mockTasks);
  notify();
}

/* ---------------- USER ACTIONS ---------------- */

export function claimTask(taskId: string, actor: User) {
  if (!hasPermission(actor.role, "TASK_CLAIM")) return;
  tasks = tasks.map((t) =>
    t.TaskID === taskId
      ? { ...t, ClaimedByUserID: actor.id, ClaimedByUserName: actor.name }
      : t
  );
  notify();
}

export function unclaimTask(taskId: string, actor: User) {
  if (!hasPermission(actor.role, "TASK_UNCLAIM")) return;
  tasks = tasks.map((t) =>
    t.TaskID === taskId
      ? { ...t, ClaimedByUserID: null, ClaimedByUserName: null }
      : t
  );
  notify();
}

export function completeTask(taskId: string, actor: User) {
  if (!hasPermission(actor.role, "TASK_COMPLETE")) return;
  
  const completedTask = tasks.find((t) => t.TaskID === taskId);
  
  tasks = tasks.map((t) =>
    t.TaskID === taskId
      ? { ...t, Status: "Completed" as TaskStatus }
      : t
  );

  // ✅ If recurring, create next instance
  if (completedTask) {
    const nextInstance = createRecurringTaskInstance(completedTask);
    if (nextInstance) {
      tasks = [...tasks, nextInstance];
    }
  }

  notify();
}

export function escalateTask(taskId: string, reason: string, actor: User) {
  const trimmed = (reason || "").trim();
  if (!trimmed) return;

  const ENFORCE_PERMS = false;
  if (ENFORCE_PERMS && !hasPermission(actor.role, "TASK_ESCALATE")) return;

  tasks = tasks.map((t) =>
    t.TaskID === taskId
      ? ({
          ...t,
          Status: "Escalated" as TaskStatus,
          EscalationReason: trimmed,
          EscalatedAtISO: new Date().toISOString(),
          EscalatedByUserID: actor.id,
          EscalatedByUserName: actor.name,
        } as any)
      : t
  );
  notify();
}

export function addComment(taskId: string, comment: string, actor: User) {
  tasks = tasks.map((t) => {
    if (t.TaskID !== taskId) return t;
    const existing = t.CommentsJSON ? JSON.parse(t.CommentsJSON) : [];
    existing.push({
      userName: actor.name,
      comment,
      ts: new Date().toISOString(),
    });
    return { ...t, CommentsJSON: JSON.stringify(existing) };
  });
  notify();
}

/* ---------------- ADMIN ACTIONS ---------------- */

export function assignTask(taskId: string, assignee: User, actor: User) {
  if (!hasPermission(actor.role, "TASK_ASSIGN")) return;
  tasks = tasks.map((t) =>
    t.TaskID === taskId
      ? { ...t, AssignedToUserID: assignee.id, AssignedToUserName: assignee.name }
      : t
  );
  notify();
}

export function massAssign(
  filterFn: (t: TaskRow) => boolean,
  assignee: User,
  actor: User
) {
  if (!hasPermission(actor.role, "TASK_MASS_ASSIGN")) return;
  tasks = tasks.map((t) =>
    filterFn(t)
      ? { ...t, AssignedToUserID: assignee.id, AssignedToUserName: assignee.name }
      : t
  );
  notify();
}

export function deescalateTask(taskId: string, actor: User) {
  if (!hasPermission(actor.role, "TASK_ASSIGN")) return;
  tasks = tasks.map((t) =>
    t.TaskID === taskId
      ? ({
          ...t,
          Status: computeStatus(t.DueDate) as TaskStatus,
          EscalationReason: null,
          EscalatedAtISO: null,
          EscalatedByUserID: null,
          EscalatedByUserName: null,
        } as any)
      : t
  );
  notify();
}
