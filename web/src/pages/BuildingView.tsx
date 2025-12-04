import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Zap,
  ClipboardList,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Pause,
  ArrowRight,
} from "lucide-react";
import { Card, CardHeader, Button, Pill } from "../components/ui";
import {
  getGeneratorsByBuilding,
  getWorkOrdersByBuilding,
  subscribe,
} from "../data/dataStore";
import type { Generator, WorkOrder } from "../data/types";
import { computeWOStatus, parsePriority, getPriorityLabel } from "../data/types";

export default function BuildingView() {
  const { buildingId } = useParams();
  const nav = useNavigate();
  const buildingName = decodeURIComponent(buildingId || "");

  const [generators, setGenerators] = useState<Generator[]>([]);
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);

  useEffect(() => {
    const update = () => {
      setGenerators(getGeneratorsByBuilding(buildingName));
      setWorkOrders(getWorkOrdersByBuilding(buildingName));
    };
    update();
    return subscribe(update);
  }, [buildingName]);

  const stats = {
    open: workOrders.filter((wo) => wo.status === "Open").length,
    onHold: workOrders.filter((wo) => wo.status === "On Hold").length,
    completed: workOrders.filter((wo) => wo.status === "Completed").length,
    overdue: workOrders.filter((wo) => computeWOStatus(wo) === "Overdue").length,
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <Card>
        <CardHeader
          title={buildingName}
          subtitle={`${generators.length} generators • ${workOrders.length} work orders`}
          right={
            <Button variant="ghost" onClick={() => nav("/buildings")}>
              <ArrowLeft size={16} /> Back to Buildings
            </Button>
          }
        />

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3 p-4 md:grid-cols-4">
          <MiniStat icon={ClipboardList} label="Open" value={stats.open} color="#22c55e" />
          <MiniStat icon={Pause} label="On Hold" value={stats.onHold} color="#f59e0b" />
          <MiniStat icon={AlertTriangle} label="Overdue" value={stats.overdue} color="#ef4444" />
          <MiniStat icon={CheckCircle2} label="Completed" value={stats.completed} color="#3b82f6" />
        </div>
      </Card>

      {/* Generators */}
      <Card>
        <CardHeader title="Generators" subtitle={`${generators.length} units`} />
        {generators.length === 0 ? (
          <div className="p-4 text-sm text-slate-400">
            No generators found. Upload a Generator Info Sheet.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 p-4 md:grid-cols-2 lg:grid-cols-3">
            {generators.map((gen) => {
              const genWOs = workOrders.filter((wo) => wo.equipmentId === gen.assetId);
              const openWOs = genWOs.filter((wo) => wo.status === "Open").length;
              const overdueWOs = genWOs.filter((wo) => computeWOStatus(wo) === "Overdue").length;

              return (
                <button
                  key={gen.assetId}
                  onClick={() =>
                    nav(`/generators/${encodeURIComponent(buildingName)}/${encodeURIComponent(gen.assetId)}`)
                  }
                  className="text-left group"
                >
                  <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-4 transition hover:border-blue-500/50 hover:shadow-lg">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="font-extrabold text-white group-hover:text-blue-400">
                          {gen.unitNumber}
                        </div>
                        <div className="text-xs text-slate-400 mt-1">
                          {gen.manufacturer} {gen.model}
                        </div>
                      </div>
                      <Zap size={18} className="text-slate-500" />
                    </div>

                    <div className="mt-3 flex flex-wrap gap-2">
                      {openWOs > 0 && <Pill>{openWOs} WOs</Pill>}
                      {overdueWOs > 0 && <Pill tone="danger">{overdueWOs} overdue</Pill>}
                      {openWOs === 0 && <Pill tone="success">Clear</Pill>}
                    </div>

                    <div className="mt-3 text-xs text-slate-500">
                      Asset: {gen.assetId}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </Card>

      {/* Work Orders */}
      <Card>
        <CardHeader
          title="Work Orders"
          subtitle={`${workOrders.length} total`}
          right={
            <Button variant="ghost" onClick={() => nav(`/work-orders?building=${buildingName}`)}>
              View All <ArrowRight size={16} />
            </Button>
          }
        />
        {workOrders.length === 0 ? (
          <div className="p-4 text-sm text-slate-400">
            No work orders found. Upload a Work Orders Sheet.
          </div>
        ) : (
          <div className="divide-y divide-slate-700">
            {workOrders.slice(0, 10).map((wo) => {
              const woStatus = computeWOStatus(wo);
              const priority = parsePriority(wo.priority);

              return (
                <button
                  key={wo.id}
                  onClick={() => nav(`/work-orders/${wo.workOrderNumber}`)}
                  className="w-full px-4 py-3 text-left hover:bg-slate-800/50 transition"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="font-bold text-white truncate">
                        {wo.description}
                      </div>
                      <div className="text-xs text-slate-400 mt-1">
                        WO# {wo.workOrderNumber} • {wo.woType} • {wo.equipmentDescription}
                      </div>
                      <div className="text-xs text-slate-500 mt-1">
                        Due: {wo.complianceEndDate} • {getPriorityLabel(priority)}
                      </div>
                    </div>
                    <StatusPill status={woStatus} />
                  </div>
                </button>
              );
            })}
            {workOrders.length > 10 && (
              <div className="p-3 text-center text-sm text-slate-400">
                +{workOrders.length - 10} more work orders
              </div>
            )}
          </div>
        )}
      </Card>
    </div>
  );
}

function MiniStat({
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
    <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-3">
      <div className="flex items-center gap-2 text-xs text-slate-400">
        <Icon size={14} style={{ color }} />
        {label}
      </div>
      <div className="mt-1 text-xl font-extrabold text-white">{value}</div>
    </div>
  );
}

function StatusPill({ status }: { status: string }) {
  const tone =
    status === "Overdue"
      ? "danger"
      : status === "Due Soon"
        ? "warn"
        : status === "On Hold"
          ? "warn"
          : status === "Completed"
            ? "success"
            : "neutral";
  return <Pill tone={tone}>{status}</Pill>;
}
