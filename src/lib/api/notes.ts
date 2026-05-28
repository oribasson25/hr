import { useMutation, useQueryClient } from "@tanstack/react-query";

export function useCreateNote(candidateId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (content: string) =>
      fetch(`/api/candidates/${candidateId}/notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      }).then((r) => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["candidate", candidateId] }),
  });
}

export function useUpdateNote(candidateId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, content }: { id: string; content: string }) =>
      fetch(`/api/notes/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      }).then((r) => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["candidate", candidateId] }),
  });
}

export function useDeleteNote(candidateId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => fetch(`/api/notes/${id}`, { method: "DELETE" }).then((r) => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["candidate", candidateId] }),
  });
}
