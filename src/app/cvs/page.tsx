"use client";

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search, FileText, File, ChevronDown } from "lucide-react";
import { Input } from "@/components/ui/input";
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
  const [statusFilter, setStatusFilter] = useState("all");
  const [jobId, setJobId] = useState("all");
  const [previewCandidate, setPreviewCandidate] = useState<Candidate | null>(null);

  const { data: jobs } = useJobs();

  const { data: candidates, isLoading } = useCandidates({
    search,
    hasCv: "true",
    ...(jobId !== "all"
      ? { jobId }
      : statusFilter === "assigned" ? { assigned: "true" }
      : statusFilter === "unassigned" ? { assigned: "false" }
      : statusFilter === "future" ? { kanbanStatus: "future" }
      : statusFilter === "leading" ? { kanbanStatus: "leading" }
      : {}),
  });

  return (
    <AppShell>
      <div className="p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-brand-black">מאגר קורות חיים</h1>
          <p className="text-brand-gray mt-1">{candidates?.length ?? 0} קורות חיים במערכת</p>
        </div>

        <div className="flex gap-3 mb-6 items-center flex-wrap">
          <div className="relative flex-1 min-w-52">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-gray" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="חיפוש לפי שם, אימייל..."
              className="pr-9 rounded-xl bg-white"
            />
          </div>
          <div className="relative">
            <select
              value={jobId}
              onChange={(e) => { setJobId(e.target.value); setStatusFilter("all"); }}
              className="appearance-none pl-7 pr-4 py-2 text-sm rounded-xl border border-brand-gray-border bg-white text-brand-black focus:outline-none focus:ring-2 focus:ring-brand-yellow cursor-pointer min-w-44"
            >
              <option value="all">כל המשרות</option>
              {jobs?.map((job) => (
                <option key={job.id} value={job.id}>{job.title}</option>
              ))}
            </select>
            <ChevronDown className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-brand-gray pointer-events-none" />
          </div>
          <div className="relative">
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setJobId("all"); }}
              className="appearance-none pl-7 pr-4 py-2 text-sm rounded-xl border border-brand-gray-border bg-white text-brand-black focus:outline-none focus:ring-2 focus:ring-brand-yellow cursor-pointer min-w-44"
            >
              <option value="all">כל המועמדים</option>
              <option value="assigned">משויכים למשרה</option>
              <option value="unassigned">לא משויכים</option>
              <option value="leading">מועמדים מובילים</option>
              <option value="future">סומנו לעתיד</option>
            </select>
            <ChevronDown className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-brand-gray pointer-events-none" />
          </div>
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
  const router = useRouter();
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
      <button
        onClick={(e) => { e.stopPropagation(); router.push(`/candidates/${candidate.id}`); }}
        className="font-semibold text-brand-black text-sm mb-1 truncate hover:underline w-full text-center"
      >
        {candidate.fullName}
      </button>
      <p className="text-xs text-brand-gray mb-1">{candidate.phone}</p>
      <p className="text-xs text-brand-gray mb-2 uppercase">{candidate.cvFileType}</p>

      {candidate.assignments && candidate.assignments.length > 0 && (
        <div className="flex flex-col gap-1 items-center">
          {candidate.assignments.slice(0, 2).map((a) => (
            <div key={a.id} className="flex items-center gap-1 flex-wrap justify-center">
              <span className="text-xs bg-brand-gray-light text-brand-gray px-2 py-0.5 rounded-full">
                {a.job?.title && a.job.title.length > 12 ? a.job.title.slice(0, 12) + "…" : a.job?.title}
              </span>
              <span className={`text-xs px-2 py-0.5 rounded-full ${
                a.status === "leading" ? "bg-brand-yellow text-brand-black" :
                a.status === "candidate" ? "bg-blue-100 text-blue-800" :
                a.status === "future" ? "bg-purple-100 text-purple-800" :
                "bg-gray-100 text-gray-600"
              }`}>
                {{ leading: "מוביל", candidate: "מועמד", future: "לעתיד", not_relevant: "לא רלוונטי" }[a.status]}
              </span>
            </div>
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
