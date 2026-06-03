"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { FileText, MoreVertical, X, GripVertical, MessageSquare } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { useDeleteAssignment, useUpdateAssignment } from "@/lib/api/assignments";
import type { JobAssignment, Candidate, AssignmentStatus } from "@/types/api";
import { cn } from "@/lib/utils";

interface Props {
  assignment: JobAssignment & { candidate: Candidate };
  jobId: string;
  isDragging?: boolean;
  onPreviewCV: (candidate: Candidate) => void;
}

export default function CandidateCard({ assignment, jobId, isDragging, onPreviewCV }: Props) {
  const router = useRouter();
  const { attributes, listeners, setNodeRef, transform, transition, isDragging: isSortableDragging } = useSortable({ id: assignment.id });

  const deleteAssignment = useDeleteAssignment(jobId);
  const updateAssignment = useUpdateAssignment(jobId);

  const STATUS_OPTIONS: { value: AssignmentStatus; label: string }[] = [
    { value: "leading", label: "מועמד מוביל" },
    { value: "candidate", label: "מועמד" },
    { value: "future", label: "לעתיד" },
    { value: "not_relevant", label: "לא רלוונטי" },
  ];

  const handleMoveToStatus = async (status: AssignmentStatus) => {
    try {
      await updateAssignment.mutateAsync({ id: assignment.id, status });
      toast.success(`הועבר ל"${STATUS_OPTIONS.find(s => s.value === status)?.label}"`);
    } catch {
      toast.error("שגיאה בהזזת המועמד");
    }
  };

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isSortableDragging ? 0.3 : 1,
  };

  const candidate = assignment.candidate;
  const date = new Date(assignment.createdAt).toLocaleDateString("he-IL", { day: "2-digit", month: "2-digit" });

  const handleRemove = async () => {
    try {
      await deleteAssignment.mutateAsync(assignment.id);
      toast.success("המועמד הוסר מהמשרה");
    } catch {
      toast.error("שגיאה בהסרת המועמד");
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "bg-white rounded-xl border border-brand-gray-border p-3 shadow-sm",
        "hover:shadow-md transition-all duration-150",
        isDragging && "shadow-xl rotate-2 scale-105"
      )}
    >
      <div className="flex items-start gap-2">
        <button
          {...attributes}
          {...listeners}
          className="mt-0.5 text-brand-gray opacity-40 hover:opacity-70 cursor-grab active:cursor-grabbing flex-shrink-0"
          aria-label="גרור"
        >
          <GripVertical className="w-4 h-4" />
        </button>
        <div className="flex-1 min-w-0">
          <button
            onClick={() => router.push(`/candidates/${candidate.id}`)}
            className="font-semibold text-brand-black text-sm truncate hover:underline text-right w-full"
          >
            {candidate.fullName}
          </button>
          <p className="text-xs text-brand-gray truncate">{candidate.phone}</p>
          <p className="text-xs text-brand-gray truncate">{candidate.email}</p>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          {candidate.notes && candidate.notes.length > 0 && (
            <span className="p-1 text-brand-gray">
              <MessageSquare className="w-4 h-4" />
            </span>
          )}
          {candidate.cvFilePath && (
            <button
              onClick={() => onPreviewCV(candidate)}
              className="p-1 text-brand-gray hover:text-brand-black rounded-lg hover:bg-brand-gray-light transition-colors"
              aria-label="צפייה בקורות חיים"
            >
              <FileText className="w-4 h-4" />
            </button>
          )}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="p-1 text-brand-gray hover:text-brand-black rounded-lg hover:bg-brand-gray-light transition-colors"
              >
                <MoreVertical className="w-4 h-4" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuLabel className="text-xs text-brand-gray font-normal">העבר לעמודה</DropdownMenuLabel>
              {STATUS_OPTIONS.filter(s => s.value !== assignment.status).map(s => (
                <DropdownMenuItem key={s.value} onClick={() => handleMoveToStatus(s.value)} className="text-sm">
                  {s.label}
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleRemove} className="text-red-600 focus:text-red-600 gap-2">
                <X className="w-4 h-4" />
                הסר מהמשרה
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      <div className="mt-2 mr-6 space-y-1.5">
        <span className="text-xs text-brand-gray opacity-70">{date}</span>
        {candidate.notes && candidate.notes[0] && (
          <p className="text-xs text-brand-gray leading-relaxed line-clamp-3 break-words">
            {candidate.notes[0].content}
          </p>
        )}
      </div>
    </div>
  );
}
