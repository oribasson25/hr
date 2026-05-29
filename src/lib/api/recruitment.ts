import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { RecruitmentStage } from "@/types/api";

export function useRecruitmentData() {
  return useQuery({
    queryKey: ["recruitment"],
    queryFn: () => fetch("/api/recruitment").then((r) => r.json()),
  });
}

export function useUpdateRecruitmentStage(candidateId?: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, recruitmentStage, startDate }: { id: string; recruitmentStage: RecruitmentStage; startDate?: string | null }) =>
      fetch(`/api/assignments/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recruitmentStage, ...(startDate !== undefined && { startDate }) }),
      }).then((r) => r.json()),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["recruitment"] });
      if (candidateId) qc.invalidateQueries({ queryKey: ["candidate", candidateId] });
    },
  });
}
