import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Building2,
  Zap,
  ClipboardList,
  ArrowRight,
  AlertTriangle,
  Clock,
  UploadCloud,
  Flame,
  CalendarDays,
  CheckCircle2,
  User,
} from "lucide-react";
import { Card, CardHeader, Button, Pill } from "../components/ui";
import {
  getBuildings,
  getWorkOrders,
  getGenerators,
  subscribe,
} from "../data/dataStore";
import { getCurrentUser } from "../data/authStore";
import type { WorkOrder, Building } from "../data/types";
import { computeWOStatus, parsePriority } from "../data/types";

export default function Dashboard() {
  const nav = useNavigate();
  const currentUser = getCurrentUser();
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [generatorCount, setGeneratorCount] = useState(0);

  useEffect(() => {
    const update = () => {
      setBuildings(getBuildings());
      setWorkOrders(getWorkOrders());
      setGeneratorCount(getGenerators().length);
    };
    update();
    return subscribe(update);
  }, []);

  const stats = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const open = workOrders.filter(wo => wo.status === "Open").length;
    const onHold = workOrders.filter(wo => wo.status === "On Hold").length;
    const overdue = workOrders.filter(wo => computeWOStatus(wo) === "Overdue").length;
    
    const dueToday = workOrders.filter(wo => {
      if (wo.status === "Completed") return false;
      const endDate = new Date(wo.complianceEndDate);
      endDate.setHours(0, 0, 0, 0);
      return endDate.getTime() === today.getTime();
    }).length;
    
    const urgent = workOrders.filter(wo => 
      wo.status === "Open" && parsePriority(wo.priority) <= 2
    ).length;

    const myTasks = workOrders.filter(wo =>
      wo.status !== "Completed" &&
      (wo.claimedByUserId === currentUser?.id || wo.assignedToUserId === currentUser?.id)
    ).length;

    const escalated = workOrders.filter(wo => wo.escalationReason || wo.status === "On Hold").length;

    return { open, onHold, overdue, dueToday, urgent, myTasks, escalated, total: workOrders.length };
  }, [workOrders, currentUser]);

  // No data state
  if (buildings.length === 0 && workOrders.length === 0) {
    return (
      <Card>
        <div className="p-16 text-center">
          <div className="inline-flex h-20 w-20 items-center justify-center rounded-2xl bg-slate-800/50 text-slate-500 mb-6">
            <UploadCloud size={40} />
          </div>
          <h2 className="text-2xl font-black text-white mb-3">Welcome to GenOps</h2>
          <p className="text-slate-400 mb-8 max-w-md mx-auto">
            Upload your generator info and work order CSV files to get started.
          </p>
          <Button onClick={() => nav("/upload")} size="md">
            <UploadCloud size={16} />
            Upload Data
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-white">Dashboard</h1>
          <p className="text-sm text-slate-400 mt-1">
            {buildings.length} buildings • {generatorCount} generators • {stats.total} work orders
          </p>
        </div>
        <Button onClick={() => nav("/upload")}>
          <UploadCloud size={14} /> Upload Data
        </Button>
      </div>

      {/* Alert Cards - Only show if there are issues */}
      {(stats.overdue > 0 || stats.dueToday > 0 || stats.urgent > 0) && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {stats.overdue > 0 && (
            <AlertCard
              icon={AlertTriangle}
              title="Past Due"
              count={stats.overdue}
              color="red"
              onClick={() => nav("/work-orders?filter=overdue")}
            />
          )}
          {stats.dueToday > 0 && (
            <AlertCard
              icon={CalendarDays}
              title="Due Today"
              count={stats.dueToday}
              color="orange"
              onClick={() => nav("/today")}
            />
          )}
          {stats.urgent > 0 && (
            <AlertCard
              icon={Flame}
              title="Urgent"
              count={stats.urgent}
              color="amber"
              onClick={() => nav("/work-orders?filter=urgent")}
            />
          )}
        </div>
      )}

      {/* Main Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left Column - Quick Stats */}
        <div className="space-y-4">
          <Card>
            <div className="p-4">
              <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4">Overview</div>
              <div className="space-y-3">
                <QuickStat icon={Building2} label="Buildings" value={buildings.length} color="blue" onClick={() => nav("/buildings")} />
                <QuickStat icon={Zap} label="Generators" value={generatorCount} color="purple" />
                <QuickStat icon={ClipboardList} label="Open Work Orders" value={stats.open} color="emerald" onClick={() => nav("/work-orders?filter=open")} />
                <QuickStat icon={Clock} label="On Hold" value={stats.onHold} color="amber" onClick={() => nav("/work-orders?filter=on-hold")} />
              </div>
            </div>
          </Card>

          <Card>
            <div className="p-4">
              <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4">Your Activity</div>
              <div className="space-y-3">
                <QuickStat icon={User} label="My Tasks" value={stats.myTasks} color="blue" onClick={() => nav("/my-tasks")} />
                <QuickStat icon={AlertTriangle} label="Escalated" value={stats.escalated} color="amber" onClick={() => nav("/escalated")} />
              </div>
            </div>
          </Card>
        </div>

        {/* Middle Column - Buildings */}
        <Card>
          <CardHeader
            title="Buildings"
            right={
              <Button variant="ghost" onClick={() => nav("/buildings")}>
                All <ArrowRight size={14} />
              </Button>
            }
          />
          <div className="p-2">
            {buildings.slice(0, 8).map((b) => (
              <button
                key={b.id}
                onClick={() => nav(`/buildings/${encodeURIComponent(b.name)}`)}
                className="group w-full flex items-center gap-3 rounded-lg px-3 py-2 hover:bg-slate-800/50 transition-all"
              >
                <div className="grid h-8 w-8 place-items-center rounded-lg bg-blue-500/15 text-blue-400">
                  <Building2 size={14} />
                </div>
                <div className="flex-1 text-left min-w-0">
                  <div className="text-sm font-bold text-white truncate group-hover:text-blue-400 transition-colors">
                    {b.name}
                  </div>
                  <div className="text-[10px] text-slate-500">
                    {b.generatorCount} gens • {b.workOrderCount} WOs
                  </div>
                </div>
                {(b.openCount > 0 || b.onHoldCount > 0) && (
                  <div className="flex gap-1">
                    {b.openCount > 0 && <MiniCount value={b.openCount} color="emerald" />}
                    {b.onHoldCount > 0 && <MiniCount value={b.onHoldCount} color="amber" />}
                  </div>
                )}
              </button>
            ))}
          </div>
        </Card>

        {/* Right Column - Recent Work Orders */}
        <Card>
          <CardHeader
            title="Recent Work Orders"
            right={
              <Button variant="ghost" onClick={() => nav("/work-orders")}>
                All <ArrowRight size={14} />
              </Button>
            }
          />
          <div className="p-2">
            {workOrders.slice(0, 8).map((wo) => {
              const woStatus = computeWOStatus(wo);
              return (
                <button
                  key={wo.id}
                  onClick={() => nav(`/work-orders/${wo.workOrderNumber}`)}
                  className="group w-full flex items-center gap-3 rounded-lg px-3 py-2 hover:bg-slate-800/50 transition-all"
                >
                  <StatusDot status={woStatus} />
                  <div className="flex-1 text-left min-w-0">
                    <div className="text-sm font-bold text-white truncate group-hover:text-blue-400 transition-colors">
                      {wo.description}
                    </div>
                    <div className="text-[10px] text-slate-500">
                      {wo.organization} • {wo.workOrderNumber}
                    </div>
                  </div>
                  <Pill tone={woStatus === "Overdue" ? "danger" : woStatus === "Due Soon" ? "warn" : "neutral"}>
                    {woStatus}
                  </Pill>
                </button>
              );
            })}
          </div>
        </Card>
      </div>
    </div>
  );
}


function AlertCard({
  icon: Icon,
  title,
  count,
  color,
  onClick,
}: {
  icon: any;
  title: string;
  count: number;
  color: "red" | "orange" | "amber";
  onClick: () => void;
}) {
  const colors = {
    red: "border-red-500/40 bg-gradient-to-br from-red-500/10 to-red-600/5 hover:from-red-500/15 hover:to-red-600/10",
    orange: "border-orange-500/40 bg-gradient-to-br from-orange-500/10 to-orange-600/5 hover:from-orange-500/15 hover:to-orange-600/10",
    amber: "border-amber-500/40 bg-gradient-to-br from-amber-500/10 to-amber-600/5 hover:from-amber-500/15 hover:to-amber-600/10",
  };
  const iconColors = {
    red: "text-red-400",
    orange: "text-orange-400",
    amber: "text-amber-400",
  };

  return (
    <button
      onClick={onClick}
      className={`group flex items-center gap-4 rounded-xl border p-4 transition-all ${colors[color]}`}
    >
      <div className={`grid h-12 w-12 place-items-center rounded-xl bg-slate-900/50 ${iconColors[color]}`}>
        <Icon size={22} />
      </div>
      <div className="flex-1 text-left">
        <div className="text-2xl font-black text-white">{count}</div>
        <div className="text-xs font-bold text-slate-400">{title}</div>
      </div>
      <ArrowRight size={18} className="text-slate-600 group-hover:text-slate-400 group-hover:translate-x-1 transition-all" />
    </button>
  );
}

function QuickStat({
  icon: Icon,
  label,
  value,
  color,
  onClick,
}: {
  icon: any;
  label: string;
  value: number;
  color: "blue" | "purple" | "emerald" | "amber";
  onClick?: () => void;
}) {
  const colors = {
    blue: "text-blue-400 bg-blue-500/15",
    purple: "text-purple-400 bg-purple-500/15",
    emerald: "text-emerald-400 bg-emerald-500/15",
    amber: "text-amber-400 bg-amber-500/15",
  };

  const Component = onClick ? "button" : "div";

  return (
    <Component
      onClick={onClick}
      className={`flex items-center gap-3 rounded-lg p-2 transition-all ${onClick ? "hover:bg-slate-800/50 cursor-pointer" : ""}`}
    >
      <div className={`grid h-9 w-9 place-items-center rounded-lg ${colors[color]}`}>
        <Icon size={16} />
      </div>
      <div className="flex-1 text-left">
        <div className="text-xs text-slate-400">{label}</div>
        <div className="text-lg font-black text-white">{value}</div>
      </div>
      {onClick && <ArrowRight size={14} className="text-slate-600" />}
    </Component>
  );
}

function StatusDot({ status }: { status: string }) {
  const color =
    status === "Overdue" ? "bg-red-500" :
    status === "Due Soon" ? "bg-orange-500" :
    status === "On Hold" ? "bg-amber-500" :
    status === "Completed" ? "bg-emerald-500" :
    "bg-slate-500";
  
  return (
    <div className={`h-2 w-2 rounded-full ${color} ${status === "Overdue" ? "animate-pulse" : ""}`} />
  );
}

function MiniCount({ value, color }: { value: number; color: "emerald" | "amber" }) {
  const colors = {
    emerald: "bg-emerald-500/20 text-emerald-400",
    amber: "bg-amber-500/20 text-amber-400",
  };
  return (
    <span className={`inline-flex items-center justify-center h-5 min-w-5 rounded px-1 text-[10px] font-bold ${colors[color]}`}>
      {value}
    </span>
  );
}
