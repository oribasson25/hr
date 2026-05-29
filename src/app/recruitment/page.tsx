"use client";

import { useRouter } from "next/navigation";
import { Users, FileText, MessageSquare, Gift, CheckCircle, XCircle, TrendingUp, Clock } from "lucide-react";
import AppShell from "@/components/layout/AppShell";
import { useRecruitmentData } from "@/lib/api/recruitment";

const STAGE_META = {
  cv_received: { label: 'קו"ח התקבלו', icon: FileText, color: "bg-blue-50 text-blue-600 border-blue-100" },
  interview: { label: "ראיון", icon: MessageSquare, color: "bg-yellow-50 text-yellow-700 border-yellow-100" },
  offer: { label: "הצעה", icon: Gift, color: "bg-purple-50 text-purple-700 border-purple-100" },
  hired: { label: "גויס", icon: CheckCircle, color: "bg-green-50 text-green-700 border-green-100" },
  rejected: { label: "נדחה", icon: XCircle, color: "bg-red-50 text-red-600 border-red-100" },
} as const;

type StageKey = keyof typeof STAGE_META;

interface Assignment {
  id: string;
  recruitmentStage: StageKey;
  startDate: string | null;
  createdAt: string;
  updatedAt: string;
  candidate?: { id: string; fullName: string };
  job?: { id: string; title: string; status: string };
}

export default function RecruitmentPage() {
  const router = useRouter();
  const { data, isLoading } = useRecruitmentData();

  const stages = data?.stages as Record<StageKey, Assignment[]> | undefined;
  const recentHires = data?.recentHires as Assignment[] | undefined;

  const activeCount = stages
    ? (stages.cv_received?.length ?? 0) + (stages.interview?.length ?? 0) + (stages.offer?.length ?? 0)
    : 0;

  const allActive: Assignment[] = stages
    ? [...(stages.cv_received ?? []), ...(stages.interview ?? []), ...(stages.offer ?? [])]
    : [];

  return (
    <AppShell>
      <div className="p-8 space-y-8">
        <div>
          <h1 className="text-2xl font-bold text-brand-black">תהליכי גיוס</h1>
          <p className="text-brand-gray text-sm mt-1">מעקב אחר כל תהליכי הגיוס הפתוחים</p>
        </div>

        {/* Dashboard Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-2xl border border-brand-gray-border p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 rounded-xl bg-brand-yellow-soft flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-brand-black" />
              </div>
              <span className="text-sm text-brand-gray font-medium">תהליכים פתוחים</span>
            </div>
            <p className="text-3xl font-bold text-brand-black">{isLoading ? "—" : activeCount}</p>
          </div>

          {(["cv_received", "interview", "offer"] as StageKey[]).map((key) => {
            const meta = STAGE_META[key];
            const Icon = meta.icon;
            const count = stages?.[key]?.length ?? 0;
            return (
              <div key={key} className="bg-white rounded-2xl border border-brand-gray-border p-5">
                <div className="flex items-center gap-3 mb-3">
                  <div className={`w-9 h-9 rounded-xl border flex items-center justify-center ${meta.color}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className="text-sm text-brand-gray font-medium">{meta.label}</span>
                </div>
                <p className="text-3xl font-bold text-brand-black">{isLoading ? "—" : count}</p>
              </div>
            );
          })}
        </div>

        {/* Pipeline Table */}
        <div className="bg-white rounded-2xl border border-brand-gray-border overflow-hidden">
          <div className="px-6 py-4 border-b border-brand-gray-border flex items-center gap-2">
            <Clock className="w-4 h-4 text-brand-gray" />
            <h2 className="font-semibold text-brand-black">כל התהליכים הפתוחים</h2>
            <span className="mr-auto text-sm text-brand-gray">{activeCount} תהליכים</span>
          </div>

          {isLoading ? (
            <div className="p-8 text-center text-brand-gray animate-pulse">טוען...</div>
          ) : allActive.length === 0 ? (
            <div className="p-8 text-center text-brand-gray">אין תהליכים פתוחים כרגע</div>
          ) : (
            <div className="divide-y divide-brand-gray-border">
              {allActive.map((a) => {
                const stage = STAGE_META[a.recruitmentStage];
                const Icon = stage.icon;
                return (
                  <div key={a.id} className="px-6 py-4 flex items-center gap-4 hover:bg-brand-gray-light/40 transition-colors">
                    <button
                      onClick={() => router.push(`/candidates/${a.candidate?.id}`)}
                      className="font-semibold text-brand-black hover:underline text-sm w-40 text-right flex-shrink-0"
                    >
                      {a.candidate?.fullName}
                    </button>
                    <button
                      onClick={() => router.push(`/jobs/${a.job?.id}`)}
                      className="text-brand-gray hover:text-brand-black hover:underline text-sm flex-1 text-right truncate"
                    >
                      {a.job?.title}
                    </button>
                    <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border ${stage.color} flex-shrink-0`}>
                      <Icon className="w-3.5 h-3.5" />
                      {stage.label}
                    </div>
                    <span className="text-xs text-brand-gray flex-shrink-0">
                      {new Date(a.updatedAt).toLocaleDateString("he-IL")}
                    </span>
                  </div>
                );
              })}
            </div>
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
                  <button
                    onClick={() => router.push(`/candidates/${a.candidate?.id}`)}
                    className="font-semibold text-brand-black hover:underline text-sm w-40 text-right flex-shrink-0"
                  >
                    {a.candidate?.fullName}
                  </button>
                  <button
                    onClick={() => router.push(`/jobs/${a.job?.id}`)}
                    className="text-brand-gray hover:text-brand-black hover:underline text-sm flex-1 text-right truncate"
                  >
                    {a.job?.title}
                  </button>
                  <div className="flex flex-col items-end flex-shrink-0 gap-0.5">
                    <span className="text-xs text-green-600 font-medium bg-green-50 px-2 py-0.5 rounded-full border border-green-100">
                      גויס {new Date(a.updatedAt).toLocaleDateString("he-IL")}
                    </span>
                    {a.startDate && (
                      <span className="text-xs text-brand-gray">
                        מתחיל {new Date(a.startDate).toLocaleDateString("he-IL")}
                      </span>
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
