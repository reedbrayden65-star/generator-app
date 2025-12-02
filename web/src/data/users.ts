import type { Role } from "../utils/permissions";

export type User = {
  id: string;
  name: string;
  role: Role;
};

export const users: User[] = [
  {
    id: "u-dev-1",
    name: "Brayden (Dev)",
    role: "DEVELOPER",
  },
  {
    id: "u-chief-1",
    name: "Chief Eng. Mock",
    role: "CHIEF_ENG",
  },
  {
    id: "u-mgr-1",
    name: "Manager Mock",
    role: "MANAGER",
  },
  {
    id: "u-dceo-1",
    name: "Alex (DCEO)",
    role: "DCEO",
  },
  {
    id: "u-dceo-2",
    name: "Jordan (DCEO)",
    role: "DCEO",
  },
];
