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
        const headers = parseCSVLine(lines[0]).map((h) => h.toLowerCase());
        const tasks: any[] = [];
        const taskIdSet = new Set<string>();

        for (let i = 1; i < lines.length; i++) {
          const values = parseCSVLine(lines[i]);
          if (values.length < 3) continue; // skip incomplete rows

          const row: any = {};
          headers.forEach((h, idx) => {
            row[h] = values[idx] || "";
          });

          // Generate unique task ID
          let taskId = `${acct.teamCode}-${i}`;
          let counter = 1;
          while (taskIdSet.has(taskId)) {
            taskId = `${acct.teamCode}-${i}-${counter}`;
            counter++;
          }
          taskIdSet.add(taskId);

          const buildingName = row.buildingname || row.building || "Unknown";
          const generatorId = row.generatorid || row.generator || "GEN-" + i;

          tasks.push({
            TaskID: taskId,
            BuildingName: buildingName,
            BuildingID: buildingName, // Use building name as ID
            GeneratorID: generatorId,
            GeneratorName: generatorId,
            TaskTitle: row.tasktitle || row.title || "Task",
            TaskDescription: row.taskdescription || row.description || "",
            TaskType: row.tasktype || row.type || "Maintenance",
            DueDate: row.duedate || row.due || new Date().toISOString().split("T")[0],
            Status: row.status || "Current",
            AssignedToUserID: null,
            AssignedToUserName: null,
            ClaimedByUserID: null,
            ClaimedByUserName: null,
            SIMTicketNumber: row.simticketnumber || row.sim || null,
            SIMTicketLink: row.simticketlink || null,
            CommentsJSON: null,
            RecurrenceType: row.recurrencetype || null,
            RecurrenceInterval: row.recurrenceinterval ? parseInt(row.recurrenceinterval) : null,
            RecurrenceEndDate: row.recurrenceenddate || null,
            TeamCode: acct.teamCode,
          });
        }

        if (tasks.length === 0) {
          setErr("No valid tasks found in file.");
          return;
        }

        // Save tasks to team storage (shared across all team members)
        const existingTasks = getTeamTasks(acct.teamCode) || [];
        const allTasks = [...existingTasks, ...tasks];
        saveTeamTasks(acct.teamCode, allTasks);

        // Also add to global store for real-time updates
        await addTasks(tasks);

        // Mark team as uploaded
        markTeamBrainUploaded(acct.teamCode);

        setTeam(getTeamByCode(acct.teamCode));
        
        // Log for debugging
        console.log("Tasks saved:", allTasks.length, "tasks");
        console.log("Sample task:", allTasks[0]);
        
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
          {!brainUploaded && (
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
              <div className="flex items-center gap-2 text-lg font-extrabold text-slate-900">
                <Sparkles size={18} />
                Your team is empty right now
              </div>
              <div className="mt-1 text-sm text-slate-600">
                Upload your Excel brain to generate buildings, generators, and tasks.
                <br />
                (Mock mode: click the button below to load a sample brain.)
              </div>

              <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
                <Stat icon={Building2} label="Buildings" value="0" />
                <Stat icon={Zap} label="Generators" value="0" />
                <Stat icon={ClipboardList} label="Tasks" value="0" />
              </div>

              {err && (
                <div className="mt-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-900">
                  {err}
                </div>
              )}

              <div className="mt-5 space-y-3">
                <div>
                  <label className="mb-2 block text-xs font-extrabold text-slate-700">
                    Upload CSV or Excel file
                  </label>
                  <input
                    type="file"
                    accept=".csv,.xlsx,.xls"
                    onChange={(e) => handleFileUpload(e.target.files?.[0])}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-900 outline-none focus:border-slate-300"
                  />
                  <div className="mt-1 text-[11px] text-slate-500">
                    Expected columns: BuildingName, GeneratorID, TaskTitle, TaskDescription, TaskType, DueDate, Status
                  </div>
                </div>

                <div className="flex flex-col gap-2 md:flex-row">
                  <Button onClick={loadSampleBrain} variant="ghost" className="flex-1">
                    <UploadCloud size={16} />
                    Load Sample Brain (Demo)
                  </Button>
                  <Button variant="ghost" onClick={() => nav("/")}>
                    Skip for now
                  </Button>
                </div>
              </div>
            </div>
          )}

          {brainUploaded && (
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
              <div className="flex items-center gap-2 text-lg font-extrabold text-emerald-900">
                ✅ Brain uploaded
              </div>
              <div className="mt-1 text-sm text-emerald-800">
                Your dashboard is now populated.
                <br />
                (In real mode this will come from your Excel file.)
              </div>

              <div className="mt-3 flex flex-wrap gap-2">
                <Pill tone="success">7 Buildings</Pill>
                <Pill tone="success">27 Generators / building</Pill>
                <Pill tone="success">Sample Tasks Loaded</Pill>
              </div>

              <div className="mt-4">
                <Button onClick={() => nav("/")}>
                  Go to Dashboard <ArrowRight size={16} />
                </Button>
              </div>
            </div>
          )}
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
