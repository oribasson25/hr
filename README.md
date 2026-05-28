# HR Manager – מערכת ניהול גיוס

מערכת web פנימית לניהול תהליך גיוס: משרות, מועמדים, Kanban Board עם Drag & Drop, ותצוגת קורות חיים.

## הגדרה ראשונית

### 1. Neon Database

1. היכנסי ל-[neon.tech](https://neon.tech) וצרי פרויקט חדש
2. בעמוד הפרויקט לחצי על **Connection Details**
3. העתיקי את ה-**Pooled connection string** (עם `?sslmode=require`)
4. עדכני את הקובץ `.env.local`:

```env
DATABASE_URL="postgresql://user:password@ep-xxx.us-east-1.aws.neon.tech/neondb?sslmode=require"
DIRECT_URL="postgresql://user:password@ep-xxx.us-east-1.aws.neon.tech/neondb?sslmode=require"
```

### 2. פרישת הסכמה ל-DB

```bash
npx prisma migrate dev --name init
```

### 3. הרצה מקומית

```bash
npm run dev
```

### 4. Seed – נתוני דוגמה (אופציונלי)

```bash
npm run db:seed
```

---

## פריסה ב-Vercel

1. Push הפרויקט ל-GitHub
2. הוסיפי את הפרויקט ב-[vercel.com](https://vercel.com)
3. הגדירי את משתני הסביבה ב-Vercel:
   - `DATABASE_URL` — Neon connection string
   - `DIRECT_URL` — אותו connection string
4. לאחר ה-deploy, הריצי:
   ```bash
   npx prisma migrate deploy
   ```

---

## מבנה הפרויקט

```
src/
├── app/
│   ├── api/           # API Routes
│   ├── jobs/          # דפי משרות
│   ├── candidates/    # דפי מועמדים
│   └── cvs/           # מאגר קורות חיים
├── components/
│   ├── layout/        # Sidebar + AppShell
│   ├── jobs/          # JobForm
│   ├── candidates/    # CandidateForm
│   ├── kanban/        # KanbanBoard + CandidateCard
│   └── cv/            # CVPreview + PDFViewer + DocxViewer
├── lib/
│   ├── api/           # React Query hooks
│   └── prisma.ts      # Prisma client (Neon adapter)
└── types/
    └── api.ts         # TypeScript types
prisma/
├── schema.prisma      # DB Schema
├── seed.ts            # Seed data
└── migrations/        # DB Migrations
```

## Stack

- **Next.js 16** (App Router, TypeScript)
- **Tailwind CSS 4** + shadcn/ui (Base UI)  
- **Prisma 7** + **Neon** (PostgreSQL Serverless)
- **@dnd-kit** – Drag & Drop
- **react-pdf** + **mammoth.js** – CV Preview
- **TanStack Query** – Server State
- **zod** + **react-hook-form** – Forms
