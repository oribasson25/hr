"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus, Search, Users, FileText, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import AppShell from "@/components/layout/AppShell";
import CandidateForm from "@/components/candidates/CandidateForm";
import { useCandidates, useCreateCandidate } from "@/lib/api/candidates";
import type { Candidate } from "@/types/api";

function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

export default function CandidatesPage() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const debouncedSearch = useDebounce(search, 300);

  const { data: candidates, isLoading } = useCandidates(debouncedSearch ? { search: debouncedSearch } : {});
  const createCandidate = useCreateCandidate();

  const handleCreate = async (data: Parameters<typeof CandidateForm>[0]["onSubmit"] extends (d: infer D) => unknown ? D : never) => {
    const fd = new FormData();
    fd.append("fullName", data.fullName);
    fd.append("phone", data.phone);
    fd.append("email", data.email);
    if (data.address) fd.append("address", data.address);
    if (data.appliedForJobId) fd.append("appliedForJobId", data.appliedForJobId);
    if (data.appliedForCustom) fd.append("appliedForCustom", data.appliedForCustom);
    if (data.cv) fd.append("cv", data.cv);

    const result = await createCandidate.mutateAsync(fd);
    if (result.id) {
      toast.success("המועמד נוצר בהצלחה");
    } else {
      toast.error(typeof result.error === "string" ? result.error : "שגיאה ביצירת מועמד");
    }
  };

  return (
    <AppShell>
      <div className="p-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-brand-black">מועמדים</h1>
            <p className="text-brand-gray mt-1">{candidates?.length ?? 0} מועמדים במערכת</p>
          </div>
          <Button
            onClick={() => setShowForm(true)}
            className="rounded-xl bg-brand-yellow text-brand-black hover:bg-brand-yellow-hover font-semibold gap-2"
          >
            <Plus className="w-4 h-4" />
            מועמד חדש
          </Button>
        </div>

        <div className="relative mb-6 max-w-md">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-gray" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="חיפוש לפי שם, אימייל, טלפון..."
            className="pr-9 rounded-xl bg-white"
          />
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="bg-white rounded-xl p-4 border border-brand-gray-border animate-pulse flex gap-4">
                <div className="h-4 bg-brand-gray-light rounded flex-1" />
                <div className="h-4 bg-brand-gray-light rounded w-32" />
              </div>
            ))}
          </div>
        ) : candidates?.length === 0 ? (
          <div className="text-center py-20">
            <Users className="w-16 h-16 text-brand-gray-border mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-brand-black mb-2">
              {search ? "לא נמצאו תוצאות" : "אין מועמדים עדיין"}
            </h2>
            <p className="text-brand-gray mb-6">
              {search ? `אין תוצאות עבור "${search}"` : "לחצי על 'מועמד חדש' כדי להוסיף"}
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-brand-gray-border overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-brand-gray-border text-right">
                  <th className="px-6 py-3 text-xs font-semibold text-brand-gray uppercase tracking-wider">שם</th>
                  <th className="px-6 py-3 text-xs font-semibold text-brand-gray uppercase tracking-wider">טלפון</th>
                  <th className="px-6 py-3 text-xs font-semibold text-brand-gray uppercase tracking-wider">אימייל</th>
                  <th className="px-6 py-3 text-xs font-semibold text-brand-gray uppercase tracking-wider">משרות</th>
                  <th className="px-6 py-3 text-xs font-semibold text-brand-gray uppercase tracking-wider text-center">CV</th>
                  <th className="px-6 py-3 text-xs font-semibold text-brand-gray uppercase tracking-wider">תאריך</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-gray-border">
                {candidates?.map((candidate: Candidate) => (
                  <tr
                    key={candidate.id}
                    onClick={() => router.push(`/candidates/${candidate.id}`)}
                    className="hover:bg-brand-gray-light cursor-pointer transition-colors"
                  >
                    <td className="px-6 py-4 font-medium text-brand-black">{candidate.fullName}</td>
                    <td className="px-6 py-4 text-brand-gray text-sm">{candidate.phone}</td>
                    <td className="px-6 py-4 text-brand-gray text-sm">{candidate.email}</td>
                    <td className="px-6 py-4">
                      {candidate.assignments && candidate.assignments.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {candidate.assignments.map((a) => (
                            <span
                              key={a.id}
                              className="inline-block px-2 py-0.5 bg-brand-yellow-soft text-brand-black text-xs rounded-full font-medium truncate max-w-[140px]"
                              title={a.job?.title}
                            >
                              {a.job?.title}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-brand-gray-border text-sm">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-center">
                      {candidate.cvFilePath ? (
                        <Check className="w-4 h-4 text-green-500 mx-auto" />
                      ) : (
                        <X className="w-4 h-4 text-brand-gray-border mx-auto" />
                      )}
                    </td>
                    <td className="px-6 py-4 text-brand-gray text-sm">
                      {new Date(candidate.createdAt).toLocaleDateString("he-IL")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <CandidateForm
        open={showForm}
        onClose={() => setShowForm(false)}
        onSubmit={handleCreate}
        loading={createCandidate.isPending}
      />
    </AppShell>
  );
}
