import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { Candidate } from "@/types/api";

const API = "/api/candidates";

async function fetchCandidates(params?: Record<string, string>): Promise<Candidate[]> {
  const url = new URL(API, window.location.origin);
  if (params) Object.entries(params).forEach(([k, v]) => v && url.searchParams.set(k, v));
  const res = await fetch(url.toString());
  if (!res.ok) throw new Error("שגיאה בטעינת מועמדים");
  return res.json();
}

async function fetchCandidate(id: string): Promise<Candidate> {
  const res = await fetch(`${API}/${id}`);
  if (!res.ok) throw new Error("שגיאה בטעינת מועמד");
  return res.json();
}

export function useCandidates(params?: Record<string, string>) {
  return useQuery({ queryKey: ["candidates", params], queryFn: () => fetchCandidates(params) });
}

export function useCandidate(id: string) {
  return useQuery({ queryKey: ["candidate", id], queryFn: () => fetchCandidate(id), enabled: !!id });
}

export function useCreateCandidate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (formData: FormData) =>
      fetch(API, { method: "POST", body: formData }).then((r) => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["candidates"] }),
  });
}

export function useUpdateCandidate(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<Candidate>) =>
      fetch(`${API}/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }).then((r) => r.json()),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["candidates"] });
      qc.invalidateQueries({ queryKey: ["candidate", id] });
    },
  });
}

export function useDeleteCandidate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => fetch(`${API}/${id}`, { method: "DELETE" }).then((r) => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["candidates"] }),
  });
}

export function useUploadCV(candidateId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (formData: FormData) => {
      const r = await fetch(`${API}/${candidateId}/cv`, { method: "POST", body: formData });
      const json = await r.json();
      if (!r.ok) throw new Error(json.error || "שגיאה בהעלאת קובץ");
      return json;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["candidate", candidateId] }),
  });
}
