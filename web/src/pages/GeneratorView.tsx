import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import type { TaskRow } from "../data/mockTasks";
import {
  subscribe,
  claimTask,
  unclaimTask,
  completeTask,
  escalateTask,
  addComment,
  assignTask,
  massAssign,
} from "../data/taskStore";
import { getTeamTasks } from "../data/teamStore";
import { getCurrentAccount } from "../data/authStore";
import { statusColor } from "../utils/status";
import {
  ArrowLeft,
  MessageSquare,
  Hand,
  HandMetal,
  CheckCircle2,
  Siren,
  UserPlus2,
  Users2,
  Search,
  Filter,
  CalendarClock,
  IdCard,
  BadgeAlert,
} from "lucide-react";
import { Card, CardHeader, Button, Pill } from "../components/ui";
import { users, type User } from "../data/users";
import { hasPermission, isAdminRole } from "../utils/permissions";
import { getCurrentUser, subscribeUser } from "../data/userStore";

const ROW_HEIGHT = 140;
const OVERSCAN = 8;

type StatusFilter =
  | "All"
  | "Current"
  | "Upcoming"
  | "PastDue"
  | "Urgent"
  | "Escalated"
  | "Unassigned"
  | "Mine";

export default function GeneratorView() {
  const { generatorId } = useParams();
  const nav = useNavigate();

  // Parse URL: format is "buildingName|||generatorId" (using ||| as separator)
  const lastSeparatorIndex = (generatorId ?? "").lastIndexOf("|||");
  let buildingId = "";
  let genId = "";
  
  if (lastSeparatorIndex > -1) {
    buildingId = decodeURIComponent((generatorId ?? "").substring(0, lastSeparatorIndex));
    genId = decodeURIComponent((generatorId ?? "").substring(lastSeparatorIndex + 3));
  }
  
  console.log(`URL parsing: generatorId="${generatorId}" -> buildingId="${buildingId}" genId="${genId}"`);

  const acct = getCurrentAccount();
  const [me, setMe] = useState(getCurrentUser());
  useEffect(() => {
    return subscribeUser(setMe);
  }, []);

  const [allTasks, setAllTasks] = useState<TaskRow[]>([]);
  useEffect(() => {
    if (!acct?.teamCode) return;
    
    // Load team tasks
    const teamTasks = getTeamTasks(acct.teamCode);
    setAllTasks(teamTasks);

    // Subscribe to changes
    const unsub = subscribe(() => {
      const updated = getTeamTasks(acct.teamCode);
      setAllTasks(updated);
    });

    return unsub;
  }, [acct]);

  // ✅ Base queue EXCLUDES escalated tasks
  const baseQueueTasks = useMemo(
    () => {
      const filtered = allTasks.filter(
        (t) =>
          t.BuildingID === buildingId &&
          t.GeneratorID === genId &&
          t.Status !== "Completed" &&
          t.Status !== "Escalated"
      );
      console.log(`GeneratorView: Looking for buildingId="${buildingId}" genId="${genId}"`);
      console.log(`Total tasks: ${allTasks.length}, Filtered: ${filtered.length}`);
      if (allTasks.length > 0) {
        console.log(`First task: BuildingID="${allTasks[0].BuildingID}" GeneratorID="${allTasks[0].GeneratorID}"`);
      }
      return filtered;
    },
    [allTasks, buildingId, genId]
  );

  // ✅ Escalated tasks for this generator
  const escalatedTasks = useMemo(
    () =>
      allTasks.filter(
        (t) =>
          t.BuildingID === buildingId &&
          t.GeneratorID === genId &&
          t.Status === "Escalated"
      ),
    [allTasks, buildingId, genId]
  );

  const isAdmin = isAdminRole(me.role);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("All");

  const filteredTasks = useMemo(() => {
    // ✅ If filter Escalated, show escalated only
    let t =
      statusFilter === "Escalated"
        ? escalatedTasks
        : baseQueueTasks;

    if (statusFilter === "Mine") {
      t = t.filter((x) => x.AssignedToUserID === me.id);
    } else if (statusFilter === "Unassigned") {
      t = t.filter((x) => !x.AssignedToUserID);
    } else if (
      statusFilter !== "All" &&
      statusFilter !== "Escalated"
    ) {
      t = t.filter((x) => x.Status === statusFilter);
    }

    if (query.trim()) {
      const q = query.toLowerCase();
      t = t.filter(
        (x) =>
          x.TaskTitle.toLowerCase().includes(q) ||
          (x.TaskDescription ?? "").toLowerCase().includes(q) ||
          (x.SIMTicketNumber ?? "").toLowerCase().includes(q) ||
          x.TaskType.toLowerCase().includes(q)
      );
    }

    const rank = (s?: string) =>
      s === "Urgent" ? 0 :
      s === "PastDue" ? 1 :
      s === "Upcoming" ? 2 :
      3;

    return [...t].sort((a, b) => {
      const r = rank(a.Status) - rank(b.Status);
      if (r !== 0) return r;
      return new Date(a.DueDate).getTime() - new Date(b.DueDate).getTime();
    });
  }, [baseQueueTasks, escalatedTasks, statusFilter, query, me.id]);

  const [openCommentsFor, setOpenCommentsFor] = useState<TaskRow | null>(null);
  const [assignOneFor, setAssignOneFor] = useState<TaskRow | null>(null);
  const [massAssignOpen, setMassAssignOpen] = useState(false);

  // ✅ Escalate modal state
  const [escalateFor, setEscalateFor] = useState<TaskRow | null>(null);
  const [escalateReason, setEscalateReason] = useState("");

  const assignees = users.filter((u) => u.role === "DCEO" || isAdminRole(u.role));

  return (
    <Card>
      <CardHeader
        title={`Generator ${genId}`}
        subtitle={`Building ${buildingId} • Active queue (${baseQueueTasks.length}) • Escalated (${escalatedTasks.length})`}
        right={
          <div className="flex items-center gap-2">
            {isAdmin && hasPermission(me.role, "TASK_MASS_ASSIGN") && statusFilter !== "Escalated" && (
              <Button onClick={() => setMassAssignOpen(true)} variant="ghost">
                <Users2 size={16} />
                Mass Assign
              </Button>
            )}
            <Button onClick={() => nav(`/buildings/${buildingId}`)} variant="ghost">
              <ArrowLeft size={16} /> Back
            </Button>
          </div>
        }
      />

      {/* Search + Filters */}
      <div className="flex flex-col gap-3 border-b border-slate-100 bg-white px-4 py-3 md:flex-row md:items-center md:justify-between">
        <div className="relative w-full md:w-[420px]">
          <Search className="absolute left-2 top-2.5 text-slate-400" size={16} />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search tasks, SIM, type..."
            className="w-full rounded-xl border border-slate-200 bg-white pl-8 pr-3 py-2 text-sm font-semibold text-slate-800 placeholder:text-slate-400 outline-none focus:border-slate-300"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Filter size={14} className="text-slate-400" />
          <Chip label="All" active={statusFilter === "All"} onClick={() => setStatusFilter("All")} />
          <Chip label="Mine" active={statusFilter === "Mine"} onClick={() => setStatusFilter("Mine")} />
          <Chip label="Unassigned" active={statusFilter === "Unassigned"} onClick={() => setStatusFilter("Unassigned")} />
          <Chip label="Upcoming" color={statusColor("Upcoming")} active={statusFilter === "Upcoming"} onClick={() => setStatusFilter("Upcoming")} />
          <Chip label="PastDue" color={statusColor("PastDue")} active={statusFilter === "PastDue"} onClick={() => setStatusFilter("PastDue")} />
          <Chip label="Urgent" color={statusColor("Urgent")} active={statusFilter === "Urgent"} onClick={() => setStatusFilter("Urgent")} />
          {/* ✅ Escalated is now a separate queue */}
          <Chip label="Escalated" color={statusColor("Escalated")} active={statusFilter === "Escalated"} onClick={() => setStatusFilter("Escalated")} />
        </div>
      </div>

      {/* Desktop header */}
      <div className="hidden md:grid min-w-0 grid-cols-[16px_1.9fr_170px_160px_160px_1fr] gap-3 border-b border-slate-200 bg-slate-50 px-4 py-3 text-[11px] font-extrabold text-slate-700 sticky top-0 z-10">
        <div />
        <div>Task</div>
        <div>Due / Type</div>
        <div>Assigned</div>
        <div>Claimed</div>
        <div>Actions</div>
      </div>

      <VirtualTaskList
        tasks={filteredTasks}
        onComment={(t) => setOpenCommentsFor(t)}
        onAssign={(t) => setAssignOneFor(t)}
        onEscalate={(t) => {
          setEscalateFor(t);
          setEscalateReason("");
        }}
        isAdmin={isAdmin && hasPermission(me.role, "TASK_ASSIGN")}
        me={me}
        showEscalate={statusFilter !== "Escalated"}
      />

      {/* ✅ Escalate Reason Modal */}
      {escalateFor && (
        <Modal onClose={() => setEscalateFor(null)}>
          <div className="text-lg font-extrabold text-slate-900">
            Escalate Task
          </div>
          <div className="text-sm text-slate-500">
            {escalateFor.TaskTitle}
          </div>

          <div className="mt-4 space-y-2">
            <label className="text-xs font-extrabold text-slate-700">
              Reason (required)
            </label>
            <textarea
              value={escalateReason}
              onChange={(e) => setEscalateReason(e.target.value)}
              placeholder="Why are you escalating? Be specific."
              className="min-h-[110px] w-full rounded-xl border border-slate-200 bg-white p-3 text-sm font-semibold text-slate-800 outline-none focus:border-slate-300"
            />
          </div>

          <div className="mt-4 flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setEscalateFor(null)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (!escalateReason.trim()) return;
                escalateTask(escalateFor.TaskID, escalateReason, me);
                setEscalateFor(null);
              }}
            >
              Confirm Escalation
            </Button>
          </div>
        </Modal>
      )}

      {/* Comments modal */}
      {openCommentsFor && (
        <Modal onClose={() => setOpenCommentsFor(null)}>
          <div className="text-lg font-extrabold text-slate-900">Comments</div>
          <div className="text-sm text-slate-500">{openCommentsFor.TaskTitle}</div>

          <div className="mt-3 max-h-64 space-y-2 overflow-auto">
            {getComments(openCommentsFor).length === 0 && (
              <div className="text-sm text-slate-500">No comments yet.</div>
            )}

            {getComments(openCommentsFor).map((c, i) => (
              <div key={i} className="rounded-xl border border-slate-100 bg-slate-50 p-3">
                <div className="text-xs font-bold text-slate-700">
                  {c.userName}
                  <span className="ml-2 font-medium text-slate-400">
                    {new Date(c.ts).toLocaleString()}
                  </span>
                </div>
                <div className="mt-1 text-sm text-slate-900">{c.comment}</div>
              </div>
            ))}
          </div>

          <div className="mt-4 flex gap-2">
            <Button
              onClick={() => {
                const text = prompt("Add comment:");
                if (text) addComment(openCommentsFor.TaskID, text, me);
                setOpenCommentsFor({ ...openCommentsFor });
              }}
            >
              Add Comment
            </Button>
            <Button onClick={() => setOpenCommentsFor(null)}>Close</Button>
          </div>
        </Modal>
      )}

      {/* Assign ONE modal */}
      {assignOneFor && (
        <Modal onClose={() => setAssignOneFor(null)}>
          <div className="text-lg font-extrabold text-slate-900">Assign Task</div>
          <div className="text-sm text-slate-500">{assignOneFor.TaskTitle}</div>

          <div className="mt-4 grid gap-2">
            {assignees.map((u) => (
              <button
                key={u.id}
                onClick={() => {
                  assignTask(assignOneFor.TaskID, u, me);
                  setAssignOneFor(null);
                }}
                className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50"
              >
                <div className="flex items-center gap-2">
                  <div className="grid h-7 w-7 place-items-center rounded-full bg-slate-900 text-[11px] font-extrabold text-white">
                    {u.name.split(" ").map(s => s[0]).slice(0,2).join("")}
                  </div>
                  <div>
                    <div className="font-extrabold">{u.name}</div>
                    <div className="text-[11px] text-slate-500">{u.role}</div>
                  </div>
                </div>

                {assignOneFor.AssignedToUserID === u.id && (
                  <Pill tone="success">Assigned</Pill>
                )}
              </button>
            ))}
          </div>

          <div className="mt-4 flex justify-end">
            <Button onClick={() => setAssignOneFor(null)} variant="ghost">Cancel</Button>
          </div>
        </Modal>
      )}

      {/* Mass Assign modal */}
      {massAssignOpen && (
        <Modal onClose={() => setMassAssignOpen(false)}>
          <div className="text-lg font-extrabold text-slate-900">Mass Assign Visible Tasks</div>
          <div className="text-sm text-slate-500">
            You are assigning <b>{filteredTasks.length}</b> tasks matching your filters.
          </div>

          <div className="mt-4 grid gap-2">
            {assignees.map((u) => (
              <button
                key={u.id}
                onClick={() => {
                  const ids = new Set(filteredTasks.map(t => t.TaskID));
                  massAssign((t) => ids.has(t.TaskID), u, me);
                  setMassAssignOpen(false);
                }}
                className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50"
              >
                <div className="flex items-center gap-2">
                  <div className="grid h-7 w-7 place-items-center rounded-full bg-slate-900 text-[11px] font-extrabold text-white">
                    {u.name.split(" ").map(s => s[0]).slice(0,2).join("")}
                  </div>
                  <div>
                    <div className="font-extrabold">{u.name}</div>
                    <div className="text-[11px] text-slate-500">{u.role}</div>
                  </div>
                </div>

                <UserPlus2 size={16} className="text-slate-500" />
              </button>
            ))}
          </div>

          <div className="mt-4 flex justify-end">
            <Button onClick={() => setMassAssignOpen(false)} variant="ghost">Cancel</Button>
          </div>
        </Modal>
      )}
    </Card>
  );
}

/* ---------------- Virtualized List (spacer-based) ---------------- */

function VirtualTaskList({
  tasks,
  onComment,
  onAssign,
  onEscalate,
  isAdmin,
  me,
  showEscalate,
}: {
  tasks: TaskRow[];
  onComment: (task: TaskRow) => void;
  onAssign: (task: TaskRow) => void;
  onEscalate: (task: TaskRow) => void;
  isAdmin: boolean;
  me: User;
  showEscalate: boolean;
}) {
  const scrollerRef = useRef<HTMLDivElement | null>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [viewportH, setViewportH] = useState(520);

  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    const measure = () => setViewportH(el.clientHeight);
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const startIndex = Math.max(0, Math.floor(scrollTop / ROW_HEIGHT) - OVERSCAN);
  const endIndex = Math.min(
    tasks.length,
    Math.ceil((scrollTop + viewportH) / ROW_HEIGHT) + OVERSCAN
  );

  const visible = tasks.slice(startIndex, endIndex);
  const topSpacer = startIndex * ROW_HEIGHT;
  const bottomSpacer = (tasks.length - endIndex) * ROW_HEIGHT;

  return (
    <div className="overflow-hidden">
      <div
        ref={scrollerRef}
        onScroll={(e) => setScrollTop(e.currentTarget.scrollTop)}
        className="max-h-[70vh] overflow-auto bg-white"
      >
        <div style={{ height: topSpacer }} />
        {visible.map((t) => (
          <TaskCard
            key={t.TaskID}
            task={t}
            onComment={onComment}
            onAssign={onAssign}
            onEscalate={onEscalate}
            isAdmin={isAdmin}
            me={me}
            showEscalate={showEscalate}
          />
        ))}
        <div style={{ height: bottomSpacer }} />

        {tasks.length === 0 && (
          <div className="px-4 py-10 text-center text-sm text-slate-500">
            No tasks match your filters.
          </div>
        )}
      </div>
    </div>
  );
}

function TaskCard({
  task: t,
  onComment,
  onAssign,
  onEscalate,
  isAdmin,
  me,
  showEscalate,
}: {
  task: TaskRow;
  onComment: (task: TaskRow) => void;
  onAssign: (task: TaskRow) => void;
  onEscalate: (task: TaskRow) => void;
  isAdmin: boolean;
  me: User;
  showEscalate: boolean;
}) {
  const claimed = !!t.ClaimedByUserID;
  const dot = statusColor(t.Status);

  return (
    <div className="px-3 py-2 md:px-4">
      <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm transition hover:shadow-md">
        <div className="flex items-start gap-3">
          <div className="mt-1 h-3 w-3 shrink-0 rounded-full" style={{ background: dot }} />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <div className="truncate text-sm font-extrabold text-slate-900">
                {t.TaskTitle}
              </div>
              <Pill className="text-[10px]">{t.TaskType}</Pill>
              {t.SIMTicketNumber && (
                <Pill className="text-[10px]">SIM {t.SIMTicketNumber}</Pill>
              )}
            </div>

            <div className="mt-1 line-clamp-2 text-[12px] text-slate-600">
              {t.TaskDescription ?? "—"}
            </div>
          </div>

          <div className="hidden md:flex flex-col items-end gap-1 text-[11px] font-semibold text-slate-700">
            <div className="flex items-center gap-1">
              <CalendarClock size={12} />
              {new Date(t.DueDate).toLocaleDateString()}
            </div>
            <div className="flex items-center gap-1 text-slate-500">
              <IdCard size={12} />
              Assigned: {t.AssignedToUserName ?? "—"}
            </div>
            <div className="flex items-center gap-1 text-slate-500">
              <BadgeAlert size={12} />
              Claimed: {t.ClaimedByUserName ?? "—"}
            </div>
          </div>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-3">
          <Action onClick={() => onComment(t)} icon={MessageSquare} label="Comment" />
          {!claimed ? (
            <Action onClick={() => claimTask(t.TaskID, me)} icon={Hand} label="Claim" />
          ) : (
            <Action onClick={() => unclaimTask(t.TaskID, me)} icon={HandMetal} label="Unclaim" tone="warn" />
          )}
          <Action onClick={() => completeTask(t.TaskID, me)} icon={CheckCircle2} label="Complete" />
          {showEscalate && (
            <Action onClick={() => onEscalate(t)} icon={Siren} label="Escalate" tone="danger" />
          )}
          {isAdmin && (
            <Action onClick={() => onAssign(t)} icon={UserPlus2} label="Assign" tone="admin" />
          )}
        </div>
      </div>
    </div>
  );
}

/* ----------------- UI helpers ----------------- */

function Chip({
  label,
  active,
  onClick,
  color,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
  color?: string;
}) {
  return (
    <button
      onClick={onClick}
      className={[
        "rounded-full border px-3 py-1 text-xs font-extrabold transition",
        active
          ? "bg-slate-900 text-white border-slate-900"
          : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50",
      ].join(" ")}
      style={active && color ? { background: color, borderColor: color, color: "white" } : undefined}
    >
      {label}
    </button>
  );
}

function Action({
  onClick,
  icon: Icon,
  label,
  tone,
}: {
  onClick: () => void;
  icon: any;
  label: string;
  tone?: "warn" | "danger" | "admin";
}) {
  const base =
    "inline-flex items-center gap-2 rounded-xl border px-3 py-1.5 text-xs font-extrabold transition active:translate-y-[1px]";
  const palette =
    tone === "danger"
      ? "border-red-200 bg-red-50 text-red-700 hover:bg-red-100"
      : tone === "warn"
      ? "border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100"
      : tone === "admin"
      ? "border-indigo-200 bg-indigo-50 text-indigo-800 hover:bg-indigo-100"
      : "border-slate-200 bg-white text-slate-800 hover:bg-slate-50";

  return (
    <button onClick={onClick} className={`${base} ${palette}`}>
      <Icon size={14} />
      {label}
    </button>
  );
}

function Modal({
  children,
  onClose,
}: {
  children: React.ReactNode;
  onClose: () => void;
}) {
  return (
    <div onClick={onClose} className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4">
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-xl rounded-2xl bg-white p-4 shadow-[0_10px_30px_rgba(15,23,42,0.18)]"
      >
        {children}
      </div>
    </div>
  );
}

function getComments(task: TaskRow): { userName: string; comment: string; ts: string }[] {
  try {
    return task.CommentsJSON ? JSON.parse(task.CommentsJSON) : [];
  } catch {
    return [];
  }
}
