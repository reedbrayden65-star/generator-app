export type Role = "DEVELOPER" | "CHIEF_ENG" | "MANAGER" | "DCEO";

export type Permission =
  | "TASK_VIEW"
  | "TASK_CLAIM"
  | "TASK_UNCLAIM"
  | "TASK_COMPLETE"
  | "TASK_ESCALATE"
  | "TASK_ASSIGN"
  | "TASK_MASS_ASSIGN"
  | "USER_MANAGE"
  | "REPORT_GENERATE";

/** ✅ Normalize roles from UI/user data */
export function normalizeRole(input: string): Role {
  const r = (input || "")
    .toUpperCase()
    .replace(/\./g, "")
    .replace(/\s+/g, "_"); // "Chief Eng." -> "CHIEF_ENG"

  if (r === "CHIEF_ENG" || r === "CHIEF_ENG_") return "CHIEF_ENG";
  if (r === "MANAGER") return "MANAGER";
  if (r === "DCEO") return "DCEO";
  return "DEVELOPER";
}

const ROLE_PERMS: Record<Role, Permission[]> = {
  DEVELOPER: [
    "TASK_VIEW",
    "TASK_CLAIM",
    "TASK_UNCLAIM",
    "TASK_COMPLETE",
    "TASK_ESCALATE",
    "TASK_ASSIGN",
    "TASK_MASS_ASSIGN",
    "USER_MANAGE",
    "REPORT_GENERATE",
  ],

  CHIEF_ENG: [
    "TASK_VIEW",
    "TASK_CLAIM",
    "TASK_UNCLAIM",
    "TASK_COMPLETE",
    "TASK_ESCALATE",
    "TASK_ASSIGN",
    "TASK_MASS_ASSIGN",
    "USER_MANAGE",
    "REPORT_GENERATE",
  ],

  MANAGER: [
    "TASK_VIEW",
    "TASK_CLAIM",
    "TASK_UNCLAIM",
    "TASK_COMPLETE",
    "TASK_ESCALATE",
    "TASK_ASSIGN",
    "TASK_MASS_ASSIGN",
    "USER_MANAGE",
    "REPORT_GENERATE",
  ],

  DCEO: [
    "TASK_VIEW",
    "TASK_CLAIM",
    "TASK_UNCLAIM",
    "TASK_COMPLETE",
    "TASK_ESCALATE",
  ],
};

export function hasPermission(roleLike: string, perm: Permission) {
  const role = normalizeRole(roleLike);
  return ROLE_PERMS[role].includes(perm);
}

export function isAdminRole(roleLike: string) {
  const role = normalizeRole(roleLike);
  return role === "DEVELOPER" || role === "CHIEF_ENG" || role === "MANAGER";
}
