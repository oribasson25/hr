# מערכת ניהול גיוס — HR System

מערכת web פנימית לניהול תהליך גיוס: משרות, מועמדים, Kanban Board, מעקב תהליכי גיוס ותצוגת קורות חיים.

---

## פריסה מלאה בחשבון Vercel חדש

### שלב 1 — חשבונות נדרשים

לפני שמתחילים, וודאי שיש לך:

| שירות | שימוש | קישור |
|---|---|---|
| **GitHub** | קוד המקור | github.com |
| **Vercel** | אחסון האפליקציה | vercel.com |
| **Neon** | מסד נתונים PostgreSQL | neon.tech |

---

### שלב 2 — Fork את הריפו

1. היכנסי לריפו: `https://github.com/CLIBRA2/hr`
2. לחצי **Fork** → בחרי את החשבון הרצוי
3. וודאי שיש לך גישת Push לריפו ה-Fork

---

### שלב 3 — הגדרת Neon (מסד נתונים)

1. היכנסי ל-[neon.tech](https://neon.tech) וצרי חשבון
2. לחצי **Create Project** → תני שם לפרויקט
3. בחרי **Region** (עדיפות: `us-east-1` לביצועים טובים)
4. לאחר היצירה — לחצי על **Connection Details**
5. בחרי **Connection string** → **Pooled connection**
6. העתיקי את ה-URL — ייראה כך:
   ```
   postgresql://user:password@ep-xxx.us-east-1.aws.neon.tech/neondb?sslmode=require
   ```

> **שמרי את ה-URL** — תצטרכי אותו בשלב 5

---

### שלב 4 — יצירת פרויקט ב-Vercel

1. היכנסי ל-[vercel.com](https://vercel.com) וצרי חשבון
2. לחצי **Add New Project**
3. בחרי **Import Git Repository** → חברי את חשבון GitHub שלך
4. חפשי את ריפו ה-Fork שיצרת ולחצי **Import**
5. **אל תלחצי Deploy עדיין** — קודם יש להגדיר משתני סביבה

---

### שלב 5 — הגדרת משתני סביבה ב-Vercel

בעמוד הפרויקט ב-Vercel, לחצי **Environment Variables** (לפני הפריסה הראשונה).

הוסיפי את המשתנים הבאים:

| שם משתנה | ערך | הסבר |
|---|---|---|
| `DATABASE_URL` | ה-URL מ-Neon (שלב 3) | חיבור ל-DB |
| `DIRECT_URL` | אותו URL מ-Neon | חיבור ישיר (נדרש ל-Prisma) |
| `ADMIN_PASSWORD` | סיסמה שתבחרי (לדוג׳ `MyPass123`) | סיסמת הכניסה למערכת |

> **שם המשתמש קבוע:** `misra-libra`
> **הסיסמה** — זו שהגדרת ב-`ADMIN_PASSWORD`

---

### שלב 6 — הפעלת Vercel Blob (אחסון קורות חיים)

Vercel Blob משמש לאחסון קבצי PDF/DOCX של קורות חיים.

1. בדשבורד של הפרויקט ב-Vercel — לחצי על לשונית **Storage**
2. לחצי **Connect Store** → בחרי **Blob**
3. לחצי **Create New** → תני שם → לחצי **Create**
4. חברי את ה-Blob Store לפרויקט (לחצי **Connect**)
5. Vercel תוסיף **אוטומטית** את המשתנה `BLOB_READ_WRITE_TOKEN` — אין צורך להגדיר ידנית

---

### שלב 7 — פריסה ראשונה

1. חזרי ללשונית **Deployments** ולחצי **Deploy**
   — או לחצי **Redeploy** אם כבר נעשתה פריסה אוטומטית
2. המתיני לסיום הבנייה (2-3 דקות)
3. לאחר הצלחה — תקבלי URL כגון `https://hr-xyz.vercel.app`

---

### שלב 8 — יצירת טבלאות במסד הנתונים

לאחר שהאפליקציה עולה, יש לאתחל את סכמת ה-DB.

#### אפשרות א׳ — דרך Vercel CLI (מומלץ)

```bash
# התקיני Vercel CLI
npm i -g vercel

# התחברי לחשבון
vercel login

# קשרי את הפרויקט המקומי לפרויקט ב-Vercel
vercel link

# משכי את משתני הסביבה מ-Vercel למחשב המקומי
vercel env pull .env.local

# דחפי את הסכמה למסד הנתונים
npx prisma db push
```

#### אפשרות ב׳ — דרך Neon Console (ללא כלים מקומיים)

1. היכנסי ל-[neon.tech](https://neon.tech) → הפרויקט שלך
2. לחצי על **SQL Editor**
3. הריצי ידנית את ה-SQL הבא:

<details>
<summary>לחצי להצגת ה-SQL המלא ליצירת כל הטבלאות</summary>

```sql
CREATE TABLE IF NOT EXISTS "Job" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "title" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "requirements" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'open',
  "filledAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS "Candidate" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "fullName" TEXT NOT NULL,
  "phone" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "address" TEXT,
  "cvFileName" TEXT,
  "cvFilePath" TEXT,
  "cvFileType" TEXT,
  "appliedForCustom" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS "JobAssignment" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "jobId" TEXT NOT NULL,
  "candidateId" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'candidate',
  "position" INTEGER NOT NULL DEFAULT 0,
  "recruitmentStage" TEXT NOT NULL DEFAULT 'cv_received',
  "startDate" TIMESTAMP(3),
  "interviewDate" TIMESTAMP(3),
  "interviewSummary" TEXT,
  "interviewRating" INTEGER,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT NOW(),
  CONSTRAINT "JobAssignment_jobId_fkey"
    FOREIGN KEY ("jobId") REFERENCES "Job"("id") ON DELETE CASCADE,
  CONSTRAINT "JobAssignment_candidateId_fkey"
    FOREIGN KEY ("candidateId") REFERENCES "Candidate"("id") ON DELETE CASCADE,
  CONSTRAINT "JobAssignment_jobId_candidateId_key"
    UNIQUE ("jobId", "candidateId")
);

CREATE TABLE IF NOT EXISTS "Note" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "candidateId" TEXT NOT NULL,
  "content" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT NOW(),
  CONSTRAINT "Note_candidateId_fkey"
    FOREIGN KEY ("candidateId") REFERENCES "Candidate"("id") ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS "CvMatchHistory" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT NOW(),
  "entries" JSONB NOT NULL
);

CREATE TABLE IF NOT EXISTS "Reminder" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "title" TEXT NOT NULL,
  "isDone" BOOLEAN NOT NULL DEFAULT FALSE,
  "dueDate" TIMESTAMP(3),
  "jobId" TEXT,
  "candidateId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT NOW(),
  CONSTRAINT "Reminder_jobId_fkey"
    FOREIGN KEY ("jobId") REFERENCES "Job"("id") ON DELETE SET NULL,
  CONSTRAINT "Reminder_candidateId_fkey"
    FOREIGN KEY ("candidateId") REFERENCES "Candidate"("id") ON DELETE SET NULL
);
```

</details>

---

### שלב 9 — כניסה למערכת

1. פתחי את ה-URL שקיבלת מ-Vercel (לדוג׳ `https://hr-xyz.vercel.app`)
2. **שם משתמש:** `misra-libra`
3. **סיסמה:** מה שהגדרת ב-`ADMIN_PASSWORD` (שלב 5)

---

## סיכום כל משתני הסביבה

| שם | מקור | חובה |
|---|---|---|
| `DATABASE_URL` | Neon → Connection Details → Pooled URL | ✅ |
| `DIRECT_URL` | אותו URL כמו `DATABASE_URL` | ✅ |
| `ADMIN_PASSWORD` | בוחרים בעצמכם | ✅ |
| `BLOB_READ_WRITE_TOKEN` | נוצר אוטומטית ע״י Vercel Blob | ✅ |

---

## עדכון קוד לאחר שינויים

כל push לענף `main` יגרום ל-Vercel לבנות ולפרוס אוטומטית.

```bash
git add .
git commit -m "תיאור השינוי"
git push origin main
```

---

## מבנה הפרויקט

```
src/
├── app/
│   ├── api/            # API Routes
│   ├── jobs/           # ניהול משרות
│   ├── candidates/     # ניהול מועמדים
│   ├── recruitment/    # תהליכי גיוס
│   ├── cvs/            # מאגר קורות חיים
│   ├── matcher/        # התאמת קורות חיים
│   ├── reminders/      # תזכורות
│   └── guide/          # מדריך למשתמש
├── components/
│   ├── layout/         # Sidebar + AppShell
│   ├── kanban/         # KanbanBoard + CandidateCard
│   └── cv/             # CVPreview
├── lib/
│   └── api/            # React Query hooks
└── types/
    └── api.ts          # TypeScript types
prisma/
├── schema.prisma       # סכמת ה-DB
└── migrations/         # Migration history
```

---

## Stack

| טכנולוגיה | שימוש |
|---|---|
| **Next.js 16** | Framework (App Router + TypeScript) |
| **Tailwind CSS 4** + shadcn/ui | עיצוב |
| **Prisma 7** + **Neon** | ORM + PostgreSQL Serverless |
| **Vercel Blob** | אחסון קבצי קורות חיים |
| **@dnd-kit** | Drag & Drop בלוח הקנבן |
| **react-pdf** + **mammoth.js** | תצוגת קורות חיים |
| **TanStack Query** | ניהול State בצד הלקוח |
| **zod** | ולידציה |
