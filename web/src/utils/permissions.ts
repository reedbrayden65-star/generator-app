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

  // ✅ Basic worker: can escalate but cannot assign/manage users
  DCEO: [
    "TASK_VIEW",
    "TASK_CLAIM",
    "TASK_UNCLAIM",
    "TASK_COMPLETE",
    "TASK_ESCALATE",
  ],
};

export function hasPermission(role: Role, perm: Permission) {
  return ROLE_PERMS[role]?.includes(perm);
}

export function isAdminRole(role: Role) {
  return role === "DEVELOPER" || role === "CHIEF_ENG" || role === "MANAGER";
}
