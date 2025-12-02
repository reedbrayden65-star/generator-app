import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import { getCurrentAccount } from "../data/authStore";
import { getTeamByCode, getTeamTasks } from "../data/teamStore";

// namespace imports so missing named exports never crash
import * as taskStore from "../data/taskStore";
import * as userStore from "../data/userStore";

import {
  UploadCloud,
  Sparkles,
  Building2,
  Zap,
  ClipboardList,
  ArrowRight,
  Siren,
  Flame,
  Layers,
} from "lucide-react";

import { Card, CardHeader, Button, Pill } from "../components/ui";

type AnyTask = any;

export default function Dashboard() {
  const nav = useNavigate();
  const acct = getCurrentAccount();

  const [teamUploaded, setTeamUploaded] = useState<boolean | null>(null);
  const [tasks, setTasks] = useState<AnyTask[]>([]);
  const [me, setMe] = useState<any>(null);



  useEffect(() => {
    if (!acct) {
      nav("/login");
      return;
    }

    // team readiness
    const team = getTeamByCode(acct.teamCode);
    setTeamUploaded(!!team?.brainUploaded);

    // ---- tasks: load team-specific tasks ----
    const teamTasks = getTeamTasks(acct.teamCode);
    setTasks(teamTasks);

    // subscribe to global task changes
    const sT: any = taskStore;
    let unsubTask: any;
    if (typeof sT.subscribe === "function") unsubTask = sT.subscribe(() => {
      // When tasks change globally, reload team tasks
      const updated = getTeamTasks(acct.teamCode);
      setTasks(updated);
    });

    // ---- user: hydrate + subscribe safely ----
    const sU: any = userStore;

    try {
      if (typeof sU.getCurrentUser === "function") setMe(sU.getCurrentUser());
      else if (typeof sU.getUser === "function") setMe(sU.getUser());
      else if (sU.currentUser) setMe(sU.currentUser);
    } catch {
      setMe(null);
    }

    let unsubUser: any;
    if (typeof sU.subscribeUser === "function") unsubUser = sU.subscribeUser(setMe);
    else if (typeof sU.subscribe === "function") unsubUser = sU.subscribe(setMe);
    else if (typeof sU.onChange === "function") unsubUser = sU.onChange(setMe);

    return () => {
      unsubTask?.();
      unsubUser?.();
    };
  }, [acct, nav]);

  // ✅ All hooks must be called unconditionally, before any early returns
  const stats = useMemo(() => {
    const s = {
      total: tasks.length,
      current: 0,
      upcoming: 0,
      pastDue: 0,
      urgent: 0,
      escalated: 0,
      completed: 0,
    };

    for (const t of tasks) {
      const st = normalizeStatus(t.Status);
      if (st === "CURRENT") s.current++;
      if (st === "UPCOMING") s.upcoming++;
      if (st === "PAST_DUE") s.pastDue++;
      if (st === "URGENT") s.urgent++;
      if (st === "ESCALATED") s.escalated++;
      if (st === "COMPLETED") s.completed++;
    }

    return s;
  }, [tasks]);

  const myAssigned = useMemo(() => {
    const myName = me?.name;
    const myId = me?.id;
    return tasks.filter((t) =>
      t.AssignedTo === myId ||
      t.AssignedTo === myName ||
      t.ClaimedBy === myId ||
      t.ClaimedBy === myName
    );
  }, [tasks, me]);

  const escalated = useMemo(
    () => tasks.filter((t) => normalizeStatus(t.Status) === "ESCALATED"),
    [tasks]
  );

  const completed = useMemo(
    () => tasks.filter((t) => normalizeStatus(t.Status) === "COMPLETED"),
    [tasks]
  );

  const hotList = useMemo(() => {
    const list = tasks.filter((t) => {
      const st = normalizeStatus(t.Status);
      return st === "UPCOMING" || st === "PAST_DUE" || st === "URGENT";
    });
    return list.slice(0, 6);
  }, [tasks]);

  // ✅ Early returns AFTER all hooks
  if (teamUploaded === null) {
    return (
      <div className="mx-auto max-w-3xl">
        <Card>
          <div className="p-8 text-sm text-slate-500">
            Loading dashboard…
          </div>
        </Card>
      </div>
    );
  }

  if (acct && !teamUploaded) {
    return (
      <div className="mx-auto max-w-4xl space-y-4">
        <Card>
          <CardHeader title="Dashboard" subtitle={`Team: ${acct.teamCode}`} />
          <div className="px-4 pb-5">
            <div className="rounded-3xl border border-slate-200 bg-gradient-to-br from-slate-50 to-white p-6 shadow-sm">
              <div className="flex items-center gap-3 text-xl font-extrabold text-slate-900">
                <div className="grid h-10 w-10 place-items-center rounded-2xl bg-slate-900 text-white">
                  <Sparkles size={18} />
                </div>
                Your team is empty
              </div>

              <div className="mt-2 text-sm text-slate-600">
                No buildings, generators, or tasks yet.
                <br />
                A Chief needs to upload the Excel brain to populate everything.
              </div>

              <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-3">
                <Stat icon={Building2} label="Buildings" value="0" />
                <Stat icon={Zap} label="Generators" value="0" />
                <Stat icon={ClipboardList} label="Tasks" value="0" />
              </div>

              <div className="mt-6 flex flex-col gap-2 md:flex-row">
                <Button onClick={() => nav("/upload-brain")} className="flex-1">
                  <UploadCloud size={16} />
                  Upload Team Brain
                </Button>

                <Button variant="ghost" onClick={() => nav("/assignments")}>
                  View My Assignments
                  <ArrowRight size={16} />
                </Button>
              </div>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* KEY STATS + QUICK ACTIONS */}
      <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
        <HeroStat label="My Tasks" value={myAssigned.length} icon={ClipboardList} onClick={() => nav("/assignments")} />
        <HeroStat label="Urgent" value={stats.urgent} icon={Flame} tone="danger" onClick={() => nav("/assignments")} />
        <HeroStat label="Escalated" value={stats.escalated} icon={Siren} tone="danger" onClick={() => nav("/escalations")} />
        <HeroStat label="Total" value={stats.total} icon={Layers} tone="neutral" onClick={() => nav("/")} />
      </div>

      {/* LOWER PANELS */}
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <Panel
          title="My Assignments"
          count={myAssigned.length}
          button="View all"
          onButton={() => nav("/assignments")}
          items={myAssigned}
          empty="No assignments yet."
          onOpen={(t: AnyTask) => nav(`/generators/${encodeURIComponent(t.GeneratorID)}`)}
        />

        <Panel
          title="Escalations"
          count={escalated.length}
          button="Open queue"
          onButton={() => nav("/escalations")}
          items={escalated}
          empty="No escalations right now."
          tone="danger"
          onOpen={(t: AnyTask) => nav(`/generators/${encodeURIComponent(t.GeneratorID)}`)}
        />

        <Panel
          title="Recently Completed"
          count={completed.length}
          button="View log"
          onButton={() => nav("/completed")}
          items={completed}
          empty="Nothing completed yet."
          tone="success"
          onOpen={(t: AnyTask) => nav(`/generators/${encodeURIComponent(t.GeneratorID)}`)}
        />
      </div>

      {/* HOT LIST */}
      <Card>
        <CardHeader title="Hot List" subtitle="Upcoming / Past Due / Urgent" />
        <div className="px-4 pb-4 grid grid-cols-1 gap-2 md:grid-cols-2 xl:grid-cols-3">
          {hotList.map((t) => (
            <HotTaskCard
              key={t.TaskID}
              t={t}
              onClick={() => nav(`/generators/${encodeURIComponent(t.GeneratorID)}`)}
            />
          ))}
          {hotList.length === 0 && (
            <div className="text-sm text-slate-500 px-2 py-4">Nothing hot right now.</div>
          )}
        </div>
      </Card>
    </div>
  );
}

/* ---------- Helpers ---------- */

function normalizeStatus(raw: any) {
  const s = String(raw || "").toLowerCase();
  if (s.includes("urgent")) return "URGENT";
  if (s.includes("past")) return "PAST_DUE";
  if (s.includes("upcoming")) return "UPCOMING";
  if (s.includes("escalat")) return "ESCALATED";
  if (s.includes("complete")) return "COMPLETED";
  return "CURRENT";
}

function prettyStatus(k: string) {
  switch (k) {
    case "PAST_DUE": return "Past Due";
    default: return k[0] + k.slice(1).toLowerCase();
  }
}

function Stat({ icon: Icon, label, value }: any) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
        <Icon size={14} /> {label}
      </div>
      <div className="mt-1 text-2xl font-extrabold text-slate-900">{value}</div>
    </div>
  );
}

function HeroStat({ label, value, icon: Icon, tone="neutral", onClick }: any) {
  const toneClass =
    tone === "warning" ? "bg-amber-50 border-amber-200 text-amber-900" :
    tone === "orange" ? "bg-orange-50 border-orange-200 text-orange-900" :
    tone === "danger" ? "bg-rose-50 border-rose-200 text-rose-900" :
    "bg-white border-slate-200 text-slate-900";

  return (
    <button onClick={onClick} className={`rounded-2xl border p-4 text-left shadow-sm transition hover:shadow-md ${toneClass}`}>
      <div className="flex items-center justify-between">
        <div className="text-xs font-bold opacity-70">{label}</div>
        <Icon size={16} className="opacity-70" />
      </div>
      <div className="mt-1 text-2xl font-extrabold">{value}</div>
    </button>
  );
}

function MiniTaskRow({ t, onClick, tone="neutral" }: any) {
  const st = normalizeStatus(t.Status);
  const pillTone =
    tone === "danger" ? "danger" :
    tone === "success" ? "success" :
    st === "URGENT" ? "danger" :
    st === "PAST_DUE" ? "danger" :
    st === "UPCOMING" ? "warn" :
    st === "ESCALATED" ? "danger" :
    st === "COMPLETED" ? "success" :
    "neutral";

  return (
    <button onClick={onClick} className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-left hover:bg-slate-50">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="truncate text-sm font-extrabold text-slate-900">
            {t.TaskTitle ?? t.Title ?? "Task"}
          </div>
          <div className="truncate text-xs text-slate-500">
            {t.BuildingName} • {t.GeneratorID}
          </div>
        </div>
        <Pill tone={pillTone}>{prettyStatus(st)}</Pill>
      </div>
    </button>
  );
}

function HotTaskCard({ t, onClick }: any) {
  const st = normalizeStatus(t.Status);
  const tone =
    st === "URGENT" ? "danger" :
    st === "PAST_DUE" ? "danger" :
    st === "UPCOMING" ? "warn" :
    "neutral";

  return (
    <button onClick={onClick} className="cursor-pointer text-left">
      <Card className="h-full">
        <div className="p-4 space-y-2">
          <div className="flex items-center justify-between">
            <div className="text-sm font-extrabold text-slate-900 truncate">
              {t.TaskTitle ?? t.Title ?? "Task"}
            </div>
            <Pill tone={tone}>{prettyStatus(st)}</Pill>
          </div>
          <div className="text-xs text-slate-600">
            {t.BuildingName} • {t.GeneratorID}
          </div>
          {t.DueDate && (
            <div className="text-xs text-slate-500">
              Due: <span className="font-bold">{t.DueDate}</span>
            </div>
          )}
        </div>
      </Card>
    </button>
  );
}

function EmptyNote({ text }: { text: string }) {
  return (
    <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-3 py-3 text-sm text-slate-500">
      {text}
    </div>
  );
}

function Panel({
  title,
  count,
  button,
  onButton,
  items,
  empty,
  tone,
  onOpen,
}: any) {
  return (
    <Card>
      <CardHeader
        title={title}
        subtitle={`${count} tasks`}
        right={
          <Button variant="ghost" onClick={onButton}>
            {button} <ArrowRight size={16} />
          </Button>
        }
      />
      <div className="px-4 pb-4 space-y-2">
        {items.slice(0, 5).map((t: AnyTask) => (
          <MiniTaskRow
            key={t.TaskID}
            t={t}
            tone={tone}
            onClick={() => onOpen(t)}
          />
        ))}
        {items.length === 0 && <EmptyNote text={empty} />}
      </div>
    </Card>
  );
}
