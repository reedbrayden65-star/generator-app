import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  UploadCloud,
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
  Trash2,
  Building2,
  Zap,
  ClipboardList,
  ArrowRight,
  Upload,
} from "lucide-react";
import { Card, CardHeader, Button, Pill, StatCard } from "../components/ui";
import {
  getGenerators,
  getWorkOrders,
  getBuildings,
  importGenerators,
  importWorkOrders,
  clearAllData,
  subscribe,
} from "../data/dataStore";
import {
  parseGeneratorSheet,
  parseWorkOrderSheet,
  detectCSVType,
} from "../data/csvParser";
import { useEffect } from "react";

export default function UploadDataPage() {
  const nav = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [stats, setStats] = useState({
    buildings: 0,
    generators: 0,
    workOrders: 0,
  });

  useEffect(() => {
    const update = () => {
      setStats({
        buildings: getBuildings().length,
        generators: getGenerators().length,
        workOrders: getWorkOrders().length,
      });
    };
    update();
    return subscribe(update);
  }, []);

  function handleFileUpload(file: File | undefined) {
    if (!file) return;
    setError(null);
    setSuccess(null);

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const csvType = detectCSVType(text);

        if (csvType === "generators") {
          const generators = parseGeneratorSheet(text);
          if (generators.length === 0) {
            setError("No generators found in file. Check the format.");
            return;
          }
          importGenerators(generators);
          setSuccess(`Imported ${generators.length} generators from ${file.name}`);
        } else if (csvType === "workorders") {
          const workOrders = parseWorkOrderSheet(text);
          if (workOrders.length === 0) {
            setError("No work orders found in file. Check the format.");
            return;
          }
          importWorkOrders(workOrders);
          setSuccess(`Imported ${workOrders.length} work orders from ${file.name}`);
        } else {
          setError(
            "Could not detect file type. Expected either a Generator Info Sheet or Work Orders CSV."
          );
        }
      } catch (err: any) {
        setError(`Failed to parse file: ${err.message}`);
      }
    };

    reader.onerror = () => setError("Failed to read file.");
    reader.readAsText(file);
  }

  function handleClearData() {
    if (confirm("Are you sure you want to clear all data? This cannot be undone.")) {
      clearAllData();
      setSuccess("All data cleared.");
    }
  }

  return (
    <div className="space-y-5">
      <Card>
        <CardHeader
          title="Upload Data"
          subtitle="Import generator info and work orders from CSV files"
          icon={<Upload size={16} />}
        />

        <div className="p-6 space-y-6">
          {/* Current Stats */}
          <div className="grid grid-cols-3 gap-4">
            <StatCard icon={Building2} label="Buildings" value={stats.buildings} color="#3b82f6" />
            <StatCard icon={Zap} label="Generators" value={stats.generators} color="#8b5cf6" />
            <StatCard icon={ClipboardList} label="Work Orders" value={stats.workOrders} color="#10b981" />
          </div>

          {/* Upload Area */}
          <div className="relative rounded-2xl border-2 border-dashed border-slate-600/70 bg-gradient-to-br from-slate-800/40 to-slate-900/30 p-10 hover:border-blue-500/50 hover:bg-slate-800/50 transition-all group">
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="relative text-center">
              <div className="inline-flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500/20 to-blue-600/10 text-blue-400 mb-5 group-hover:scale-110 transition-transform">
                <UploadCloud size={36} />
              </div>
              <div className="text-xl font-black text-white mb-2">
                Drop CSV files here
              </div>
              <div className="text-sm text-slate-400 mb-6">
                or click to browse your files
              </div>
              <div className="flex justify-center gap-6 mb-8">
                <div className="flex items-center gap-2 text-sm text-slate-300 bg-slate-800/50 px-4 py-2 rounded-xl">
                  <FileSpreadsheet size={18} className="text-blue-400" />
                  Generator Info Sheet
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-300 bg-slate-800/50 px-4 py-2 rounded-xl">
                  <FileSpreadsheet size={18} className="text-emerald-400" />
                  Work Orders Sheet
                </div>
              </div>

              <input
                type="file"
                accept=".csv"
                multiple
                onChange={(e) => {
                  const files = e.target.files;
                  if (files) {
                    for (let i = 0; i < files.length; i++) {
                      handleFileUpload(files[i]);
                    }
                  }
                }}
                className="w-full max-w-md rounded-xl border border-slate-600/50 bg-slate-900/70 px-4 py-3 text-sm font-bold text-white outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 file:mr-4 file:rounded-xl file:border-0 file:bg-gradient-to-r file:from-blue-600 file:to-blue-500 file:px-5 file:py-2.5 file:text-sm file:font-bold file:text-white hover:file:from-blue-500 hover:file:to-blue-400 cursor-pointer transition-all"
              />
            </div>
          </div>

          {/* Messages */}
          {error && (
            <div className="flex items-center gap-3 rounded-xl border border-red-900 bg-red-950/50 px-4 py-3">
              <AlertTriangle size={20} className="text-red-400" />
              <span className="text-sm text-red-200">{error}</span>
            </div>
          )}

          {success && (
            <div className="flex items-center gap-3 rounded-xl border border-emerald-900 bg-emerald-950/50 px-4 py-3">
              <CheckCircle2 size={20} className="text-emerald-400" />
              <span className="text-sm text-emerald-200">{success}</span>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-between pt-5 border-t border-slate-700/50">
            <Button variant="danger" onClick={handleClearData}>
              <Trash2 size={14} />
              Clear All Data
            </Button>

            <div className="flex gap-3">
              <Button variant="ghost" onClick={() => nav("/buildings")}>
                View Buildings <ArrowRight size={14} />
              </Button>
              <Button onClick={() => nav("/")}>
                Go to Dashboard <ArrowRight size={14} />
              </Button>
            </div>
          </div>
        </div>
      </Card>

      {/* Format Help */}
      <Card>
        <CardHeader title="Expected CSV Formats" />
        <div className="p-5 space-y-4">
          <FormatHelp
            title="Generator Info Sheet"
            color="blue"
            columns={[
              "Campus",
              "Building",
              "Unit Number",
              "Asset ID",
              "Manufacturer",
              "Model",
              "Serial",
              "Size (KW)",
              "Run Hours",
              "Fuel Level %",
              "3M PM",
              "6M PM",
              "12M PM",
            ]}
          />
          <FormatHelp
            title="Work Orders Sheet"
            color="emerald"
            columns={[
              "Cluster",
              "Organization",
              "Work Order",
              "Description",
              "Equipment Category",
              "Compliance Start/End Date",
              "Status",
              "WO Type",
              "Equipment",
              "Priority",
              "SIM Ticket No",
              "FSB Number",
            ]}
          />
        </div>
      </Card>
    </div>
  );
}

function FormatHelp({
  title,
  color,
  columns,
}: {
  title: string;
  color: "blue" | "emerald";
  columns: string[];
}) {
  const borderColor = color === "blue" ? "border-blue-800" : "border-emerald-800";
  const bgColor = color === "blue" ? "bg-blue-950/30" : "bg-emerald-950/30";
  const textColor = color === "blue" ? "text-blue-400" : "text-emerald-400";

  return (
    <div className={`rounded-xl border ${borderColor} ${bgColor} p-4`}>
      <div className={`font-bold ${textColor} mb-2`}>{title}</div>
      <div className="flex flex-wrap gap-2">
        {columns.map((col) => (
          <Pill key={col}>{col}</Pill>
        ))}
      </div>
    </div>
  );
}
