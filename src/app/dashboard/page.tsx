"use client";

import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import {
  Users, Briefcase, TrendingUp, CheckCircle, XCircle, FileText,
  Activity, Target, BarChart2, UserCheck, Clock
} from "lucide-react";
import AppShell from "@/components/layout/AppShell";

const SOURCE_LABELS: Record<string, string> = {
  referral: "חבר מביא חבר",
  linkedin: "לינקדאין",
  facebook: "פייסבוק",
  job_board: "אתר משרות",
};
const SOURCE_COLORS: Record<string, string> = {
  referral: "bg-purple-500",
  linkedin: "bg-blue-500",
  facebook: "bg-indigo-500",
  job_board: "bg-green-500",
};

const STAGE_LABELS: Record<string, string> = {
  cv_received: 'קו"ח התקבלו',
  interview: "ראיון",
  offer: "הצעה",
  hired: "גויס",
  rejected: "נדחה",
};
const STAGE_COLORS: Record<string, string> = {
  cv_received: "bg-blue-400",
  interview: "bg-yellow-400",
  offer: "bg-purple-400",
  hired: "bg-green-500",
  rejected: "bg-red-400",
};

interface DashboardData {
  overview: {
    totalCandidates: number;
    totalJobs: number;
    openJobs: number;
    filledJobs: number;
    totalAssignments: number;
    hirings: number;
    rejections: number;
    activeProcesses: number;
    candidatesWithCV: number;
    conversionRate: number;
  };
  sourceStats: { source: string; count: number }[];
  stageBreakdown: { stage: string; count: number }[];
  hrStaffStats: { id: string; name: string; role: string | null; candidateCount: number }[];
  recentActivity: { id: string; recruitmentStage: string; updatedAt: string; candidate?: { id: string; fullName: string }; job?: { id: string; title: string } }[];
  monthlyHires: { month: string; count: number }[];
}

function StatCard({ icon: Icon, label, value, sub, color, delay = 0 }: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  sub?: string;
  color: string;
  delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay, ease: "easeOut" }}
      className="bg-white rounded-2xl border border-brand-gray-border p-5"
    >
      <div className="flex items-center gap-3 mb-3">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>
          <Icon className="w-5 h-5 text-white" />
        </div>
        <span className="text-sm text-brand-gray font-medium">{label}</span>
      </div>
      <p className="text-3xl font-bold text-brand-black">{value}</p>
      {sub && <p className="text-xs text-brand-gray mt-1">{sub}</p>}
    </motion.div>
  );
}

function BarChart({ data, maxVal, colorClass }: { data: { label: string; value: number }[]; maxVal: number; colorClass: (label: string) => string }) {
  return (
    <div className="space-y-3">
      {data.map((item) => (
        <div key={item.label} className="flex items-center gap-3">
          <span className="text-sm text-brand-gray w-32 text-right flex-shrink-0">{item.label}</span>
          <div className="flex-1 bg-brand-gray-light rounded-full h-3 overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: maxVal > 0 ? `${(item.value / maxVal) * 100}%` : "0%" }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              className={`h-full rounded-full ${colorClass(item.label)}`}
            />
          </div>
          <span className="text-sm font-semibold text-brand-black w-8 text-left flex-shrink-0">{item.value}</span>
        </div>
      ))}
    </div>
  );
}

export default function DashboardPage() {
  const router = useRouter();
  const { data, isLoading } = useQuery<DashboardData>({
    queryKey: ["dashboard"],
    queryFn: () => fetch("/api/dashboard").then((r) => r.json()),
  });

  const overview = data?.overview;

  const stageData = (data?.stageBreakdown ?? [])
    .filter((s) => s.stage in STAGE_LABELS)
    .map((s) => ({ label: STAGE_LABELS[s.stage] ?? s.stage, value: s.count, key: s.stage }))
    .sort((a, b) => {
      const order = ["cv_received", "interview", "offer", "hired", "rejected"];
      return order.indexOf(a.key) - order.indexOf(b.key);
    });

  const maxStage = Math.max(...stageData.map((s) => s.value), 1);

  const sourceData = (data?.sourceStats ?? []).map((s) => ({
    label: SOURCE_LABELS[s.source] ?? s.source,
    value: s.count,
    key: s.source,
  }));
  const maxSource = Math.max(...sourceData.map((s) => s.value), 1);

  const maxMonthly = Math.max(...(data?.monthlyHires ?? []).map((m) => m.count), 1);

  return (
    <AppShell>
      <div className="p-8 space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-brand-black">דשבורד</h1>
          <p className="text-brand-gray mt-1">סקירה כללית של מערכת הגיוס</p>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard icon={Users} label="מועמדים" value={isLoading ? "—" : (overview?.totalCandidates ?? 0)} sub={`${overview?.candidatesWithCV ?? 0} עם CV`} color="bg-blue-500" delay={0} />
          <StatCard icon={Briefcase} label="משרות" value={isLoading ? "—" : (overview?.totalJobs ?? 0)} sub={`${overview?.openJobs ?? 0} פתוחות`} color="bg-brand-yellow" delay={0.07} />
          <StatCard icon={Activity} label="תהליכים פעילים" value={isLoading ? "—" : (overview?.activeProcesses ?? 0)} color="bg-purple-500" delay={0.14} />
          <StatCard icon={UserCheck} label="גויסו" value={isLoading ? "—" : (overview?.hirings ?? 0)} sub={`${overview?.conversionRate ?? 0}% המרה`} color="bg-green-500" delay={0.21} />
        </div>

        <div className="grid grid-cols-4 gap-4">
          <StatCard icon={Target} label="מש' שנסגרו" value={isLoading ? "—" : (overview?.filledJobs ?? 0)} color="bg-gray-700" delay={0.28} />
          <StatCard icon={XCircle} label="נדחו" value={isLoading ? "—" : (overview?.rejections ?? 0)} color="bg-red-400" delay={0.35} />
          <StatCard icon={FileText} label="שיוכים כולל" value={isLoading ? "—" : (overview?.totalAssignments ?? 0)} color="bg-indigo-400" delay={0.42} />
          <StatCard icon={TrendingUp} label="יחס המרה" value={isLoading ? "—" : `${overview?.conversionRate ?? 0}%`} sub="CV → גיוס" color="bg-teal-500" delay={0.49} />
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-2 gap-6">
          {/* Stage Breakdown */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, delay: 0.2 }} className="bg-white rounded-2xl border border-brand-gray-border p-6">
            <div className="flex items-center gap-2 mb-6">
              <BarChart2 className="w-5 h-5 text-brand-gray" />
              <h2 className="font-bold text-brand-black">שלבי גיוס</h2>
            </div>
            {isLoading ? (
              <div className="space-y-3 animate-pulse">{[...Array(5)].map((_, i) => <div key={i} className="h-6 bg-brand-gray-light rounded" />)}</div>
            ) : stageData.length === 0 ? (
              <p className="text-brand-gray text-center py-6">אין נתונים</p>
            ) : (
              <BarChart
                data={stageData}
                maxVal={maxStage}
                colorClass={(label) => {
                  const item = stageData.find((s) => s.label === label);
                  return STAGE_COLORS[item?.key ?? ""] ?? "bg-gray-400";
                }}
              />
            )}
          </motion.div>

          {/* Source Stats */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, delay: 0.27 }} className="bg-white rounded-2xl border border-brand-gray-border p-6">
            <div className="flex items-center gap-2 mb-6">
              <TrendingUp className="w-5 h-5 text-brand-gray" />
              <h2 className="font-bold text-brand-black">מקורות הגעה</h2>
            </div>
            {isLoading ? (
              <div className="space-y-3 animate-pulse">{[...Array(4)].map((_, i) => <div key={i} className="h-6 bg-brand-gray-light rounded" />)}</div>
            ) : sourceData.length === 0 ? (
              <p className="text-brand-gray text-center py-6">אין נתונים — הגדר מקורות בהקמת מועמדים</p>
            ) : (
              <BarChart
                data={sourceData}
                maxVal={maxSource}
                colorClass={(label) => {
                  const item = sourceData.find((s) => s.label === label);
                  return SOURCE_COLORS[item?.key ?? ""] ?? "bg-gray-400";
                }}
              />
            )}
          </motion.div>
        </div>

        {/* Monthly Hires + HR Staff */}
        <div className="grid grid-cols-3 gap-6">
          {/* Monthly Hires */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, delay: 0.3 }} className="col-span-2 bg-white rounded-2xl border border-brand-gray-border p-6">
            <div className="flex items-center gap-2 mb-6">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <h2 className="font-bold text-brand-black">גיוסים לפי חודש (6 חודשים אחרונים)</h2>
            </div>
            {isLoading ? (
              <div className="h-32 bg-brand-gray-light rounded animate-pulse" />
            ) : (data?.monthlyHires ?? []).length === 0 ? (
              <p className="text-brand-gray text-center py-6">אין גיוסים עדיין</p>
            ) : (
              <div className="flex items-end gap-3 h-32">
                {data!.monthlyHires.map((m, i) => (
                  <div key={m.month} className="flex-1 flex flex-col items-center gap-1">
                    <span className="text-xs font-semibold text-brand-black">{m.count}</span>
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: maxMonthly > 0 ? `${(m.count / maxMonthly) * 80}%` : "4px" }}
                      transition={{ duration: 0.5, delay: i * 0.08, ease: "easeOut" }}
                      className="w-full bg-green-400 rounded-t-lg min-h-[4px]"
                      style={{ height: maxMonthly > 0 ? `${Math.max((m.count / maxMonthly) * 100, 5)}%` : "5%" }}
                    />
                    <span className="text-xs text-brand-gray">{m.month}</span>
                  </div>
                ))}
              </div>
            )}
          </motion.div>

          {/* HR Staff */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, delay: 0.37 }} className="bg-white rounded-2xl border border-brand-gray-border p-6">
            <div className="flex items-center gap-2 mb-6">
              <Users className="w-5 h-5 text-brand-gray" />
              <h2 className="font-bold text-brand-black">עובדי HR</h2>
            </div>
            {isLoading ? (
              <div className="space-y-3 animate-pulse">{[...Array(3)].map((_, i) => <div key={i} className="h-10 bg-brand-gray-light rounded" />)}</div>
            ) : (data?.hrStaffStats ?? []).length === 0 ? (
              <div className="text-center py-4">
                <p className="text-brand-gray text-sm mb-3">אין עובדי HR</p>
                <button onClick={() => router.push("/hr-staff")} className="text-xs text-brand-yellow font-semibold hover:underline">
                  הוסף עובד HR
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {data!.hrStaffStats.map((s) => (
                  <div key={s.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-brand-yellow-soft flex items-center justify-center flex-shrink-0">
                        <span className="text-xs font-bold text-brand-black">
                          {s.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-brand-black leading-tight">{s.name}</p>
                        {s.role && <p className="text-xs text-brand-gray">{s.role}</p>}
                      </div>
                    </div>
                    <span className="text-sm font-bold text-brand-black bg-brand-gray-light px-2 py-0.5 rounded-full">{s.candidateCount}</span>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        </div>

        {/* Recent Activity */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, delay: 0.4 }} className="bg-white rounded-2xl border border-brand-gray-border overflow-hidden">
          <div className="px-6 py-4 border-b border-brand-gray-border flex items-center gap-2">
            <Clock className="w-4 h-4 text-brand-gray" />
            <h2 className="font-bold text-brand-black">פעילות אחרונה</h2>
          </div>
          {isLoading ? (
            <div className="p-6 space-y-3 animate-pulse">{[...Array(5)].map((_, i) => <div key={i} className="h-10 bg-brand-gray-light rounded" />)}</div>
          ) : (data?.recentActivity ?? []).length === 0 ? (
            <div className="p-8 text-center text-brand-gray">אין פעילות אחרונה</div>
          ) : (
            <div className="divide-y divide-brand-gray-border">
              {data!.recentActivity.map((a, i) => (
                <motion.div
                  key={a.id}
                  initial={{ opacity: 0, x: -6 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.2, delay: i * 0.04 }}
                  className="px-6 py-3 flex items-center gap-4 hover:bg-brand-gray-light/40 transition-colors"
                >
                  <div className={`w-2 h-2 rounded-full flex-shrink-0 ${STAGE_COLORS[a.recruitmentStage] ?? "bg-gray-300"}`} />
                  <button onClick={() => router.push(`/candidates/${a.candidate?.id}`)} className="font-medium text-brand-black hover:underline text-sm w-36 text-right flex-shrink-0">
                    {a.candidate?.fullName}
                  </button>
                  <span className="text-xs px-2 py-0.5 rounded-full border text-brand-gray bg-brand-gray-light flex-shrink-0">
                    {STAGE_LABELS[a.recruitmentStage] ?? a.recruitmentStage}
                  </span>
                  <button onClick={() => router.push(`/jobs/${a.job?.id}`)} className="text-brand-gray hover:text-brand-black hover:underline text-sm flex-1 text-right truncate">
                    {a.job?.title}
                  </button>
                  <span className="text-xs text-brand-gray flex-shrink-0">
                    {new Date(a.updatedAt).toLocaleDateString("he-IL")}
                  </span>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </AppShell>
  );
}
