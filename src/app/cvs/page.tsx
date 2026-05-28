"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Search, FileText, File } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import AppShell from "@/components/layout/AppShell";
import CVPreview from "@/components/cv/CVPreview";
import { useCandidates } from "@/lib/api/candidates";
import { useJobs } from "@/lib/api/jobs";
import type { Candidate } from "@/types/api";

function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useState(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  });
  return debounced;
}

export default function CVsPage() {
  const [search, setSearch] = useState("");
  const [assigned, setAssigned] = useState("all");
  const [jobId, setJobId] = useState("all");
  const [previewCandidate, setPreviewCandidate] = useState<Candidate | null>(null);

  const { data: jobs } = useJobs();

  const { data: candidates, isLoading } = useCandidates({
    search,
    hasCv: "true",
    ...(jobId !== "all" ? { jobId } : assigned !== "all" ? { assigned } : {}),
  });

  return (
    <AppShell>
      <div className="p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-brand-black">מאגר קורות חיים</h1>
          <p className="text-brand-gray mt-1">{candidates?.length ?? 0} קורות חיים במערכת</p>
        </div>

        <div className="flex gap-4 mb-6 flex-wrap">
          <div className="relative flex-1 min-w-60">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-gray" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="חיפוש לפי שם, אימייל..."
              className="pr-9 rounded-xl bg-white"
            />
          </div>
          <Select value={jobId} onValueChange={(v) => { setJobId(v ?? "all"); setAssigned("all"); }}>
            <SelectTrigger className="w-52 rounded-xl bg-white">
              <SelectValue placeholder="סינון לפי משרה" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">כל המשרות</SelectItem>
              {jobs?.map((job) => (
                <SelectItem key={job.id} value={job.id}>{job.title}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={assigned} onValueChange={(v) => { setAssigned(v ?? "all"); setJobId("all"); }}>
            <SelectTrigger className="w-48 rounded-xl bg-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">כל המועמדים</SelectItem>
              <SelectItem value="true">משויכים למשרה</SelectItem>
              <SelectItem value="false">לא משויכים</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="bg-white rounded-2xl p-4 border border-brand-gray-border animate-pulse">
                <div className="h-12 w-12 bg-brand-gray-light rounded-xl mx-auto mb-3" />
                <div className="h-4 bg-brand-gray-light rounded mb-2" />
                <div className="h-3 bg-brand-gray-light rounded w-2/3 mx-auto" />
              </div>
            ))}
          </div>
        ) : candidates?.length === 0 ? (
          <div className="text-center py-20">
            <FileText className="w-16 h-16 text-brand-gray-border mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-brand-black mb-2">אין קורות חיים</h2>
            <p className="text-brand-gray">קורות חיים יופיעו כאן לאחר העלאתם למועמדים</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {candidates?.map((candidate: Candidate) => (
              <CVCard
                key={candidate.id}
                candidate={candidate}
                onClick={() => setPreviewCandidate(candidate)}
              />
            ))}
          </div>
        )}
      </div>

      {previewCandidate && (
        <CVPreview
          candidate={previewCandidate}
          open={!!previewCandidate}
          onClose={() => setPreviewCandidate(null)}
        />
      )}
    </AppShell>
  );
}

function CVCard({ candidate, onClick }: { candidate: Candidate; onClick: () => void }) {
  const isPdf = candidate.cvFileType === "pdf";

  return (
    <button
      onClick={onClick}
      className="group bg-white rounded-2xl p-4 border border-brand-gray-border text-center hover:shadow-md hover:bg-brand-yellow-soft transition-all duration-200 relative"
    >
      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-3 ${isPdf ? "bg-red-50" : "bg-blue-50"}`}>
        {isPdf ? (
          <FileText className="w-7 h-7 text-red-500" />
        ) : (
          <File className="w-7 h-7 text-blue-500" />
        )}
      </div>
      <p className="font-semibold text-brand-black text-sm mb-1 truncate">{candidate.fullName}</p>
      <p className="text-xs text-brand-gray mb-1">{candidate.phone}</p>
      <p className="text-xs text-brand-gray mb-2 uppercase">{candidate.cvFileType}</p>

      {candidate.assignments && candidate.assignments.length > 0 && (
        <div className="flex flex-wrap gap-1 justify-center">
          {candidate.assignments.slice(0, 2).map((a) => (
            <span key={a.id} className="text-xs bg-brand-gray-light text-brand-gray px-2 py-0.5 rounded-full">
              {a.job?.title && a.job.title.length > 12 ? a.job.title.slice(0, 12) + "…" : a.job?.title}
            </span>
          ))}
          {candidate.assignments.length > 2 && (
            <span className="text-xs text-brand-gray">+{candidate.assignments.length - 2}</span>
          )}
        </div>
      )}

      <p className="text-xs text-brand-gray mt-2 opacity-0 group-hover:opacity-100 transition-opacity absolute bottom-2 left-0 right-0">
        לחץ לצפייה
      </p>
    </button>
  );
}
