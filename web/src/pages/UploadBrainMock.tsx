import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getCurrentAccount, signOut } from "../data/authStore";
import {
  generateMockBrainForTeam,
  getTeamByCode,
  markTeamBrainUploaded,
  saveTeamTasks,
  getTeamTasks,
} from "../data/teamStore";
import { resetToMockTasks, addTasks } from "../data/taskStore";
import { computeStatus } from "../utils/status";
import {
  UploadCloud,
  Building2,
  Zap,
  ClipboardList,
  ArrowRight,
  Sparkles,
  AlertTriangle,
} from "lucide-react";
import { Card, CardHeader, Button, Pill } from "../components/ui";

function UploadBrainMockPage() {
  const nav = useNavigate();
  const acct = getCurrentAccount();

  const [team, setTeam] = useState(
    acct?.teamCode ? getTeamByCode(acct.teamCode) : null
  );
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (!acct) {
      nav("/login");
      return;
    }

    // ✅ legacy account created before team codes existed
    if (!acct.teamCode) {
      setErr(
        "This account was created before team codes were added. Please log in again and select a team code."
      );
      return;
    }

    setTeam(getTeamByCode(acct.teamCode));
  }, [acct, nav]);

  function loadSampleBrain() {
    if (!acct?.teamCode) return;
    try {
      generateMockBrainForTeam(acct.teamCode);
      resetToMockTasks();
      setTeam(getTeamByCode(acct.teamCode));
    } catch (e: any) {
      setErr(e.message);
    }
  }

  function handleFileUpload(file: File | undefined) {
    if (!file || !acct?.teamCode) return;
    setErr(null);

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const text = e.target?.result as string;
        const lines = text.split("\n").filter((l) => l.trim());
        if (lines.length < 2) {
          setErr("File must have at least a header row and one data row.");
          return;
        }

        // Parse CSV with proper quote handling
        const headers = parseCSVLine(lines[0]).map((h) => h.toLowerCase().replace(/_/g, ""));
        const tasks: any[] = [];
        const taskIdSet = new Set<string>();

        for (let i = 1; i < lines.length; i++) {
          const values = parseCSVLine(lines[i]);
          if (values.length < 3) continue; // skip incomplete rows

          const row: any = {};
          headers.forEach((h, idx) => {
            row[h] = values[idx] || "";
          });

          // Handle new format: Campus, Building, UnitNumber, 3M_PM, 6M_PM, 12M_PM
          const campus = row.campus || "SBN";
          const building = row.building || row.buildingname || "Unknown";
          const unitNumber = row.unitnumber || row.generatorid || "Gen 1";
          
          // Create tasks for each PM type if dates exist
          const pmTypes = [
            { type: "3M_PM", date: row["3mpm"], window: row["3mcompliancewindow"] || 30 },
            { type: "6M_PM", date: row["6mpm"], window: row["6mcompliancewindow"] || 45 },
            { type: "12M_PM", date: row["12mpm"], window: row["12mcompliancewindow"] || 60 },
          ];

          for (const pm of pmTypes) {
            if (!pm.date) continue;

            let taskId = `${acct.teamCode}-${building}-${unitNumber}-${pm.type}-${i}`;
            let counter = 1;
            while (taskIdSet.has(taskId)) {
              taskId = `${acct.teamCode}-${building}-${unitNumber}-${pm.type}-${i}-${counter}`;
              counter++;
            }
            taskIdSet.add(taskId);

            // Parse date and compute status
            const parsedDate = new Date(pm.date);
            const isoDate = parsedDate.toISOString().split("T")[0];
            const status = computeStatus(isoDate, parseInt(pm.window) || 30);

            tasks.push({
              TaskID: taskId,
              BuildingName: `${campus}-${building}`,
              BuildingID: `${campus}-${building}`,
              GeneratorID: unitNumber,
              GeneratorName: unitNumber,
              TaskTitle: `${pm.type.replace("_", " ")} - ${unitNumber}`,
              TaskDescription: `Preventive maintenance for ${unitNumber} in Building ${building}`,
              TaskType: pm.type,
              DueDate: isoDate,
              ComplianceWindow: pm.window,
              Status: status,
              AssignedToUserID: null,
              AssignedToUserName: null,
              ClaimedByUserID: null,
              ClaimedByUserName: null,
              SIMTicketNumber: null,
              SIMTicketLink: null,
              CommentsJSON: null,
              RecurrenceType: pm.type === "3M_PM" ? "MONTHLY" : pm.type === "6M_PM" ? "MONTHLY" : "YEARLY",
              RecurrenceInterval: pm.type === "3M_PM" ? 3 : pm.type === "6M_PM" ? 6 : 12,
              RecurrenceEndDate: null,
              TeamCode: acct.teamCode,
            });
          }
        }

        if (tasks.length === 0) {
          setErr("No valid tasks found in file.");
          return;
        }

        // Debug: log a sample task status
        console.log("Sample task:", tasks[0]?.TaskTitle, tasks[0]?.DueDate, tasks[0]?.Status);

        // Replace all tasks (don't append)
        saveTeamTasks(acct.teamCode, tasks);

        // Clear global store and add new tasks
        resetToMockTasks();
        await addTasks(tasks);

        // Mark team as uploaded
        markTeamBrainUploaded(acct.teamCode);

        setTeam(getTeamByCode(acct.teamCode));
        
        // Log for debugging
        console.log("Tasks saved:", tasks.length, "tasks");
        console.log("Sample task:", tasks[0]);
        
        setErr(null);
      } catch (e: any) {
        setErr(`Failed to parse file: ${e.message}`);
      }
    };

    reader.onerror = () => {
      setErr("Failed to read file.");
    };

    reader.readAsText(file);
  }

  // Helper function to parse CSV line with quote support
  function parseCSVLine(line: string): string[] {
    const result: string[] = [];
    let current = "";
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      const nextChar = line[i + 1];

      if (char === '"') {
        if (inQuotes && nextChar === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === "," && !inQuotes) {
        result.push(current.trim());
        current = "";
      } else {
        current += char;
      }
    }

    result.push(current.trim());
    return result;
  }

  if (!acct) return null;

  if (!acct.teamCode) {
    return (
      <div className="mx-auto max-w-2xl space-y-4">
        <Card>
          <CardHeader title="Team Setup" subtitle="Team code required" />
          <div className="px-4 pb-5 space-y-3">
            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
              <div className="flex items-center gap-2 font-extrabold">
                <AlertTriangle size={16} />
                Legacy account detected
              </div>
              <div className="mt-1 text-xs text-amber-800">
                You need to re-log in with a team code.
              </div>
            </div>

            <Button
              onClick={() => {
                signOut();
                nav("/login");
              }}
              className="w-full"
            >
              Go to Login
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  const brainUploaded = team?.brainUploaded;

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <Card>
        <CardHeader
          title="Team Setup"
          subtitle={`Team: ${acct.teamCode}`}
          right={
            brainUploaded ? (
              <Button onClick={() => nav("/")}>
                Go to Dashboard <ArrowRight size={16} />
              </Button>
            ) : null
          }
        />

        <div className="space-y-4 px-4 pb-5">


          {brainUploaded && (
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5 mb-4">
              <div className="flex items-center gap-2 text-lg font-extrabold text-emerald-900">
                ✅ Data uploaded
              </div>
              <div className="mt-1 text-sm text-emerald-800">
                Your dashboard is populated. Upload again to replace data.
              </div>
            </div>
          )}

          {/* Always show upload option */}
          <div className="rounded-2xl border border-slate-700 bg-slate-800 p-5">
            <div className="flex items-center gap-2 text-lg font-extrabold text-white">
              <UploadCloud size={18} />
              Upload Generator Data
            </div>
            <div className="mt-1 text-sm text-slate-400">
              Upload your CSV file with generator PM schedules.
            </div>

            {err && (
              <div className="mt-3 rounded-xl border border-red-900 bg-red-950 px-3 py-2 text-sm font-semibold text-red-200">
                {err}
              </div>
            )}

            <div className="mt-4">
              <input
                type="file"
                accept=".csv"
                onChange={(e) => handleFileUpload(e.target.files?.[0])}
                className="w-full rounded-xl border border-slate-600 bg-slate-900 px-3 py-2 text-sm font-semibold text-white outline-none focus:border-blue-500 file:mr-3 file:rounded-lg file:border-0 file:bg-blue-600 file:px-3 file:py-1 file:text-sm file:font-semibold file:text-white hover:file:bg-blue-500"
              />
              <div className="mt-2 text-[11px] text-slate-500">
                Expected: Campus, Building, UnitNumber, 3M_PM, 3M_ComplianceWindow, 6M_PM, 6M_ComplianceWindow, 12M_PM, 12M_ComplianceWindow
              </div>
            </div>

            <div className="mt-4 flex gap-2">
              <Button onClick={loadSampleBrain} variant="ghost">
                Load Sample Data
              </Button>
              <Button onClick={() => nav("/buildings")}>
                View Buildings
              </Button>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}

function Stat({ icon: Icon, label, value }: any) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
        <Icon size={14} />
        {label}
      </div>
      <div className="mt-1 text-2xl font-extrabold text-slate-900">{value}</div>
    </div>
  );
}

export default UploadBrainMockPage;
export { UploadBrainMockPage as UploadBrainMock };
