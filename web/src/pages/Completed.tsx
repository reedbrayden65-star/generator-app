import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import type { TaskRow } from "../data/mockTasks";
import { subscribe } from "../data/taskStore";
import { getCurrentUser, subscribeUser } from "../data/userStore";
import { isAdminRole } from "../utils/permissions";
import {
  CheckCircle2,
  Search,
  Download,
  Building2,
  Zap,
  CalendarClock,
  User,
  FileText,
  Filter,
  ArrowLeft,
} from "lucide-react";
import { Card, CardHeader, Button, Pill } from "../components/ui";

const ROW_HEIGHT = 140;
const OVERSCAN = 8;

type FilterMode = "All" | "Mine" | "Building" | "Generator";

function CompletedPage() {
  const nav = useNavigate();

  const [me, setMe] = useState(getCurrentUser());
  useEffect(() => {
    return subscribeUser(setMe);
  }, []);

  const isAdmin = isAdminRole(me.role);

  const [allTasks, setAllTasks] = useState<TaskRow[]>([]);
  useEffect(() => subscribe(setAllTasks), []);

  const completedTasks = useMemo(
    () =>
      allTasks
        .filter((t) => String(t.Status).toLowerCase() === "completed")
        .sort(
          (a, b) =>
            new Date(b.DueDate).getTime() - new Date(a.DueDate).getTime()
        ),
    [allTasks]
  );

  const buildings = useMemo(
    () => Array.from(new Set(completedTasks.map((t) => t.BuildingName))).sort(),
    [completedTasks]
  );
  const gens = useMemo(
    () => Array.from(new Set(completedTasks.map((t) => t.GeneratorID))).sort(),
    [completedTasks]
  );

  const [query, setQuery] = useState("");
  const [mode, setMode] = useState<FilterMode>("All");
  const [buildingFilter, setBuildingFilter] = useState<string>("All");
  const [genFilter, setGenFilter] = useState<string>("All");

  const filtered = useMemo(() => {
    let t = completedTasks;

    if (mode === "Mine") {
      t = t.filter(
        (x) =>
          x.ClaimedByUserID === me.id ||
          x.AssignedToUserID === me.id ||
          x.ClaimedByUserName === me.name
      );
    }
    if (mode === "Building" && buildingFilter !== "All") {
      t = t.filter((x) => x.BuildingName === buildingFilter);
    }
    if (mode === "Generator" && genFilter !== "All") {
      t = t.filter((x) => x.GeneratorID === genFilter);
    }

    if (query.trim()) {
      const q = query.toLowerCase();
      t = t.filter(
        (x) =>
          x.TaskTitle.toLowerCase().includes(q) ||
          (x.TaskDescription ?? "").toLowerCase().includes(q) ||
          (x.SIMTicketNumber ?? "").toLowerCase().includes(q) ||
          x.BuildingName.toLowerCase().includes(q) ||
          x.GeneratorID.toLowerCase().includes(q) ||
          (x.AssignedToUserName ?? "").toLowerCase().includes(q) ||
          (x.ClaimedByUserName ?? "").toLowerCase().includes(q)
      );
    }

    return t;
  }, [completedTasks, query, me, mode, buildingFilter, genFilter]);

  function exportCSV(rows: TaskRow[]) {
    const headers = [
      "Building",
      "Generator",
      "TaskTitle",
      "TaskDescription",
      "TaskType",
      "DueDate",
      "AssignedTo",
      "ClaimedBy",
      "SIMTicketNumber",
      "SIMTicketLink",
      "EscalationReason",
      "CompletedStatus",
    ];

    const csv = [
      headers.join(","),
      ...rows.map((r) =>
        [
          r.BuildingName,
          r.GeneratorID,
          r.TaskTitle,
          r.TaskDescription ?? "",
          r.TaskType,
          r.DueDate,
          r.AssignedToUserName ?? "",
          r.ClaimedByUserName ?? "",
          r.SIMTicketNumber ?? "",
          r.SIMTicketLink ?? "",
          (r as any).EscalationReason ?? "",
          r.Status,
        ]
          .map((v) => `"${String(v).replace(/"/g, '""')}"`)
          .join(",")
      ),
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = `completed-report-${new Date()
      .toISOString()
      .slice(0, 10)}.csv`;
    a.click();

    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-5">
      <Card>
        <CardHeader
          title="Completed Tasks"
          subtitle="Historical log + exportable reports"
          right={
            <div className="flex items-center gap-2">
              {isAdmin && (
                <Button onClick={() => exportCSV(filtered)}>
                  <Download size={16} />
                  Export CSV
                </Button>
              )}
              <Button variant="ghost" onClick={() => nav(-1)}>
                <ArrowLeft size={16} />
                Back
              </Button>
            </div>
          }
        />

        <div className="grid grid-cols-2 gap-3 px-4 pb-4 md:grid-cols-4">
          <Kpi label="Completed Total" value={completedTasks.length} />
          <Kpi
            label="Completed (Mine)"
            value={completedTasks.filter(
              (t) =>
                t.AssignedToUserID === me.id || t.ClaimedByUserID === me.id
            ).length}
          />
          <Kpi label="Buildings Covered" value={buildings.length} />
          <Kpi label="Generators Covered" value={gens.length} />
        </div>

        <div className="flex flex-col gap-3 border-t border-slate-700 p-4 md:flex-row md:items-center md:justify-between">
          <div className="relative w-full md:w-[460px]">
            <Search
              className="absolute left-2 top-2.5 text-slate-500"
              size={16}
            />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search completed tasks..."
              className="w-full rounded-xl border border-slate-600 bg-slate-800 pl-8 pr-3 py-2 text-sm font-semibold text-white placeholder:text-slate-500 outline-none focus:border-blue-500"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Filter size={14} className="text-slate-500" />
            <Chip
              label="All"
              active={mode === "All"}
              onClick={() => setMode("All")}
            />
            <Chip
              label="Mine"
              active={mode === "Mine"}
              onClick={() => setMode("Mine")}
            />
            <Chip
              label="By Building"
              active={mode === "Building"}
              onClick={() => setMode("Building")}
            />
            <Chip
              label="By Generator"
              active={mode === "Generator"}
              onClick={() => setMode("Generator")}
            />
          </div>
        </div>

        {(mode === "Building" || mode === "Generator") && (
          <div className="flex flex-col gap-2 border-t border-slate-700 px-4 py-3 md:flex-row md:items-center">
            {mode === "Building" && (
              <select
                value={buildingFilter}
                onChange={(e) => setBuildingFilter(e.target.value)}
                className="rounded-xl border border-slate-600 bg-slate-800 px-3 py-2 text-sm font-bold text-white outline-none"
              >
                <option value="All">All Buildings</option>
                {buildings.map((b) => (
                  <option key={b} value={b}>
                    {b}
                  </option>
                ))}
              </select>
            )}

            {mode === "Generator" && (
              <select
                value={genFilter}
                onChange={(e) => setGenFilter(e.target.value)}
                className="rounded-xl border border-slate-600 bg-slate-800 px-3 py-2 text-sm font-bold text-white outline-none"
              >
                <option value="All">All Generators</option>
                {gens.map((g) => (
                  <option key={g} value={g}>
                    {g}
                  </option>
                ))}
              </select>
            )}
          </div>
        )}
      </Card>

      <Card>
        <div className="border-b border-slate-700 px-4 py-3 text-xs font-extrabold text-slate-400">
          Showing {filtered.length} completed task
          {filtered.length !== 1 ? "s" : ""}
        </div>

        <VirtualCompletedList rows={filtered} />

        {filtered.length === 0 && (
          <div className="p-10 text-center text-sm text-slate-400">
            No completed tasks match your filters.
          </div>
        )}
      </Card>
    </div>
  );
}

/* ---------------- Virtual list ---------------- */

function VirtualCompletedList({ rows }: { rows: TaskRow[] }) {
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
    rows.length,
    Math.ceil((scrollTop + viewportH) / ROW_HEIGHT) + OVERSCAN
  );

  const visible = rows.slice(startIndex, endIndex);
  const topSpacer = startIndex * ROW_HEIGHT;
  const bottomSpacer = (rows.length - endIndex) * ROW_HEIGHT;

  return (
    <div
      ref={scrollerRef}
      onScroll={(e) => setScrollTop(e.currentTarget.scrollTop)}
      className="max-h-[72vh] overflow-auto bg-slate-800"
    >
      <div style={{ height: topSpacer }} />
      {visible.map((t) => (
        <CompletedCard key={t.TaskID} t={t} />
      ))}
      <div style={{ height: bottomSpacer }} />
    </div>
  );
}

function CompletedCard({ t }: { t: TaskRow }) {
  return (
    <div className="px-3 py-2 md:px-4">
      <div className="rounded-2xl border border-slate-700 bg-slate-800/50 p-3 shadow-lg transition hover:scale-[1.01] hover:shadow-xl">
        <div className="flex items-start gap-3">
          <div className="mt-1 grid h-7 w-7 place-items-center rounded-full bg-emerald-600/20 text-emerald-400">
            <CheckCircle2 size={16} />
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <div className="truncate text-sm font-extrabold text-white">
                {t.TaskTitle}
              </div>
              <Pill tone="success" className="text-[10px]">
                COMPLETED
              </Pill>
              <Pill className="text-[10px]">{t.TaskType}</Pill>
              {t.SIMTicketNumber && (
                <Pill className="text-[10px]">SIM {t.SIMTicketNumber}</Pill>
              )}
            </div>

            <div className="mt-1 line-clamp-2 text-[12px] text-slate-400">
              {t.TaskDescription ?? "—"}
            </div>

            <div className="mt-2 flex flex-wrap gap-2 text-[11px] font-semibold text-slate-300">
              <Meta icon={Building2} label={t.BuildingName} />
              <Meta icon={Zap} label={t.GeneratorID} />
              <Meta
                icon={CalendarClock}
                label={`Due ${new Date(t.DueDate).toLocaleDateString()}`}
              />
              <Meta icon={User} label={`Assigned ${t.AssignedToUserName ?? "—"}`} />
              <Meta icon={User} label={`Claimed ${t.ClaimedByUserName ?? "—"}`} />
            </div>

            {(t as any).EscalationReason && (
              <div className="mt-2 rounded-xl border border-amber-900 bg-amber-950 px-3 py-2 text-[12px] font-semibold text-amber-200">
                Escalation reason: {(t as any).EscalationReason}
              </div>
            )}
          </div>

          <div className="hidden md:flex flex-col items-end gap-2 text-[11px] font-semibold text-slate-500">
            <div className="inline-flex items-center gap-1">
              <FileText size={12} />
              {t.TaskID}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------------- UI bits ---------------- */

function Kpi({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-slate-700 bg-slate-800/50 p-3 shadow-lg">
      <div className="text-[11px] font-semibold text-slate-400">{label}</div>
      <div className="mt-1 text-xl font-extrabold text-white">{value}</div>
    </div>
  );
}

function Chip({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={[
        "rounded-full border px-3 py-1 text-xs font-extrabold transition",
        active
          ? "bg-blue-600 text-white border-blue-600"
          : "bg-slate-700 text-slate-300 border-slate-600 hover:bg-slate-600",
      ].join(" ")}
    >
      {label}
    </button>
  );
}

function Meta({ icon: Icon, label }: { icon: any; label: string }) {
  return (
    <div className="inline-flex items-center gap-1 rounded-full bg-slate-700/50 px-2 py-1">
      <Icon size={12} className="text-slate-400" />
      <span>{label}</span>
    </div>
  );
}

/** ✅ DEFAULT EXPORT (this is what fixes your error) */
export default CompletedPage;

/** Optional named export too */
export { CompletedPage };
