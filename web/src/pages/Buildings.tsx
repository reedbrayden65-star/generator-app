import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Building2, ArrowLeft, Zap, ClipboardList, Search, ArrowRight } from "lucide-react";
import { Card, CardHeader, Button, Pill, Input } from "../components/ui";
import { getBuildings, subscribe } from "../data/dataStore";
import type { Building } from "../data/types";

export default function BuildingsPage() {
  const nav = useNavigate();
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const update = () => setBuildings(getBuildings());
    update();
    return subscribe(update);
  }, []);

  const filtered = buildings.filter(b => 
    b.name.toLowerCase().includes(search.toLowerCase()) ||
    b.campus.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-5">
      <Card>
        <CardHeader
          title="Buildings"
          subtitle={`${buildings.length} building${buildings.length !== 1 ? "s" : ""}`}
          icon={<Building2 size={16} />}
          right={
            <Button variant="ghost" onClick={() => nav("/")}>
              <ArrowLeft size={14} /> Dashboard
            </Button>
          }
        />
        <div className="p-4 border-t border-slate-700/40">
          <Input
            placeholder="Search buildings..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            icon={<Search size={16} />}
          />
        </div>
      </Card>

      {filtered.length === 0 ? (
        <Card>
          <div className="p-12 text-center">
            <Building2 size={48} className="mx-auto text-slate-600 mb-4" />
            <div className="text-lg font-bold text-white mb-2">No Buildings Found</div>
            <div className="text-sm text-slate-400">
              {buildings.length === 0 
                ? "Upload generator and work order data to get started."
                : "No buildings match your search."}
            </div>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((building) => (
            <button
              key={building.id}
              onClick={() => nav(`/buildings/${encodeURIComponent(building.name)}`)}
              className="text-left group"
            >
              <Card className="h-full transition-all duration-300 hover:border-blue-500/50 hover:shadow-xl hover:shadow-blue-500/10 hover:scale-[1.02]">
                <div className="p-5">
                  <div className="flex items-start gap-4 mb-4">
                    <div className="relative grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-blue-500/25 to-blue-600/15 text-blue-400 shadow-lg shadow-blue-500/20 group-hover:shadow-blue-500/40 transition-all">
                      <Building2 size={24} />
                      <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-lg font-black text-white truncate group-hover:text-blue-400 transition-colors">
                        {building.name}
                      </div>
                      <div className="text-xs text-slate-400 mt-1.5 flex items-center gap-3">
                        <span className="flex items-center gap-1.5">
                          <Zap size={12} className="text-purple-400" />
                          {building.generatorCount} gens
                        </span>
                        <span className="flex items-center gap-1.5">
                          <ClipboardList size={12} className="text-blue-400" />
                          {building.workOrderCount} WOs
                        </span>
                      </div>
                    </div>
                    <ArrowRight size={16} className="text-slate-600 group-hover:text-blue-400 group-hover:translate-x-1 transition-all mt-1" />
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {building.openCount > 0 && (
                      <Pill tone="success">{building.openCount} Open</Pill>
                    )}
                    {building.onHoldCount > 0 && (
                      <Pill tone="warn">{building.onHoldCount} Hold</Pill>
                    )}
                    {building.completedCount > 0 && (
                      <Pill tone="info">{building.completedCount} Done</Pill>
                    )}
                    {building.workOrderCount === 0 && (
                      <Pill tone="success">All Clear ✓</Pill>
                    )}
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
