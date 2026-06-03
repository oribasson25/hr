"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { Users, FileText, MessageSquare, Gift, CheckCircle, XCircle, TrendingUp, Clock, ChevronDown } from "lucide-react";
import AppShell from "@/components/layout/AppShell";
import { useRecruitmentData } from "@/lib/api/recruitment";
import { useHrStaff } from "@/lib/api/hr-staff";

const PIPELINE_STEPS: { key: StageKey; label: string }[] = [
  { key: "cv_received", label: 'קו"ח' },
  { key: "interview", label: "ראיון" },
  { key: "offer", label: "הצעה" },
  { key: "hired", label: "גויס" },
];

const STEP_INDEX: Record<string, number> = {
  cv_received: 0,
  interview: 1,
  offer: 2,
  hired: 3,
  rejected: -1,
};

function PipelineBar({ stage }: { stage: string }) {
  const currentIdx = STEP_INDEX[stage] ?? 0;
  const isRejected = stage === "rejected";

  return (
    <div className="flex items-start w-full">
      {PIPELINE_STEPS.map((step, i) => {
        const done = i < currentIdx;
        const active = !isRejected && i === currentIdx;
        const colored = done || active;
        return (
          <div key={step.key} className={`flex items-start ${i < PIPELINE_STEPS.length - 1 ? "flex-1" : "flex-none"}`}>
            <div className="flex flex-col items-center flex-shrink-0">
              <div className={`w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center transition-all duration-300 ${
                done ? "bg-brand-yellow border-brand-yellow" : active ? "bg-brand-yellow border-brand-yellow ring-2 ring-brand-yellow/40 scale-110" : isRejected ? "bg-red-200 border-red-300" : "bg-white border-brand-gray-border"
              }`}>
                {done && <div className="w-1 h-1 rounded-full bg-brand-black" />}
              </div>
              <span className={`text-[10px] mt-0.5 whitespace-nowrap font-medium leading-tight ${colored ? "text-brand-black" : isRejected ? "text-red-400" : "text-brand-gray"}`}>
                {step.label}
              </span>
            </div>
            {i < PIPELINE_STEPS.length - 1 && (
              <div className={`flex-1 h-0.5 mt-[6px] transition-colors duration-300 ${done ? "bg-brand-yellow" : "bg-brand-gray-border"}`} />
            )}
          </div>
        );
      })}
      {isRejected && (
        <div className="flex flex-col items-center flex-shrink-0 mr-2">
          <div className="w-3.5 h-3.5 rounded-full bg-red-100 border-2 border-red-400 flex items-center justify-center">
            <XCircle className="w-2.5 h-2.5 text-red-500" />
          </div>
          <span className="text-[10px] mt-0.5 text-red-500 font-medium whitespace-nowrap">נדחה</span>
        </div>
      )}
    </div>
  );
}

const STAGE_META = {
  cv_received: { label: 'קו"ח התקבלו', icon: FileText, color: "bg-blue-50 text-blue-600 border-blue-100" },
  interview: { label: "ראיון", icon: MessageSquare, color: "bg-yellow-50 text-yellow-700 border-yellow-100" },
  offer: { label: "הצעה", icon: Gift, color: "bg-purple-50 text-purple-700 border-purple-100" },
  hired: { label: "גויס", icon: CheckCircle, color: "bg-green-50 text-green-700 border-green-100" },
  rejected: { label: "נדחה", icon: XCircle, color: "bg-red-50 text-red-600 border-red-100" },
} as const;

type StageKey = keyof typeof STAGE_META;

const KANBAN_META: Record<string, { label: string; color: string }> = {
  leading: { label: "מוביל", color: "bg-brand-yellow text-brand-black" },
  candidate: { label: "מועמד", color: "bg-blue-100 text-blue-800" },
};

interface Assignment {
  id: string;
  status: string;
  recruitmentStage: StageKey;
  startDate: string | null;
  createdAt: string;
  updatedAt: string;
  candidate?: { id: string; fullName: string; hrStaffId?: string | null };
  job?: { id: string; title: string; status: string };
}

export default function RecruitmentPage() {
  const router = useRouter();
  const { data, isLoading } = useRecruitmentData();
  const { data: hrStaff } = useHrStaff();
  const [jobFilter, setJobFilter] = useState("");
  const [hrStaffFilter, setHrStaffFilter] = useState("");
  const [showAll, setShowAll] = useState(false);

  const stages = data?.stages as Record<StageKey, Assignment[]> | undefined;
  const recentHires = data?.recentHires as Assignment[] | undefined;

  const allActive: Assignment[] = useMemo(() => stages
    ? [...(stages.offer ?? []), ...(stages.interview ?? []), ...(stages.cv_received ?? [])]
    : [], [stages]);

  const jobOptions = useMemo(() => {
    const seen = new Set<string>();
    return allActive
      .map((a) => ({ id: a.job?.id ?? "", title: a.job?.title ?? "" }))
      .filter((j) => j.id && !seen.has(j.id) && seen.add(j.id));
  }, [allActive]);

  const filtered = useMemo(() => {
    let result = allActive;
    if (jobFilter) result = result.filter((a) => a.job?.id === jobFilter);
    if (hrStaffFilter) result = result.filter((a) => a.candidate?.hrStaffId === hrStaffFilter);
    return result;
  }, [allActive, jobFilter, hrStaffFilter]);

  const activeCount = stages
    ? (stages.cv_received?.length ?? 0) + (stages.interview?.length ?? 0) + (stages.offer?.length ?? 0)
    : 0;

  return (
    <AppShell>
      <div className="p-8 space-y-8">
        <div>
          <h1 className="text-2xl font-bold text-brand-black">תהליכי גיוס</h1>
          <p className="text-brand-gray text-sm mt-1">מעקב אחר כל תהליכי הגיוס הפתוחים</p>
        </div>

        {/* Dashboard Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25, ease: "easeOut" }} className="bg-white rounded-2xl border border-brand-gray-border p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 rounded-xl bg-brand-yellow-soft flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-brand-black" />
              </div>
              <span className="text-sm text-brand-gray font-medium">תהליכים פתוחים</span>
            </div>
            <p className="text-3xl font-bold text-brand-black">{isLoading ? "—" : activeCount}</p>
          </motion.div>

          {(["cv_received", "interview", "offer"] as StageKey[]).map((key, i) => {
            const meta = STAGE_META[key];
            const Icon = meta.icon;
            const count = stages?.[key]?.length ?? 0;
            return (
              <motion.div key={key} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25, delay: (i + 1) * 0.07, ease: "easeOut" }} className="bg-white rounded-2xl border border-brand-gray-border p-5">
                <div className="flex items-center gap-3 mb-3">
                  <div className={`w-9 h-9 rounded-xl border flex items-center justify-center ${meta.color}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className="text-sm text-brand-gray font-medium">{meta.label}</span>
                </div>
                <p className="text-3xl font-bold text-brand-black">{isLoading ? "—" : count}</p>
              </motion.div>
            );
          })}
        </div>

        {/* Pipeline Table */}
        <div className="bg-white rounded-2xl border border-brand-gray-border overflow-hidden">
          <div className="px-6 py-4 border-b border-brand-gray-border flex items-center gap-3 flex-wrap">
            <Clock className="w-4 h-4 text-brand-gray flex-shrink-0" />
            <h2 className="font-semibold text-brand-black">כל התהליכים הפתוחים</h2>
            <div className="mr-auto flex items-center gap-3 flex-wrap">
              {jobOptions.length > 0 && (
                <div className="relative">
                  <select value={jobFilter} onChange={(e) => { setJobFilter(e.target.value); setShowAll(false); }} className="appearance-none pl-7 pr-3 py-1.5 text-sm rounded-xl border border-brand-gray-border bg-white text-brand-black focus:outline-none focus:ring-2 focus:ring-brand-yellow cursor-pointer">
                    <option value="">כל המשרות</option>
                    {jobOptions.map((j) => (
                      <option key={j.id} value={j.id}>{j.title}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-brand-gray pointer-events-none" />
                </div>
              )}
              {hrStaff && hrStaff.length > 0 && (
                <div className="relative">
                  <select value={hrStaffFilter} onChange={(e) => { setHrStaffFilter(e.target.value); setShowAll(false); }} className="appearance-none pl-7 pr-3 py-1.5 text-sm rounded-xl border border-brand-gray-border bg-white text-brand-black focus:outline-none focus:ring-2 focus:ring-brand-yellow cursor-pointer">
                    <option value="">כל אנשי HR</option>
                    {hrStaff.map((s) => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-brand-gray pointer-events-none" />
                </div>
              )}
              <span className="text-sm text-brand-gray">{filtered.length} תהליכים</span>
              {filtered.length > 5 && (
                <button
                  onClick={() => setShowAll((v) => !v)}
                  className="text-sm text-brand-gray hover:text-brand-black font-medium transition-colors"
                >
                  {showAll ? "הצג פחות ↑" : `הצג הכל (${filtered.length}) ↓`}
                </button>
              )}
            </div>
          </div>

          {isLoading ? (
            <div className="p-8 text-center text-brand-gray animate-pulse">טוען...</div>
          ) : allActive.length === 0 ? (
            <div className="p-8 text-center text-brand-gray">אין תהליכים פתוחים כרגע</div>
          ) : filtered.length === 0 ? (
            <div className="p-8 text-center text-brand-gray">אין תהליכים לסינון זה</div>
          ) : (
            <>
              <div className="divide-y divide-brand-gray-border">
                {(showAll ? filtered : filtered.slice(0, 5)).map((a, i) => (
                  <motion.div key={a.id} initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.2, delay: i * 0.03, ease: "easeOut" }} className="px-6 py-4 flex items-center gap-4 hover:bg-brand-gray-light/40 transition-colors">
                    <button onClick={() => router.push(`/candidates/${a.candidate?.id}`)} className="font-semibold text-brand-black hover:underline text-sm w-36 text-right flex-shrink-0">
                      {a.candidate?.fullName}
                    </button>
                    {KANBAN_META[a.status] && (
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${KANBAN_META[a.status].color}`}>
                        {KANBAN_META[a.status].label}
                      </span>
                    )}
                    <button onClick={() => router.push(`/jobs/${a.job?.id}`)} className="text-brand-gray hover:text-brand-black hover:underline text-sm flex-1 text-right truncate">
                      {a.job?.title}
                    </button>
                    <div className="w-52 flex-shrink-0">
                      <PipelineBar stage={a.recruitmentStage} />
                    </div>
                    <span className="text-xs text-brand-gray flex-shrink-0 w-16 text-left">
                      {new Date(a.updatedAt).toLocaleDateString("he-IL")}
                    </span>
                  </motion.div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Recent Hires */}
        <div className="bg-white rounded-2xl border border-brand-gray-border overflow-hidden">
          <div className="px-6 py-4 border-b border-brand-gray-border flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-green-600" />
            <h2 className="font-semibold text-brand-black">גיוסים אחרונים</h2>
            <span className="mr-auto text-sm text-brand-gray">{recentHires?.length ?? 0} גיוסים</span>
          </div>

          {isLoading ? (
            <div className="p-8 text-center text-brand-gray animate-pulse">טוען...</div>
          ) : !recentHires?.length ? (
            <div className="p-8 text-center text-brand-gray">אין גיוסים עדיין</div>
          ) : (
            <div className="divide-y divide-brand-gray-border">
              {recentHires.map((a) => (
                <div key={a.id} className="px-6 py-4 flex items-center gap-4 hover:bg-green-50/30 transition-colors">
                  <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                    <Users className="w-4 h-4 text-green-600" />
                  </div>
                  <button onClick={() => router.push(`/candidates/${a.candidate?.id}`)} className="font-semibold text-brand-black hover:underline text-sm w-40 text-right flex-shrink-0">
                    {a.candidate?.fullName}
                  </button>
                  <button onClick={() => router.push(`/jobs/${a.job?.id}`)} className="text-brand-gray hover:text-brand-black hover:underline text-sm flex-1 text-right truncate">
                    {a.job?.title}
                  </button>
                  <div className="flex flex-col items-end flex-shrink-0 gap-0.5">
                    <span className="text-xs text-green-600 font-medium bg-green-50 px-2 py-0.5 rounded-full border border-green-100">
                      גויס {new Date(a.updatedAt).toLocaleDateString("he-IL")}
                    </span>
                    {a.startDate && (
                      <span className="text-xs text-brand-gray">מתחיל {new Date(a.startDate).toLocaleDateString("he-IL")}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
