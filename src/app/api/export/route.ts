import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import * as XLSX from "xlsx";

const STATUS_LABELS: Record<string, string> = {
  leading: "מוביל",
  candidate: "מועמד",
  not_relevant: "לא רלוונטי",
  future: "לעתיד",
  open: "פתוחה",
  filled: "נסגרה",
  closed: "סגורה",
};

const STAGE_LABELS: Record<string, string> = {
  cv_received: 'קו"ח התקבלו',
  interview: "ראיון",
  offer: "הצעה",
  hired: "גויס",
  rejected: "נדחה",
};

function rtlSheet(ws: XLSX.WorkSheet) {
  if (!ws["!views"]) ws["!views"] = [{}];
  ws["!views"][0] = { ...ws["!views"][0], rightToLeft: true };
  return ws;
}

export async function GET() {
  try {
    const [candidates, jobs, assignments, notes, reminders] = await Promise.all([
      prisma.candidate.findMany({ orderBy: { createdAt: "desc" } }),
      prisma.job.findMany({ orderBy: { createdAt: "desc" } }),
      prisma.jobAssignment.findMany({
        include: { candidate: true, job: true },
        orderBy: { createdAt: "desc" },
      }),
      prisma.note.findMany({
        include: { candidate: true },
        orderBy: { createdAt: "desc" },
      }),
      prisma.reminder.findMany({
        include: { candidate: true, job: true },
        orderBy: { dueDate: "asc" },
      }),
    ]);

    const wb = XLSX.utils.book_new();

    // Sheet 1: מועמדים
    const candidatesData = candidates.map((c) => ({
      "שם מלא": c.fullName,
      "טלפון": c.phone,
      "אימייל": c.email,
      "כתובת": c.address ?? "",
      "משרה (חופשי)": c.appliedForCustom ?? "",
      "קורות חיים": c.cvFilePath ? "כן" : "לא",
      "תאריך הקמה": new Date(c.createdAt).toLocaleDateString("he-IL"),
    }));
    const wsCandidates = rtlSheet(XLSX.utils.json_to_sheet(candidatesData));
    wsCandidates["!cols"] = [32, 18, 30, 25, 20, 12, 16].map((w) => ({ wch: w }));
    XLSX.utils.book_append_sheet(wb, wsCandidates, "מועמדים");

    // Sheet 2: משרות
    const jobsData = jobs.map((j) => ({
      "כותרת משרה": j.title,
      "תיאור": j.description,
      "דרישות": j.requirements,
      "סטטוס": STATUS_LABELS[j.status] ?? j.status,
      "תאריך הקמה": new Date(j.createdAt).toLocaleDateString("he-IL"),
      "תאריך סגירה": j.filledAt ? new Date(j.filledAt).toLocaleDateString("he-IL") : "",
    }));
    const wsJobs = rtlSheet(XLSX.utils.json_to_sheet(jobsData));
    wsJobs["!cols"] = [30, 40, 40, 12, 16, 16].map((w) => ({ wch: w }));
    XLSX.utils.book_append_sheet(wb, wsJobs, "משרות");

    // Sheet 3: תהליכי גיוס
    const assignmentsData = assignments.map((a) => ({
      "שם מועמד": a.candidate.fullName,
      "טלפון": a.candidate.phone,
      "אימייל": a.candidate.email,
      "משרה": a.job.title,
      "סטטוס משרה": STATUS_LABELS[a.job.status] ?? a.job.status,
      "סטטוס קנבן": STATUS_LABELS[a.status] ?? a.status,
      "שלב גיוס": STAGE_LABELS[a.recruitmentStage] ?? a.recruitmentStage,
      "תאריך תחילת עבודה": a.startDate ? new Date(a.startDate).toLocaleDateString("he-IL") : "",
      "תאריך שיוך": new Date(a.createdAt).toLocaleDateString("he-IL"),
      "עדכון אחרון": new Date(a.updatedAt).toLocaleDateString("he-IL"),
    }));
    const emptyAssignment = { "שם מועמד": "", "טלפון": "", "אימייל": "", "משרה": "", "סטטוס משרה": "", "סטטוס קנבן": "", "שלב גיוס": "", "תאריך תחילת עבודה": "", "תאריך שיוך": "", "עדכון אחרון": "" };
    const wsAssignments = rtlSheet(XLSX.utils.json_to_sheet(assignmentsData.length ? assignmentsData : [emptyAssignment]));
    wsAssignments["!cols"] = [28, 18, 28, 28, 14, 14, 18, 18, 16, 16].map((w) => ({ wch: w }));
    XLSX.utils.book_append_sheet(wb, wsAssignments, "תהליכי גיוס");

    // Sheet 4: הערות
    const notesData = notes.map((n) => ({
      "שם מועמד": n.candidate.fullName,
      "טלפון מועמד": n.candidate.phone,
      "תוכן הערה": n.content,
      "תאריך": new Date(n.createdAt).toLocaleDateString("he-IL", {
        day: "2-digit", month: "2-digit", year: "2-digit",
        hour: "2-digit", minute: "2-digit",
      }),
    }));
    const wsNotes = rtlSheet(XLSX.utils.json_to_sheet(notesData.length ? notesData : [{ "שם מועמד": "", "טלפון מועמד": "", "תוכן הערה": "", "תאריך": "" }]));
    wsNotes["!cols"] = [28, 18, 50, 18].map((w) => ({ wch: w }));
    XLSX.utils.book_append_sheet(wb, wsNotes, "הערות");

    // Sheet 5: תזכורות
    const remindersData = reminders.map((r) => ({
      "כותרת": r.title,
      "מועמד": r.candidate?.fullName ?? "",
      "משרה": r.job?.title ?? "",
      "תאריך יעד": r.dueDate ? new Date(r.dueDate).toLocaleDateString("he-IL") : "",
      "סטטוס": r.isDone ? "הושלם" : "פתוח",
      "תאריך יצירה": new Date(r.createdAt).toLocaleDateString("he-IL"),
    }));
    const wsReminders = rtlSheet(XLSX.utils.json_to_sheet(remindersData.length ? remindersData : [{ "כותרת": "", "מועמד": "", "משרה": "", "תאריך יעד": "", "סטטוס": "", "תאריך יצירה": "" }]));
    wsReminders["!cols"] = [30, 28, 28, 16, 10, 16].map((w) => ({ wch: w }));
    XLSX.utils.book_append_sheet(wb, wsReminders, "תזכורות");

    const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });
    const date = new Date().toLocaleDateString("he-IL").replace(/\//g, "-");

    return new NextResponse(buf, {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="hr-export-${date}.xlsx"`,
      },
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
