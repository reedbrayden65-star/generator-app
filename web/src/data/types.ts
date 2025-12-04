// Core data types based on real CSV exports

// From "Gen info sheet.csv" - Generator master data
export type Generator = {
  id: string; // Asset ID
  campus: string;
  building: string;
  unitNumber: string; // e.g., "GEN 1.1A", "GEN HS"
  assetId: string;
  pfhoStatus: string; // Date or Y/N
  manufacturer: string;
  model: string;
  serial: string;
  sizeKW: string;
  enclosureManufacturer: string;
  runHours: string;
  fuelLevelPercent: string;
  pm3M: string; // 3 month PM date
  pm3MWindow: string;
  pm6M: string; // 6 month PM date
  pm6MWindow: string;
  pm12M: string; // 12 month PM date
  pm12MWindow: string;
  loadBank: string;
  fsbStatus: string; // Y/N/WIP
  warrantyExpiration: string;
  notes: string;
  knownIssues: string;
};

// From "gen work orders.csv" - Work orders/tasks
export type WorkOrder = {
  id: string; // Work Order number
  cluster: string;
  organization: string; // e.g., "SBN100"
  department: string; // e.g., "DCEO"
  workOrderNumber: string;
  description: string;
  equipmentCategory: string; // e.g., "GEN.DSL"
  complianceStartDate: string;
  complianceEndDate: string;
  status: "Open" | "On Hold" | "Completed" | "Cancelled";
  woType: string; // "Field Service Bulletin", "Firmware Revision", "PM", etc.
  equipmentId: string; // Asset ID - links to Generator
  equipmentDescription: string; // e.g., "DIESEL GENERATOR - GEN 1.6B"
  priority: string;
  location: string;
  schedStartDate: string;
  schedEndDate: string;
  dateCreated: string;
  simTicketNumber: string;
  fsbNumber: string;
  mcmNumber: string;
  // App-specific fields
  assignedToUserId?: string;
  assignedToUserName?: string;
  claimedByUserId?: string;
  claimedByUserName?: string;
  commentsJSON?: string;
  escalationReason?: string;
  escalatedByUserName?: string;
};

// Building summary (derived from generators + work orders)
export type Building = {
  id: string; // e.g., "SBN-100"
  campus: string;
  buildingNumber: string;
  name: string; // e.g., "SBN100"
  generatorCount: number;
  workOrderCount: number;
  openCount: number;
  onHoldCount: number;
  completedCount: number;
};

// Parsed priority info
export type PriorityLevel = 1 | 2 | 3 | 4 | 5;

export function parsePriority(priorityStr: string): PriorityLevel {
  if (priorityStr.includes("Priority 1")) return 1;
  if (priorityStr.includes("Priority 2")) return 2;
  if (priorityStr.includes("Priority 3")) return 3;
  if (priorityStr.includes("Priority 4")) return 4;
  if (priorityStr.includes("Priority 5")) return 5;
  return 3; // default
}

export function getPriorityLabel(priority: PriorityLevel): string {
  switch (priority) {
    case 1: return "Critical";
    case 2: return "High";
    case 3: return "Medium";
    case 4: return "Low";
    case 5: return "Minimal";
  }
}

// Work order status for UI
export type WOStatus = "Open" | "On Hold" | "Completed" | "Overdue" | "Due Soon";

export function computeWOStatus(wo: WorkOrder): WOStatus {
  if (wo.status === "Completed") return "Completed";
  if (wo.status === "On Hold") return "On Hold";
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const endDate = new Date(wo.complianceEndDate);
  endDate.setHours(0, 0, 0, 0);
  
  const daysUntilDue = Math.floor((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  
  if (daysUntilDue < 0) return "Overdue";
  if (daysUntilDue <= 14) return "Due Soon";
  return "Open";
}
