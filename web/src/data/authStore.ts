// src/data/authStore.ts

export type Account = {
  id: string;
  name: string;
  email: string;
  teamCode: string; // must always exist
  createdAtISO: string;
  verified: boolean;
};

export type AuthState = {
  currentAccountId: string | null;
  accounts: Account[];
  rememberMe: boolean;
};

const STORAGE_KEY = "generatorApp.auth.v5";
const DEFAULT_TEAM = "SBN-OPS";

/** ✅ migrate old state so teamCode is never missing */
function migrate(parsed: any): AuthState {
  const accounts: Account[] = (parsed.accounts || []).map((a: any) => ({
    id: a.id,
    name: a.name ?? "Unknown",
    email: a.email ?? "",
    teamCode: (a.teamCode || DEFAULT_TEAM).toUpperCase(), // ✅ backfill
    createdAtISO: a.createdAtISO ?? new Date().toISOString(),
    verified: !!a.verified,
  }));

  const rememberMe =
    typeof parsed.rememberMe === "boolean" ? parsed.rememberMe : true;

  const currentAccountId =
    rememberMe && parsed.currentAccountId
      ? parsed.currentAccountId
      : null;

  return { currentAccountId, accounts, rememberMe };
}

function loadState(): AuthState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return migrate(JSON.parse(raw));
  } catch {}

  return { currentAccountId: null, accounts: [], rememberMe: true };
}

let state: AuthState = loadState();
const listeners = new Set<(s: AuthState) => void>();

function persist() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {}
}

function notify() {
  persist();
  for (const l of listeners) l(state);
}

export function subscribeAuth(listener: (s: AuthState) => void) {
  listeners.add(listener);
  listener(state);
  return () => listeners.delete(listener);
}

export function getAuthState() {
  return state;
}

export function findAccountByEmail(email: string) {
  const e = email.trim().toLowerCase();
  return state.accounts.find((a) => a.email.toLowerCase() === e);
}

export function getCurrentAccount(): Account | null {
  return state.accounts.find((a) => a.id === state.currentAccountId) ?? null;
}

/**
 * ✅ teamCode is optional now (so any old CreateAccount page still works)
 * If missing, it defaults to SBN-OPS.
 */
export function createAccount(
  name: string,
  email: string,
  teamCode?: string
): Account {
  const e = email.trim().toLowerCase();
  const tc = (teamCode || DEFAULT_TEAM).trim().toUpperCase();

  if (findAccountByEmail(e)) {
    throw new Error("Account already exists for that email.");
  }

  const acct: Account = {
    id: `acct_${Math.random().toString(36).slice(2)}`,
    name: name.trim(),
    email: e,
    teamCode: tc, // ✅ guaranteed
    createdAtISO: new Date().toISOString(),
    verified: false,
  };

  state = { ...state, accounts: [...state.accounts, acct] };
  notify();
  return acct;
}

export function markVerified(accountId: string) {
  state = {
    ...state,
    accounts: state.accounts.map((a) =>
      a.id === accountId ? { ...a, verified: true } : a
    ),
  };
  notify();
}

export function signInWithRememberChoice(
  accountId: string,
  remember: boolean
) {
  state = { ...state, currentAccountId: accountId, rememberMe: remember };
  notify();
}

export function signOut() {
  state = { ...state, currentAccountId: null };
  notify();
}
