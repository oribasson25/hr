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
};

const STAGE_LABELS: Record<string, string> = {
  cv_received: 'קו"ח התקבלו',
  interview: "ראיון",
  offer: "הצעה",
  hired: "גויס",
  rejected: "נדחה",
  ghosted: "הבריז",
  withdrew: "הסיר מועמדות",
};

const SOURCE_LABELS: Record<string, string> = {
  referral: "חבר מביא חבר",
  linkedin: "לינקדאין",
  facebook: "פייסבוק",
  job_board: "אתר משרות",
  instagram: "אינסטגרם",
  tiktok: "טיקטוק",
};

function fmt(date: Date | string) {
  return new Date(date).toLocaleDateString("he-IL", {
    day: "2-digit", month: "2-digit", year: "numeric",
  });
}

function fmtDatetime(date: Date | string) {
  return new Date(date).toLocaleDateString("he-IL", {
    day: "2-digit", month: "2-digit", year: "2-digit",
    hour: "2-digit", minute: "2-digit",
  });
}

function rtlSheet(ws: XLSX.WorkSheet) {
  if (!ws["!views"]) ws["!views"] = [{}];
  ws["!views"][0] = { ...ws["!views"][0], rightToLeft: true };
  return ws;
}

export async function GET() {
  try {
    const [candidates, jobs, assignments, notes, reminders, hrStaff] = await Promise.all([
      prisma.candidate.findMany({
        orderBy: { createdAt: "desc" },
        include: {
          hrStaff: { select: { name: true, role: true } },
          notes: { select: { id: true } },
          assignments: { select: { id: true } },
        },
      }),
      prisma.job.findMany({
        orderBy: { createdAt: "desc" },
        include: {
          _count: { select: { assignments: true } },
          assignments: { select: { recruitmentStage: true } },
        },
      }),
      prisma.jobAssignment.findMany({
        include: {
          candidate: {
            include: { hrStaff: { select: { name: true } } },
          },
          job: true,
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.note.findMany({
        include: { candidate: { select: { fullName: true, phone: true } } },
        orderBy: { createdAt: "desc" },
      }),
      prisma.reminder.findMany({
        include: {
          candidate: { select: { fullName: true, phone: true } },
          job: { select: { title: true } },
        },
        orderBy: { dueDate: "asc" },
      }),
      prisma.hrStaff.findMany({ orderBy: { name: "asc" } }),
    ]);

    const wb = XLSX.utils.book_new();

    // ─── Sheet 1: מועמדים ───────────────────────────────────────
    const candidatesData = candidates.map((c) => ({
      "שם מלא": c.fullName,
      "טלפון": c.phone,
      "אימייל": c.email ?? "",
      "כתובת": c.address ?? "",
      "ציפיות שכר": c.salaryExpectation ?? "",
      "מקור הגעה": SOURCE_LABELS[c.source ?? ""] ?? (c.source ?? ""),
      "הופנה ע\"י": c.referredByName ?? "",
      "איש HR": c.hrStaff ? `${c.hrStaff.name}${c.hrStaff.role ? ` (${c.hrStaff.role})` : ""}` : "",
      "קורות חיים": c.cvFilePath ? "כן" : "לא",
      "מספר הערות": c.notes.length,
      "מספר משרות": c.assignments.length,
      "משרה (חופשי)": c.appliedForCustom ?? "",
      "תאריך הקמה": fmt(c.createdAt),
      "עדכון אחרון": fmt(c.updatedAt),
    }));
    const wsCandidates = rtlSheet(XLSX.utils.json_to_sheet(
      candidatesData.length ? candidatesData : [Object.fromEntries(Object.keys(candidatesData[0] ?? {
        "שם מלא": "", "טלפון": "", "אימייל": "", "כתובת": "", "ציפיות שכר": "",
        "מקור הגעה": "", "הופנה ע\"י": "", "איש HR": "", "קורות חיים": "",
        "מספר הערות": "", "מספר משרות": "", "משרה (חופשי)": "",
        "תאריך הקמה": "", "עדכון אחרון": "",
      }).map(k => [k, ""]))]
    ));
    wsCandidates["!cols"] = [28, 16, 28, 24, 16, 18, 20, 22, 12, 12, 12, 24, 14, 14].map((w) => ({ wch: w }));
    XLSX.utils.book_append_sheet(wb, wsCandidates, "מועמדים");

    // ─── Sheet 2: משרות ─────────────────────────────────────────
    const jobsData = jobs.map((j) => {
      const stageCount = (stage: string) => j.assignments.filter(a => a.recruitmentStage === stage).length;
      return {
        "כותרת משרה": j.title,
        "סטטוס": STATUS_LABELS[j.status] ?? j.status,
        "תקציב שכר": j.salaryBudget ?? "",
        "סה\"כ מועמדים": j._count.assignments,
        "גויסו": stageCount("hired"),
        "נדחו": stageCount("rejected"),
        "הבריזו": stageCount("ghosted"),
        "הסירו מועמדות": stageCount("withdrew"),
        "בשלב ראיון": stageCount("interview"),
        "בשלב הצעה": stageCount("offer"),
        "תיאור": j.description,
        "דרישות": j.requirements,
        "תאריך הקמה": fmt(j.createdAt),
        "תאריך סגירה": j.filledAt ? fmt(j.filledAt) : "",
      };
    });
    const wsJobs = rtlSheet(XLSX.utils.json_to_sheet(jobsData.length ? jobsData : [{}]));
    wsJobs["!cols"] = [30, 12, 16, 14, 10, 10, 12, 16, 14, 14, 40, 40, 14, 14].map((w) => ({ wch: w }));
    XLSX.utils.book_append_sheet(wb, wsJobs, "משרות");

    // ─── Sheet 3: תהליכי גיוס ───────────────────────────────────
    const assignmentsData = assignments.map((a) => ({
      "שם מועמד": a.candidate.fullName,
      "טלפון": a.candidate.phone,
      "אימייל": a.candidate.email ?? "",
      "ציפיות שכר": a.candidate.salaryExpectation ?? "",
      "איש HR": a.candidate.hrStaff?.name ?? "",
      "משרה": a.job.title,
      "סטטוס משרה": STATUS_LABELS[a.job.status] ?? a.job.status,
      "עמודת קנבן": STATUS_LABELS[a.status] ?? a.status,
      "שלב גיוס": STAGE_LABELS[a.recruitmentStage] ?? a.recruitmentStage,
      "סיבת דחייה": a.rejectionReason ?? "",
      "תאריך תחילת עבודה": a.startDate ? fmt(a.startDate) : "",
      "תאריך שיוך": fmt(a.createdAt),
      "עדכון אחרון": fmt(a.updatedAt),
    }));
    const wsAssignments = rtlSheet(XLSX.utils.json_to_sheet(assignmentsData.length ? assignmentsData : [{}]));
    wsAssignments["!cols"] = [28, 16, 28, 16, 20, 28, 14, 14, 18, 30, 18, 14, 14].map((w) => ({ wch: w }));
    XLSX.utils.book_append_sheet(wb, wsAssignments, "תהליכי גיוס");

    // ─── Sheet 4: הערות ─────────────────────────────────────────
    const notesData = notes.map((n) => ({
      "שם מועמד": n.candidate.fullName,
      "טלפון מועמד": n.candidate.phone,
      "תוכן הערה": n.content,
      "תאריך ושעה": fmtDatetime(n.createdAt),
    }));
    const wsNotes = rtlSheet(XLSX.utils.json_to_sheet(notesData.length ? notesData : [{ "שם מועמד": "", "טלפון מועמד": "", "תוכן הערה": "", "תאריך ושעה": "" }]));
    wsNotes["!cols"] = [28, 16, 60, 18].map((w) => ({ wch: w }));
    XLSX.utils.book_append_sheet(wb, wsNotes, "הערות");

    // ─── Sheet 5: תזכורות ───────────────────────────────────────
    const remindersData = reminders.map((r) => ({
      "כותרת תזכורת": r.title,
      "מועמד": r.candidate?.fullName ?? "",
      "טלפון מועמד": r.candidate?.phone ?? "",
      "משרה": r.job?.title ?? "",
      "תאריך יעד": r.dueDate ? fmt(r.dueDate) : "",
      "סטטוס": r.isDone ? "✅ הושלם" : "🔔 פתוח",
      "תאריך יצירה": fmt(r.createdAt),
    }));
    const wsReminders = rtlSheet(XLSX.utils.json_to_sheet(remindersData.length ? remindersData : [{}]));
    wsReminders["!cols"] = [32, 28, 16, 28, 14, 12, 14].map((w) => ({ wch: w }));
    XLSX.utils.book_append_sheet(wb, wsReminders, "תזכורות");

    // ─── Sheet 6: עובדי HR ──────────────────────────────────────
    if (hrStaff.length > 0) {
      const hrData = hrStaff.map((s) => ({
        "שם": s.name,
        "תפקיד": s.role ?? "",
        "אימייל": s.email ?? "",
        "טלפון": s.phone ?? "",
        "תאריך הקמה": fmt(s.createdAt),
      }));
      const wsHR = rtlSheet(XLSX.utils.json_to_sheet(hrData));
      wsHR["!cols"] = [24, 20, 28, 16, 14].map((w) => ({ wch: w }));
      XLSX.utils.book_append_sheet(wb, wsHR, "עובדי HR");
    }

    // ─── Sheet 7: סיכום ─────────────────────────────────────────
    const totalHired = assignments.filter(a => a.recruitmentStage === "hired").length;
    const totalRejected = assignments.filter(a => a.recruitmentStage === "rejected").length;
    const totalGhosted = assignments.filter(a => a.recruitmentStage === "ghosted").length;
    const totalWithdrew = assignments.filter(a => a.recruitmentStage === "withdrew").length;
    const openJobs = jobs.filter(j => j.status === "open").length;
    const closedJobs = jobs.filter(j => j.status === "filled").length;

    const summaryData = [
      { "נושא": "סה\"כ מועמדים", "ערך": candidates.length },
      { "נושא": "מועמדים עם קורות חיים", "ערך": candidates.filter(c => c.cvFilePath).length },
      { "נושא": "מועמדים עם הערות", "ערך": candidates.filter(c => c.notes.length > 0).length },
      { "נושא": "", "ערך": "" },
      { "נושא": "סה\"כ משרות", "ערך": jobs.length },
      { "נושא": "משרות פתוחות", "ערך": openJobs },
      { "נושא": "משרות שנסגרו", "ערך": closedJobs },
      { "נושא": "", "ערך": "" },
      { "נושא": "סה\"כ שיוכים", "ערך": assignments.length },
      { "נושא": "גויסו", "ערך": totalHired },
      { "נושא": "נדחו", "ערך": totalRejected },
      { "נושא": "הבריזו", "ערך": totalGhosted },
      { "נושא": "הסירו מועמדות", "ערך": totalWithdrew },
      { "נושא": "", "ערך": "" },
      { "נושא": "סה\"כ הערות", "ערך": notes.length },
      { "נושא": "סה\"כ תזכורות", "ערך": reminders.length },
      { "נושא": "תזכורות פתוחות", "ערך": reminders.filter(r => !r.isDone).length },
      { "נושא": "", "ערך": "" },
      { "נושא": "תאריך ייצוא", "ערך": fmtDatetime(new Date()) },
    ];
    const wsSummary = rtlSheet(XLSX.utils.json_to_sheet(summaryData));
    wsSummary["!cols"] = [28, 12].map((w) => ({ wch: w }));
    XLSX.utils.book_append_sheet(wb, wsSummary, "סיכום");

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
