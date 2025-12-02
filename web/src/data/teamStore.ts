// src/data/teamStore.ts
import { mockTasks } from "./mockTasks";
import type { TaskRow } from "./mockTasks";

export type Team = {
  id: string;
  code: string;
  name: string;
  brainUploaded: boolean;
  createdAtISO: string;
};

type TeamState = {
  teams: Team[];
};

const STORAGE_KEY = "generatorApp.teams.v2";

function loadState(): TeamState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as TeamState;
  } catch {}

  return {
    teams: [
      {
        id: "team_default",
        code: "SBN-OPS",
        name: "SBN Ops Default Team",
        brainUploaded: true,
        createdAtISO: new Date().toISOString(),
      },
      {
        id: "team_test",
        code: "SBN-TEST",
        name: "SBN Test Team",
        brainUploaded: false,
        createdAtISO: new Date().toISOString(),
      },
    ],
  };
}

let state: TeamState = loadState();
const listeners = new Set<(s: TeamState) => void>();

function persist() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {}
}

function notify() {
  persist();
  for (const l of listeners) l(state);
}

/* ---------------- Public API ---------------- */

export function subscribeTeams(listener: (s: TeamState) => void) {
  listeners.add(listener);
  listener(state);
  return () => listeners.delete(listener);
}

export function getTeams() {
  return state.teams;
}

/**
 * ✅ SAFE now: accepts undefined/null
 */
export function getTeamByCode(code?: string | null) {
  if (!code) return null; // <-- fixes your crash
  const c = code.trim().toUpperCase();
  if (!c) return null;
  return state.teams.find((t) => t.code === c) || null;
}

export function createTeam(code: string, name?: string): Team {
  const c = code.trim().toUpperCase();
  if (!c) throw new Error("Team code required.");
  if (getTeamByCode(c)) throw new Error("Team code already exists.");

  const team: Team = {
    id: `team_${Math.random().toString(36).slice(2)}`,
    code: c,
    name: name || c,
    brainUploaded: false,
    createdAtISO: new Date().toISOString(),
  };

  state = { ...state, teams: [...state.teams, team] };
  notify();
  return team;
}

export function markTeamBrainUploaded(teamCode: string) {
  const c = teamCode.trim().toUpperCase();
  state = {
    ...state,
    teams: state.teams.map((t) =>
      t.code === c ? { ...t, brainUploaded: true } : t
    ),
  };
  notify();
}

export function generateMockBrainForTeam(teamCode: string): TaskRow[] {
  const c = teamCode.trim().toUpperCase();
  const team = getTeamByCode(c);
  if (!team) throw new Error("Team not found.");

  markTeamBrainUploaded(c);

  return mockTasks.map((t) => ({
    ...t,
    TeamCode: c,
    TaskID: `${c}-${t.TaskID}`,
    BuildingName: t.BuildingName,
    GeneratorID: t.GeneratorID,
  })) as any;
}

/**
 * ✅ Get tasks for a specific team
 * This allows team-wide data sharing
 */
export function getTeamTasks(teamCode?: string | null): TaskRow[] {
  if (!teamCode) return [];
  const c = teamCode.trim().toUpperCase();
  const team = getTeamByCode(c);
  if (!team) return [];
  
  // Get from localStorage
  try {
    const key = `generatorApp.teamTasks.${c}`;
    const raw = localStorage.getItem(key);
    if (raw) return JSON.parse(raw) as TaskRow[];
  } catch {}
  
  return [];
}

/**
 * ✅ Save tasks for a specific team
 */
export function saveTeamTasks(teamCode: string, tasks: TaskRow[]): void {
  const c = teamCode.trim().toUpperCase();
  try {
    const key = `generatorApp.teamTasks.${c}`;
    localStorage.setItem(key, JSON.stringify(tasks));
  } catch {}
}
