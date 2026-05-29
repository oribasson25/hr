import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export function useInterviews() {
  return useQuery({
    queryKey: ["interviews"],
    queryFn: () => fetch("/api/interviews").then((r) => r.json()),
  });
}

export function useUpdateInterview(candidateId?: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      interviewSummary,
      interviewRating,
    }: {
      id: string;
      interviewSummary?: string | null;
      interviewRating?: number | null;
    }) =>
      fetch(`/api/assignments/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ interviewSummary, interviewRating }),
      }).then((r) => r.json()),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["interviews"] });
      qc.invalidateQueries({ queryKey: ["recruitment"] });
      if (candidateId) qc.invalidateQueries({ queryKey: ["candidate", candidateId] });
    },
  });
}
