"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Search } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCandidates } from "@/lib/api/candidates";
import { useCreateAssignment } from "@/lib/api/assignments";
import type { AssignmentStatus } from "@/types/api";

interface Props {
  open: boolean;
  onClose: () => void;
  jobId: string;
}

export default function AddCandidateDialog({ open, onClose, jobId }: Props) {
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState("");
  const [status, setStatus] = useState<AssignmentStatus>("candidate");

  const { data: candidates } = useCandidates({ search });
  const createAssignment = useCreateAssignment();

  const handleSubmit = async () => {
    if (!selectedId) { toast.error("יש לבחור מועמד"); return; }
    try {
      await createAssignment.mutateAsync({ jobId, candidateId: selectedId, status });
      toast.success("המועמד שויך למשרה");
      onClose();
      setSelectedId("");
      setSearch("");
    } catch {
      toast.error("שגיאה בשיוך המועמד — ייתכן שהוא כבר משויך");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md rounded-2xl">
        <DialogHeader>
          <DialogTitle>הוספת מועמד למשרה</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-gray" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="חפשי לפי שם, אימייל..."
              className="pr-9 rounded-xl"
            />
          </div>

          {candidates && candidates.length > 0 && (
            <div className="max-h-48 overflow-y-auto border border-brand-gray-border rounded-xl divide-y">
              {candidates.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setSelectedId(c.id)}
                  className={`w-full text-right px-4 py-2.5 hover:bg-brand-gray-light transition-colors flex items-center justify-between ${
                    selectedId === c.id ? "bg-brand-yellow-soft" : ""
                  }`}
                >
                  <div>
                    <p className="font-medium text-brand-black text-sm">{c.fullName}</p>
                    <p className="text-xs text-brand-gray">{c.email}</p>
                  </div>
                  {selectedId === c.id && <span className="text-xs text-brand-yellow font-bold">✓</span>}
                </button>
              ))}
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-brand-black">סטטוס התחלתי</label>
            <Select value={status} onValueChange={(v) => v && setStatus(v as AssignmentStatus)}>
              <SelectTrigger className="rounded-xl">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="leading">מועמד מוביל</SelectItem>
                <SelectItem value="candidate">מועמד</SelectItem>
                <SelectItem value="not_relevant">לא רלוונטי</SelectItem>
                <SelectItem value="future">לעתיד</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose} className="rounded-xl">ביטול</Button>
          <Button
            onClick={handleSubmit}
            disabled={!selectedId || createAssignment.isPending}
            className="rounded-xl bg-brand-yellow text-brand-black hover:bg-brand-yellow-hover font-semibold"
          >
            {createAssignment.isPending ? "מוסיף..." : "הוסף"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
