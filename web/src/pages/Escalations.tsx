import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import type { TaskRow } from "../data/mockTasks";
import {
  subscribe,
  addComment,
  assignTask,
  deescalateTask,
} from "../data/taskStore";
import { statusColor } from "../utils/status";
import { users } from "../data/users";
import { getCurrentUser, subscribeUser } from "../data/userStore";
import { hasPermission, isAdminRole } from "../utils/permissions";
import {
  Search,
  Siren,
  Building2,
  Zap,
  AlertTriangle,
  CalendarClock,
  ExternalLink,
  MessageSquare,
  UserPlus2,
  CheckCircle2,
  ArrowRight,
} from "lucide-react";
import { Card, CardHeader, Button, Pill } from "../components/ui";

const ROW_HEIGHT = 160;
const OVERSCAN = 8;

function EscalationsPage() {
  const nav = useNavigate();

  const [me, setMe] = useState(getCurrentUser());
  useEffect(() => {
    return subscribeUser(setMe);
  }, []);

  const [allTasks, setAllTasks] = useState<TaskRow[]>([]);
  useEffect(() => subscribe(setAllTasks), []);

  const isAdmin = isAdminRole(me.role);

  const [query, setQuery] = useState("");
  const [showMineOnly, setShowMineOnly] = useState(false);

  // ✅ Case-insensitive + simple
  const escalated = useMemo(() => {
    let t = allTasks.filter(
      (x) => String(x.Status).toLowerCase() === "escalated"
    );

    if (showMineOnly) {
      t = t.filter((x) => x.AssignedToUserID === me.id);
    }

    if (query.trim()) {
      const q = query.toLowerCase();
      t = t.filter(
        (x) =>
          x.TaskTitle.toLowerCase().includes(q) ||
          (x.TaskDescription ?? "").toLowerCase().includes(q) ||
          x.BuildingName.toLowerCase().includes(q) ||
          x.GeneratorID.toLowerCase().includes(q) ||
          (x.SIMTicketNumber ?? "").toLowerCase().includes(q) ||
          (x.AssignedToUserName ?? "").toLowerCase().includes(q) ||
          ((x as any).EscalationReason ?? "").toLowerCase().includes(q)
      );
    }

    return t.sort(
      (a, b) => new Date(a.DueDate).getTime() - new Date(b.DueDate).getTime()
    );
  }, [allTasks, query, showMineOnly, me.id]);

  const counts = useMemo(() => {
    const urgent = escalated.length;
    const pastDue = allTasks.filter(
      (t) => String(t.Status).toLowerCase() === "pastdue"
    ).length;
    const upcoming = allTasks.filter(
      (t) => String(t.Status).toLowerCase() === "upcoming"
    ).length;
    return { urgent, pastDue, upcoming };
  }, [escalated, allTasks]);

  const [assignOneFor, setAssignOneFor] = useState<TaskRow | null>(null);
  const [openCommentsFor, setOpenCommentsFor] = useState<TaskRow | null>(null);

  const assignees = users.filter((u) => u.role === "DCEO" || isAdminRole(u.role));

  return (
    <div className="space-y-5">
      <Card>
        <CardHeader
          title="Escalations"
          subtitle="Global feed of escalated generator tasks"
          right={
            <Button variant="ghost" onClick={() => nav(-1)}>
              Back
            </Button>
          }
        />

        <div className="grid grid-cols-2 gap-3 px-4 pb-4 md:grid-cols-4">
          <Kpi icon={Siren} label="Escalated Now" value={counts.urgent} color={statusColor("Escalated")} />
          <Kpi icon={AlertTriangle} label="Past Due (All)" value={counts.pastDue} color={statusColor("PastDue")} />
          <Kpi icon={CalendarClock} label="Upcoming (All)" value={counts.upcoming} color={statusColor("Upcoming")} />
          <Kpi icon={Zap} label="Total Tasks (All)" value={allTasks.filter((t: TaskRow) => t.Status !== "Completed").length} color="#3b82f6" />
        </div>

        <div className="flex flex-col gap-2 border-t border-slate-700 p-4 md:flex-row md:items-center md:justify-between">
          <div className="relative w-full md:w-[460px]">
            <Search className="absolute left-2 top-2.5 text-slate-500" size={16} />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search escalations (task, SIM, building, gen, user, reason...)"
              className="w-full rounded-xl border border-slate-600 bg-slate-800 pl-8 pr-3 py-2 text-sm font-semibold text-white placeholder:text-slate-500 outline-none focus:border-blue-500"
            />
          </div>

          <div className="flex items-center gap-2">
            <Button variant="ghost" onClick={() => setShowMineOnly(false)} className={!showMineOnly ? "bg-blue-600 text-white border-blue-600" : ""}>
              All Escalations
            </Button>
            <Button variant="ghost" onClick={() => setShowMineOnly(true)} className={showMineOnly ? "bg-blue-600 text-white border-blue-600" : ""}>
              Mine Only
            </Button>
          </div>
        </div>
      </Card>

      <Card>
        <div className="border-b border-slate-700 px-4 py-3 text-xs font-extrabold text-slate-400">
          {escalated.length} escalated task{escalated.length !== 1 ? "s" : ""}
        </div>

        <VirtualEscalationList
          tasks={escalated}
          me={me}
          isAdmin={isAdmin}
          onAssign={(t: TaskRow) => setAssignOneFor(t)}
          onComment={(t: TaskRow) => setOpenCommentsFor(t)}
        />

        {escalated.length === 0 && (
          <div className="p-10 text-center text-sm text-slate-400">
            No escalated tasks right now.
          </div>
        )}
      </Card>

      {/* Assign modal */}
      {assignOneFor && (
        <Modal onClose={() => setAssignOneFor(null)}>
          <div className="text-lg font-extrabold text-white">Assign Escalation</div>
          <div className="text-sm text-slate-400">{assignOneFor.TaskTitle}</div>

          <div className="mt-4 grid gap-2">
            {assignees.map((u) => (
              <button
                key={u.id}
                onClick={() => {
                  assignTask(assignOneFor.TaskID, u, me);
                  setAssignOneFor(null);
                }}
                className="flex items-center justify-between rounded-xl border border-slate-600 bg-slate-700 px-3 py-2 text-sm font-semibold text-white hover:bg-slate-600"
              >
                <div className="flex items-center gap-2">
                  <div className="grid h-7 w-7 place-items-center rounded-full bg-blue-600 text-[11px] font-extrabold text-white">
                    {u.name.split(" ").map(s => s[0]).slice(0,2).join("")}
                  </div>
                  <div>
                    <div className="font-extrabold">{u.name}</div>
                    <div className="text-[11px] text-slate-400">{u.role}</div>
                  </div>
                </div>

                {assignOneFor.AssignedToUserID === u.id && (
                  <Pill tone="success">Assigned</Pill>
                )}
              </button>
            ))}
          </div>

          <div className="mt-4 flex justify-end">
            <Button variant="ghost" onClick={() => setAssignOneFor(null)}>Cancel</Button>
          </div>
        </Modal>
      )}

      {/* Comments modal */}
      {openCommentsFor && (
        <Modal onClose={() => setOpenCommentsFor(null)}>
          <div className="text-lg font-extrabold text-white">Comments</div>
          <div className="text-sm text-slate-400">{openCommentsFor.TaskTitle}</div>

          <div className="mt-3 max-h-64 space-y-2 overflow-auto">
            {getComments(openCommentsFor).length === 0 && (
              <div className="text-sm text-slate-400">No comments yet.</div>
            )}

            {getComments(openCommentsFor).map((c: any, i: number) => (
              <div key={i} className="rounded-xl border border-slate-600 bg-slate-700 p-3">
                <div className="text-xs font-bold text-slate-300">
                  {c.userName}
                  <span className="ml-2 font-medium text-slate-500">
                    {new Date(c.ts).toLocaleString()}
                  </span>
                </div>
                <div className="mt-1 text-sm text-white">{c.comment}</div>
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
    </div>
  );
}

/* ---------- Virtual list + cards (unchanged) ---------- */

function VirtualEscalationList({ tasks, me, isAdmin, onAssign, onComment }: any) {
  const scrollerRef = useRef<HTMLDivElement | null>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [viewportH, setViewportH] = useState(560);

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
    <div
      ref={scrollerRef}
      onScroll={(e) => setScrollTop(e.currentTarget.scrollTop)}
      className="max-h-[72vh] overflow-auto bg-slate-800"
    >
      <div style={{ height: topSpacer }} />
      {visible.map((t: TaskRow) => (
        <EscalationCard
          key={t.TaskID}
          task={t}
          me={me}
          isAdmin={isAdmin}
          onAssign={onAssign}
          onComment={onComment}
        />
      ))}
      <div style={{ height: bottomSpacer }} />
    </div>
  );
}

function EscalationCard({ task: t, me, isAdmin, onAssign, onComment }: any) {
  const dot = statusColor("Escalated");
  const reason = (t as any).EscalationReason as string | undefined;
  const escalatedBy = (t as any).EscalatedByUserName as string | undefined;

  return (
    <div className="px-3 py-2 md:px-4">
      <div className="rounded-2xl border border-slate-700 bg-slate-800/50 p-3 shadow-lg transition hover:scale-[1.01] hover:shadow-xl">
        <div className="flex items-start gap-3">
          <div className="mt-1 h-3 w-3 shrink-0 rounded-full" style={{ background: dot }} />

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <div className="truncate text-sm font-extrabold text-white">{t.TaskTitle}</div>
              <Pill tone="danger" className="text-[10px]">ESCALATED</Pill>
              <Pill className="text-[10px]">{t.TaskType}</Pill>
              {t.SIMTicketNumber && <Pill className="text-[10px]">SIM {t.SIMTicketNumber}</Pill>}
            </div>

            {reason && (
              <div className="mt-2 rounded-xl border border-red-900 bg-red-950 p-2 text-[12px] font-semibold text-red-200">
                Reason: {reason}
                {escalatedBy && (
                  <span className="ml-2 text-[11px] font-bold text-red-400">• by {escalatedBy}</span>
                )}
              </div>
            )}

            <div className="mt-2 flex flex-wrap gap-2 text-[11px] font-semibold text-slate-300">
              <div className="inline-flex items-center gap-1 rounded-full bg-slate-700/50 px-2 py-1">
                <Building2 size={12} className="text-slate-400" />
                {t.BuildingName}
              </div>
              <div className="inline-flex items-center gap-1 rounded-full bg-slate-700/50 px-2 py-1">
                <Zap size={12} className="text-slate-400" />
                {t.GeneratorID}
              </div>
              <div className="inline-flex items-center gap-1 rounded-full bg-slate-700/50 px-2 py-1">
                <CalendarClock size={12} className="text-slate-400" />
                Due {new Date(t.DueDate).toLocaleDateString()}
              </div>
              <div className="inline-flex items-center gap-1 rounded-full bg-slate-700/50 px-2 py-1">
                Assigned: {t.AssignedToUserName ?? "—"}
              </div>
            </div>
          </div>

          <Button
            variant="ghost"
            onClick={() =>
              window.location.assign(`/generators/${t.BuildingID}-${t.GeneratorID}`)
            }
          >
            Open <ArrowRight size={14} />
          </Button>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-slate-700 pt-3">
          <Action onClick={() => onComment(t)} icon={MessageSquare} label="Comment" />
          {isAdmin && hasPermission(me.role, "TASK_ASSIGN") && (
            <Action onClick={() => onAssign(t)} icon={UserPlus2} label="Reassign" tone="admin" />
          )}
          {isAdmin && hasPermission(me.role, "TASK_ASSIGN") && (
            <Action onClick={() => deescalateTask(t.TaskID, me)} icon={CheckCircle2} label="Clear Escalation" tone="success" />
          )}
          {t.SIMTicketLink && (
            <Action onClick={() => window.open(t.SIMTicketLink, "_blank")} icon={ExternalLink} label="Open SIM" />
          )}
        </div>
      </div>
    </div>
  );
}

function Kpi({ icon: Icon, label, value, color }: any) {
  return (
    <div className="rounded-2xl border border-slate-700 bg-slate-800/50 p-3 shadow-lg">
      <div className="flex items-center gap-2 text-[11px] font-semibold text-slate-400">
        <Icon size={14} />
        {label}
      </div>
      <div className="mt-1 flex items-center gap-2">
        <span className="h-2.5 w-2.5 rounded-full" style={{ background: color }} />
        <span className="text-xl font-extrabold text-white">{value}</span>
      </div>
    </div>
  );
}

function Action({ onClick, icon: Icon, label, tone }: any) {
  const base = "inline-flex items-center gap-2 rounded-xl border px-3 py-1.5 text-xs font-extrabold transition active:translate-y-[1px]";
  const palette =
    tone === "admin"
      ? "border-indigo-900 bg-indigo-950 text-indigo-300 hover:bg-indigo-900"
      : tone === "success"
      ? "border-emerald-900 bg-emerald-950 text-emerald-300 hover:bg-emerald-900"
      : "border-slate-600 bg-slate-700 text-slate-200 hover:bg-slate-600";
  return (
    <button onClick={onClick} className={`${base} ${palette}`}>
      <Icon size={14} />
      {label}
    </button>
  );
}

function Modal({ children, onClose }: any) {
  return (
    <div onClick={onClose} className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4 backdrop-blur-sm">
      <div onClick={(e) => e.stopPropagation()} className="w-full max-w-xl rounded-2xl bg-slate-800 border border-slate-700 p-4 shadow-[0_10px_30px_rgba(0,0,0,0.5)]">
        {children}
      </div>
    </div>
  );
}

function getComments(task: TaskRow) {
  try {
    return task.CommentsJSON ? JSON.parse(task.CommentsJSON) : [];
  } catch {
    return [];
  }
}

export default EscalationsPage;
