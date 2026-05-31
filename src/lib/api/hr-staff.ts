import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { HrStaff } from "@/types/api";

const API = "/api/hr-staff";

export function useHrStaff() {
  return useQuery<(HrStaff & { _count: { candidates: number } })[]>({
    queryKey: ["hr-staff"],
    queryFn: () => fetch(API).then((r) => r.json()),
  });
}

export function useCreateHrStaff() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<HrStaff>) =>
      fetch(API, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }).then((r) => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["hr-staff"] }),
  });
}

export function useUpdateHrStaff(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<HrStaff>) =>
      fetch(`${API}/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }).then((r) => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["hr-staff"] }),
  });
}

export function useDeleteHrStaff() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => fetch(`${API}/${id}`, { method: "DELETE" }).then((r) => r.json()),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["hr-staff"] });
      qc.invalidateQueries({ queryKey: ["candidates"] });
    },
  });
}
