import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import type { TaskRow } from "../data/mockTasks";
import { subscribe } from "../data/taskStore";
import { getTeamTasks } from "../data/teamStore";
import { getCurrentAccount } from "../data/authStore";
import { Building2, ArrowRight } from "lucide-react";
import { Card, CardHeader, Button, Pill } from "../components/ui";

function normalizeStatus(raw: any) {
  const s = String(raw || "").toLowerCase();
  if (s.includes("urgent")) return "URGENT";
  if (s.includes("past")) return "PAST_DUE";
  if (s.includes("upcoming")) return "UPCOMING";
  if (s.includes("escalat")) return "ESCALATED";
  if (s.includes("complete")) return "COMPLETED";
  return "CURRENT";
}

export default function BuildingsPage() {
  const nav = useNavigate();
  const acct = getCurrentAccount();

  const [tasks, setTasks] = useState<TaskRow[]>([]);

  useEffect(() => {
    if (!acct?.teamCode) {
      nav("/login");
      return;
    }

    // Load team tasks
    const teamTasks = getTeamTasks(acct.teamCode);
    setTasks(teamTasks);

    // Subscribe to changes
    const unsub = subscribe(() => {
      const updated = getTeamTasks(acct.teamCode);
      setTasks(updated);
    });

    return unsub;
  }, [acct, nav]);

  const buildings = useMemo(() => {
    const buildingMap = new Map<string, TaskRow[]>();
    
    for (const task of tasks) {
      if (!buildingMap.has(task.BuildingName)) {
        buildingMap.set(task.BuildingName, []);
      }
      buildingMap.get(task.BuildingName)!.push(task);
    }

    return Array.from(buildingMap.entries())
      .map(([name, buildingTasks]) => {
        const generators = new Set(buildingTasks.map(t => t.GeneratorID)).size;
        const urgent = buildingTasks.filter(t => normalizeStatus(t.Status) === "URGENT").length;
        const pastDue = buildingTasks.filter(t => normalizeStatus(t.Status) === "PAST_DUE").length;
        const escalated = buildingTasks.filter(t => normalizeStatus(t.Status) === "ESCALATED").length;

        return {
          name,
          taskCount: buildingTasks.length,
          generatorCount: generators,
          urgent,
          pastDue,
          escalated,
        };
      })
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [tasks]);

  if (!acct) return null;

  return (
    <div className="space-y-5">
      <Card>
        <CardHeader
          title="Buildings"
          subtitle={`${buildings.length} building${buildings.length !== 1 ? "s" : ""} • ${tasks.length} total tasks`}
          right={
            <Button variant="ghost" onClick={() => nav("/")}>
              Back to Dashboard <ArrowRight size={16} />
            </Button>
          }
        />
      </Card>

      {buildings.length === 0 ? (
        <Card>
          <div className="p-8 text-center text-sm text-slate-500">
            No buildings yet. Upload a brain file to get started.
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {buildings.map((building) => (
            <button
              key={building.name}
              onClick={() => nav(`/buildings/${encodeURIComponent(building.name)}`)}
              className="text-left"
            >
              <Card className="h-full hover:shadow-lg transition">
                <div className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="grid h-10 w-10 place-items-center rounded-xl bg-slate-900 text-white">
                      <Building2 size={18} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-lg font-extrabold text-slate-900 truncate">
                        {building.name}
                      </div>
                      <div className="text-xs text-slate-500 mt-1">
                        {building.generatorCount} generator{building.generatorCount !== 1 ? "s" : ""}
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-600">Tasks:</span>
                      <span className="font-extrabold text-slate-900">{building.taskCount}</span>
                    </div>

                    <div className="flex flex-wrap gap-2 mt-3">
                      {building.urgent > 0 && (
                        <Pill tone="danger" className="text-[10px]">
                          {building.urgent} Urgent
                        </Pill>
                      )}
                      {building.pastDue > 0 && (
                        <Pill tone="warn" className="text-[10px]">
                          {building.pastDue} Past Due
                        </Pill>
                      )}
                      {building.escalated > 0 && (
                        <Pill tone="danger" className="text-[10px]">
                          {building.escalated} Escalated
                        </Pill>
                      )}
                      {building.urgent === 0 && building.pastDue === 0 && building.escalated === 0 && (
                        <Pill tone="neutral" className="text-[10px]">
                          All clear
                        </Pill>
                      )}
                    </div>
                  </div>

                  <div className="mt-4 text-xs text-slate-500">
                    Click to view generators →
                  </div>
                </div>
              </Card>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
