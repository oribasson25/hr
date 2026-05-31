"use client";

import { use, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ArrowRight, Edit, FileText, Trash2, Plus, X, Pencil, CheckCircle, Bell, RefreshCw, Calendar, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import AppShell from "@/components/layout/AppShell";
import CandidateForm from "@/components/candidates/CandidateForm";
import CVPreview from "@/components/cv/CVPreview";
import ReminderForm from "@/components/reminders/ReminderForm";
import { useCandidate, useUpdateCandidate, useDeleteCandidate, useUploadCV, useDeleteCV } from "@/lib/api/candidates";
import { useCreateNote, useUpdateNote, useDeleteNote } from "@/lib/api/notes";
import { useCreateReminder } from "@/lib/api/reminders";
import { useUpdateRecruitmentStage } from "@/lib/api/recruitment";
import type { RecruitmentStage, CandidateSource } from "@/types/api";

const SOURCE_LABELS: Record<CandidateSource, string> = {
  referral: "חבר מביא חבר",
  linkedin: "לינקדאין",
  facebook: "פייסבוק",
  job_board: "אתר משרות",
  instagram: "אינסטגרם",
  tiktok: "טיקטוק",
};

const STATUS_LABELS: Record<string, string> = {
  leading: "מוביל",
  candidate: "מועמד",
  not_relevant: "לא רלוונטי",
  future: "לעתיד",
};
const STATUS_COLORS: Record<string, string> = {
  leading: "bg-brand-yellow text-brand-black",
  candidate: "bg-blue-100 text-blue-800",
  not_relevant: "bg-gray-100 text-gray-600",
  future: "bg-purple-100 text-purple-800",
};

export default function CandidatePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [showEdit, setShowEdit] = useState(false);
  const [showCV, setShowCV] = useState(false);
  const [showReminderForm, setShowReminderForm] = useState(false);
  const [newNote, setNewNote] = useState("");
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [editingNoteContent, setEditingNoteContent] = useState("");
  const [stageDialog, setStageDialog] = useState<{ assignmentId: string; type: "interview" | "hired"; jobTitle: string } | null>(null);
  const [stageDate, setStageDate] = useState("");
  const [rejectionDialog, setRejectionDialog] = useState<{ assignmentId: string; jobTitle: string } | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");

  const cvInputRef = useRef<HTMLInputElement>(null);

  const { data: candidate, isLoading } = useCandidate(id);
  const updateCandidate = useUpdateCandidate(id);
  const deleteCandidate = useDeleteCandidate();
  const uploadCV = useUploadCV(id);
  const deleteCV = useDeleteCV(id);
  const createNote = useCreateNote(id);
  const updateNote = useUpdateNote(id);
  const deleteNote = useDeleteNote(id);
  const createReminder = useCreateReminder();
  const updateRecruitmentStage = useUpdateRecruitmentStage(id);

  const handleUpdate = async (data: Parameters<typeof CandidateForm>[0]["onSubmit"] extends (d: infer D) => unknown ? D : never) => {
    const result = await updateCandidate.mutateAsync({
      fullName: data.fullName,
      phone: data.phone,
      email: data.email || null,
      address: data.address || null,
      appliedForCustom: data.appliedForCustom || null,
      source: data.source || null,
      referredById: data.referredById || null,
      salaryExpectation: data.salaryExpectation || null,
      hrStaffId: data.hrStaffId || null,
    });
    if (!result.error) toast.success("המועמד עודכן");
  };

  const handleDelete = async () => {
    if (!confirm("האם למחוק את המועמד?")) return;
    await deleteCandidate.mutateAsync(id);
    toast.success("המועמד נמחק");
    router.push("/candidates");
  };

  const handleReplaceCV = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const ext = file.name.split(".").pop()?.toLowerCase();
    if (!["pdf", "docx"].includes(ext || "")) {
      toast.error("סוג קובץ לא נתמך (PDF או DOCX בלבד)");
      return;
    }
    const fd = new FormData();
    fd.append("cv", file);
    try {
      await uploadCV.mutateAsync(fd);
      toast.success("קורות החיים הוחלפו בהצלחה");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "שגיאה בהעלאת קובץ");
    }
    e.target.value = "";
  };

  const handleDeleteCV = async () => {
    if (!confirm("האם למחוק את קורות החיים?")) return;
    try {
      await deleteCV.mutateAsync();
      toast.success("קורות החיים נמחקו");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "שגיאה במחיקת קובץ");
    }
  };

  const handleCreateReminder = async (data: { title: string; dueDate?: string | null }) => {
    const result = await createReminder.mutateAsync({ ...data, candidateId: id });
    if (result.id) toast.success("התזכורת נוספה");
    else toast.error("שגיאה בהוספת תזכורת");
  };

  const handleStageDialogConfirm = async () => {
    if (!stageDialog) return;
    const { assignmentId, type, jobTitle } = stageDialog;
    const dateISO = stageDate ? new Date(stageDate).toISOString() : null;

    if (type === "interview") {
      await updateRecruitmentStage.mutateAsync({ id: assignmentId, recruitmentStage: "interview" });
      if (dateISO && candidate) {
        await createReminder.mutateAsync({
          title: `ראיון — ${candidate.fullName} | ${jobTitle}`,
          dueDate: dateISO,
          candidateId: id,
        });
        toast.success("השלב עודכן והתזכורת נוצרה");
      } else {
        toast.success("השלב עודכן לראיון");
      }
    } else {
      await updateRecruitmentStage.mutateAsync({
        id: assignmentId,
        recruitmentStage: "hired",
        startDate: dateISO,
      });
      toast.success("המועמד סומן כגויס");
    }

    setStageDialog(null);
    setStageDate("");
  };

  const handleRejectionConfirm = async () => {
    if (!rejectionDialog) return;
    if (!rejectionReason.trim()) {
      toast.error("נא לרשום סיבת דחייה");
      return;
    }
    await updateRecruitmentStage.mutateAsync({
      id: rejectionDialog.assignmentId,
      recruitmentStage: "rejected",
      rejectionReason: rejectionReason.trim(),
    });
    toast.success("המועמד סומן כנדחה");
    setRejectionDialog(null);
    setRejectionReason("");
  };

  const handleAddNote = async () => {
    if (!newNote.trim()) return;
    await createNote.mutateAsync(newNote.trim());
    setNewNote("");
    toast.success("ההערה נוספה");
  };

  const handleSaveNote = async (noteId: string) => {
    if (!editingNoteContent.trim()) return;
    await updateNote.mutateAsync({ id: noteId, content: editingNoteContent });
    setEditingNoteId(null);
    toast.success("ההערה עודכנה");
  };

  const handleDeleteNote = async (noteId: string) => {
    await deleteNote.mutateAsync(noteId);
    toast.success("ההערה נמחקה");
  };

  if (isLoading) {
    return (
      <AppShell>
        <div className="p-8 animate-pulse space-y-4">
          <div className="h-8 bg-brand-gray-light rounded w-64" />
          <div className="h-4 bg-brand-gray-light rounded w-48" />
        </div>
      </AppShell>
    );
  }

  if (!candidate) {
    return (
      <AppShell>
        <div className="p-8 text-center">
          <p className="text-brand-gray">מועמד לא נמצא</p>
          <Button onClick={() => router.push("/candidates")} className="mt-4 rounded-xl">חזרה</Button>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="p-8">
        <button onClick={() => router.push("/candidates")} className="flex items-center gap-1 text-brand-gray hover:text-brand-black text-sm mb-6 transition-colors">
          <ArrowRight className="w-4 h-4" />
          חזרה למועמדים
        </button>

        <div className="grid grid-cols-3 gap-8">
          <div className="space-y-4">
            <div className="bg-white rounded-2xl border border-brand-gray-border p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h1 className="text-xl font-bold text-brand-black">{candidate.fullName}</h1>
                  <p className="text-brand-gray text-sm mt-1">
                    נוסף {new Date(candidate.createdAt).toLocaleDateString("he-IL")}
                  </p>
                </div>
                <Button size="icon" variant="ghost" onClick={() => setShowEdit(true)} className="rounded-xl">
                  <Edit className="w-4 h-4" />
                </Button>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex gap-2">
                  <span className="text-brand-gray w-20 flex-shrink-0">טלפון:</span>
                  <a href={`tel:${candidate.phone}`} className="text-brand-black hover:underline">{candidate.phone}</a>
                </div>
                {candidate.email && (
                  <div className="flex gap-2">
                    <span className="text-brand-gray w-20 flex-shrink-0">אימייל:</span>
                    <a href={`mailto:${candidate.email}`} className="text-brand-black hover:underline truncate">{candidate.email}</a>
                  </div>
                )}
                {candidate.address && (
                  <div className="flex gap-2">
                    <span className="text-brand-gray w-20 flex-shrink-0">כתובת:</span>
                    <span className="text-brand-black">{candidate.address}</span>
                  </div>
                )}
                {candidate.salaryExpectation && (
                  <div className="flex gap-2">
                    <span className="text-brand-gray w-20 flex-shrink-0">ציפיות שכר:</span>
                    <span className="text-brand-black font-medium">{candidate.salaryExpectation}</span>
                  </div>
                )}
                {candidate.source && (
                  <div className="flex gap-2">
                    <span className="text-brand-gray w-20 flex-shrink-0">מקור:</span>
                    <span className="text-brand-black">{SOURCE_LABELS[candidate.source]}</span>
                  </div>
                )}
                {candidate.referredBy && (
                  <div className="flex gap-2">
                    <span className="text-brand-gray w-20 flex-shrink-0">הופנה על ידי:</span>
                    <button
                      onClick={() => router.push(`/candidates/${candidate.referredBy!.id}`)}
                      className="text-brand-black hover:underline font-medium"
                    >
                      {candidate.referredBy.fullName}
                    </button>
                  </div>
                )}
                {candidate.hrStaff && (
                  <div className="flex gap-2">
                    <span className="text-brand-gray w-20 flex-shrink-0">איש HR:</span>
                    <div className="flex items-center gap-1">
                      <User className="w-3.5 h-3.5 text-brand-gray" />
                      <span className="text-brand-black">{candidate.hrStaff.name}</span>
                    </div>
                  </div>
                )}
              </div>

              {candidate.appliedForCustom && (
                <div className="mt-4 p-3 bg-brand-yellow-soft rounded-xl">
                  <p className="text-xs text-brand-gray font-medium mb-1">מתמודד למשרה (חופשי)</p>
                  <p className="text-sm text-brand-black font-semibold">{candidate.appliedForCustom}</p>
                </div>
              )}

              {candidate.assignments && candidate.assignments.length > 0 && (
                <div className="mt-4 pt-4 border-t border-brand-gray-border">
                  <p className="text-xs text-brand-gray font-medium mb-2">משרות</p>
                  <div className="space-y-1.5">
                    {candidate.assignments.map((a) => (
                      <button
                        key={a.id}
                        onClick={() => router.push(`/jobs/${a.jobId}`)}
                        className="flex items-center justify-between w-full text-right group"
                      >
                        <span className="text-sm text-brand-black group-hover:underline truncate">{a.job?.title}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full flex-shrink-0 mr-2 ${
                          a.status === "leading" ? "bg-brand-yellow text-brand-black" :
                          a.status === "candidate" ? "bg-blue-100 text-blue-800" :
                          a.status === "future" ? "bg-purple-100 text-purple-800" :
                          "bg-gray-100 text-gray-600"
                        }`}>
                          {{ leading: "מוביל", candidate: "מועמד", future: "לעתיד", not_relevant: "לא רלוונטי" }[a.status]}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="bg-white rounded-2xl border border-brand-gray-border p-4 space-y-2">
              {candidate.cvFilePath ? (
                <>
                  <Button onClick={() => setShowCV(true)} className="w-full rounded-xl gap-2">
                    <FileText className="w-4 h-4" />
                    צפייה בקורות חיים
                  </Button>
                  <input ref={cvInputRef} type="file" accept=".pdf,.docx" className="hidden" onChange={handleReplaceCV} />
                  <Button onClick={() => cvInputRef.current?.click()} variant="outline" className="w-full rounded-xl gap-2" size="sm" disabled={uploadCV.isPending}>
                    <RefreshCw className="w-4 h-4" />
                    {uploadCV.isPending ? "מחליף..." : "החלף קורות חיים"}
                  </Button>
                  <Button onClick={handleDeleteCV} variant="ghost" className="w-full rounded-xl text-orange-500 hover:text-orange-600 hover:bg-orange-50 gap-2" size="sm" disabled={deleteCV.isPending}>
                    <Trash2 className="w-4 h-4" />
                    מחיקת קורות חיים
                  </Button>
                </>
              ) : (
                <>
                  <input ref={cvInputRef} type="file" accept=".pdf,.docx" className="hidden" onChange={handleReplaceCV} />
                  <Button onClick={() => cvInputRef.current?.click()} variant="outline" className="w-full rounded-xl gap-2" disabled={uploadCV.isPending}>
                    <FileText className="w-4 h-4" />
                    {uploadCV.isPending ? "מעלה..." : "העלאת קורות חיים"}
                  </Button>
                </>
              )}
              <Button onClick={() => setShowReminderForm(true)} variant="outline" className="w-full rounded-xl gap-2" size="sm">
                <Bell className="w-4 h-4" />
                הוסף תזכורת
              </Button>
              <Button onClick={handleDelete} variant="ghost" className="w-full rounded-xl text-red-500 hover:text-red-600 hover:bg-red-50 gap-2" size="sm">
                <Trash2 className="w-4 h-4" />
                מחיקת מועמד
              </Button>
            </div>
          </div>

          <div className="col-span-2">
            <Tabs defaultValue="notes">
              <TabsList className="rounded-xl bg-brand-gray-light mb-6">
                <TabsTrigger value="notes" className="rounded-lg">הערות</TabsTrigger>
                <TabsTrigger value="jobs" className="rounded-lg">משרות משויכות</TabsTrigger>
              </TabsList>

              <TabsContent value="notes">
                <div className="space-y-4">
                  <div className="bg-white rounded-2xl border border-brand-gray-border p-4 space-y-3">
                    <Textarea value={newNote} onChange={(e) => setNewNote(e.target.value)} placeholder="הוסיפי הערה..." rows={3} className="rounded-xl resize-none" />
                    <Button onClick={handleAddNote} disabled={!newNote.trim() || createNote.isPending} size="sm" className="rounded-xl bg-brand-yellow text-brand-black hover:bg-brand-yellow-hover font-semibold gap-2">
                      <Plus className="w-4 h-4" />
                      הוספת הערה
                    </Button>
                  </div>

                  {candidate.notes?.length === 0 && (
                    <div className="text-center py-8 text-brand-gray">אין הערות עדיין</div>
                  )}

                  {candidate.notes?.map((note) => (
                    <div key={note.id} className="bg-white rounded-2xl border border-brand-gray-border p-4">
                      {editingNoteId === note.id ? (
                        <div className="space-y-2">
                          <Textarea value={editingNoteContent} onChange={(e) => setEditingNoteContent(e.target.value)} rows={3} className="rounded-xl resize-none" />
                          <div className="flex gap-2">
                            <Button size="sm" onClick={() => handleSaveNote(note.id)} className="rounded-xl bg-brand-yellow text-brand-black hover:bg-brand-yellow-hover gap-1">
                              <CheckCircle className="w-3 h-3" />
                              שמור
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => setEditingNoteId(null)} className="rounded-xl">ביטול</Button>
                          </div>
                        </div>
                      ) : (
                        <div>
                          <p className="text-brand-black text-sm whitespace-pre-wrap">{note.content}</p>
                          <div className="flex items-center justify-between mt-3">
                            <span className="text-xs text-brand-gray">
                              {new Date(note.createdAt).toLocaleDateString("he-IL", { day: "2-digit", month: "2-digit", year: "2-digit", hour: "2-digit", minute: "2-digit" })}
                            </span>
                            <div className="flex gap-1">
                              <button onClick={() => { setEditingNoteId(note.id); setEditingNoteContent(note.content); }} className="p-1.5 rounded-lg text-brand-gray hover:text-brand-black hover:bg-brand-gray-light transition-colors">
                                <Pencil className="w-3.5 h-3.5" />
                              </button>
                              <button onClick={() => handleDeleteNote(note.id)} className="p-1.5 rounded-lg text-brand-gray hover:text-red-500 hover:bg-red-50 transition-colors">
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="jobs">
                {candidate.assignments?.length === 0 ? (
                  <div className="text-center py-8 text-brand-gray">המועמד אינו משויך למשרות</div>
                ) : (
                  <div className="space-y-4">
                    {candidate.assignments?.map((assignment) => {
                      const STAGES: { key: RecruitmentStage; label: string }[] = [
                        { key: "cv_received", label: "קו\"ח התקבלו" },
                        { key: "interview", label: "ראיון" },
                        { key: "offer", label: "הצעה" },
                        { key: "hired", label: "גויס" },
                        { key: "rejected", label: "נדחה" },
                      ];
                      const currentStage = (assignment.recruitmentStage || "cv_received") as RecruitmentStage;
                      const mainStages = STAGES.slice(0, 3);
                      const currentIdx = STAGES.findIndex((s) => s.key === currentStage);
                      const isTerminal = currentStage === "hired" || currentStage === "rejected";

                      return (
                        <div key={assignment.id} className="bg-white rounded-2xl border border-brand-gray-border p-5">
                          <div className="flex items-start justify-between mb-4">
                            <div>
                              <button onClick={() => router.push(`/jobs/${assignment.jobId}`)} className="font-semibold text-brand-black hover:underline text-sm">
                                {assignment.job?.title}
                              </button>
                              <p className="text-xs text-brand-gray mt-0.5">
                                משויך מ-{new Date(assignment.createdAt).toLocaleDateString("he-IL")}
                              </p>
                              {currentStage === "rejected" && assignment.rejectionReason && (
                                <p className="text-xs text-red-500 mt-1 bg-red-50 px-2 py-1 rounded-lg">
                                  סיבת דחייה: {assignment.rejectionReason}
                                </p>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              {assignment.job?.status === "filled" && (
                                <Badge className="bg-brand-black text-white text-xs">נסגרה</Badge>
                              )}
                              <Badge className={`${STATUS_COLORS[assignment.status]} text-xs rounded-full`}>
                                {STATUS_LABELS[assignment.status]}
                              </Badge>
                            </div>
                          </div>

                          <div className="flex items-center gap-1 mb-4">
                            {mainStages.map((stage, i) => {
                              const stageIdx = STAGES.findIndex((s) => s.key === stage.key);
                              const isActive = !isTerminal && stageIdx === currentIdx;
                              const isDone = !isTerminal && stageIdx < currentIdx;
                              return (
                                <div key={stage.key} className="flex items-center flex-1">
                                  <button
                                    onClick={() => {
                                      if (stage.key === "interview") {
                                        setStageDate("");
                                        setStageDialog({ assignmentId: assignment.id, type: "interview", jobTitle: assignment.job?.title ?? "" });
                                      } else {
                                        updateRecruitmentStage.mutate({ id: assignment.id, recruitmentStage: stage.key });
                                      }
                                    }}
                                    className={`flex-1 text-center py-1.5 px-2 rounded-lg text-xs font-medium transition-all ${
                                      isActive ? "bg-brand-yellow text-brand-black shadow-sm" : isDone ? "bg-green-100 text-green-700" : "bg-brand-gray-light text-brand-gray hover:bg-yellow-50"
                                    }`}
                                  >
                                    {stage.label}
                                  </button>
                                  {i < mainStages.length - 1 && (
                                    <div className={`w-4 h-0.5 flex-shrink-0 mx-0.5 ${isDone || isActive ? "bg-green-300" : "bg-brand-gray-border"}`} />
                                  )}
                                </div>
                              );
                            })}
                          </div>

                          <div className="flex gap-2">
                            <button
                              onClick={() => {
                                setStageDate("");
                                setStageDialog({ assignmentId: assignment.id, type: "hired", jobTitle: assignment.job?.title ?? "" });
                              }}
                              className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                                currentStage === "hired" ? "bg-green-500 text-white" : "bg-green-50 text-green-700 hover:bg-green-100"
                              }`}
                            >
                              גויס
                            </button>
                            <button
                              onClick={() => {
                                setRejectionReason("");
                                setRejectionDialog({ assignmentId: assignment.id, jobTitle: assignment.job?.title ?? "" });
                              }}
                              className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                                currentStage === "rejected" ? "bg-red-500 text-white" : "bg-red-50 text-red-600 hover:bg-red-100"
                              }`}
                            >
                              נדחה
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>

      <CandidateForm
        open={showEdit}
        onClose={() => setShowEdit(false)}
        onSubmit={handleUpdate}
        defaultValues={candidate}
        title="עריכת מועמד"
        loading={updateCandidate.isPending}
        isEdit
      />

      {showCV && (
        <CVPreview candidate={candidate} open={showCV} onClose={() => setShowCV(false)} />
      )}

      <ReminderForm
        open={showReminderForm}
        onClose={() => setShowReminderForm(false)}
        onSubmit={handleCreateReminder}
        loading={createReminder.isPending}
        contextLabel={candidate.fullName}
      />

      {/* Stage dialog (interview / hired) */}
      <Dialog open={!!stageDialog} onOpenChange={(open) => { if (!open) { setStageDialog(null); setStageDate(""); } }}>
        <DialogContent className="max-w-sm rounded-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-brand-yellow" />
              {stageDialog?.type === "interview" ? "תאריך הראיון" : "תאריך התחלה"}
            </DialogTitle>
          </DialogHeader>
          <div className="py-2">
            <Label className="text-sm text-brand-gray mb-2 block">
              {stageDialog?.type === "interview"
                ? "בחרי תאריך לראיון — תיווצר תזכורת אוטומטית"
                : "מתי המועמד מתחיל לעבוד?"}
            </Label>
            <Input type="date" value={stageDate} onChange={(e) => setStageDate(e.target.value)} className="rounded-xl" dir="ltr" />
          </div>
          <DialogFooter className="gap-2 flex-row-reverse">
            <Button onClick={handleStageDialogConfirm} disabled={updateRecruitmentStage.isPending || createReminder.isPending} className="rounded-xl bg-brand-yellow text-brand-black hover:bg-brand-yellow-hover font-semibold">
              {stageDialog?.type === "interview" ? "קביעת ראיון" : "אישור גיוס"}
            </Button>
            <Button variant="outline" onClick={() => { setStageDialog(null); setStageDate(""); }} className="rounded-xl">ביטול</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Rejection reason dialog */}
      <Dialog open={!!rejectionDialog} onOpenChange={(open) => { if (!open) { setRejectionDialog(null); setRejectionReason(""); } }}>
        <DialogContent className="max-w-sm rounded-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <X className="w-5 h-5" />
              סיבת דחייה
            </DialogTitle>
          </DialogHeader>
          <div className="py-2 space-y-2">
            <Label className="text-sm text-brand-gray">
              דחייה ל-{rejectionDialog?.jobTitle} — מה הסיבה?
            </Label>
            <Textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="לדוגמה: ציפיות שכר גבוהות, חסר ניסיון רלוונטי..."
              rows={3}
              className="rounded-xl resize-none"
            />
          </div>
          <DialogFooter className="gap-2 flex-row-reverse">
            <Button
              onClick={handleRejectionConfirm}
              disabled={!rejectionReason.trim() || updateRecruitmentStage.isPending}
              className="rounded-xl bg-red-500 text-white hover:bg-red-600 font-semibold"
            >
              אישור דחייה
            </Button>
            <Button variant="outline" onClick={() => { setRejectionDialog(null); setRejectionReason(""); }} className="rounded-xl">ביטול</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}
