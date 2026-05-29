"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  CalendarCheck, Bell, Star, ChevronDown, ChevronUp, CheckCircle, Clock, FileText,
  MessageSquare,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import AppShell from "@/components/layout/AppShell";
import { useInterviews, useUpdateInterview } from "@/lib/api/interviews";

interface Assignment {
  id: string;
  recruitmentStage: string;
  interviewDate: string | null;
  interviewSummary: string | null;
  interviewRating: number | null;
  candidate?: { id: string; fullName: string; phone: string };
  job?: { id: string; title: string; status: string };
}

interface Reminder {
  id: string;
  title: string;
  dueDate: string | null;
  candidate?: { id: string; fullName: string } | null;
}

const STAGE_LABELS: Record<string, string> = {
  interview: "ראיון",
  offer: "הצעה",
  hired: "גויס",
  rejected: "נדחה",
  cv_received: 'קו"ח',
};

const STAGE_COLORS: Record<string, string> = {
  interview: "bg-yellow-50 text-yellow-700 border-yellow-200",
  offer: "bg-purple-50 text-purple-700 border-purple-200",
  hired: "bg-green-50 text-green-700 border-green-200",
  rejected: "bg-red-50 text-red-600 border-red-200",
  cv_received: "bg-blue-50 text-blue-600 border-blue-200",
};

export function RatingBadge({ rating }: { rating: number | null }) {
  if (!rating) return null;
  const color =
    rating >= 8 ? "bg-green-100 text-green-700" :
    rating >= 5 ? "bg-brand-yellow text-brand-black" :
    "bg-red-100 text-red-600";
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full ${color}`}>
      <Star className="w-3 h-3 fill-current" />
      {rating}
    </span>
  );
}

function InterviewRow({ assignment }: { assignment: Assignment }) {
  const router = useRouter();
  const [expanded, setExpanded] = useState(false);
  const [summary, setSummary] = useState(assignment.interviewSummary ?? "");
  const [rating, setRating] = useState<number | null>(assignment.interviewRating);
  const update = useUpdateInterview();

  const handleSave = async () => {
    await update.mutateAsync({ id: assignment.id, interviewSummary: summary || null, interviewRating: rating });
    toast.success("הראיון עודכן");
    setExpanded(false);
  };

  const stageColor = STAGE_COLORS[assignment.recruitmentStage] ?? "bg-gray-50 text-gray-600 border-gray-200";
  const stageLabel = STAGE_LABELS[assignment.recruitmentStage] ?? assignment.recruitmentStage;

  return (
    <div className="border-b border-brand-gray-border last:border-0">
      <div
        className="px-6 py-4 flex items-center gap-4 hover:bg-brand-gray-light/40 transition-colors cursor-pointer"
        onClick={() => setExpanded((e) => !e)}
      >
        <button
          onClick={(e) => { e.stopPropagation(); router.push(`/candidates/${assignment.candidate?.id}`); }}
          className="font-semibold text-brand-black hover:underline text-sm w-36 text-right flex-shrink-0"
        >
          {assignment.candidate?.fullName}
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); router.push(`/jobs/${assignment.job?.id}`); }}
          className="text-brand-gray hover:text-brand-black hover:underline text-sm flex-1 text-right truncate"
        >
          {assignment.job?.title}
        </button>
        {assignment.interviewDate ? (
          <span className="text-xs text-brand-gray flex-shrink-0 w-24 text-left">
            {new Date(assignment.interviewDate).toLocaleDateString("he-IL")}
          </span>
        ) : (
          <span className="text-xs text-brand-gray/50 flex-shrink-0 w-24 text-left">—</span>
        )}
        <span className={`text-xs px-2 py-0.5 rounded-full border font-medium flex-shrink-0 ${stageColor}`}>
          {stageLabel}
        </span>
        <div className="flex-shrink-0 w-14 flex justify-center">
          <RatingBadge rating={rating} />
        </div>
        <div className="flex-shrink-0 text-brand-gray">
          {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </div>
      </div>

      {expanded && (
        <div className="px-6 pb-5 bg-brand-yellow-soft/30 border-t border-brand-gray-border/50">
          <div className="pt-4 space-y-4 max-w-2xl">
            <div>
              <label className="text-xs font-medium text-brand-gray mb-2 block flex items-center gap-1">
                <MessageSquare className="w-3.5 h-3.5" />
                סיכום ראיון
              </label>
              <Textarea
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                placeholder="רשום סיכום הראיון, רשמים, נקודות חזקות/חלשות..."
                rows={3}
                className="rounded-xl resize-none text-sm bg-white"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-brand-gray mb-2 block flex items-center gap-1">
                <Star className="w-3.5 h-3.5" />
                דירוג 1–10
              </label>
              <div className="flex gap-1.5 flex-wrap">
                {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
                  <button
                    key={n}
                    onClick={() => setRating(rating === n ? null : n)}
                    className={`w-9 h-9 rounded-xl text-sm font-bold transition-all ${
                      rating === n
                        ? n >= 8 ? "bg-green-500 text-white shadow-sm"
                          : n >= 5 ? "bg-brand-yellow text-brand-black shadow-sm"
                          : "bg-red-400 text-white shadow-sm"
                        : "bg-white border border-brand-gray-border text-brand-gray hover:border-brand-yellow hover:text-brand-black"
                    }`}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={handleSave}
                disabled={update.isPending}
                size="sm"
                className="rounded-xl bg-brand-yellow text-brand-black hover:bg-brand-yellow-hover font-semibold"
              >
                שמור
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => { setExpanded(false); setSummary(assignment.interviewSummary ?? ""); setRating(assignment.interviewRating); }}
                className="rounded-xl"
              >
                ביטול
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function InterviewsPage() {
  const router = useRouter();
  const { data, isLoading } = useInterviews();

  const upcoming: Assignment[] = data?.upcoming ?? [];
  const past: Assignment[] = data?.past ?? [];
  const reminders: Reminder[] = data?.reminders ?? [];

  const pendingSummary = past.filter((a) => !a.interviewSummary && !a.interviewRating).length;

  return (
    <AppShell>
      <div className="p-8 space-y-8">
        <div>
          <h1 className="text-2xl font-bold text-brand-black">ראיונות עבודה</h1>
          <p className="text-brand-gray text-sm mt-1">מעקב אחר כל הראיונות — עתידיים, עברו וסיכומים</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white rounded-2xl border border-brand-gray-border p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 rounded-xl bg-brand-yellow-soft flex items-center justify-center">
                <Clock className="w-5 h-5 text-brand-black" />
              </div>
              <span className="text-sm text-brand-gray font-medium">ראיונות קרובים</span>
            </div>
            <p className="text-3xl font-bold text-brand-black">{isLoading ? "—" : upcoming.length}</p>
          </div>
          <div className="bg-white rounded-2xl border border-brand-gray-border p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 rounded-xl bg-orange-50 flex items-center justify-center">
                <FileText className="w-5 h-5 text-orange-500" />
              </div>
              <span className="text-sm text-brand-gray font-medium">ממתינים לסיכום</span>
            </div>
            <p className="text-3xl font-bold text-brand-black">{isLoading ? "—" : pendingSummary}</p>
          </div>
          <div className="bg-white rounded-2xl border border-brand-gray-border p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 rounded-xl bg-green-50 flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
              <span className="text-sm text-brand-gray font-medium">סה"כ ראיונות</span>
            </div>
            <p className="text-3xl font-bold text-brand-black">{isLoading ? "—" : upcoming.length + past.length}</p>
          </div>
        </div>

        {/* Upcoming Reminders */}
        {reminders.length > 0 && (
          <div className="bg-brand-yellow-soft border border-brand-yellow rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-3">
              <Bell className="w-4 h-4 text-brand-black" />
              <h2 className="font-semibold text-brand-black text-sm">תזכורות ראיונות קרובות</h2>
            </div>
            <div className="space-y-2">
              {reminders.map((r) => (
                <div key={r.id} className="flex items-center gap-3 bg-white/70 rounded-xl px-4 py-2">
                  <button
                    onClick={() => r.candidate && router.push(`/candidates/${r.candidate.id}`)}
                    className="font-medium text-brand-black text-sm hover:underline"
                  >
                    {r.candidate?.fullName ?? r.title}
                  </button>
                  <span className="text-xs text-brand-gray flex-1">{r.title}</span>
                  {r.dueDate && (
                    <span className="text-xs font-medium text-brand-black">
                      {new Date(r.dueDate).toLocaleDateString("he-IL", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Upcoming Interviews */}
        {upcoming.length > 0 && (
          <div className="bg-white rounded-2xl border border-brand-gray-border overflow-hidden">
            <div className="px-6 py-4 border-b border-brand-gray-border flex items-center gap-2">
              <CalendarCheck className="w-4 h-4 text-brand-yellow" />
              <h2 className="font-semibold text-brand-black">ראיונות קרובים</h2>
              <span className="mr-auto text-sm text-brand-gray">{upcoming.length} ראיונות</span>
            </div>
            <div className="divide-y divide-brand-gray-border">
              {/* Header */}
              <div className="px-6 py-2 flex items-center gap-4 bg-brand-gray-light/30 text-xs font-medium text-brand-gray">
                <span className="w-36 text-right">מועמד</span>
                <span className="flex-1 text-right">משרה</span>
                <span className="w-24 text-left">תאריך ראיון</span>
                <span className="w-16 text-center">שלב</span>
                <span className="w-14 text-center">דירוג</span>
                <span className="w-4" />
              </div>
              {upcoming.map((a) => <InterviewRow key={a.id} assignment={a} />)}
            </div>
          </div>
        )}

        {/* Past Interviews */}
        <div className="bg-white rounded-2xl border border-brand-gray-border overflow-hidden">
          <div className="px-6 py-4 border-b border-brand-gray-border flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-brand-gray" />
            <h2 className="font-semibold text-brand-black">ראיונות שהתקיימו</h2>
            <span className="mr-auto text-sm text-brand-gray">{past.length} ראיונות</span>
          </div>
          {isLoading ? (
            <div className="p-8 text-center text-brand-gray animate-pulse">טוען...</div>
          ) : past.length === 0 ? (
            <div className="p-8 text-center text-brand-gray">אין ראיונות שהתקיימו עדיין</div>
          ) : (
            <div className="divide-y divide-brand-gray-border">
              {/* Header */}
              <div className="px-6 py-2 flex items-center gap-4 bg-brand-gray-light/30 text-xs font-medium text-brand-gray">
                <span className="w-36 text-right">מועמד</span>
                <span className="flex-1 text-right">משרה</span>
                <span className="w-24 text-left">תאריך ראיון</span>
                <span className="w-16 text-center">שלב</span>
                <span className="w-14 text-center">דירוג</span>
                <span className="w-4" />
              </div>
              {past.map((a) => <InterviewRow key={a.id} assignment={a} />)}
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
