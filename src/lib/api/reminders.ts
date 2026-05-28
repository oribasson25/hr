import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { Reminder } from "@/types/api";

const API = "/api/reminders";

type RemindersFilter = {
  isDone?: boolean;
  jobId?: string;
  candidateId?: string;
};

function buildQuery(filter: RemindersFilter) {
  const params = new URLSearchParams();
  if (filter.isDone !== undefined) params.set("isDone", String(filter.isDone));
  if (filter.jobId) params.set("jobId", filter.jobId);
  if (filter.candidateId) params.set("candidateId", filter.candidateId);
  const q = params.toString();
  return q ? `${API}?${q}` : API;
}

export function useReminders(filter: RemindersFilter = {}) {
  return useQuery<Reminder[]>({
    queryKey: ["reminders", filter],
    queryFn: () => fetch(buildQuery(filter)).then((r) => r.json()),
  });
}

export function usePendingRemindersCount() {
  return useQuery<number>({
    queryKey: ["reminders-count"],
    queryFn: () =>
      fetch(`${API}?isDone=false`)
        .then((r) => r.json())
        .then((data: Reminder[]) => data.length),
    refetchInterval: 60_000,
  });
}

export function useCreateReminder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { title: string; dueDate?: string | null; jobId?: string | null; candidateId?: string | null }) =>
      fetch(API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }).then((r) => r.json()),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["reminders"] });
      qc.invalidateQueries({ queryKey: ["reminders-count"] });
    },
  });
}

export function useUpdateReminder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: { id: string; title?: string; isDone?: boolean; dueDate?: string | null; jobId?: string | null; candidateId?: string | null }) =>
      fetch(`${API}/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }).then((r) => r.json()),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["reminders"] });
      qc.invalidateQueries({ queryKey: ["reminders-count"] });
    },
  });
}

export function useDeleteReminder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      fetch(`${API}/${id}`, { method: "DELETE" }).then((r) => r.json()),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["reminders"] });
      qc.invalidateQueries({ queryKey: ["reminders-count"] });
    },
  });
}
