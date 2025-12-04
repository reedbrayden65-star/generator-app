import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  AlertTriangle,
  Info,
  Calendar,
  UserPlus,
  Flag,
  CheckCircle2,
  MessageSquare,
  Hand,
} from "lucide-react";
import { Card, CardHeader, Button, Pill } from "../components/ui";
import {
  getGenerator,
  getWorkOrdersByGenerator,
  subscribe,
  claimWorkOrder,
  unclaimWorkOrder,
  assignWorkOrder,
  escalateWorkOrder,
  completeWorkOrder,
  addWorkOrderComment,
} from "../data/dataStore";
import { getCurrentUser } from "../data/authStore";
import type { Generator, WorkOrder } from "../data/types";
import { computeWOStatus, parsePriority, getPriorityLabel } from "../data/types";

export default function GeneratorView() {
  const { buildingId, generatorId } = useParams();
  const nav = useNavigate();
  const buildingName = decodeURIComponent(buildingId || "");
  const assetId = decodeURIComponent(generatorId || "");

  const [generator, setGenerator] = useState<Generator | undefined>();
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [showAssignModal, setShowAssignModal] = useState<string | null>(null);
  const [showEscalateModal, setShowEscalateModal] = useState<string | null>(null);
  const [showCommentModal, setShowCommentModal] = useState<string | null>(null);
  const [showInfoModal, setShowInfoModal] = useState(false);
  const currentUser = getCurrentUser();

  useEffect(() => {
    const update = () => {
      setGenerator(getGenerator(assetId));
      setWorkOrders(getWorkOrdersByGenerator(assetId));
    };
    update();
    return subscribe(update);
  }, [assetId]);

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

  if (!generator) {
    return (
      <Card>
        <div className="p-8 text-center text-slate-400">
          Generator not found: {assetId}
        </div>
      </Card>
    );
  }

  const stats = {
    open: workOrders.filter((wo) => wo.status === "Open").length,
    onHold: workOrders.filter((wo) => wo.status === "On Hold").length,
    overdue: workOrders.filter((wo) => computeWOStatus(wo) === "Overdue").length,
    completed: workOrders.filter((wo) => wo.status === "Completed").length,
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <Card>
        <CardHeader
          title={generator.unitNumber}
          subtitle={`${buildingName} • Asset ID: ${generator.assetId}`}
          right={
            <div className="flex items-center gap-2">
              <Button
                variant="primary"
                onClick={() => setShowInfoModal(true)}
              >
                <Info size={14} /> Full Info
              </Button>
              <Button
                variant="ghost"
                onClick={() => nav(`/buildings/${encodeURIComponent(buildingName)}`)}
              >
                <ArrowLeft size={16} /> Back
              </Button>
            </div>
          }
        />

        {/* Generator Info */}
        <div className="p-4 grid grid-cols-2 gap-4 md:grid-cols-4">
          <InfoItem label="Manufacturer" value={generator.manufacturer || "—"} />
          <InfoItem label="Model" value={generator.model || "—"} />
          <InfoItem label="Serial" value={generator.serial || "—"} />
          <InfoItem label="Size" value={generator.sizeKW ? `${generator.sizeKW} KW` : "—"} />
          <InfoItem label="Run Hours" value={generator.runHours || "—"} />
          <InfoItem label="Fuel Level" value={generator.fuelLevelPercent ? `${generator.fuelLevelPercent}%` : "—"} />
          <InfoItem label="PFHO Status" value={generator.pfhoStatus || "—"} />
          <InfoItem label="FSB Status" value={generator.fsbStatus || "—"} />
        </div>

        {/* PM Schedule */}
        {(generator.pm3M || generator.pm6M || generator.pm12M) && (
          <div className="border-t border-slate-700 p-4">
            <div className="text-xs font-bold text-slate-400 mb-3 flex items-center gap-2">
              <Calendar size={14} />
              PM Schedule
            </div>
            <div className="grid grid-cols-3 gap-3">
              {generator.pm3M && (
                <div className="rounded-xl bg-slate-800/50 p-3">
                  <div className="text-xs text-slate-400">3 Month PM</div>
                  <div className="font-bold text-white">{generator.pm3M}</div>
                </div>
              )}
              {generator.pm6M && (
                <div className="rounded-xl bg-slate-800/50 p-3">
                  <div className="text-xs text-slate-400">6 Month PM</div>
                  <div className="font-bold text-white">{generator.pm6M}</div>
                </div>
              )}
              {generator.pm12M && (
                <div className="rounded-xl bg-slate-800/50 p-3">
                  <div className="text-xs text-slate-400">12 Month PM</div>
                  <div className="font-bold text-white">{generator.pm12M}</div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Notes / Issues */}
        {(generator.notes || generator.knownIssues) && (
          <div className="border-t border-slate-700 p-4 space-y-3">
            {generator.notes && (
              <div className="rounded-xl bg-slate-800/50 p-3">
                <div className="text-xs text-slate-400 mb-1 flex items-center gap-1">
                  <Info size={12} /> Notes
                </div>
                <div className="text-sm text-white">{generator.notes}</div>
              </div>
            )}
            {generator.knownIssues && (
              <div className="rounded-xl bg-amber-950/30 border border-amber-800 p-3">
                <div className="text-xs text-amber-400 mb-1 flex items-center gap-1">
                  <AlertTriangle size={12} /> Known Issues
                </div>
                <div className="text-sm text-amber-200">{generator.knownIssues}</div>
              </div>
            )}
          </div>
        )}
      </Card>

      {/* Work Order Stats */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard label="Open" value={stats.open} color="#22c55e" />
        <StatCard label="On Hold" value={stats.onHold} color="#f59e0b" />
        <StatCard label="Overdue" value={stats.overdue} color="#ef4444" />
        <StatCard label="Completed" value={stats.completed} color="#3b82f6" />
      </div>

      {/* Work Orders */}
      <Card>
        <CardHeader
          title="Work Orders"
          subtitle={`${workOrders.length} for this generator`}
        />

        {workOrders.length === 0 ? (
          <div className="p-4 text-sm text-slate-400">
            No work orders for this generator.
          </div>
        ) : (
          <div className="divide-y divide-slate-700/50">
            {workOrders.map((wo) => {
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
                        Due: {wo.complianceEndDate} • {getPriorityLabel(priority)}
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
            const reason = (document.getElementById("escalate-reason") as HTMLTextAreaElement)?.value;
            if (!reason?.trim() || !currentUser) return;
            escalateWorkOrder(showEscalateModal, reason, currentUser.name);
            setShowEscalateModal(null);
          }}
        >
          <div className="space-y-2">
            <label className="text-sm text-slate-300">Escalation Reason</label>
            <textarea
              id="escalate-reason"
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
            const comment = (document.getElementById("comment-text") as HTMLTextAreaElement)?.value;
            if (!comment?.trim() || !currentUser) return;
            addWorkOrderComment(showCommentModal, comment, currentUser.name);
            setShowCommentModal(null);
          }}
        >
          <div className="space-y-2">
            <label className="text-sm text-slate-300">Comment</label>
            <textarea
              id="comment-text"
              className="w-full rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-sm text-white outline-none focus:border-blue-500"
              rows={3}
              placeholder="Enter your comment..."
            />
          </div>
        </Modal>
      )}

      {/* Generator Info Modal */}
      {showInfoModal && generator && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm overflow-y-auto py-8">
          <div className="w-full max-w-2xl mx-4 rounded-2xl border border-slate-700 bg-gradient-to-br from-slate-900 to-slate-800 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-700 px-6 py-4">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Info size={18} className="text-blue-400" />
                  Generator Information
                </h3>
                <p className="text-sm text-slate-400">{generator.unitNumber} • {generator.assetId}</p>
              </div>
              <Button variant="ghost" onClick={() => setShowInfoModal(false)}>
                ✕
              </Button>
            </div>
            
            <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
              {/* Location */}
              <InfoSection title="Location">
                <InfoRow label="Campus" value={generator.campus} />
                <InfoRow label="Building" value={generator.building} />
                <InfoRow label="Unit Number" value={generator.unitNumber} />
                <InfoRow label="Asset ID" value={generator.assetId} />
              </InfoSection>

              {/* Equipment Details */}
              <InfoSection title="Equipment Details">
                <InfoRow label="Manufacturer" value={generator.manufacturer} />
                <InfoRow label="Model" value={generator.model} />
                <InfoRow label="Serial Number" value={generator.serial} />
                <InfoRow label="Size (KW)" value={generator.sizeKW} />
                <InfoRow label="Enclosure Manufacturer" value={generator.enclosureManufacturer} />
              </InfoSection>

              {/* Status & Metrics */}
              <InfoSection title="Status & Metrics">
                <InfoRow label="Run Hours" value={generator.runHours} />
                <InfoRow label="Fuel Level %" value={generator.fuelLevelPercent} />
                <InfoRow label="PFHO Status" value={generator.pfhoStatus} />
                <InfoRow label="FSB Status" value={generator.fsbStatus} />
                <InfoRow label="Load Bank" value={generator.loadBank} />
                <InfoRow label="Warranty Expiration" value={generator.warrantyExpiration} />
              </InfoSection>

              {/* PM Schedule */}
              <InfoSection title="PM Schedule">
                <InfoRow label="3 Month PM" value={generator.pm3M} />
                <InfoRow label="3 Month Window" value={generator.pm3MWindow} />
                <InfoRow label="6 Month PM" value={generator.pm6M} />
                <InfoRow label="6 Month Window" value={generator.pm6MWindow} />
                <InfoRow label="12 Month PM" value={generator.pm12M} />
                <InfoRow label="12 Month Window" value={generator.pm12MWindow} />
              </InfoSection>

              {/* Notes */}
              {(generator.notes || generator.knownIssues) && (
                <InfoSection title="Notes & Issues">
                  {generator.notes && (
                    <div className="col-span-2 rounded-lg bg-slate-800/50 p-3">
                      <div className="text-xs text-slate-400 mb-1">Notes</div>
                      <div className="text-sm text-white whitespace-pre-wrap">{generator.notes}</div>
                    </div>
                  )}
                  {generator.knownIssues && (
                    <div className="col-span-2 rounded-lg bg-amber-950/30 border border-amber-800 p-3">
                      <div className="text-xs text-amber-400 mb-1 flex items-center gap-1">
                        <AlertTriangle size={12} /> Known Issues
                      </div>
                      <div className="text-sm text-amber-200 whitespace-pre-wrap">{generator.knownIssues}</div>
                    </div>
                  )}
                </InfoSection>
              )}
            </div>

            <div className="border-t border-slate-700 px-6 py-4 flex justify-end">
              <Button variant="primary" onClick={() => setShowInfoModal(false)}>
                Close
              </Button>
            </div>
          </div>
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

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-xs text-slate-400">{label}</div>
      <div className="font-bold text-white">{value}</div>
    </div>
  );
}

function StatCard({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: string;
}) {
  return (
    <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-4">
      <div className="text-xs text-slate-400">{label}</div>
      <div className="mt-1 flex items-center gap-2">
        <span className="h-3 w-3 rounded-full" style={{ background: color }} />
        <span className="text-2xl font-extrabold text-white">{value}</span>
      </div>
    </div>
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

function InfoSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h4 className="text-sm font-bold text-blue-400 mb-3 flex items-center gap-2">
        <span className="h-1 w-1 rounded-full bg-blue-400" />
        {title}
      </h4>
      <div className="grid grid-cols-2 gap-3">
        {children}
      </div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-slate-800/40 px-3 py-2">
      <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">{label}</div>
      <div className="text-sm font-semibold text-white mt-0.5">{value || "—"}</div>
    </div>
  );
}
