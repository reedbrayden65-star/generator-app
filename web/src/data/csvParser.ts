// CSV parsing utilities for the two sheet types
import type { Generator, WorkOrder } from "./types";

// Parse CSV line handling quoted fields
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

// Parse Generator Info Sheet CSV
export function parseGeneratorSheet(csvText: string): Generator[] {
  const lines = csvText.split(/\r?\n/).filter(l => l.trim());
  if (lines.length < 2) return [];

  const headers = parseCSVLine(lines[0]).map(h => h.toLowerCase().replace(/[:\s]+/g, "").replace(/_/g, ""));
  const generators: Generator[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    if (values.length < 3) continue;

    const row: Record<string, string> = {};
    headers.forEach((h, idx) => {
      row[h] = values[idx] || "";
    });

    const campus = row.campus || row.cluster || "";
    const building = row.building || "";
    const unitNumber = row.unitnumber || row.unit || "";
    const assetId = row.assetid || row.asset || "";

    if (!assetId && !unitNumber) continue;

    generators.push({
      id: assetId || `${campus}-${building}-${unitNumber}`,
      campus,
      building,
      unitNumber,
      assetId,
      pfhoStatus: row.pfhosatus || row.pfhostatus || row["pfhosatus(y/nify,date)"] || "",
      manufacturer: row.manufacturer || "",
      model: row.model || "",
      serial: row.serial || "",
      sizeKW: row.size || row["size(kw)"] || row.sizekw || "",
      enclosureManufacturer: row.enclosuremanufacturer || "",
      runHours: row.runhours || "",
      fuelLevelPercent: row.fuellevel || row["fuellevel%"] || "",
      pm3M: row["3mpm"] || row.pm3m || "",
      pm3MWindow: row.compliancewindow || "",
      pm6M: row["6mpm"] || row.pm6m || "",
      pm6MWindow: row.compliancewindow || "",
      pm12M: row["12mpm"] || row.pm12m || "",
      pm12MWindow: row.compliancewindow || "",
      loadBank: row.loadbank || "",
      fsbStatus: row.fsbstatus || row["fsbstatus(y/n/wip)"] || "",
      warrantyExpiration: row.warrantyexpirationdate || row.warrantyexpiration || "",
      notes: row.notes || "",
      knownIssues: row.knownissues || "",
    });
  }

  return generators;
}

// Parse Work Orders CSV
export function parseWorkOrderSheet(csvText: string): WorkOrder[] {
  const lines = csvText.split(/\r?\n/).filter(l => l.trim());
  if (lines.length < 2) return [];

  const headers = parseCSVLine(lines[0]).map(h => 
    h.toLowerCase()
      .replace(/[:\s.]+/g, "")
      .replace(/_/g, "")
  );
  
  const workOrders: WorkOrder[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    if (values.length < 5) continue;

    const row: Record<string, string> = {};
    headers.forEach((h, idx) => {
      row[h] = values[idx] || "";
    });

    const woNumber = row.workorder || row.workordernumber || row.wo || "";
    if (!woNumber) continue;

    const status = row.status || "Open";
    const normalizedStatus = 
      status.toLowerCase().includes("hold") ? "On Hold" :
      status.toLowerCase().includes("complete") ? "Completed" :
      status.toLowerCase().includes("cancel") ? "Cancelled" :
      "Open";

    workOrders.push({
      id: woNumber,
      cluster: row.cluster || "",
      organization: row.organization || "",
      department: row.department || "",
      workOrderNumber: woNumber,
      description: row.description || "",
      equipmentCategory: row.equipmentcategory || "",
      complianceStartDate: row.compliancestartdate || "",
      complianceEndDate: row.complianceenddate || "",
      status: normalizedStatus as WorkOrder["status"],
      woType: row.wotype || "",
      equipmentId: row.equipment || row.equipmentid || "",
      equipmentDescription: row.equipmentdescription || "",
      priority: row.priority || "",
      location: row.location || "",
      schedStartDate: row.schedstartdate || row["schedstartdate"] || "",
      schedEndDate: row.schedenddate || row["schedenddate"] || "",
      dateCreated: row.datecreated || row["datecreated(utc)"] || "",
      simTicketNumber: row.simticketno || row.simticketnumber || "",
      fsbNumber: row.fsbnumber || "",
      mcmNumber: row.mcmno || row.mcmnumber || "",
    });
  }

  return workOrders;
}

// Detect which type of CSV this is
export function detectCSVType(csvText: string): "generators" | "workorders" | "unknown" {
  const firstLine = csvText.split(/\r?\n/)[0]?.toLowerCase() || "";
  
  if (firstLine.includes("work order") || firstLine.includes("compliance start") || firstLine.includes("wo type")) {
    return "workorders";
  }
  if (firstLine.includes("unit number") || firstLine.includes("manufacturer") || firstLine.includes("asset id")) {
    return "generators";
  }
  return "unknown";
}
