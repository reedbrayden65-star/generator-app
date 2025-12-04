// Central data store for generators and work orders
import type { Generator, WorkOrder, Building } from "./types";

type DataState = {
  generators: Generator[];
  workOrders: WorkOrder[];
  buildings: Building[];
};

const STORAGE_KEY = "generatorOps.data.v1";

let state: DataState = loadState();
const listeners = new Set<(s: DataState) => void>();

function loadState(): DataState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return { generators: [], workOrders: [], buildings: [] };
}

function persist() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {}
}

function notify() {
  persist();
  for (const l of listeners) l(state);
}

export function subscribe(listener: (s: DataState) => void) {
  listeners.add(listener);
  listener(state);
  return () => { listeners.delete(listener); };
}

export function getState(): DataState {
  return state;
}

// Get all generators
export function getGenerators(): Generator[] {
  return state.generators;
}

// Get generators for a building
export function getGeneratorsByBuilding(buildingName: string): Generator[] {
  return state.generators.filter(g => 
    g.building === buildingName || 
    `${g.campus}${g.building}` === buildingName ||
    `${g.campus}-${g.building}` === buildingName
  );
}

// Get a single generator by asset ID or unit number
export function getGenerator(id: string): Generator | undefined {
  return state.generators.find(g => 
    g.assetId === id || 
    g.unitNumber === id ||
    g.id === id
  );
}

// Get all work orders
export function getWorkOrders(): WorkOrder[] {
  return state.workOrders;
}

// Get work orders for a building
export function getWorkOrdersByBuilding(buildingName: string): WorkOrder[] {
  return state.workOrders.filter(wo => 
    wo.organization === buildingName ||
    wo.organization.replace("-", "") === buildingName.replace("-", "")
  );
}

// Get work orders for a generator
export function getWorkOrdersByGenerator(assetId: string): WorkOrder[] {
  return state.workOrders.filter(wo => wo.equipmentId === assetId);
}

// Get work orders by status
export function getWorkOrdersByStatus(status: string): WorkOrder[] {
  return state.workOrders.filter(wo => wo.status === status);
}

// Get all buildings
export function getBuildings(): Building[] {
  return state.buildings;
}

// Rebuild buildings list from generators and work orders
function rebuildBuildings() {
  const buildingMap = new Map<string, Building>();
  
  // From generators
  for (const gen of state.generators) {
    const key = `${gen.campus}${gen.building}`;
    if (!buildingMap.has(key)) {
      buildingMap.set(key, {
        id: `${gen.campus}-${gen.building}`,
        campus: gen.campus,
        buildingNumber: gen.building,
        name: key,
        generatorCount: 0,
        workOrderCount: 0,
        openCount: 0,
        onHoldCount: 0,
        completedCount: 0,
      });
    }
    buildingMap.get(key)!.generatorCount++;
  }
  
  // From work orders
  for (const wo of state.workOrders) {
    const key = wo.organization;
    if (!buildingMap.has(key)) {
      buildingMap.set(key, {
        id: key,
        campus: wo.cluster,
        buildingNumber: key.replace(wo.cluster, ""),
        name: key,
        generatorCount: 0,
        workOrderCount: 0,
        openCount: 0,
        onHoldCount: 0,
        completedCount: 0,
      });
    }
    const b = buildingMap.get(key)!;
    b.workOrderCount++;
    if (wo.status === "Open") b.openCount++;
    if (wo.status === "On Hold") b.onHoldCount++;
    if (wo.status === "Completed") b.completedCount++;
  }
  
  state.buildings = Array.from(buildingMap.values()).sort((a, b) => 
    a.name.localeCompare(b.name)
  );
}

// Import generators from CSV
export function importGenerators(generators: Generator[]) {
  // Merge with existing, replacing duplicates by assetId
  const existing = new Map(state.generators.map(g => [g.assetId, g]));
  for (const gen of generators) {
    existing.set(gen.assetId, gen);
  }
  state = { ...state, generators: Array.from(existing.values()) };
  rebuildBuildings();
  notify();
}

// Import work orders from CSV
export function importWorkOrders(workOrders: WorkOrder[]) {
  // Merge with existing, replacing duplicates by work order number
  const existing = new Map(state.workOrders.map(wo => [wo.workOrderNumber, wo]));
  for (const wo of workOrders) {
    existing.set(wo.workOrderNumber, wo);
  }
  state = { ...state, workOrders: Array.from(existing.values()) };
  rebuildBuildings();
  notify();
}

// Update a work order (for assignments, claims, status changes)
export function updateWorkOrder(woNumber: string, updates: Partial<WorkOrder>) {
  state = {
    ...state,
    workOrders: state.workOrders.map(wo =>
      wo.workOrderNumber === woNumber ? { ...wo, ...updates } : wo
    ),
  };
  rebuildBuildings();
  notify();
}

// Claim a work order
export function claimWorkOrder(woNumber: string, userId: string, userName: string) {
  updateWorkOrder(woNumber, {
    claimedByUserId: userId,
    claimedByUserName: userName,
  });
}

// Unclaim a work order
export function unclaimWorkOrder(woNumber: string) {
  updateWorkOrder(woNumber, {
    claimedByUserId: undefined,
    claimedByUserName: undefined,
  });
}

// Assign a work order
export function assignWorkOrder(woNumber: string, userId: string, userName: string) {
  updateWorkOrder(woNumber, {
    assignedToUserId: userId,
    assignedToUserName: userName,
  });
}

// Escalate a work order
export function escalateWorkOrder(woNumber: string, reason: string, userName: string) {
  updateWorkOrder(woNumber, {
    escalationReason: reason,
    escalatedByUserName: userName,
    status: "On Hold",
  });
}

// Complete a work order
export function completeWorkOrder(woNumber: string) {
  updateWorkOrder(woNumber, {
    status: "Completed",
  });
}

// Add comment to work order
export function addWorkOrderComment(woNumber: string, comment: string, userName: string) {
  const wo = state.workOrders.find(w => w.workOrderNumber === woNumber);
  if (!wo) return;
  
  const comments = wo.commentsJSON ? JSON.parse(wo.commentsJSON) : [];
  comments.push({
    text: comment,
    userName,
    timestamp: new Date().toISOString(),
  });
  
  updateWorkOrder(woNumber, {
    commentsJSON: JSON.stringify(comments),
  });
}

// Clear all data
export function clearAllData() {
  state = { generators: [], workOrders: [], buildings: [] };
  notify();
}
