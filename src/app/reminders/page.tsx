"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus, Bell, Trash2, Check, RotateCcw, Briefcase, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import AppShell from "@/components/layout/AppShell";
import ReminderForm from "@/components/reminders/ReminderForm";
import { useReminders, useCreateReminder, useUpdateReminder, useDeleteReminder } from "@/lib/api/reminders";
import type { Reminder } from "@/types/api";

const filterOptions = [
  { key: "all", label: "הכול" },
  { key: "pending", label: "ממתינות" },
  { key: "done", label: "הושלמו" },
];

export default function RemindersPage() {
  const router = useRouter();
  const [filter, setFilter] = useState<"all" | "pending" | "done">("pending");
  const [showForm, setShowForm] = useState(false);

  const isDoneFilter = filter === "done" ? true : filter === "pending" ? false : undefined;
  const { data: reminders, isLoading } = useReminders(isDoneFilter !== undefined ? { isDone: isDoneFilter } : {});
  const createReminder = useCreateReminder();
  const updateReminder = useUpdateReminder();
  const deleteReminder = useDeleteReminder();

  const handleCreate = async (data: { title: string; dueDate?: string | null }) => {
    const result = await createReminder.mutateAsync(data);
    if (result.id) {
      toast.success("התזכורת נוספה");
    } else {
      toast.error("שגיאה בהוספת תזכורת");
    }
  };

  const handleToggle = async (reminder: Reminder) => {
    await updateReminder.mutateAsync({ id: reminder.id, isDone: !reminder.isDone });
    toast.success(reminder.isDone ? "התזכורת סומנה כממתינה" : "התזכורת הושלמה");
  };

  const handleDelete = async (id: string) => {
    await deleteReminder.mutateAsync(id);
    toast.success("התזכורת נמחקה");
  };

  const isOverdue = (reminder: Reminder) =>
    !reminder.isDone && reminder.dueDate && new Date(reminder.dueDate) < new Date();

  const pendingCount = reminders?.filter((r) => !r.isDone).length ?? 0;

  return (
    <AppShell>
      <div className="p-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-brand-black">תזכורות</h1>
            <p className="text-brand-gray mt-1">
              {pendingCount > 0 ? `${pendingCount} תזכורות ממתינות` : "אין תזכורות ממתינות"}
            </p>
          </div>
          <Button
            onClick={() => setShowForm(true)}
            className="rounded-xl bg-brand-yellow text-brand-black hover:bg-brand-yellow-hover font-semibold gap-2"
          >
            <Plus className="w-4 h-4" />
            תזכורת חדשה
          </Button>
        </div>

        <div className="flex gap-2 mb-6">
          {filterOptions.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setFilter(key as "all" | "pending" | "done")}
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
          <div className="space-y-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-white rounded-xl p-4 border border-brand-gray-border animate-pulse flex gap-4">
                <div className="h-4 bg-brand-gray-light rounded flex-1" />
                <div className="h-4 bg-brand-gray-light rounded w-24" />
              </div>
            ))}
          </div>
        ) : reminders?.length === 0 ? (
          <div className="text-center py-20">
            <Bell className="w-16 h-16 text-brand-gray-border mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-brand-black mb-2">
              {filter === "done" ? "אין תזכורות שהושלמו" : filter === "pending" ? "אין תזכורות ממתינות" : "אין תזכורות"}
            </h2>
            <p className="text-brand-gray mb-6">לחצי על &quot;תזכורת חדשה&quot; כדי להתחיל</p>
          </div>
        ) : (
          <div className="space-y-2">
            {reminders?.map((reminder) => (
              <ReminderRow
                key={reminder.id}
                reminder={reminder}
                isOverdue={!!isOverdue(reminder)}
                onToggle={() => handleToggle(reminder)}
                onDelete={() => handleDelete(reminder.id)}
                onNavigateJob={() => router.push(`/jobs/${reminder.jobId}`)}
                onNavigateCandidate={() => router.push(`/candidates/${reminder.candidateId}`)}
              />
            ))}
          </div>
        )}
      </div>

      <ReminderForm
        open={showForm}
        onClose={() => setShowForm(false)}
        onSubmit={handleCreate}
        loading={createReminder.isPending}
      />
    </AppShell>
  );
}

function ReminderRow({
  reminder,
  isOverdue,
  onToggle,
  onDelete,
  onNavigateJob,
  onNavigateCandidate,
}: {
  reminder: Reminder;
  isOverdue: boolean;
  onToggle: () => void;
  onDelete: () => void;
  onNavigateJob: () => void;
  onNavigateCandidate: () => void;
}) {
  return (
    <div
      className={`bg-white rounded-xl border px-4 py-3 flex items-center gap-3 group transition-colors ${
        isOverdue ? "border-red-200 bg-red-50" : "border-brand-gray-border"
      } ${reminder.isDone ? "opacity-60" : ""}`}
    >
      <button
        onClick={onToggle}
        className={`w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-colors ${
          reminder.isDone
            ? "bg-green-500 border-green-500 text-white"
            : isOverdue
            ? "border-red-400 hover:border-red-500"
            : "border-brand-gray hover:border-brand-yellow"
        }`}
      >
        {reminder.isDone ? (
          <Check className="w-3 h-3" />
        ) : (
          <RotateCcw className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
        )}
      </button>

      <div className="flex-1 min-w-0">
        <span className={`text-sm font-medium ${reminder.isDone ? "line-through text-brand-gray" : "text-brand-black"}`}>
          {reminder.title}
        </span>
        <div className="flex items-center gap-3 mt-0.5 flex-wrap">
          {reminder.dueDate && (
            <span className={`text-xs ${isOverdue ? "text-red-600 font-medium" : "text-brand-gray"}`}>
              {isOverdue ? "⚠ " : ""}
              {new Date(reminder.dueDate).toLocaleDateString("he-IL")}
            </span>
          )}
          {reminder.job && (
            <button
              onClick={onNavigateJob}
              className="flex items-center gap-1 text-xs text-blue-600 hover:underline"
            >
              <Briefcase className="w-3 h-3" />
              {reminder.job.title}
            </button>
          )}
          {reminder.candidate && (
            <button
              onClick={onNavigateCandidate}
              className="flex items-center gap-1 text-xs text-purple-600 hover:underline"
            >
              <User className="w-3 h-3" />
              {reminder.candidate.fullName}
            </button>
          )}
        </div>
      </div>

      <button
        onClick={onDelete}
        className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-brand-gray hover:text-red-500 hover:bg-red-50 transition-all"
      >
        <Trash2 className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}
