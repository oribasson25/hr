"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus, Briefcase } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import AppShell from "@/components/layout/AppShell";
import JobForm from "@/components/jobs/JobForm";
import { useJobs, useCreateJob } from "@/lib/api/jobs";
import type { Job } from "@/types/api";

const statusLabels: Record<string, string> = {
  all: "הכול",
  open: "פתוחות",
  filled: "אויישו",
};

export default function JobsPage() {
  const router = useRouter();
  const [filter, setFilter] = useState("open");
  const [showForm, setShowForm] = useState(false);
  const { data: jobs, isLoading } = useJobs(filter);
  const createJob = useCreateJob();

  const handleCreate = async (data: { title: string; description: string; requirements: string }) => {
    const result = await createJob.mutateAsync(data);
    if (result.id) {
      toast.success("המשרה נוצרה בהצלחה");
    } else {
      toast.error("שגיאה ביצירת משרה");
    }
  };

  return (
    <AppShell>
      <div className="p-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-brand-black">משרות</h1>
            <p className="text-brand-gray mt-1">ניהול כל המשרות הפתוחות</p>
          </div>
          <Button
            onClick={() => setShowForm(true)}
            className="rounded-xl bg-brand-yellow text-brand-black hover:bg-brand-yellow-hover font-semibold gap-2"
          >
            <Plus className="w-4 h-4" />
            משרה חדשה
          </Button>
        </div>

        <div className="flex gap-2 mb-6">
          {Object.entries(statusLabels).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                filter === key
                  ? "bg-brand-black text-white"
                  : "bg-white text-brand-gray border border-brand-gray-border hover:bg-brand-gray-light"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-white rounded-2xl p-6 border border-brand-gray-border animate-pulse">
                <div className="h-5 bg-brand-gray-light rounded mb-3 w-3/4" />
                <div className="h-4 bg-brand-gray-light rounded mb-2" />
                <div className="h-4 bg-brand-gray-light rounded w-2/3" />
              </div>
            ))}
          </div>
        ) : jobs?.length === 0 ? (
          <div className="text-center py-20">
            <Briefcase className="w-16 h-16 text-brand-gray-border mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-brand-black mb-2">אין משרות</h2>
            <p className="text-brand-gray mb-6">לחצי על "משרה חדשה" כדי להתחיל</p>
            <Button onClick={() => setShowForm(true)} className="rounded-xl bg-brand-yellow text-brand-black hover:bg-brand-yellow-hover font-semibold">
              <Plus className="w-4 h-4 ml-2" />
              משרה חדשה
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {jobs?.map((job: Job) => (
              <JobCard key={job.id} job={job} onClick={() => router.push(`/jobs/${job.id}`)} />
            ))}
          </div>
        )}
      </div>

      <JobForm
        open={showForm}
        onClose={() => setShowForm(false)}
        onSubmit={handleCreate}
        loading={createJob.isPending}
      />
    </AppShell>
  );
}

function JobCard({ job, onClick }: { job: Job; onClick: () => void }) {
  const counts = job._count || { leading: 0, candidate: 0, not_relevant: 0, future: 0 };
  const total = counts.leading + counts.candidate + counts.not_relevant + counts.future;

  return (
    <div
      onClick={onClick}
      className="bg-white rounded-2xl p-6 border border-brand-gray-border shadow-sm hover:shadow-md cursor-pointer transition-all duration-200 hover:-translate-y-0.5"
    >
      <div className="flex items-start justify-between mb-3">
        <h2 className="text-lg font-bold text-brand-black leading-tight">{job.title}</h2>
        <Badge className={`rounded-full text-xs font-medium flex-shrink-0 mr-2 ${
          job.status === "open"
            ? "bg-brand-yellow text-brand-black border-brand-yellow"
            : "bg-brand-black text-white border-brand-black"
        }`}>
          {job.status === "open" ? "פתוחה" : "נסגרה"}
        </Badge>
      </div>
      <p className="text-brand-gray text-sm leading-relaxed line-clamp-2 mb-4">{job.description}</p>
      <div className="flex items-center gap-3 text-xs text-brand-gray flex-wrap">
        {counts.leading > 0 && (
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-brand-yellow inline-block" />
            {counts.leading} מוביל
          </span>
        )}
        {counts.candidate > 0 && (
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-blue-400 inline-block" />
            {counts.candidate} מועמד
          </span>
        )}
        {counts.future > 0 && (
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-purple-400 inline-block" />
            {counts.future} לעתיד
          </span>
        )}
        {counts.not_relevant > 0 && (
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-gray-400 inline-block" />
            {counts.not_relevant} לא רלוונטי
          </span>
        )}
        {total === 0 && <span>אין מועמדים עדיין</span>}
      </div>
    </div>
  );
}
