import { config } from "dotenv";
config({ path: ".env.local" });
config({ path: ".env" });

import { PrismaClient } from "@prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";

const connectionString = process.env.DATABASE_URL!;
const adapter = new PrismaNeon({ connectionString });
const prisma = new PrismaClient({ adapter } as ConstructorParameters<typeof PrismaClient>[0]);

async function main() {
  const job1 = await prisma.job.create({
    data: {
      title: "מפתח Full Stack",
      description: "אנו מחפשים מפתח Full Stack עם ניסיון ב-React ו-Node.js לצוות הפיתוח שלנו.",
      requirements: "• 3+ שנות ניסיון ב-React\n• ניסיון ב-Node.js / Next.js\n• ידע ב-SQL ו-NoSQL\n• עברית ואנגלית ברמה גבוהה",
      status: "open",
    },
  });

  const job2 = await prisma.job.create({
    data: {
      title: "מעצב UI/UX",
      description: "מחפשים מעצב חווית משתמש יצירתי ומנוסה לעיצוב מוצרים דיגיטליים.",
      requirements: "• 2+ שנות ניסיון בעיצוב UX/UI\n• שליטה ב-Figma\n• תיק עבודות מרשים\n• הבנה של עקרונות נגישות",
      status: "open",
    },
  });

  const job3 = await prisma.job.create({
    data: {
      title: "מנהל מוצר",
      description: "מנהל מוצר לצוות פיתוח מוצר B2B SaaS.",
      requirements: "• 4+ שנות ניסיון בניהול מוצר\n• ניסיון ב-Agile/Scrum\n• יכולת אנליטית גבוהה\n• ניסיון עם לקוחות עסקיים",
      status: "filled",
      filledAt: new Date(),
    },
  });

  const candidates = await Promise.all([
    prisma.candidate.create({ data: { fullName: "דני לוי", phone: "050-1234567", email: "dani@example.com", address: "תל אביב" } }),
    prisma.candidate.create({ data: { fullName: "שרה כהן", phone: "052-9876543", email: "sara@example.com", address: "חיפה" } }),
    prisma.candidate.create({ data: { fullName: "יוסי אברהם", phone: "054-5555555", email: "yossi@example.com" } }),
    prisma.candidate.create({ data: { fullName: "רחל גרינברג", phone: "053-3333333", email: "rachel@example.com", address: "ירושלים" } }),
    prisma.candidate.create({ data: { fullName: "מיכאל בן-דוד", phone: "058-7777777", email: "michael@example.com" } }),
    prisma.candidate.create({ data: { fullName: "נועה שפירו", phone: "050-2222222", email: "noa@example.com", address: "רמת גן" } }),
    prisma.candidate.create({ data: { fullName: "אבי טל", phone: "052-8888888", email: "avi@example.com" } }),
    prisma.candidate.create({ data: { fullName: "יעל מזרחי", phone: "054-4444444", email: "yael@example.com", address: "נס ציונה" } }),
  ]);

  await prisma.jobAssignment.createMany({
    data: [
      { jobId: job1.id, candidateId: candidates[0].id, status: "leading", position: 0 },
      { jobId: job1.id, candidateId: candidates[1].id, status: "candidate", position: 0 },
      { jobId: job1.id, candidateId: candidates[2].id, status: "candidate", position: 1 },
      { jobId: job1.id, candidateId: candidates[3].id, status: "not_relevant", position: 0 },
      { jobId: job2.id, candidateId: candidates[4].id, status: "candidate", position: 0 },
      { jobId: job2.id, candidateId: candidates[5].id, status: "leading", position: 0 },
      { jobId: job3.id, candidateId: candidates[6].id, status: "leading", position: 0 },
      { jobId: job3.id, candidateId: candidates[7].id, status: "future", position: 0 },
    ],
  });

  console.log("✅ Seed completed: 3 jobs, 8 candidates, 8 assignments");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
