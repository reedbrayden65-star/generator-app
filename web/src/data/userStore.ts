import { users, type User } from "./users";

const STORAGE_KEY = "generatorApp.currentUser.v2";

const safeStorage = {
  get(key: string) {
    try {
      if (typeof window === "undefined") return null;
      return window.localStorage.getItem(key);
    } catch {
      return null;
    }
  },
  set(key: string, value: string) {
    try {
      if (typeof window === "undefined") return;
      window.localStorage.setItem(key, value);
    } catch {}
  },
};

function loadUser(): User {
  const savedId = safeStorage.get(STORAGE_KEY);
  const found = users.find((u) => u.id === savedId);
  return found ?? users[0];
}

let currentUser: User = loadUser();
safeStorage.set(STORAGE_KEY, currentUser.id);

const listeners = new Set<(u: User) => void>();

function notify() {
  safeStorage.set(STORAGE_KEY, currentUser.id);
  for (const l of listeners) l(currentUser);
}

export function subscribeUser(listener: (u: User) => void) {
  listeners.add(listener);
  listener(currentUser);
  return () => {
    listeners.delete(listener);
  };
}

export function getCurrentUser() {
  return currentUser;
}

export function setCurrentUserById(id: string) {
  const found = users.find((u) => u.id === id);
  if (!found) return;
  currentUser = found;
  notify();
}
