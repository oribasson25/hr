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
import { Plus, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import KanbanColumn from "./KanbanColumn";
import CandidateCard from "./CandidateCard";
import AddCandidateDialog from "./AddCandidateDialog";
import CVPreview from "@/components/cv/CVPreview";
import { useReorderAssignments, useUpdateAssignment } from "@/lib/api/assignments";
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
  const [previewCandidate, setPreviewCandidate] = useState<Candidate | null>(null);

  const reorder = useReorderAssignments(job.id);
  const updateAssignment = useUpdateAssignment(job.id);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const columns = useMemo(() => {
    const map: Record<AssignmentStatus, (JobAssignment & { candidate: Candidate })[]> = {
      leading: [], candidate: [], not_relevant: [], future: [],
    };
    job.assignments.forEach((a) => {
      if (a.status in map) map[a.status as AssignmentStatus].push(a);
    });
    Object.keys(map).forEach((k) => {
      map[k as AssignmentStatus].sort((a, b) => a.position - b.position);
    });
    return map;
  }, [job.assignments]);

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

  const isFilled = job.status === "filled";

  return (
    <div className={`relative ${isFilled ? "opacity-80" : ""}`}>
      {isFilled && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-xl flex items-center gap-2 text-green-800">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span className="text-sm font-medium">המשרה אויישה — עמודת "לעתיד" נשארת פעילה לשמירת מועמדים</span>
        </div>
      )}

      <div className="flex justify-between items-center mb-4">
        <Button
          onClick={() => setShowAddDialog(true)}
          className="rounded-xl bg-brand-yellow text-brand-black hover:bg-brand-yellow-hover font-semibold gap-2"
          size="sm"
        >
          <Plus className="w-4 h-4" />
          הוסף מועמד למשרה
        </Button>
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
            <CandidateCard
              assignment={activeAssignment}
              jobId={job.id}
              isDragging
              onPreviewCV={() => {}}
            />
          )}
        </DragOverlay>
      </DndContext>

      <AddCandidateDialog
        open={showAddDialog}
        onClose={() => setShowAddDialog(false)}
        jobId={job.id}
      />

      {previewCandidate && (
        <CVPreview
          candidate={previewCandidate}
          open={!!previewCandidate}
          onClose={() => setPreviewCandidate(null)}
        />
      )}
    </div>
  );
}
