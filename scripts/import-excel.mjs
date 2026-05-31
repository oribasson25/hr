/**
 * Import candidates from Excel file into the HR system database.
 * Run from hr-system directory: node scripts/import-excel.mjs
 */

import { createRequire } from "module";
import { PrismaClient } from "@prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const require = createRequire(import.meta.url);
const XLSX = require("xlsx");

const __dirname = dirname(fileURLToPath(import.meta.url));

process.loadEnvFile(resolve(__dirname, "../.env.local"));

const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error("DATABASE_URL not found in .env.local");

const adapter = new PrismaNeon({ connectionString });
const prisma = new PrismaClient({ adapter });

// ── Job domain normalization ──────────────────────────────────────────────────

const JOB_KEYS = {
  service: "נציג/ת שירות לקוחות",
  claims: "מיישב/ת תביעות",
  network_manager: "מנהל/ת רשת",
  renewals: "נציג/ת חידושים",
  sales: "נציג/ת מכירות",
  home_service: "נציג/ת שירות דירה",
  car_service: "נציג/ת שירות רכב",
  ppc: "מנהל/ת PPC",
  mortgage_out: "יועץ/ת משכנתא יוצאת",
  mortgage_in: "יועץ/ת משכנתא נכנס",
  mortgage: "יועץ/ת משכנתא",
  analyst: "אנליסט",
};

function normalizeDomain(raw) {
  const d = (raw || "").trim().replace(/[?!]/g, "").replace(/\s+/g, " ").trim().toLowerCase();
  if (!d) return null;
  if (d.includes("מנהל רשת")) return "network_manager";
  if (d === "ppc") return "ppc";
  if (d.includes("אנליסט")) return "analyst";
  if (d.includes("משכנתא יוצ")) return "mortgage_out";
  if (d.includes("משכנתא נכנ") || d.includes("משכנתא נכנס")) return "mortgage_in";
  if (d.includes("משכנתא")) return "mortgage";
  if (d.includes("תביעות")) return "claims";
  if (d.includes("חידושים")) return "renewals";
  if (d.includes("מכירות") || d.includes("מכירה")) return "sales";
  if (d.includes("שירות רכב")) return "car_service";
  if (d.includes("שירות דירה")) return "home_service";
  if (d.includes("שירות")) return "service";
  return null;
}

// ── Source mapping ────────────────────────────────────────────────────────────

const IGNORE_SOURCES = new Set([
  "", "???", "אין מענה", "לא אקטואלי", "לא רלוונטי", "לא מעוניינת",
  "עצמאית", "שמעה עלינו", "הבריז", "הבריזה", "הסיר מועמדות",
  "הסירה מועמדות", "תחשוב ותודיע", "יחשוב ויודיע", "הגיע פיזית", "עתידי",
]);

function mapSource(raw) {
  const s = (raw || "").trim();
  if (IGNORE_SOURCES.has(s)) return null;
  const l = s.toLowerCase();
  if (l.includes("פייסבוק") || l === "פייסבור" || l === "פייס/אתי") return "facebook";
  if (l.includes("אינסטגרם") || l.includes("instagram")) return "instagram";
  if (l.includes("טיקטוק") || l.includes("tiktok")) return "tiktok";
  if (l.includes("לינקדאין") || l.includes("linkedin")) return "linkedin";
  if (s === "אתר" || l.includes("לשכת התעסוקה") || l.includes("גוביקס") ||
      l.includes("ג'וביקס") || l.includes("רזומה") || l.includes("ג'וב מאסטר")) return "job_board";
  if (s === "סחבק") return "referral";
  // Looks like a Hebrew person name → referral
  if (/^[א-ת"'\s-]+$/.test(s) && s.split(" ").length >= 2) return "referral";
  return null;
}

// ── Date helpers ──────────────────────────────────────────────────────────────

function parseDate(cell) {
  if (!cell) return null;
  if (typeof cell === "number") {
    // Excel serial date
    return new Date((cell - 25569) * 86400 * 1000);
  }
  const str = String(cell).trim();
  const m = str.match(/^(\d{1,2})[.\/-](\d{1,2})[.\/-](\d{2,4})$/);
  if (!m) return null;
  let year = parseInt(m[3]);
  if (year < 100) year += 2000;
  return new Date(year, parseInt(m[2]) - 1, parseInt(m[1]));
}

function normalizePhone(raw) {
  return String(raw || "").replace(/[\s\-.()+]/g, "").trim();
}

// ── Stage mapping ─────────────────────────────────────────────────────────────

function mapStage(statusCell) {
  const s = String(statusCell || "").trim();
  if (/שלילי/i.test(s)) return "rejected";
  if (/התקבל|נקלט/i.test(s)) return "hired";
  return "cv_received";
}

function mapRejectionReason(statusCell) {
  const s = String(statusCell || "").trim();
  if (/שלילי/i.test(s) && s !== "שלילי") return s;
  return null;
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  const xlsxPath = resolve(__dirname, "../../מועמדים ללא הערות.xlsx");
  const wb = XLSX.readFile(xlsxPath);
  const ws = wb.Sheets[wb.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: "" });

  const oneYearAgo = new Date("2025-05-31");
  const today = new Date("2026-05-31");

  // Filter rows from last year
  const filtered = rows.slice(1).filter((row) => {
    const date = parseDate(row[4]);
    return date && date >= oneYearAgo && date <= today;
  });

  console.log(`Found ${filtered.length} candidates from the last year`);

  // Collect unique domain keys
  const domainKeys = new Set(
    filtered.map((r) => normalizeDomain(r[3])).filter(Boolean)
  );
  console.log("Job domains to create:", [...domainKeys]);

  // Create/get jobs for each domain
  const jobMap = new Map(); // key → job.id
  for (const key of domainKeys) {
    const title = JOB_KEYS[key];
    if (!title) continue;
    const existing = await prisma.job.findFirst({ where: { title } });
    if (existing) {
      jobMap.set(key, existing.id);
      console.log(`  Using existing job: ${title}`);
    } else {
      const job = await prisma.job.create({
        data: {
          title,
          description: title,
          requirements: "",
          status: "open",
        },
      });
      jobMap.set(key, job.id);
      console.log(`  Created job: ${title}`);
    }
  }

  // Deduplicate rows by phone (keep latest date)
  const byPhone = new Map();
  for (const row of filtered) {
    const phone = normalizePhone(row[2]);
    if (!phone || phone.length < 9) continue;
    const date = parseDate(row[4]);
    if (!byPhone.has(phone) || date > byPhone.get(phone).date) {
      byPhone.set(phone, { row, date });
    }
  }
  console.log(`Unique candidates by phone: ${byPhone.size}`);

  // Import candidates
  let created = 0, skipped = 0, errors = 0;

  for (const [phone, { row }] of byPhone) {
    const fullName = String(row[1] || "").trim();
    if (!fullName) { skipped++; continue; }

    const domainKey = normalizeDomain(row[3]);
    const source = mapSource(row[6]);
    const stage = mapStage(row[5]);
    const rejectionReason = mapRejectionReason(row[5]);
    const jobId = domainKey ? jobMap.get(domainKey) : null;

    try {
      // Upsert candidate by phone
      let candidate = await prisma.candidate.findFirst({ where: { phone } });
      if (!candidate) {
        candidate = await prisma.candidate.create({
          data: {
            fullName,
            phone,
            source: source ?? undefined,
          },
        });
        created++;
      } else {
        skipped++;
      }

      // Create job assignment if we have a job and one doesn't exist
      if (jobId) {
        const existingAssignment = await prisma.jobAssignment.findFirst({
          where: { candidateId: candidate.id, jobId },
        });
        if (!existingAssignment) {
          await prisma.jobAssignment.create({
            data: {
              candidateId: candidate.id,
              jobId,
              recruitmentStage: stage,
              rejectionReason: rejectionReason ?? undefined,
            },
          });
        }
      }
    } catch (err) {
      console.error(`Error importing ${fullName} (${phone}):`, err.message);
      errors++;
    }
  }

  console.log(`\nImport complete:`);
  console.log(`  Created: ${created}`);
  console.log(`  Skipped (already exist): ${skipped}`);
  console.log(`  Errors: ${errors}`);

  await prisma.$disconnect();
}

main().catch((err) => {
  console.error(err);
  prisma.$disconnect();
  process.exit(1);
});
