import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { AssignmentStatus } from "@/types/api";

export function useCreateAssignment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { jobId: string; candidateId: string; status?: AssignmentStatus }) =>
      fetch("/api/assignments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }).then((r) => r.json()),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ["job", vars.jobId] });
      qc.invalidateQueries({ queryKey: ["jobs"] });
      qc.invalidateQueries({ queryKey: ["candidate", vars.candidateId] });
    },
  });
}

export function useUpdateAssignment(jobId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: { id: string; status?: AssignmentStatus; position?: number }) =>
      fetch(`/api/assignments/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }).then((r) => r.json()),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["job", jobId] });
      qc.invalidateQueries({ queryKey: ["jobs"] });
    },
  });
}

export function useDeleteAssignment(jobId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => fetch(`/api/assignments/${id}`, { method: "DELETE" }).then((r) => r.json()),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["job", jobId] });
      qc.invalidateQueries({ queryKey: ["jobs"] });
    },
  });
}

export function useReorderAssignments(jobId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (updates: { id: string; status: AssignmentStatus; position: number }[]) =>
      fetch("/api/assignments/reorder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ updates }),
      }).then((r) => r.json()),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["job", jobId] });
      qc.invalidateQueries({ queryKey: ["jobs"] });
    },
  });
}
