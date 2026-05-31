"use client";

import { useState } from "react";
import { use } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ArrowRight, MoreVertical, Edit, CheckCircle, Trash2, RotateCcw, AlertCircle, Bell, DollarSign, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import AppShell from "@/components/layout/AppShell";
import KanbanBoard from "@/components/kanban/KanbanBoard";
import JobForm from "@/components/jobs/JobForm";
import CandidateForm from "@/components/candidates/CandidateForm";
import ReminderForm from "@/components/reminders/ReminderForm";
import { useJob, useUpdateJob, useDeleteJob } from "@/lib/api/jobs";
import { useCreateReminder } from "@/lib/api/reminders";
import { useCreateCandidate } from "@/lib/api/candidates";

export default function JobPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [showEdit, setShowEdit] = useState(false);
  const [showFillConfirm, setShowFillConfirm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showReminderForm, setShowReminderForm] = useState(false);
  const [showNewCandidate, setShowNewCandidate] = useState(false);

  const { data: job, isLoading } = useJob(id);
  const updateJob = useUpdateJob(id);
  const deleteJob = useDeleteJob();
  const createReminder = useCreateReminder();
  const createCandidate = useCreateCandidate();

  const handleUpdate = async (data: { title: string; description: string; requirements: string; salaryBudget?: string }) => {
    const result = await updateJob.mutateAsync(data);
    if (!result.error) toast.success("המשרה עודכנה"); else toast.error("שגיאה");
  };

  const handleFill = async () => {
    await updateJob.mutateAsync({ status: "filled" });
    toast.success("המשרה סומנה כנסגרה");
    setShowFillConfirm(false);
  };

  const handleReopen = async () => {
    await updateJob.mutateAsync({ status: "open" });
    toast.success("המשרה נפתחה מחדש");
  };

  const handleDelete = async () => {
    await deleteJob.mutateAsync(id);
    toast.success("המשרה נמחקה");
    router.push("/jobs");
  };

  const handleCreateReminder = async (data: { title: string; dueDate?: string | null }) => {
    const result = await createReminder.mutateAsync({ ...data, jobId: id });
    if (result.id) toast.success("התזכורת נוספה");
    else toast.error("שגיאה בהוספת תזכורת");
  };

  const handleCreateCandidate = async (data: Parameters<typeof CandidateForm>[0]["onSubmit"] extends (d: infer D) => unknown ? D : never) => {
    const fd = new FormData();
    fd.append("fullName", data.fullName);
    fd.append("phone", data.phone);
    if (data.email) fd.append("email", data.email);
    if (data.address) fd.append("address", data.address);
    fd.append("appliedForJobId", id);
    if (data.source) fd.append("source", data.source);
    if (data.referredById) fd.append("referredById", data.referredById);
    if (data.salaryExpectation) fd.append("salaryExpectation", data.salaryExpectation);
    if (data.hrStaffId) fd.append("hrStaffId", data.hrStaffId);
    if (data.cv) fd.append("cv", data.cv);

    const result = await createCandidate.mutateAsync(fd);
    if (result.id) {
      toast.success("המועמד נוצר ושויך למשרה");
    } else {
      const msg = typeof result.error === "string" ? result.error : "שגיאה ביצירת מועמד";
      toast.error(msg);
      throw new Error(msg);
    }
  };

  if (isLoading) {
    return (
      <AppShell>
        <div className="p-8 space-y-4 animate-pulse">
          <div className="h-8 bg-brand-gray-light rounded w-64" />
          <div className="h-4 bg-brand-gray-light rounded w-48" />
        </div>
      </AppShell>
    );
  }

  if (!job) {
    return (
      <AppShell>
        <div className="p-8 text-center">
          <p className="text-brand-gray">משרה לא נמצאה</p>
          <Button onClick={() => router.push("/jobs")} className="mt-4 rounded-xl">חזרה למשרות</Button>
        </div>
      </AppShell>
    );
  }

  const isFilled = job.status === "filled";
  const hiredAssignments = job.assignments?.filter((a) => a.recruitmentStage === "hired") ?? [];
  const hiredCount = hiredAssignments.length;

  return (
    <AppShell>
      <div className="p-8">
        <button onClick={() => router.push("/jobs")} className="flex items-center gap-1 text-brand-gray hover:text-brand-black text-sm mb-6 transition-colors">
          <ArrowRight className="w-4 h-4" />
          חזרה למשרות
        </button>

        {isFilled && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-xl flex items-center justify-between">
            <div className="flex items-center gap-2 text-green-800">
              <CheckCircle className="w-5 h-5 flex-shrink-0" />
              <span className="font-medium">
                המשרה נסגרה{job.filledAt && ` ב-${new Date(job.filledAt).toLocaleDateString("he-IL")}`}
              </span>
            </div>
            <Button size="sm" variant="outline" onClick={handleReopen} className="rounded-xl gap-2 text-green-700 border-green-300 hover:bg-green-50">
              <RotateCcw className="w-4 h-4" />
              פתח מחדש
            </Button>
          </div>
        )}

        <div className="flex items-start justify-between mb-4">
          <div className="flex items-start gap-3 flex-wrap">
            <h1 className="text-3xl font-bold text-brand-black">{job.title}</h1>
            <Badge className={`rounded-full ${isFilled ? "bg-brand-black text-white" : "bg-brand-yellow text-brand-black"}`}>
              {isFilled ? "נסגרה" : "פתוחה"}
            </Badge>
            {hiredCount > 0 && (
              <div className="flex items-center gap-2">
                <Badge className="rounded-full bg-green-100 text-green-700 border border-green-200">
                  גויסו: {hiredCount}
                </Badge>
                <span className="text-sm text-green-700 font-medium">
                  {hiredAssignments.map((a) => a.candidate?.fullName).join(", ")}
                </span>
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              onClick={() => setShowNewCandidate(true)}
              className="rounded-xl bg-brand-yellow text-brand-black hover:bg-brand-yellow-hover font-semibold gap-2"
            >
              <UserPlus className="w-4 h-4" />
              מועמד חדש
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger className="inline-flex items-center justify-center w-9 h-9 rounded-xl border border-input bg-background hover:bg-accent transition-colors">
                <MoreVertical className="w-4 h-4" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                <DropdownMenuItem onClick={() => setShowEdit(true)} className="gap-2">
                  <Edit className="w-4 h-4" />
                  עריכה
                </DropdownMenuItem>
                {isFilled ? (
                  <DropdownMenuItem onClick={handleReopen} className="gap-2">
                    <RotateCcw className="w-4 h-4" />
                    פתח מחדש
                  </DropdownMenuItem>
                ) : (
                  <DropdownMenuItem onClick={() => setShowFillConfirm(true)} className="gap-2">
                    <CheckCircle className="w-4 h-4" />
                    סמן כנסגרה
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem onClick={() => setShowReminderForm(true)} className="gap-2">
                  <Bell className="w-4 h-4" />
                  הוסף תזכורת
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setShowDeleteConfirm(true)} className="text-red-600 focus:text-red-600 gap-2">
                  <Trash2 className="w-4 h-4" />
                  מחיקה
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {job.salaryBudget && (
          <div className="flex items-center gap-2 mb-6 text-sm text-brand-gray">
            <DollarSign className="w-4 h-4 text-green-600" />
            <span>תקציב שכר:</span>
            <span className="font-semibold text-brand-black">{job.salaryBudget}</span>
          </div>
        )}

        <Tabs defaultValue="board" className="mb-6">
          <TabsList className="rounded-xl bg-brand-gray-light">
            <TabsTrigger value="board" className="rounded-lg">לוח מועמדים</TabsTrigger>
            <TabsTrigger value="details" className="rounded-lg">פרטי המשרה</TabsTrigger>
          </TabsList>
          <TabsContent value="board" className="mt-6">
            <KanbanBoard job={job as Parameters<typeof KanbanBoard>[0]['job']} />
          </TabsContent>
          <TabsContent value="details" className="mt-6">
            <div className="bg-white rounded-2xl border border-brand-gray-border p-6 space-y-6">
              {job.salaryBudget && (
                <div>
                  <h3 className="font-semibold text-brand-black mb-2">תקציב שכר</h3>
                  <p className="text-brand-gray">{job.salaryBudget}</p>
                </div>
              )}
              <div>
                <h3 className="font-semibold text-brand-black mb-2">תיאור</h3>
                <p className="text-brand-gray whitespace-pre-wrap">{job.description}</p>
              </div>
              <div>
                <h3 className="font-semibold text-brand-black mb-2">דרישות</h3>
                <p className="text-brand-gray whitespace-pre-wrap">{job.requirements}</p>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      <JobForm
        open={showEdit}
        onClose={() => setShowEdit(false)}
        onSubmit={handleUpdate}
        defaultValues={job}
        title="עריכת משרה"
        loading={updateJob.isPending}
      />

      <CandidateForm
        open={showNewCandidate}
        onClose={() => setShowNewCandidate(false)}
        onSubmit={handleCreateCandidate}
        title={`מועמד חדש — ${job.title}`}
        loading={createCandidate.isPending}
        preselectedJobId={id}
      />

      <Dialog open={showFillConfirm} onOpenChange={setShowFillConfirm}>
        <DialogContent className="max-w-sm rounded-2xl">
          <DialogHeader>
            <DialogTitle>סגירת משרה</DialogTitle>
          </DialogHeader>
          <p className="text-brand-gray text-sm">
            האם לסגור את המשרה "{job.title}"? <br />
            מועמדים שמורים בעמודת "לעתיד" יישארו זמינים.
          </p>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowFillConfirm(false)} className="rounded-xl">ביטול</Button>
            <Button onClick={handleFill} className="rounded-xl bg-brand-black text-white hover:opacity-80">אישור</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ReminderForm
        open={showReminderForm}
        onClose={() => setShowReminderForm(false)}
        onSubmit={handleCreateReminder}
        loading={createReminder.isPending}
        contextLabel={job.title}
      />

      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogContent className="max-w-sm rounded-2xl">
          <DialogHeader>
            <DialogTitle>מחיקת משרה</DialogTitle>
          </DialogHeader>
          <p className="text-brand-gray text-sm">האם למחוק את המשרה "{job.title}"? פעולה זו אינה הפיכה.</p>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowDeleteConfirm(false)} className="rounded-xl">ביטול</Button>
            <Button onClick={handleDelete} className="rounded-xl bg-red-500 text-white hover:bg-red-600">מחק</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}
