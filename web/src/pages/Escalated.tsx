import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  AlertTriangle,
  Hand,
  UserPlus,
  Flag,
  CheckCircle2,
  MessageSquare,
  ArrowRight,
} from "lucide-react";
import { Card, CardHeader, Button, Pill } from "../components/ui";
import {
  getWorkOrders,
  subscribe,
  claimWorkOrder,
  unclaimWorkOrder,
  assignWorkOrder,
  completeWorkOrder,
  addWorkOrderComment,
  updateWorkOrder,
} from "../data/dataStore";
import { getCurrentUser } from "../data/authStore";
import type { WorkOrder } from "../data/types";
import { computeWOStatus, parsePriority } from "../data/types";

export default function EscalatedPage() {
  const nav = useNavigate();
  const currentUser = getCurrentUser();
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [showAssignModal, setShowAssignModal] = useState<string | null>(null);
  const [showCommentModal, setShowCommentModal] = useState<string | null>(null);

  useEffect(() => {
    const update = () => setWorkOrders(getWorkOrders());
    update();
    return subscribe(update);
  }, []);

  // Escalated tasks (have escalation reason or on hold)
  const escalatedTasks = workOrders.filter(
    (wo) => wo.escalationReason || wo.status === "On Hold"
  );

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

  const handleReopen = (woNumber: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm("Reopen this work order and clear escalation?")) {
      updateWorkOrder(woNumber, {
        status: "Open",
        escalationReason: undefined,
        escalatedByUserName: undefined,
      });
    }
  };

  return (
    <div className="space-y-5">
      <Card>
        <CardHeader
          title="Escalated Tasks"
          subtitle={`${escalatedTasks.length} escalated or on hold`}
          icon={<AlertTriangle size={16} />}
        />

        {escalatedTasks.length === 0 ? (
          <div className="p-12 text-center">
            <CheckCircle2 size={48} className="mx-auto text-emerald-500 mb-4" />
            <div className="text-lg font-bold text-white mb-2">No Escalations</div>
            <div className="text-sm text-slate-400 mb-4">
              No work orders have been escalated or put on hold.
            </div>
            <Button onClick={() => nav("/work-orders")}>
              Browse Work Orders <ArrowRight size={14} />
            </Button>
          </div>
        ) : (
          <div className="divide-y divide-slate-700/50">
            {escalatedTasks.map((wo) => (
              <WorkOrderRow
                key={wo.id}
                wo={wo}
                currentUser={currentUser}
                onClaim={handleClaim}
                onUnclaim={handleUnclaim}
                onComplete={handleComplete}
                onReopen={handleReopen}
                onAssign={(woNum) => setShowAssignModal(woNum)}
                onComment={(woNum) => setShowCommentModal(woNum)}
              />
            ))}
          </div>
        )}
      </Card>

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

      {showCommentModal && (
        <Modal
          title="Add Comment"
          onClose={() => setShowCommentModal(null)}
          onSubmit={() => {
            const comment = (
              document.getElementById("comment-text-esc") as HTMLTextAreaElement
            )?.value;
            if (!comment?.trim() || !currentUser) return;
            addWorkOrderComment(showCommentModal, comment, currentUser.name);
            setShowCommentModal(null);
          }}
        >
          <div className="space-y-2">
            <label className="text-sm text-slate-300">Comment</label>
            <textarea
              id="comment-text-esc"
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
  onReopen,
  onAssign,
  onComment,
}: {
  wo: WorkOrder;
  currentUser: any;
  onClaim: (woNumber: string, e: React.MouseEvent) => void;
  onUnclaim: (woNumber: string, e: React.MouseEvent) => void;
  onComplete: (woNumber: string, e: React.MouseEvent) => void;
  onReopen: (woNumber: string, e: React.MouseEvent) => void;
  onAssign: (woNumber: string) => void;
  onComment: (woNumber: string) => void;
}) {
  const woStatus = computeWOStatus(wo);
  const priority = parsePriority(wo.priority);
  const isClaimed = !!wo.claimedByUserId;
  const isMyTask = wo.claimedByUserId === currentUser?.id;
  const isCompleted = wo.status === "Completed";

  return (
    <div className="px-4 py-4 hover:bg-slate-800/30 transition">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-bold text-white">{wo.description}</span>
            <StatusPill status={woStatus} />
            <PriorityPill priority={priority} />
          </div>
          <div className="text-sm text-slate-400 mt-1">
            WO# {wo.workOrderNumber} • {wo.woType}
          </div>
          <div className="text-xs text-slate-500 mt-1">
            {wo.organization} • Due: {wo.complianceEndDate}
          </div>
          {wo.escalationReason && (
            <div className="text-xs text-amber-400 mt-2 flex items-start gap-1 bg-amber-500/10 rounded-lg p-2">
              <Flag size={12} className="mt-0.5 shrink-0" />
              <div>
                <span className="font-bold">Escalated:</span> {wo.escalationReason}
                {wo.escalatedByUserName && (
                  <span className="text-amber-500"> — by {wo.escalatedByUserName}</span>
                )}
              </div>
            </div>
          )}
          {isClaimed && (
            <div className="text-xs text-blue-400 mt-1 flex items-center gap-1">
              <Hand size={10} />
              Claimed by {wo.claimedByUserName}
            </div>
          )}
        </div>
      </div>

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
          <Button variant="solid" onClick={(e) => onReopen(wo.workOrderNumber, e)}>
            <AlertTriangle size={12} /> Reopen
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
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button variant="primary" onClick={onSubmit}>Submit</Button>
        </div>
      </div>
    </div>
  );
}

function StatusPill({ status }: { status: string }) {
  const tone =
    status === "Overdue" ? "danger" :
    status === "Due Soon" ? "warn" :
    status === "On Hold" ? "warn" :
    status === "Completed" ? "success" : "neutral";
  return <Pill tone={tone}>{status}</Pill>;
}

function PriorityPill({ priority }: { priority: number }) {
  const tone = priority <= 2 ? "danger" : priority === 3 ? "warn" : "neutral";
  return <Pill tone={tone}>P{priority}</Pill>;
}
