"use client";

import { useState, useMemo } from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  closestCorners,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import { toast } from "sonner";
import { Plus, AlertCircle, UserPlus, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import KanbanColumn from "./KanbanColumn";
import CandidateCard from "./CandidateCard";
import AddCandidateDialog from "./AddCandidateDialog";
import CandidateForm from "@/components/candidates/CandidateForm";
import CVPreview from "@/components/cv/CVPreview";
import { useReorderAssignments, useUpdateAssignment } from "@/lib/api/assignments";
import { useCreateCandidate } from "@/lib/api/candidates";
import { useHrStaff } from "@/lib/api/hr-staff";
import type { Job, JobAssignment, AssignmentStatus, Candidate } from "@/types/api";

const COLUMNS: { id: AssignmentStatus; label: string; color: string }[] = [
  { id: "leading", label: "מועמד מוביל", color: "border-t-brand-yellow bg-brand-yellow-soft" },
  { id: "candidate", label: "מועמד", color: "border-t-blue-400 bg-blue-50" },
  { id: "not_relevant", label: "לא רלוונטי", color: "border-t-gray-300 bg-gray-50" },
  { id: "future", label: "לעתיד", color: "border-t-purple-300 bg-purple-50" },
];

interface Props {
  job: Job & { assignments: (JobAssignment & { candidate: Candidate })[] };
}

export default function KanbanBoard({ job }: Props) {
  const [activeAssignment, setActiveAssignment] = useState<(JobAssignment & { candidate: Candidate }) | null>(null);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showNewCandidateForm, setShowNewCandidateForm] = useState(false);
  const [previewCandidate, setPreviewCandidate] = useState<Candidate | null>(null);
  const [hrStaffFilter, setHrStaffFilter] = useState("");

  const reorder = useReorderAssignments(job.id);
  const updateAssignment = useUpdateAssignment(job.id);
  const createCandidate = useCreateCandidate();
  const { data: hrStaff } = useHrStaff();

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const columns = useMemo(() => {
    const map: Record<AssignmentStatus, (JobAssignment & { candidate: Candidate })[]> = {
      leading: [], candidate: [], not_relevant: [], future: [],
    };
    job.assignments.forEach((a) => {
      if (a.recruitmentStage === "hired") return;
      if (hrStaffFilter && a.candidate?.hrStaffId !== hrStaffFilter) return;
      if (a.status in map) map[a.status as AssignmentStatus].push(a);
    });
    Object.keys(map).forEach((k) => {
      map[k as AssignmentStatus].sort((a, b) => a.position - b.position);
    });
    return map;
  }, [job.assignments, hrStaffFilter]);

  const handleDragStart = (event: DragStartEvent) => {
    const assignment = job.assignments.find((a) => a.id === event.active.id);
    if (assignment) setActiveAssignment(assignment);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    setActiveAssignment(null);
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const draggedId = active.id as string;
    const overId = over.id as string;

    const draggedAssignment = job.assignments.find((a) => a.id === draggedId);
    if (!draggedAssignment) return;

    const targetCol = COLUMNS.find((c) => c.id === overId);
    const targetAssignment = job.assignments.find((a) => a.id === overId);

    const newStatus: AssignmentStatus = targetCol ? targetCol.id : (targetAssignment?.status || draggedAssignment.status);

    if (newStatus !== draggedAssignment.status) {
      try {
        await updateAssignment.mutateAsync({ id: draggedId, status: newStatus, position: 0 });
        toast.success(`הועבר ל"${COLUMNS.find((c) => c.id === newStatus)?.label}"`);
      } catch {
        toast.error("שגיאה בהזזת המועמד");
      }
    }
  };

  const handleCreateCandidate = async (data: Parameters<typeof CandidateForm>[0]["onSubmit"] extends (d: infer D) => unknown ? D : never) => {
    const fd = new FormData();
    fd.append("fullName", data.fullName);
    fd.append("phone", data.phone);
    if (data.email) fd.append("email", data.email);
    if (data.address) fd.append("address", data.address);
    fd.append("appliedForJobId", job.id);
    if (data.source) fd.append("source", data.source);
    if (data.referredById) fd.append("referredById", data.referredById);
    if (data.salaryExpectation) fd.append("salaryExpectation", data.salaryExpectation);
    if (data.hrStaffId) fd.append("hrStaffId", data.hrStaffId);
    if (data.cv) fd.append("cv", data.cv);

    const result = await createCandidate.mutateAsync(fd);
    if (result.id) {
      toast.success("המועמד נוצר ושויך למשרה");
    } else {
      const msg = typeof result.error === "string" ? result.error : "שגיאה ביצירת מועמד";
      toast.error(msg);
      throw new Error(msg);
    }
  };

  const isFilled = job.status === "filled";

  const hrStaffInJob = useMemo(() => {
    if (!hrStaff) return [];
    const ids = new Set(job.assignments.map((a) => a.candidate?.hrStaffId).filter(Boolean));
    return hrStaff.filter((s) => ids.has(s.id));
  }, [hrStaff, job.assignments]);

  return (
    <div className={`relative ${isFilled ? "opacity-80" : ""}`}>
      {isFilled && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-xl flex items-center gap-2 text-green-800">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span className="text-sm font-medium">המשרה נסגרה — עמודת "לעתיד" נשארת פעילה לשמירת מועמדים</span>
        </div>
      )}

      <div className="flex justify-between items-center mb-4 gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <Button onClick={() => setShowAddDialog(true)} className="rounded-xl bg-brand-yellow text-brand-black hover:bg-brand-yellow-hover font-semibold gap-2" size="sm">
            <Plus className="w-4 h-4" />
            מועמד קיים
          </Button>
          <Button onClick={() => setShowNewCandidateForm(true)} variant="outline" className="rounded-xl gap-2" size="sm">
            <UserPlus className="w-4 h-4" />
            מועמד חדש
          </Button>
        </div>
        {hrStaffInJob.length > 0 && (
          <div className="relative">
            <select
              value={hrStaffFilter}
              onChange={(e) => setHrStaffFilter(e.target.value)}
              className="appearance-none pl-7 pr-3 py-1.5 text-sm rounded-xl border border-brand-gray-border bg-white text-brand-black focus:outline-none focus:ring-2 focus:ring-brand-yellow cursor-pointer"
            >
              <option value="">כל אנשי HR</option>
              {hrStaffInJob.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
            <ChevronDown className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-brand-gray pointer-events-none" />
          </div>
        )}
      </div>

      <DndContext sensors={sensors} collisionDetection={closestCorners} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        <div className="grid grid-cols-4 gap-4">
          {COLUMNS.map((col) => (
            <KanbanColumn
              key={col.id}
              id={col.id}
              label={col.label}
              color={col.color}
              assignments={columns[col.id]}
              jobId={job.id}
              disabled={isFilled && col.id !== "future"}
              onPreviewCV={(candidate) => setPreviewCandidate(candidate)}
            />
          ))}
        </div>

        <DragOverlay>
          {activeAssignment && (
            <CandidateCard assignment={activeAssignment} jobId={job.id} isDragging onPreviewCV={() => {}} />
          )}
        </DragOverlay>
      </DndContext>

      <AddCandidateDialog open={showAddDialog} onClose={() => setShowAddDialog(false)} jobId={job.id} />

      <CandidateForm
        open={showNewCandidateForm}
        onClose={() => setShowNewCandidateForm(false)}
        onSubmit={handleCreateCandidate}
        title={`מועמד חדש — ${job.title}`}
        loading={createCandidate.isPending}
        preselectedJobId={job.id}
      />

      {previewCandidate && (
        <CVPreview candidate={previewCandidate} open={!!previewCandidate} onClose={() => setPreviewCandidate(null)} />
      )}
    </div>
  );
}
