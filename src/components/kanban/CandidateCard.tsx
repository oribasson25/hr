"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { FileText, MoreVertical, X, GripVertical } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useDeleteAssignment } from "@/lib/api/assignments";
import type { JobAssignment, Candidate } from "@/types/api";
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
            <DropdownMenuTrigger className="p-1 text-brand-gray hover:text-brand-black rounded-lg hover:bg-brand-gray-light transition-colors">
              <MoreVertical className="w-4 h-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuItem onClick={handleRemove} className="text-red-600 focus:text-red-600 gap-2">
                <X className="w-4 h-4" />
                הסר מהמשרה
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      <div className="mt-2 mr-6">
        <span className="text-xs text-brand-gray opacity-70">{date}</span>
      </div>
    </div>
  );
}
