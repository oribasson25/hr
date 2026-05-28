import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { Job } from "@/types/api";

const API = "/api/jobs";

async function fetchJobs(status?: string): Promise<Job[]> {
  const url = status && status !== "all" ? `${API}?status=${status}` : API;
  const res = await fetch(url);
  if (!res.ok) throw new Error("שגיאה בטעינת משרות");
  return res.json();
}

async function fetchJob(id: string): Promise<Job> {
  const res = await fetch(`${API}/${id}`);
  if (!res.ok) throw new Error("שגיאה בטעינת משרה");
  return res.json();
}

export function useJobs(status?: string) {
  return useQuery({ queryKey: ["jobs", status], queryFn: () => fetchJobs(status) });
}

export function useJob(id: string) {
  return useQuery({ queryKey: ["job", id], queryFn: () => fetchJob(id), enabled: !!id });
}

export function useCreateJob() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { title: string; description: string; requirements: string }) =>
      fetch(API, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }).then((r) => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["jobs"] }),
  });
}

export function useUpdateJob(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<Job>) =>
      fetch(`${API}/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }).then((r) => r.json()),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["jobs"] });
      qc.invalidateQueries({ queryKey: ["job", id] });
    },
  });
}

export function useDeleteJob() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => fetch(`${API}/${id}`, { method: "DELETE" }).then((r) => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["jobs"] }),
  });
}
