"use client";

import { use, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ArrowRight, Edit, FileText, Trash2, Plus, X, Pencil, CheckCircle, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import AppShell from "@/components/layout/AppShell";
import CandidateForm from "@/components/candidates/CandidateForm";
import CVPreview from "@/components/cv/CVPreview";
import ReminderForm from "@/components/reminders/ReminderForm";
import { useCandidate, useUpdateCandidate, useDeleteCandidate } from "@/lib/api/candidates";
import { useCreateNote, useUpdateNote, useDeleteNote } from "@/lib/api/notes";
import { useCreateReminder } from "@/lib/api/reminders";

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

  const { data: candidate, isLoading } = useCandidate(id);
  const updateCandidate = useUpdateCandidate(id);
  const deleteCandidate = useDeleteCandidate();
  const createNote = useCreateNote(id);
  const updateNote = useUpdateNote(id);
  const deleteNote = useDeleteNote(id);
  const createReminder = useCreateReminder();

  const handleUpdate = async (data: Parameters<typeof CandidateForm>[0]["onSubmit"] extends (d: infer D) => unknown ? D : never) => {
    const result = await updateCandidate.mutateAsync({
      fullName: data.fullName,
      phone: data.phone,
      email: data.email,
      address: data.address || null,
      appliedForCustom: data.appliedForCustom || null,
    });
    if (!result.error) toast.success("המועמד עודכן");
  };

  const handleDelete = async () => {
    if (!confirm("האם למחוק את המועמד?")) return;
    await deleteCandidate.mutateAsync(id);
    toast.success("המועמד נמחק");
    router.push("/candidates");
  };

  const handleCreateReminder = async (data: { title: string; dueDate?: string | null }) => {
    const result = await createReminder.mutateAsync({ ...data, candidateId: id });
    if (result.id) toast.success("התזכורת נוספה");
    else toast.error("שגיאה בהוספת תזכורת");
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
                  <span className="text-brand-gray w-16 flex-shrink-0">טלפון:</span>
                  <a href={`tel:${candidate.phone}`} className="text-brand-black hover:underline">{candidate.phone}</a>
                </div>
                <div className="flex gap-2">
                  <span className="text-brand-gray w-16 flex-shrink-0">אימייל:</span>
                  <a href={`mailto:${candidate.email}`} className="text-brand-black hover:underline truncate">{candidate.email}</a>
                </div>
                {candidate.address && (
                  <div className="flex gap-2">
                    <span className="text-brand-gray w-16 flex-shrink-0">כתובת:</span>
                    <span className="text-brand-black">{candidate.address}</span>
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
              <Button
                onClick={() => setShowCV(true)}
                className="w-full rounded-xl gap-2"
                variant={candidate.cvFilePath ? "default" : "outline"}
              >
                <FileText className="w-4 h-4" />
                {candidate.cvFilePath ? "צפייה בקורות חיים" : "ללא קורות חיים"}
              </Button>
              <Button
                onClick={() => setShowReminderForm(true)}
                variant="outline"
                className="w-full rounded-xl gap-2"
                size="sm"
              >
                <Bell className="w-4 h-4" />
                הוסף תזכורת
              </Button>
              <Button
                onClick={handleDelete}
                variant="ghost"
                className="w-full rounded-xl text-red-500 hover:text-red-600 hover:bg-red-50 gap-2"
                size="sm"
              >
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
                    <Textarea
                      value={newNote}
                      onChange={(e) => setNewNote(e.target.value)}
                      placeholder="הוסיפי הערה..."
                      rows={3}
                      className="rounded-xl resize-none"
                    />
                    <Button
                      onClick={handleAddNote}
                      disabled={!newNote.trim() || createNote.isPending}
                      size="sm"
                      className="rounded-xl bg-brand-yellow text-brand-black hover:bg-brand-yellow-hover font-semibold gap-2"
                    >
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
                          <Textarea
                            value={editingNoteContent}
                            onChange={(e) => setEditingNoteContent(e.target.value)}
                            rows={3}
                            className="rounded-xl resize-none"
                          />
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
                              <button
                                onClick={() => { setEditingNoteId(note.id); setEditingNoteContent(note.content); }}
                                className="p-1.5 rounded-lg text-brand-gray hover:text-brand-black hover:bg-brand-gray-light transition-colors"
                              >
                                <Pencil className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDeleteNote(note.id)}
                                className="p-1.5 rounded-lg text-brand-gray hover:text-red-500 hover:bg-red-50 transition-colors"
                              >
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
                  <div className="space-y-3">
                    {candidate.assignments?.map((assignment) => (
                      <div key={assignment.id} className="bg-white rounded-2xl border border-brand-gray-border p-4 flex items-center justify-between">
                        <div>
                          <button
                            onClick={() => router.push(`/jobs/${assignment.jobId}`)}
                            className="font-semibold text-brand-black hover:underline text-sm"
                          >
                            {assignment.job?.title}
                          </button>
                          <p className="text-xs text-brand-gray mt-0.5">
                            משויך מ-{new Date(assignment.createdAt).toLocaleDateString("he-IL")}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          {assignment.job?.status === "filled" && (
                            <Badge className="bg-brand-black text-white text-xs">אויישה</Badge>
                          )}
                          <Badge className={`${STATUS_COLORS[assignment.status]} text-xs rounded-full`}>
                            {STATUS_LABELS[assignment.status]}
                          </Badge>
                        </div>
                      </div>
                    ))}
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
        <CVPreview
          candidate={candidate}
          open={showCV}
          onClose={() => setShowCV(false)}
        />
      )}

      <ReminderForm
        open={showReminderForm}
        onClose={() => setShowReminderForm(false)}
        onSubmit={handleCreateReminder}
        loading={createReminder.isPending}
        contextLabel={candidate.fullName}
      />
    </AppShell>
  );
}
