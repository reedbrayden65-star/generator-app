import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  CalendarDays,
  Clock,
  AlertTriangle,
  CheckCircle2,
  ArrowRight,
  Flame,
  Hand,
  UserPlus,
  Flag,
  MessageSquare,
} from "lucide-react";
import { Card, CardHeader, Button, Pill, StatCard } from "../components/ui";
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

export default function TodayPage() {
  const nav = useNavigate();
  const currentUser = getCurrentUser();
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [showAssignModal, setShowAssignModal] = useState<string | null>(null);
  const [showEscalateModal, setShowEscalateModal] = useState<string | null>(null);
  const [showCommentModal, setShowCommentModal] = useState<string | null>(null);

  useEffect(() => {
    const update = () => setWorkOrders(getWorkOrders());
    update();
    return subscribe(update);
  }, []);

  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const todayStr = today.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  // Tasks due today
  const todayTasks = useMemo(() => {
    return workOrders.filter((wo) => {
      if (wo.status === "Completed") return false;
      const due = new Date(wo.complianceEndDate);
      due.setHours(0, 0, 0, 0);
      return due.getTime() === today.getTime();
    });
  }, [workOrders, today]);

  // Tasks overdue
  const overdueTasks = useMemo(() => {
    return workOrders.filter((wo) => computeWOStatus(wo) === "Overdue");
  }, [workOrders]);

  // My tasks (claimed or assigned to me)
  const myTasks = useMemo(() => {
    return workOrders.filter(
      (wo) =>
        wo.status !== "Completed" &&
        (wo.claimedByUserId === currentUser?.id ||
          wo.assignedToUserId === currentUser?.id)
    );
  }, [workOrders, currentUser]);

  // Urgent tasks (Priority 1-2)
  const urgentTasks = useMemo(() => {
    return workOrders.filter(
      (wo) => wo.status === "Open" && parsePriority(wo.priority) <= 2
    );
  }, [workOrders]);

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

  return (
    <div className="space-y-5">
      {/* Header */}
      <Card>
        <div className="p-6">
          <div className="flex items-center gap-4">
            <div className="grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-blue-600 to-blue-500 text-white shadow-lg shadow-blue-500/30">
              <CalendarDays size={28} />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold text-white tracking-tight">
                Today
              </h1>
              <p className="text-slate-400">{todayStr}</p>
            </div>
          </div>
        </div>
      </Card>

      {/* Stats Row */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard
          icon={CalendarDays}
          label="Due Today"
          value={todayTasks.length}
          color="#3b82f6"
        />
        <StatCard
          icon={Clock}
          label="My Tasks"
          value={myTasks.length}
          color="#8b5cf6"
        />
        <StatCard
          icon={AlertTriangle}
          label="Past Due"
          value={overdueTasks.length}
          color="#f97316"
        />
        <StatCard
          icon={Flame}
          label="Urgent"
          value={urgentTasks.length}
          color="#ef4444"
        />
      </div>

      {/* Due Today - Main Focus */}
      <Card>
        <CardHeader
          title="📅 Due Today"
          subtitle={`${todayTasks.length} work order${todayTasks.length !== 1 ? "s" : ""} due today`}
          icon={<CalendarDays size={16} />}
          right={
            todayTasks.length > 10 && (
              <Button
                variant="ghost"
                onClick={() => nav("/work-orders?filter=due-today")}
              >
                View All ({todayTasks.length}) <ArrowRight size={14} />
              </Button>
            )
          }
        />
        {todayTasks.length === 0 ? (
          <div className="p-12 text-center">
            <CheckCircle2
              size={56}
              className="mx-auto text-emerald-500 mb-4"
            />
            <div className="text-xl font-bold text-white mb-2">All caught up!</div>
            <div className="text-sm text-slate-400">
              No work orders due today. Great job!
            </div>
          </div>
        ) : (
          <div className="divide-y divide-slate-700/50">
            {todayTasks.slice(0, 10).map((wo) => (
              <WorkOrderRow
                key={wo.id}
                wo={wo}
                currentUser={currentUser}
                onClaim={handleClaim}
                onUnclaim={handleUnclaim}
                onComplete={handleComplete}
                onAssign={(woNum) => setShowAssignModal(woNum)}
                onEscalate={(woNum) => setShowEscalateModal(woNum)}
                onComment={(woNum) => setShowCommentModal(woNum)}
              />
            ))}
            {todayTasks.length > 10 && (
              <div className="p-4 text-center">
                <Button onClick={() => nav("/work-orders?filter=due-today")}>
                  View All {todayTasks.length} Work Orders <ArrowRight size={14} />
                </Button>
              </div>
            )}
          </div>
        )}
      </Card>

      {/* Quick Links to Other Filters */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {overdueTasks.length > 0 && (
          <button
            onClick={() => nav("/work-orders?filter=overdue")}
            className="group text-left"
          >
            <Card className="h-full transition-all hover:border-red-500/50 hover:shadow-red-500/10">
              <div className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="grid h-10 w-10 place-items-center rounded-xl bg-red-500/20 text-red-400">
                      <AlertTriangle size={18} />
                    </div>
                    <div>
                      <div className="text-sm font-bold text-white">Past Due</div>
                      <div className="text-xs text-slate-400">{overdueTasks.length} overdue</div>
                    </div>
                  </div>
                  <ArrowRight size={16} className="text-slate-600 group-hover:text-red-400 transition-colors" />
                </div>
              </div>
            </Card>
          </button>
        )}

        {urgentTasks.length > 0 && (
          <button
            onClick={() => nav("/work-orders?filter=urgent")}
            className="group text-left"
          >
            <Card className="h-full transition-all hover:border-orange-500/50 hover:shadow-orange-500/10">
              <div className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="grid h-10 w-10 place-items-center rounded-xl bg-orange-500/20 text-orange-400">
                      <Flame size={18} />
                    </div>
                    <div>
                      <div className="text-sm font-bold text-white">Urgent</div>
                      <div className="text-xs text-slate-400">{urgentTasks.length} high priority</div>
                    </div>
                  </div>
                  <ArrowRight size={16} className="text-slate-600 group-hover:text-orange-400 transition-colors" />
                </div>
              </div>
            </Card>
          </button>
        )}

        {myTasks.length > 0 && (
          <button
            onClick={() => nav("/work-orders")}
            className="group text-left"
          >
            <Card className="h-full transition-all hover:border-purple-500/50 hover:shadow-purple-500/10">
              <div className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="grid h-10 w-10 place-items-center rounded-xl bg-purple-500/20 text-purple-400">
                      <Hand size={18} />
                    </div>
                    <div>
                      <div className="text-sm font-bold text-white">My Tasks</div>
                      <div className="text-xs text-slate-400">{myTasks.length} claimed/assigned</div>
                    </div>
                  </div>
                  <ArrowRight size={16} className="text-slate-600 group-hover:text-purple-400 transition-colors" />
                </div>
              </div>
            </Card>
          </button>
        )}
      </div>

      {/* Modals */}
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

      {showEscalateModal && (
        <Modal
          title="Escalate Work Order"
          onClose={() => setShowEscalateModal(null)}
          onSubmit={() => {
            const reason = (
              document.getElementById("escalate-reason-today") as HTMLTextAreaElement
            )?.value;
            if (!reason?.trim() || !currentUser) return;
            escalateWorkOrder(showEscalateModal, reason, currentUser.name);
            setShowEscalateModal(null);
          }}
        >
          <div className="space-y-2">
            <label className="text-sm text-slate-300">Escalation Reason</label>
            <textarea
              id="escalate-reason-today"
              className="w-full rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-sm text-white outline-none focus:border-blue-500"
              rows={3}
              placeholder="Enter reason for escalation..."
            />
          </div>
        </Modal>
      )}

      {showCommentModal && (
        <Modal
          title="Add Comment"
          onClose={() => setShowCommentModal(null)}
          onSubmit={() => {
            const comment = (
              document.getElementById("comment-text-today") as HTMLTextAreaElement
            )?.value;
            if (!comment?.trim() || !currentUser) return;
            addWorkOrderComment(showCommentModal, comment, currentUser.name);
            setShowCommentModal(null);
          }}
        >
          <div className="space-y-2">
            <label className="text-sm text-slate-300">Comment</label>
            <textarea
              id="comment-text-today"
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

function WorkOrderRow({
  wo,
  currentUser,
  onClaim,
  onUnclaim,
  onComplete,
  onAssign,
  onEscalate,
  onComment,
  showOverdue,
}: {
  wo: WorkOrder;
  currentUser: any;
  onClaim: (woNumber: string, e: React.MouseEvent) => void;
  onUnclaim: (woNumber: string, e: React.MouseEvent) => void;
  onComplete: (woNumber: string, e: React.MouseEvent) => void;
  onAssign: (woNumber: string) => void;
  onEscalate: (woNumber: string) => void;
  onComment: (woNumber: string) => void;
  showOverdue?: boolean;
}) {
  const woStatus = computeWOStatus(wo);
  const priority = parsePriority(wo.priority);
  const isClaimed = !!wo.claimedByUserId;
  const isMyTask = wo.claimedByUserId === currentUser?.id;
  const isCompleted = wo.status === "Completed";

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const dueDate = new Date(wo.complianceEndDate);
  dueDate.setHours(0, 0, 0, 0);
  const daysOverdue = Math.floor(
    (today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24)
  );

  return (
    <div className="px-4 py-4 hover:bg-slate-800/30 transition">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-bold text-white">{wo.description}</span>
            <StatusPill status={woStatus} />
            <PriorityPill priority={priority} />
            {showOverdue && daysOverdue > 0 && (
              <Pill tone="danger">{daysOverdue}d overdue</Pill>
            )}
          </div>
          <div className="text-sm text-slate-400 mt-1">
            WO# {wo.workOrderNumber} • {wo.woType}
          </div>
          <div className="text-xs text-slate-500 mt-1">
            {wo.organization} • {wo.equipmentDescription} • Due:{" "}
            {wo.complianceEndDate}
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
        </div>
      </div>

      {/* Action Buttons */}
      {!isCompleted && (
        <div className="flex items-center gap-2 mt-3 flex-wrap">
          {!isClaimed ? (
            <Button variant="primary" onClick={(e) => onClaim(wo.workOrderNumber, e)}>
              <Hand size={12} /> Claim
            </Button>
          ) : isMyTask ? (
            <Button variant="ghost" onClick={(e) => onUnclaim(wo.workOrderNumber, e)}>
              <Hand size={12} /> Unclaim
            </Button>
          ) : null}

          <Button
            variant="success"
            onClick={(e) => {
              e.stopPropagation();
              onAssign(wo.workOrderNumber);
            }}
          >
            <UserPlus size={12} /> Assign
          </Button>

          <Button
            variant="warn"
            onClick={(e) => {
              e.stopPropagation();
              onEscalate(wo.workOrderNumber);
            }}
          >
            <Flag size={12} /> Escalate
          </Button>

          <Button variant="solid" onClick={(e) => onComplete(wo.workOrderNumber, e)}>
            <CheckCircle2 size={12} /> Complete
          </Button>

          <Button
            variant="ghost"
            onClick={(e) => {
              e.stopPropagation();
              onComment(wo.workOrderNumber);
            }}
          >
            <MessageSquare size={12} /> Comment
          </Button>
        </div>
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

function StatusPill({ status }: { status: string }) {
  const tone =
    status === "Overdue"
      ? "danger"
      : status === "Due Soon"
        ? "warn"
        : status === "On Hold"
          ? "warn"
          : status === "Completed"
            ? "success"
            : "neutral";
  return <Pill tone={tone}>{status}</Pill>;
}

function PriorityPill({ priority }: { priority: number }) {
  const tone = priority <= 2 ? "danger" : priority === 3 ? "warn" : "neutral";
  return <Pill tone={tone}>P{priority}</Pill>;
}
