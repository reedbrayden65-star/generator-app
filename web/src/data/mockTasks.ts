export type TaskStatus =
  | "Current"
  | "Upcoming"
  | "PastDue"
  | "Urgent"
  | "Escalated"
  | "Completed";

export type TaskType =
  | "Standalone"
  | "3Month"
  | "6Month"
  | "12Month";

export type TaskRow = {
  TaskID: string;
  BuildingID: string;
  BuildingName: string;

  GeneratorID: string;
  GeneratorName: string;

  TaskTitle: string;
  TaskDescription?: string;
  TaskType: TaskType;

  DueDate: string;

  AssignedToUserID?: string | null;
  AssignedToUserName?: string | null;

  ClaimedByUserID?: string | null;
  ClaimedByUserName?: string | null;

  SIMTicketNumber?: string | null;
  SIMTicketLink?: string | null;

  Status?: TaskStatus;
  CommentsJSON?: string | null;

  // ✅ Recurrence fields
  RecurrenceType?: "DAILY" | "WEEKLY" | "MONTHLY" | "QUARTERLY" | "YEARLY" | null;
  RecurrenceInterval?: number | null; // e.g., 3 for every 3 months
  RecurrenceEndDate?: string | null; // when to stop recurring
  ParentTaskID?: string | null; // link to original recurring task
  TeamCode?: string;
};

/** ------------------------------
 * Buildings + Generators
 * ------------------------------ */
const buildings = Array.from({ length: 7 }, (_, i) => {
  const num = 100 + i;
  return { id: `SBN${num}`, name: `SBN ${num}` };
});

const generators = Array.from({ length: 27 }, (_, i) => {
  const n = String(i + 1).padStart(2, "0");
  return { id: `GEN-${n}`, name: `Generator ${n}` };
});

/** ------------------------------
 * Task library (titles + types)
 * ------------------------------ */
const taskLibrary: Array<{ title: string; desc: string; type: TaskType }> = [
  { title: "Oil level inspection", desc: "Check oil level, leaks, log readings.", type: "3Month" },
  { title: "Battery health test", desc: "Run load test, clean terminals.", type: "6Month" },
  { title: "Coolant system check", desc: "Inspect reservoir, hoses, concentration.", type: "12Month" },
  { title: "Control panel inspection", desc: "Verify alarms, gauges, startup logic.", type: "Standalone" },
  { title: "Load bank run", desc: "Perform load test, confirm stable output.", type: "12Month" },
  { title: "Air filter replacement", desc: "Inspect and replace air filters.", type: "6Month" },
  { title: "Fuel system inspection", desc: "Check fuel lines, filters, tank levels.", type: "3Month" },
  { title: "Breaker exercise", desc: "Exercise and inspect breakers.", type: "12Month" },
  { title: "Exhaust inspection", desc: "Check clamps, leaks, vibration points.", type: "6Month" },
  { title: "ATS functional test", desc: "Verify ATS transfer + alarms.", type: "3Month" },
];

/** ------------------------------
 * Scale control
 * ------------------------------ */
const TASKS_PER_GENERATOR = 80; // 👈 change this to 200 when you want full stress test

/** ------------------------------
 * Helpers
 * ------------------------------ */
function isoFromOffset(daysFromNow: number) {
  const d = new Date();
  d.setDate(d.getDate() + daysFromNow);
  return d.toISOString();
}

function makeTaskId(b: string, g: string, n: number) {
  return `${b}-${g}-T${String(n).padStart(3, "0")}`;
}

function maybeSIM(i: number) {
  if (i % 11 !== 0) return { num: null, link: null };
  const num = `SIM-${100000 + i}`;
  return { num, link: `https://sim.amazon.com/ticket/${num}` };
}

function pick<T>(arr: T[], seed: number) {
  return arr[seed % arr.length];
}

function dueOffsetForIndex(i: number) {
  // produces a nice spread of statuses
  // ~20% past due, ~10% urgent, rest current/upcoming
  const mod = i % 20;
  if (mod === 0 || mod === 1) return -25;      // urgent
  if (mod >= 2 && mod <= 5) return -7;         // past due
  if (mod >= 6 && mod <= 10) return 3;         // upcoming soon
  if (mod >= 11 && mod <= 15) return 20;       // upcoming later
  return 0;                                    // current
}

/** ------------------------------
 * Generate mock tasks
 * ------------------------------ */
export const mockTasks: TaskRow[] = [];
let globalIndex = 1;

for (const b of buildings) {
  for (const g of generators) {
    for (let t = 1; t <= TASKS_PER_GENERATOR; t++) {
      const tpl = pick(taskLibrary, globalIndex + t);
      const offset = dueOffsetForIndex(globalIndex + t);
      const sim = maybeSIM(globalIndex + t);

      mockTasks.push({
        TaskID: makeTaskId(b.id, g.id, t),

        BuildingID: b.id,
        BuildingName: b.name,

        GeneratorID: g.id,
        GeneratorName: g.name,

        TaskTitle: tpl.title,
        TaskDescription: tpl.desc,
        TaskType: tpl.type,

        DueDate: isoFromOffset(offset),

        AssignedToUserID: t % 9 === 0 ? "U2" : null,
        AssignedToUserName: t % 9 === 0 ? "Alex" : null,

        ClaimedByUserID: null,
        ClaimedByUserName: null,

        SIMTicketNumber: sim.num,
        SIMTicketLink: sim.link,

        Status: undefined, // store computes from DueDate
        CommentsJSON: null,
      });
    }
    globalIndex += TASKS_PER_GENERATOR;
  }
}
