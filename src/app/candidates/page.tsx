"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus, Search, Users, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import AppShell from "@/components/layout/AppShell";
import CandidateForm from "@/components/candidates/CandidateForm";
import { useCandidates, useCreateCandidate } from "@/lib/api/candidates";
import { useJobs } from "@/lib/api/jobs";
import type { Candidate, JobAssignment } from "@/types/api";

const STAGE_PRIORITY: Record<string, number> = {
  offer: 6, interview: 5, cv_received: 4, hired: 3, rejected: 2, ghosted: 1, withdrew: 0,
};

const STAGE_BADGE: Record<string, { label: string; className: string }> = {
  cv_received: { label: 'שלח קו"ח',       className: "bg-blue-50 text-blue-700 border-blue-100" },
  interview:   { label: "תואם ראיון",      className: "bg-yellow-50 text-yellow-700 border-yellow-100" },
  offer:       { label: "נשלחה הצעה",      className: "bg-purple-50 text-purple-700 border-purple-100" },
  hired:       { label: "גויס",            className: "bg-green-50 text-green-700 border-green-100" },
  rejected:    { label: "נדחה",            className: "bg-red-50 text-red-600 border-red-100" },
  ghosted:     { label: "הבריז",           className: "bg-orange-50 text-orange-600 border-orange-100" },
  withdrew:    { label: "ביטל מועמדות",   className: "bg-gray-100 text-gray-500 border-gray-200" },
};

function getPrimaryStage(assignments: JobAssignment[] | undefined): string | null {
  if (!assignments || assignments.length === 0) return null;
  return assignments.reduce((best, a) => {
    const bPriority = STAGE_PRIORITY[best] ?? -1;
    const aPriority = STAGE_PRIORITY[a.recruitmentStage] ?? -1;
    return aPriority > bPriority ? a.recruitmentStage : best;
  }, assignments[0].recruitmentStage);
}

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
  const [jobFilter, setJobFilter] = useState("");
  const debouncedSearch = useDebounce(search, 300);

  const { data: allJobs } = useJobs();
  const params: Record<string, string> = {};
  if (debouncedSearch) params.search = debouncedSearch;
  if (jobFilter) params.jobId = jobFilter;
  const { data: candidates, isLoading } = useCandidates(params);
  const createCandidate = useCreateCandidate();

  const handleCreate = async (data: Parameters<typeof CandidateForm>[0]["onSubmit"] extends (d: infer D) => unknown ? D : never) => {
    const fd = new FormData();
    fd.append("fullName", data.fullName);
    fd.append("phone", data.phone);
    if (data.email) fd.append("email", data.email);
    if (data.address) fd.append("address", data.address);
    if (data.appliedForJobId) fd.append("appliedForJobId", data.appliedForJobId);
    if (data.appliedForCustom) fd.append("appliedForCustom", data.appliedForCustom);
    if (data.source) fd.append("source", data.source);
    if (data.referredByName) fd.append("referredByName", data.referredByName);
    if (data.salaryExpectation) fd.append("salaryExpectation", data.salaryExpectation);
    if (data.hrStaffId) fd.append("hrStaffId", data.hrStaffId);
    if (data.cv) fd.append("cv", data.cv);

    const result = await createCandidate.mutateAsync(fd);
    if (result.id) {
      toast.success("המועמד נוצר בהצלחה");
    } else {
      const msg = typeof result.error === "string" ? result.error : "שגיאה ביצירת מועמד";
      toast.error(msg);
      throw new Error(msg);
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

        <div className="flex flex-wrap gap-3 mb-6">
          <div className="relative flex-1 min-w-[200px] max-w-md">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-gray" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="חיפוש לפי שם, אימייל, טלפון..."
              className="pr-9 rounded-xl bg-white"
            />
          </div>
          <Select value={jobFilter} onValueChange={(v) => setJobFilter(v ?? "")}>
            <SelectTrigger className="rounded-xl bg-white w-56">
              <SelectValue>
                {jobFilter
                  ? <span>{allJobs?.find(j => j.id === jobFilter)?.title ?? "משרה"}</span>
                  : <span className="text-muted-foreground">סינון לפי משרה...</span>
                }
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {allJobs?.map((j) => (
                <SelectItem key={j.id} value={j.id}>{j.title}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {jobFilter && (
            <Button variant="outline" onClick={() => setJobFilter("")} className="rounded-xl gap-1.5 text-sm">
              <X className="w-3.5 h-3.5" />
              נקה סינון
            </Button>
          )}
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
                  <th className="px-6 py-3 text-xs font-semibold text-brand-gray uppercase tracking-wider">סטטוס</th>
                  <th className="px-6 py-3 text-xs font-semibold text-brand-gray uppercase tracking-wider text-center">CV</th>
                  <th className="px-6 py-3 text-xs font-semibold text-brand-gray uppercase tracking-wider text-center">הערה</th>
                  <th className="px-6 py-3 text-xs font-semibold text-brand-gray uppercase tracking-wider">תאריך</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-gray-border">
                {candidates?.map((candidate: Candidate, i: number) => (
                  <motion.tr
                    key={candidate.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.22, delay: i * 0.04, ease: "easeOut" }}
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
                    <td className="px-6 py-4">
                      {(() => {
                        const stage = getPrimaryStage(candidate.assignments);
                        const badge = stage ? STAGE_BADGE[stage] : null;
                        return badge ? (
                          <span className={`inline-block px-2.5 py-0.5 text-xs font-semibold rounded-full border ${badge.className}`}>
                            {badge.label}
                          </span>
                        ) : (
                          <span className="text-brand-gray-border text-sm">—</span>
                        );
                      })()}
                    </td>
                    <td className="px-6 py-4 text-center">
                      {candidate.cvFilePath ? (
                        <Check className="w-4 h-4 text-green-500 mx-auto" />
                      ) : (
                        <X className="w-4 h-4 text-brand-gray-border mx-auto" />
                      )}
                    </td>
                    <td className="px-6 py-4 max-w-[200px]">
                      {candidate.notes && candidate.notes.length > 0 ? (
                        <p className="text-xs text-brand-gray leading-relaxed line-clamp-2 break-words">
                          {candidate.notes[0].content}
                        </p>
                      ) : (
                        <span className="text-brand-gray-border text-sm">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-brand-gray text-sm">
                      {new Date(candidate.createdAt).toLocaleDateString("he-IL")}
                    </td>
                  </motion.tr>
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
