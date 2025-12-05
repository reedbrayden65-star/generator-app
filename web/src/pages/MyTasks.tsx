import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  User,
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
  escalateWorkOrder,
  completeWorkOrder,
  addWorkOrderComment,
} from "../data/dataStore";
import { getCurrentUser } from "../data/authStore";
import type { WorkOrder } from "../data/types";
import { computeWOStatus, parsePriority } from "../data/types";

export default function MyTasksPage() {
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

  // My tasks (claimed or assigned to me)
  const myTasks = workOrders.filter(
    (wo) =>
      wo.status !== "Completed" &&
      (wo.claimedByUserId === currentUser?.id ||
        wo.assignedToUserId === currentUser?.id)
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

  return (
    <div className="space-y-5">
      <Card>
        <CardHeader
          title="My Tasks"
          subtitle={`${myTasks.length} task${myTasks.length !== 1 ? "s" : ""} claimed or assigned to you`}
          icon={<User size={16} />}
        />

        {myTasks.length === 0 ? (
          <div className="p-12 text-center">
            <User size={48} className="mx-auto text-slate-600 mb-4" />
            <div className="text-lg font-bold text-white mb-2">No Tasks</div>
            <div className="text-sm text-slate-400 mb-4">
              You haven't claimed or been assigned any work orders yet.
            </div>
            <Button onClick={() => nav("/work-orders")}>
              Browse Work Orders <ArrowRight size={14} />
            </Button>
          </div>
        ) : (
          <div className="divide-y divide-slate-700/50">
            {myTasks.map((wo) => (
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

      {showEscalateModal && (
        <Modal
          title="Escalate Work Order"
          onClose={() => setShowEscalateModal(null)}
          onSubmit={() => {
            const reason = (
              document.getElementById("escalate-reason-my") as HTMLTextAreaElement
            )?.value;
            if (!reason?.trim() || !currentUser) return;
            escalateWorkOrder(showEscalateModal, reason, currentUser.name);
            setShowEscalateModal(null);
          }}
        >
          <div className="space-y-2">
            <label className="text-sm text-slate-300">Escalation Reason</label>
            <textarea
              id="escalate-reason-my"
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
              document.getElementById("comment-text-my") as HTMLTextAreaElement
            )?.value;
            if (!comment?.trim() || !currentUser) return;
            addWorkOrderComment(showCommentModal, comment, currentUser.name);
            setShowCommentModal(null);
          }}
        >
          <div className="space-y-2">
            <label className="text-sm text-slate-300">Comment</label>
            <textarea
              id="comment-text-my"
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
}: {
  wo: WorkOrder;
  currentUser: any;
  onClaim: (woNumber: string, e: React.MouseEvent) => void;
  onUnclaim: (woNumber: string, e: React.MouseEvent) => void;
  onComplete: (woNumber: string, e: React.MouseEvent) => void;
  onAssign: (woNumber: string) => void;
  onEscalate: (woNumber: string) => void;
  onComment: (woNumber: string) => void;
}) {
  const woStatus = computeWOStatus(wo);
  const priority = parsePriority(wo.priority);
  const isClaimed = !!wo.claimedByUserId;
  const isMyTask = wo.claimedByUserId === currentUser?.id;

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

      <div className="flex items-center gap-2 mt-3 flex-wrap">
        {isMyTask && (
          <Button variant="ghost" onClick={(e) => onUnclaim(wo.workOrderNumber, e)}>
            <Hand size={12} /> Unclaim
          </Button>
        )}
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
