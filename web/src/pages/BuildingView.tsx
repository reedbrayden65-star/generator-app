import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import type { TaskRow } from "../data/mockTasks";
import { subscribe } from "../data/taskStore";
import { getTeamTasks } from "../data/teamStore";
import { getCurrentAccount } from "../data/authStore";
import { generatorWorstStatus, statusColor } from "../utils/status";
import { ArrowLeft, ZoomIn, ZoomOut, Maximize2 } from "lucide-react";
import { Card, CardHeader, Button, Pill } from "../components/ui";
import { defaultLayout } from "../data/generatorLayout";
import type { GenBox } from "../data/generatorLayout"; // ✅ type-only import

type GenSummary = {
  genId: string;
  genName: string;
  worst: string;
  color: string;
};

export default function BuildingView() {
  const { buildingId } = useParams();
  const nav = useNavigate();
  const acct = getCurrentAccount();

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

  const tasks = allTasks.filter(
    (t) => t.BuildingID === buildingId && t.Status !== "Completed"
  );

  const generators: GenSummary[] = useMemo(() => {
    // Get unique generators from tasks
    const genMap = new Map<string, string>();
    for (const t of tasks) {
      if (!genMap.has(t.GeneratorID)) {
        genMap.set(t.GeneratorID, t.GeneratorName || t.GeneratorID);
      }
    }

    return Array.from(genMap.entries()).map(([genId, genName]) => {
      const genTasks = tasks.filter((t) => t.GeneratorID === genId);
      const worst = generatorWorstStatus(genTasks);
      return {
        genId,
        genName,
        worst,
        color: statusColor(worst),
      };
    });
  }, [tasks]);

  const genMap = useMemo(() => {
    const m = new Map<string, GenSummary>();
    generators.forEach((g) => m.set(g.genId, g));
    return m;
  }, [generators]);

  const buildingName =
    tasks.find((t) => t.BuildingName)?.BuildingName ?? buildingId ?? "Building";

  // --- zoom/pan state ---
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });

  const zoomIn = () => setZoom((z) => Math.min(2.2, +(z + 0.15).toFixed(2)));
  const zoomOut = () => setZoom((z) => Math.max(0.7, +(z - 0.15).toFixed(2)));
  const resetView = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  // drag-to-pan
  const [dragging, setDragging] = useState(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(
    null
  );

  function onPointerDown(e: React.PointerEvent) {
    setDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  }
  function onPointerMove(e: React.PointerEvent) {
    if (!dragging || !dragStart) return;
    setPan({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
  }
  function onPointerUp() {
    setDragging(false);
    setDragStart(null);
  }

  return (
    <Card className="overflow-hidden">
      <CardHeader
        title={buildingName}
        subtitle="Interactive overhead map (SVG placeholder)"
        right={
          <div className="flex items-center gap-2">
            <Button onClick={() => nav("/")} variant="ghost">
              <ArrowLeft size={16} /> Back
            </Button>
            <Button onClick={zoomOut} variant="ghost" title="Zoom out">
              <ZoomOut size={16} />
            </Button>
            <Button onClick={zoomIn} variant="ghost" title="Zoom in">
              <ZoomIn size={16} />
            </Button>
            <Button onClick={resetView} variant="ghost" title="Reset view">
              <Maximize2 size={16} />
            </Button>
          </div>
        }
      />

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-100 bg-white px-4 py-3 text-xs font-semibold text-slate-600">
        <Legend label="Current" color={statusColor("Current")} />
        <Legend label="Upcoming" color={statusColor("Upcoming")} />
        <Legend label="Past Due" color={statusColor("PastDue")} />
        <Legend label="Urgent" color={statusColor("Urgent")} />
        <Legend label="Escalated" color={statusColor("Escalated")} />
        <div className="ml-auto text-[11px] text-slate-500">
          Drag to pan • Click a generator
        </div>
      </div>

      {/* Overhead Map */}
      <div className="relative bg-slate-50">
        <svg
          viewBox="0 0 1000 420"
          className="h-[72vh] w-full touch-none select-none"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerLeave={onPointerUp}
          style={{ cursor: dragging ? "grabbing" : "grab" }}
        >
          {/* Background floorplate */}
          <defs>
            <linearGradient id="bg" x1="0" x2="1">
              <stop offset="0%" stopColor="#f8fafc" />
              <stop offset="100%" stopColor="#eef2f7" />
            </linearGradient>
          </defs>

          <rect x="0" y="0" width="1000" height="420" fill="url(#bg)" />

          {/* main building outline placeholder */}
          <rect
            x="25"
            y="25"
            width="950"
            height="370"
            rx="24"
            fill="#ffffff"
            stroke="#e2e8f0"
            strokeWidth="2"
          />

          {/* subtle grid / lanes */}
          {Array.from({ length: 8 }).map((_, i) => (
            <line
              key={i}
              x1={60 + i * 115}
              y1={55}
              x2={60 + i * 115}
              y2={365}
              stroke="#f1f5f9"
              strokeWidth="2"
            />
          ))}
          {Array.from({ length: 3 }).map((_, i) => (
            <line
              key={i}
              x1={50}
              y1={90 + i * 110}
              x2={950}
              y2={90 + i * 110}
              stroke="#f1f5f9"
              strokeWidth="2"
            />
          ))}

          {/* transform group = pan/zoom */}
          <g transform={`translate(${pan.x} ${pan.y}) scale(${zoom})`}>
            {generators.map((gen, idx) => {
              // Create a simple box layout for each generator
              const cols = 9;
              const startX = 40;
              const startY = 80;
              const gapX = 14;
              const gapY = 20;
              const w = 86;
              const h = 68;
              
              const col = idx % cols;
              const row = Math.floor(idx / cols);
              
              const box = {
                id: gen.genId,
                x: startX + col * (w + gapX),
                y: startY + row * (h + gapY),
                w,
                h,
              };

              return (
                <GenBoxSvg
                  key={gen.genId}
                  box={box}
                  worst={gen.worst}
                  color={gen.color}
                  name={gen.genName}
                  onClick={() => nav(`/generators/${encodeURIComponent(buildingId || "")}|||${encodeURIComponent(gen.genId || "")}`)}
                />
              );
            })}
          </g>
        </svg>

        {/* floating hint */}
        <div className="pointer-events-none absolute left-4 top-4 rounded-2xl border border-slate-200 bg-white/90 px-3 py-2 text-xs font-semibold text-slate-700 shadow-sm backdrop-blur">
          Placeholder layout. Send your building image and I’ll map exact positions.
        </div>
      </div>
    </Card>
  );
}

/* ----------------- SVG parts ----------------- */

function GenBoxSvg({
  box,
  worst,
  color,
  name,
  onClick,
}: {
  box: GenBox;
  worst: string;
  color: string;
  name: string;
  onClick: () => void;
}) {
  return (
    <g onClick={onClick} style={{ cursor: "pointer" }}>
      {/* glow */}
      <rect
        x={box.x - 3}
        y={box.y - 3}
        width={box.w + 6}
        height={box.h + 6}
        rx="18"
        fill={`${color}22`}
      />

      {/* main tile */}
      <rect
        x={box.x}
        y={box.y}
        width={box.w}
        height={box.h}
        rx="16"
        fill="#0b1220"
        stroke="#e2e8f0"
        strokeWidth="1.5"
      />

      {/* status bar */}
      <rect
        x={box.x}
        y={box.y + box.h - 8}
        width={box.w}
        height={8}
        fill={color}
      />

      {/* label */}
      <text
        x={box.x + 10}
        y={box.y + 24}
        fill="#e2e8f0"
        fontSize="12"
        fontWeight="700"
      >
        {box.id}
      </text>
      <text
        x={box.x + 10}
        y={box.y + 42}
        fill="#94a3b8"
        fontSize="11"
        fontWeight="600"
      >
        {name}
      </text>

      {/* worst pill */}
      <rect
        x={box.x + 10}
        y={box.y + 48}
        width={box.w - 20}
        height={16}
        rx="8"
        fill={`${color}22`}
      />
      <text
        x={box.x + box.w / 2}
        y={box.y + 60}
        fill={color}
        fontSize="10"
        fontWeight="800"
        textAnchor="middle"
      >
        {worst.toUpperCase()}
      </text>
    </g>
  );
}

/* ----------------- legend ----------------- */
function Legend({ label, color }: { label: string; color: string }) {
  return (
    <div className="inline-flex items-center gap-2 rounded-full bg-slate-50 px-2 py-1">
      <span className="h-2.5 w-2.5 rounded-full" style={{ background: color }} />
      {label}
      <Pill className="ml-1">{label.split(" ")[0]}</Pill>
    </div>
  );
}
