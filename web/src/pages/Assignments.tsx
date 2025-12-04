import { useEffect, useMemo, useState } from "react";
import type { TaskRow } from "../data/mockTasks";
import { subscribe } from "../data/taskStore";
import { statusColor } from "../utils/status";
import { Card, CardHeader, Pill, Button } from "../components/ui";
import {
  ClipboardCheck,
  Search,
  Building2,
  Zap,
  AlertTriangle,
  Clock3,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { getCurrentUser, subscribeUser } from "../data/userStore";

function Assignments() {
  const nav = useNavigate();
  const [me, setMe] = useState(getCurrentUser());
  useEffect(() => {
    return subscribeUser(setMe);
  }, []);

  const [allTasks, setAllTasks] = useState<TaskRow[]>([]);
  useEffect(() => subscribe(setAllTasks), []);

  const [query, setQuery] = useState("");
  const [showOnlyUrgent, setShowOnlyUrgent] = useState(false);

  const assignedTasks = useMemo(() => {
    const tasks = allTasks.filter(
      (t) => t.Status !== "Completed" && t.AssignedToUserID === me.id
    );

    let filtered = tasks;

    if (showOnlyUrgent) {
      filtered = filtered.filter(
        (t) => t.Status === "Urgent" || t.Status === "Escalated"
      );
    }

    if (query.trim()) {
      const q = query.toLowerCase();
      filtered = filtered.filter(
        (t) =>
          t.TaskTitle.toLowerCase().includes(q) ||
          t.BuildingName.toLowerCase().includes(q) ||
          t.GeneratorID.toLowerCase().includes(q) ||
          (t.SIMTicketNumber ?? "").toLowerCase().includes(q)
      );
    }

    const rank = (s?: string) =>
      s === "Escalated" ? 0 :
      s === "Urgent" ? 1 :
      s === "PastDue" ? 2 :
      s === "Upcoming" ? 3 :
      4;

    return filtered.sort((a, b) => {
      const r = rank(a.Status) - rank(b.Status);
      if (r !== 0) return r;
      return new Date(a.DueDate).getTime() - new Date(b.DueDate).getTime();
    });
  }, [allTasks, query, showOnlyUrgent, me.id]);

  const grouped = useMemo(() => {
    const map = new Map<string, TaskRow[]>();
    for (const t of assignedTasks) {
      const key = `${t.BuildingName} • ${t.GeneratorID}`;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(t);
    }
    return Array.from(map.entries());
  }, [assignedTasks]);

  const counts = useMemo(() => {
    const urgent = assignedTasks.filter(
      t => t.Status === "Urgent" || t.Status === "Escalated"
    ).length;
    const pastDue = assignedTasks.filter(t => t.Status === "PastDue").length;
    const upcoming = assignedTasks.filter(t => t.Status === "Upcoming").length;
    return { total: assignedTasks.length, urgent, pastDue, upcoming };
  }, [assignedTasks]);

  return (
    <div className="space-y-5">
      <Card>
        <CardHeader
          title="My Assignments"
          subtitle={`Showing tasks assigned to ${me.name}`}
          right={<Button variant="ghost" onClick={() => nav(-1)}>Back</Button>}
        />

        <div className="grid grid-cols-2 gap-3 p-4 md:grid-cols-4">
          <Kpi icon={ClipboardCheck} label="Total" value={counts.total} color="#3b82f6" />
          <Kpi icon={Zap} label="Urgent" value={counts.urgent} color={statusColor("Urgent")} />
          <Kpi icon={AlertTriangle} label="Past Due" value={counts.pastDue} color={statusColor("PastDue")} />
          <Kpi icon={Clock3} label="Upcoming" value={counts.upcoming} color={statusColor("Upcoming")} />
        </div>

        <div className="flex flex-col gap-2 border-t border-slate-700 p-4 md:flex-row md:items-center md:justify-between">
          <div className="relative w-full md:w-96">
            <Search className="absolute left-2 top-2.5 text-slate-500" size={16} />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search tasks, buildings, gens, SIM..."
              className="w-full rounded-xl border border-slate-600 bg-slate-800 pl-8 pr-3 py-2 text-sm font-semibold text-white placeholder:text-slate-500 outline-none focus:border-blue-500"
            />
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              onClick={() => setShowOnlyUrgent(false)}
              className={!showOnlyUrgent ? "bg-blue-600 text-white border-blue-600" : ""}
            >
              All
            </Button>
            <Button
              variant="ghost"
              onClick={() => setShowOnlyUrgent(true)}
              className={showOnlyUrgent ? "bg-blue-600 text-white border-blue-600" : ""}
            >
              Urgent / Escalated
            </Button>
          </div>
        </div>
      </Card>

      <div className="space-y-4">
        {grouped.map(([groupKey, tasks]) => (
          <Card key={groupKey}>
            <div className="flex items-center justify-between border-b border-slate-700 px-4 py-3">
              <div className="flex items-center gap-2">
                <div className="grid h-9 w-9 place-items-center rounded-xl bg-blue-600 text-white">
                  <Building2 size={16} />
                </div>
                <div>
                  <div className="text-sm font-extrabold text-white">
                    {groupKey}
                  </div>
                  <div className="text-[11px] text-slate-400">
                    {tasks.length} task{tasks.length !== 1 ? "s" : ""}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {tasks.some(t => t.Status === "Urgent" || t.Status === "Escalated") && (
                  <Pill tone="danger">URGENT</Pill>
                )}
                {tasks.some(t => t.Status === "PastDue") && (
                  <Pill tone="warn">PAST DUE</Pill>
                )}
              </div>
            </div>

            <div className="divide-y divide-slate-700">
              {tasks.map(t => {
                const dot = statusColor(t.Status);
                return (
                  <div key={t.TaskID} className="flex flex-col gap-2 px-4 py-3 md:flex-row md:items-center md:justify-between">
                    <div className="flex items-start gap-3">
                      <span className="mt-1 h-2.5 w-2.5 rounded-full" style={{ background: dot }} />
                      <div className="min-w-0">
                        <div className="truncate font-extrabold text-white">{t.TaskTitle}</div>
                        <div className="mt-0.5 text-[11px] text-slate-400">
                          Due: {new Date(t.DueDate).toLocaleDateString()} • {t.TaskType}
                          {t.SIMTicketNumber && (
                            <span className="ml-2 font-bold text-slate-300">
                              SIM {t.SIMTicketNumber}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <Button variant="ghost" onClick={() => nav(`/generators/${t.BuildingID}-${t.GeneratorID}`)}>
                      Open Generator
                    </Button>
                  </div>
                );
              })}
            </div>
          </Card>
        ))}

        {assignedTasks.length === 0 && (
          <Card>
            <div className="p-8 text-center text-sm text-slate-400">
              No tasks assigned to {me.name}.
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}

function Kpi({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: any;
  label: string;
  value: number;
  color: string;
}) {
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

export default Assignments;
