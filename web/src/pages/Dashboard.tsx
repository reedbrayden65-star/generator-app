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
} from "lucide-react";
import { Card, CardHeader, Button, Pill } from "../components/ui";
import {
  getBuildings,
  getWorkOrders,
  getGenerators,
  subscribe,
} from "../data/dataStore";
import type { WorkOrder, Building } from "../data/types";
import { computeWOStatus, parsePriority } from "../data/types";

export default function Dashboard() {
  const nav = useNavigate();
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

    return { open, onHold, overdue, dueToday, urgent, total: workOrders.length };
  }, [workOrders]);

  // No data state
  if (buildings.length === 0 && workOrders.length === 0) {
    return (
      <Card>
        <div className="p-12 text-center">
          <div className="inline-flex h-20 w-20 items-center justify-center rounded-2xl bg-slate-800/50 text-slate-500 mb-5">
            <UploadCloud size={40} />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">No Data Yet</h2>
          <p className="text-sm text-slate-400 mb-6">
            Upload your CSV files to get started with GenOps.
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
      {/* Hero Stats */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <HeroStat
          icon={Building2}
          label="Buildings"
          value={buildings.length}
          color="blue"
          onClick={() => nav("/buildings")}
        />
        <HeroStat
          icon={Zap}
          label="Generators"
          value={generatorCount}
          color="purple"
        />
        <HeroStat
          icon={ClipboardList}
          label="Open WOs"
          value={stats.open}
          color="emerald"
          onClick={() => nav("/work-orders?filter=open")}
        />
        <HeroStat
          icon={AlertTriangle}
          label="Needs Attention"
          value={stats.overdue + stats.urgent}
          color="red"
          onClick={() => nav("/work-orders?filter=overdue")}
          pulse={stats.overdue > 0}
        />
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <QuickAction
          icon={AlertTriangle}
          title="Past Due"
          count={stats.overdue}
          color="red"
          onClick={() => nav("/work-orders?filter=overdue")}
        />
        <QuickAction
          icon={CalendarDays}
          title="Due Today"
          count={stats.dueToday}
          color="orange"
          onClick={() => nav("/work-orders?filter=due-today")}
        />
        <QuickAction
          icon={Flame}
          title="Urgent"
          count={stats.urgent}
          color="amber"
          onClick={() => nav("/work-orders?filter=urgent")}
        />
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        {/* Buildings - Takes 2 columns */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader
              title="Buildings"
              subtitle={`${buildings.length} total`}
              right={
                <Button variant="ghost" onClick={() => nav("/buildings")}>
                  All <ArrowRight size={14} />
                </Button>
              }
            />
            <div className="p-2">
              {buildings.slice(0, 6).map((b) => (
                <button
                  key={b.id}
                  onClick={() => nav(`/buildings/${encodeURIComponent(b.name)}`)}
                  className="group w-full flex items-center gap-3 rounded-xl px-3 py-2.5 hover:bg-slate-800/50 transition-all"
                >
                  <div className="grid h-9 w-9 place-items-center rounded-lg bg-blue-500/15 text-blue-400">
                    <Building2 size={16} />
                  </div>
                  <div className="flex-1 text-left min-w-0">
                    <div className="text-sm font-bold text-white truncate group-hover:text-blue-400 transition-colors">
                      {b.name}
                    </div>
                    <div className="text-[11px] text-slate-500">
                      {b.generatorCount} gens • {b.workOrderCount} WOs
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    {b.openCount > 0 && <MiniPill color="emerald">{b.openCount}</MiniPill>}
                    {b.onHoldCount > 0 && <MiniPill color="amber">{b.onHoldCount}</MiniPill>}
                  </div>
                </button>
              ))}
            </div>
          </Card>
        </div>

        {/* Recent Work Orders - Takes 3 columns */}
        <div className="lg:col-span-3">
          <Card>
            <CardHeader
              title="Recent Work Orders"
              subtitle={`${stats.total} total`}
              right={
                <Button variant="ghost" onClick={() => nav("/work-orders")}>
                  All <ArrowRight size={14} />
                </Button>
              }
            />
            <div className="p-2">
              {workOrders.slice(0, 6).map((wo) => {
                const woStatus = computeWOStatus(wo);
                const priority = parsePriority(wo.priority);
                return (
                  <button
                    key={wo.id}
                    onClick={() => nav(`/work-orders/${wo.workOrderNumber}`)}
                    className="group w-full flex items-center gap-3 rounded-xl px-3 py-2.5 hover:bg-slate-800/50 transition-all"
                  >
                    <StatusDot status={woStatus} />
                    <div className="flex-1 text-left min-w-0">
                      <div className="text-sm font-bold text-white truncate group-hover:text-blue-400 transition-colors">
                        {wo.description}
                      </div>
                      <div className="text-[11px] text-slate-500">
                        {wo.organization} • {wo.workOrderNumber}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {priority <= 2 && <MiniPill color="red">P{priority}</MiniPill>}
                      <StatusPill status={woStatus} />
                    </div>
                  </button>
                );
              })}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}


function HeroStat({
  icon: Icon,
  label,
  value,
  color,
  onClick,
  pulse,
}: {
  icon: any;
  label: string;
  value: number;
  color: "blue" | "purple" | "emerald" | "red";
  onClick?: () => void;
  pulse?: boolean;
}) {
  const colors = {
    blue: "from-blue-500/20 to-blue-600/10 text-blue-400 shadow-blue-500/20",
    purple: "from-purple-500/20 to-purple-600/10 text-purple-400 shadow-purple-500/20",
    emerald: "from-emerald-500/20 to-emerald-600/10 text-emerald-400 shadow-emerald-500/20",
    red: "from-red-500/20 to-red-600/10 text-red-400 shadow-red-500/20",
  };

  const Component = onClick ? "button" : "div";

  return (
    <Component
      onClick={onClick}
      className={`group relative overflow-hidden rounded-2xl border border-slate-700/50 bg-gradient-to-br from-slate-800/80 to-slate-900/60 p-5 text-left transition-all hover:border-slate-600/70 hover:shadow-xl ${onClick ? "cursor-pointer hover:scale-[1.02]" : ""}`}
    >
      <div className="flex items-start justify-between">
        <div>
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">{label}</div>
          <div className={`text-3xl font-black text-white ${pulse ? "animate-pulse" : ""}`}>{value}</div>
        </div>
        <div className={`grid h-12 w-12 place-items-center rounded-xl bg-gradient-to-br ${colors[color]} shadow-lg`}>
          <Icon size={22} />
        </div>
      </div>
      {onClick && (
        <ArrowRight size={14} className="absolute bottom-4 right-4 text-slate-600 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
      )}
    </Component>
  );
}

function QuickAction({
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
    red: "border-red-500/30 hover:border-red-500/50 bg-red-500/5 hover:bg-red-500/10",
    orange: "border-orange-500/30 hover:border-orange-500/50 bg-orange-500/5 hover:bg-orange-500/10",
    amber: "border-amber-500/30 hover:border-amber-500/50 bg-amber-500/5 hover:bg-amber-500/10",
  };
  const iconColors = {
    red: "text-red-400",
    orange: "text-orange-400",
    amber: "text-amber-400",
  };

  if (count === 0) return null;

  return (
    <button
      onClick={onClick}
      className={`group flex items-center gap-4 rounded-xl border p-4 transition-all ${colors[color]}`}
    >
      <div className={`grid h-10 w-10 place-items-center rounded-lg bg-slate-800/50 ${iconColors[color]}`}>
        <Icon size={18} />
      </div>
      <div className="flex-1 text-left">
        <div className="text-sm font-bold text-white">{title}</div>
        <div className="text-xs text-slate-400">{count} work order{count !== 1 ? "s" : ""}</div>
      </div>
      <ArrowRight size={16} className="text-slate-600 group-hover:text-slate-400 group-hover:translate-x-1 transition-all" />
    </button>
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
    <div className={`h-2.5 w-2.5 rounded-full ${color} ${status === "Overdue" ? "animate-pulse" : ""}`} />
  );
}

function StatusPill({ status }: { status: string }) {
  const tone =
    status === "Overdue" ? "danger" :
    status === "Due Soon" ? "warn" :
    status === "On Hold" ? "warn" :
    status === "Completed" ? "success" :
    "neutral";
  return <Pill tone={tone}>{status}</Pill>;
}

function MiniPill({ children, color }: { children: React.ReactNode; color: "emerald" | "amber" | "red" }) {
  const colors = {
    emerald: "bg-emerald-500/20 text-emerald-400",
    amber: "bg-amber-500/20 text-amber-400",
    red: "bg-red-500/20 text-red-400",
  };
  return (
    <span className={`inline-flex items-center rounded-md px-1.5 py-0.5 text-[10px] font-bold ${colors[color]}`}>
      {children}
    </span>
  );
}
