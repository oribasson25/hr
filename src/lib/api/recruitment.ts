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
    mutationFn: ({ id, recruitmentStage, startDate, interviewDate }: {
      id: string;
      recruitmentStage: RecruitmentStage;
      startDate?: string | null;
      interviewDate?: string | null;
    }) =>
      fetch(`/api/assignments/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recruitmentStage,
          ...(startDate !== undefined && { startDate }),
          ...(interviewDate !== undefined && { interviewDate }),
        }),
      }).then((r) => r.json()),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["recruitment"] });
      qc.invalidateQueries({ queryKey: ["interviews"] });
      if (candidateId) qc.invalidateQueries({ queryKey: ["candidate", candidateId] });
    },
  });
}
