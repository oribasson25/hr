"use client";

import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import CandidateCard from "./CandidateCard";
import type { JobAssignment, AssignmentStatus, Candidate } from "@/types/api";

interface Props {
  id: AssignmentStatus;
  label: string;
  color: string;
  assignments: (JobAssignment & { candidate: Candidate })[];
  jobId: string;
  disabled?: boolean;
  onPreviewCV: (candidate: Candidate) => void;
}

export default function KanbanColumn({ id, label, color, assignments, jobId, disabled, onPreviewCV }: Props) {
  const { setNodeRef, isOver } = useDroppable({ id });

  return (
    <div
      ref={setNodeRef}
      className={`flex flex-col rounded-2xl border-t-4 ${color} ${
        isOver ? "ring-2 ring-brand-yellow ring-offset-1" : ""
      } ${disabled ? "opacity-50 pointer-events-none" : ""} min-h-64 transition-all duration-150`}
    >
      <div className="px-4 py-3 flex items-center justify-between">
        <h3 className="font-semibold text-sm text-brand-black">{label}</h3>
        <span className="text-xs text-brand-gray bg-white rounded-full px-2 py-0.5 border border-brand-gray-border">
          {assignments.length}
        </span>
      </div>

      <div className="flex-1 px-3 pb-3 overflow-y-auto">
        <SortableContext items={assignments.map((a) => a.id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-2">
            {assignments.map((assignment) => (
              <CandidateCard
                key={assignment.id}
                assignment={assignment}
                jobId={jobId}
                onPreviewCV={onPreviewCV}
              />
            ))}
          </div>
        </SortableContext>
        {assignments.length === 0 && (
          <div className="text-center py-6 text-brand-gray text-xs opacity-70">גרור מועמד לכאן</div>
        )}
      </div>
    </div>
  );
}
