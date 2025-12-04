import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  Search,
  UserPlus,
  Flag,
  CheckCircle2,
  MessageSquare,
  Hand,
} from "lucide-react";
import { Card, CardHeader, Button, Pill } from "../components/ui";
import {
  getWorkOrders,
  subscribe,
  claimWorkOrder,
  unclaimWorkOrder,
  assignWorkOrder,
  escalateWorkOrder,
  completeWorkOrder,
  addWorkOrderComment,
} from "../data/dataStore";
import { getCurrentUser } from "../data/authStore";
import type { WorkOrder } from "../data/types";
import { computeWOStatus, parsePriority, getPriorityLabel } from "../data/types";

type FilterType = "all" | "open" | "on-hold" | "overdue" | "due-soon" | "due-today" | "urgent" | "completed";

export default function WorkOrdersPage() {
  const nav = useNavigate();
  const [searchParams] = useSearchParams();
  const initialFilter = (searchParams.get("filter") as FilterType) || "all";
  const buildingFilter = searchParams.get("building") || "";

  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<FilterType>(initialFilter);
  const [showAssignModal, setShowAssignModal] = useState<string | null>(null);
  const [showEscalateModal, setShowEscalateModal] = useState<string | null>(null);
  const [showCommentModal, setShowCommentModal] = useState<string | null>(null);
  const currentUser = getCurrentUser();

  useEffect(() => {
    const update = () => setWorkOrders(getWorkOrders());
    update();
    return subscribe(update);
  }, []);

  const handleClaim = (woNumber: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!currentUser) return;
    claimWorkOrder(woNumber, currentUser.id, currentUser.name);
  };

  const handleUnclaim = (woNumber: string, e: React.MouseEvent) => {
    e.stopPropagation();
    unclaimWorkOrder(woNumber);
  };

  const handleComplete = (woNumber: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm("Mark this work order as completed?")) {
      completeWorkOrder(woNumber);
    }
  };

  const filtered = useMemo(() => {
    let result = workOrders;

    // Building filter
    if (buildingFilter) {
      result = result.filter((wo) => wo.organization === buildingFilter);
    }

    // Status filter
    if (filter === "open") {
      result = result.filter((wo) => wo.status === "Open");
    } else if (filter === "on-hold") {
      result = result.filter((wo) => wo.status === "On Hold");
    } else if (filter === "completed") {
      result = result.filter((wo) => wo.status === "Completed");
    } else if (filter === "overdue") {
      result = result.filter((wo) => computeWOStatus(wo) === "Overdue");
    } else if (filter === "due-soon") {
      result = result.filter((wo) => computeWOStatus(wo) === "Due Soon");
    } else if (filter === "due-today") {
      result = result.filter((wo) => {
        if (wo.status === "Completed") return false;
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const endDate = new Date(wo.complianceEndDate);
        endDate.setHours(0, 0, 0, 0);
        return endDate.getTime() === today.getTime();
      });
    } else if (filter === "urgent") {
      result = result.filter((wo) => wo.status === "Open" && parsePriority(wo.priority) <= 2);
    }

    // Search
    if (query.trim()) {
      const q = query.toLowerCase();
      result = result.filter(
        (wo) =>
          wo.description.toLowerCase().includes(q) ||
          wo.workOrderNumber.toLowerCase().includes(q) ||
          wo.equipmentDescription.toLowerCase().includes(q) ||
          wo.woType.toLowerCase().includes(q) ||
          wo.simTicketNumber?.toLowerCase().includes(q) ||
          wo.fsbNumber?.toLowerCase().includes(q)
      );
    }

    // Sort by compliance end date
    return result.sort(
      (a, b) =>
        new Date(a.complianceEndDate).getTime() -
        new Date(b.complianceEndDate).getTime()
    );
  }, [workOrders, filter, query, buildingFilter]);

  const counts = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    return {
      all: workOrders.length,
      open: workOrders.filter((wo) => wo.status === "Open").length,
      onHold: workOrders.filter((wo) => wo.status === "On Hold").length,
      overdue: workOrders.filter((wo) => computeWOStatus(wo) === "Overdue").length,
      dueSoon: workOrders.filter((wo) => computeWOStatus(wo) === "Due Soon").length,
      dueToday: workOrders.filter((wo) => {
        if (wo.status === "Completed") return false;
        const endDate = new Date(wo.complianceEndDate);
        endDate.setHours(0, 0, 0, 0);
        return endDate.getTime() === today.getTime();
      }).length,
      urgent: workOrders.filter((wo) => wo.status === "Open" && parsePriority(wo.priority) <= 2).length,
      completed: workOrders.filter((wo) => wo.status === "Completed").length,
    };
  }, [workOrders]);

  return (
    <div className="space-y-5">
      <Card>
        <CardHeader
          title="Work Orders"
          subtitle={buildingFilter ? `Filtered by ${buildingFilter}` : `${workOrders.length} total`}
          right={
            <Button variant="ghost" onClick={() => nav("/")}>
              Back to Dashboard
            </Button>
          }
        />

        {/* Stats */}
        <div className="grid grid-cols-2 gap-2 p-4 md:grid-cols-4 lg:grid-cols-8">
          <MiniStat label="All" value={counts.all} active={filter === "all"} onClick={() => setFilter("all")} />
          <MiniStat label="Open" value={counts.open} color="#22c55e" active={filter === "open"} onClick={() => setFilter("open")} />
          <MiniStat label="Hold" value={counts.onHold} color="#f59e0b" active={filter === "on-hold"} onClick={() => setFilter("on-hold")} />
          <MiniStat label="Past Due" value={counts.overdue} color="#ef4444" active={filter === "overdue"} onClick={() => setFilter("overdue")} />
          <MiniStat label="Due Today" value={counts.dueToday} color="#f97316" active={filter === "due-today"} onClick={() => setFilter("due-today")} />
          <MiniStat label="Due Soon" value={counts.dueSoon} color="#fb923c" active={filter === "due-soon"} onClick={() => setFilter("due-soon")} />
          <MiniStat label="Urgent" value={counts.urgent} color="#dc2626" active={filter === "urgent"} onClick={() => setFilter("urgent")} />
          <MiniStat label="Done" value={counts.completed} color="#3b82f6" active={filter === "completed"} onClick={() => setFilter("completed")} />
        </div>

        {/* Search */}
        <div className="border-t border-slate-700 p-4">
          <div className="relative">
            <Search className="absolute left-3 top-3 text-slate-500" size={16} />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search work orders, WO#, equipment, FSB..."
              className="w-full rounded-xl border border-slate-600 bg-slate-800 pl-10 pr-4 py-2.5 text-sm font-semibold text-white placeholder:text-slate-500 outline-none focus:border-blue-500"
            />
          </div>
        </div>
      </Card>

      {/* Results */}
      <Card>
        <div className="border-b border-slate-700 px-4 py-3 text-xs font-bold text-slate-400">
          {filtered.length} work order{filtered.length !== 1 ? "s" : ""}
        </div>

        {filtered.length === 0 ? (
          <div className="p-8 text-center text-sm text-slate-400">
            No work orders match your filters.
          </div>
        ) : (
          <div className="divide-y divide-slate-700/50">
            {filtered.map((wo) => {
              const woStatus = computeWOStatus(wo);
              const priority = parsePriority(wo.priority);
              const isClaimed = !!wo.claimedByUserId;
              const isMyTask = wo.claimedByUserId === currentUser?.id;
              const isCompleted = wo.status === "Completed";

              return (
                <div
                  key={wo.id}
                  className="px-4 py-4 hover:bg-slate-800/30 transition"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-white">
                          {wo.description}
                        </span>
                        <StatusPill status={woStatus} />
                        <PriorityPill priority={priority} />
                      </div>
                      <div className="text-sm text-slate-400 mt-1">
                        WO# {wo.workOrderNumber} • {wo.woType}
                      </div>
                      <div className="text-xs text-slate-500 mt-1">
                        {wo.organization} • {wo.equipmentDescription}
                      </div>
                      <div className="text-xs text-slate-500 mt-1">
                        Compliance: {wo.complianceStartDate} → {wo.complianceEndDate}
                        {wo.simTicketNumber && ` • SIM: ${wo.simTicketNumber}`}
                        {wo.fsbNumber && ` • FSB: ${wo.fsbNumber}`}
                      </div>
                      {isClaimed && (
                        <div className="text-xs text-blue-400 mt-1 flex items-center gap-1">
                          <Hand size={10} />
                          Claimed by {wo.claimedByUserName}
                        </div>
                      )}
                      {wo.assignedToUserName && (
                        <div className="text-xs text-emerald-400 mt-1 flex items-center gap-1">
                          <UserPlus size={10} />
                          Assigned to {wo.assignedToUserName}
                        </div>
                      )}
                      {wo.escalationReason && (
                        <div className="text-xs text-amber-400 mt-1 flex items-center gap-1">
                          <Flag size={10} />
                          Escalated: {wo.escalationReason}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  {!isCompleted && (
                    <div className="flex items-center gap-2 mt-3 flex-wrap">
                      {!isClaimed ? (
                        <Button
                          variant="primary"
                          onClick={(e) => handleClaim(wo.workOrderNumber, e)}
                        >
                          <Hand size={12} /> Claim
                        </Button>
                      ) : isMyTask ? (
                        <Button
                          variant="ghost"
                          onClick={(e) => handleUnclaim(wo.workOrderNumber, e)}
                        >
                          <Hand size={12} /> Unclaim
                        </Button>
                      ) : null}
                      
                      <Button
                        variant="success"
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowAssignModal(wo.workOrderNumber);
                        }}
                      >
                        <UserPlus size={12} /> Assign
                      </Button>
                      
                      <Button
                        variant="warn"
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowEscalateModal(wo.workOrderNumber);
                        }}
                      >
                        <Flag size={12} /> Escalate
                      </Button>
                      
                      <Button
                        variant="solid"
                        onClick={(e) => handleComplete(wo.workOrderNumber, e)}
                      >
                        <CheckCircle2 size={12} /> Complete
                      </Button>
                      
                      <Button
                        variant="ghost"
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowCommentModal(wo.workOrderNumber);
                        }}
                      >
                        <MessageSquare size={12} /> Comment
                      </Button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {/* Assign Modal */}
      {showAssignModal && (
        <Modal
          title="Assign Work Order"
          onClose={() => setShowAssignModal(null)}
          onSubmit={() => {
            if (!currentUser) return;
            assignWorkOrder(showAssignModal, currentUser.id, currentUser.name);
            setShowAssignModal(null);
          }}
        >
          <p className="text-sm text-slate-300">
            Assign WO# {showAssignModal} to {currentUser?.name}?
          </p>
        </Modal>
      )}

      {/* Escalate Modal */}
      {showEscalateModal && (
        <Modal
          title="Escalate Work Order"
          onClose={() => setShowEscalateModal(null)}
          onSubmit={() => {
            const reason = (document.getElementById("escalate-reason-wo") as HTMLTextAreaElement)?.value;
            if (!reason?.trim() || !currentUser) return;
            escalateWorkOrder(showEscalateModal, reason, currentUser.name);
            setShowEscalateModal(null);
          }}
        >
          <div className="space-y-2">
            <label className="text-sm text-slate-300">Escalation Reason</label>
            <textarea
              id="escalate-reason-wo"
              className="w-full rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-sm text-white outline-none focus:border-blue-500"
              rows={3}
              placeholder="Enter reason for escalation..."
            />
          </div>
        </Modal>
      )}

      {/* Comment Modal */}
      {showCommentModal && (
        <Modal
          title="Add Comment"
          onClose={() => setShowCommentModal(null)}
          onSubmit={() => {
            const comment = (document.getElementById("comment-text-wo") as HTMLTextAreaElement)?.value;
            if (!comment?.trim() || !currentUser) return;
            addWorkOrderComment(showCommentModal, comment, currentUser.name);
            setShowCommentModal(null);
          }}
        >
          <div className="space-y-2">
            <label className="text-sm text-slate-300">Comment</label>
            <textarea
              id="comment-text-wo"
              className="w-full rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-sm text-white outline-none focus:border-blue-500"
              rows={3}
              placeholder="Enter your comment..."
            />
          </div>
        </Modal>
      )}
    </div>
  );
}

function Modal({
  title,
  children,
  onClose,
  onSubmit,
}: {
  title: string;
  children: React.ReactNode;
  onClose: () => void;
  onSubmit: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl border border-slate-700 bg-gradient-to-br from-slate-900 to-slate-800 p-6 shadow-2xl">
        <h3 className="text-lg font-bold text-white mb-4">{title}</h3>
        <div className="mb-6">{children}</div>
        <div className="flex gap-3 justify-end">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" onClick={onSubmit}>
            Submit
          </Button>
        </div>
      </div>
    </div>
  );
}

function MiniStat({
  label,
  value,
  color,
  active,
  onClick,
}: {
  label: string;
  value: number;
  color?: string;
  active?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`rounded-xl border p-3 text-left transition ${
        active
          ? "border-blue-500 bg-blue-600/20"
          : "border-slate-700 bg-slate-800/50 hover:border-slate-600"
      }`}
    >
      <div className="text-xs text-slate-400">{label}</div>
      <div className="mt-1 flex items-center gap-2">
        {color && <span className="h-2 w-2 rounded-full" style={{ background: color }} />}
        <span className="text-lg font-extrabold text-white">{value}</span>
      </div>
    </button>
  );
}

function StatusPill({ status }: { status: string }) {
  const tone =
    status === "Overdue" ? "danger" :
    status === "Due Soon" ? "warn" :
    status === "On Hold" ? "warn" :
    status === "Completed" ? "success" :
    "neutral";
  return <Pill tone={tone}>{status}</Pill>;
}

function PriorityPill({ priority }: { priority: number }) {
  const tone = priority <= 2 ? "danger" : priority === 3 ? "warn" : "neutral";
  return <Pill tone={tone}>P{priority}</Pill>;
}
