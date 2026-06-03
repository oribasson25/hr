import { PrismaClient } from "@prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";

const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter } as ConstructorParameters<typeof PrismaClient>[0]);

const HIRED_NAMES = [
  "נועם כהן",
  "ליאן קומדי",
  "קמיל מרי מיזל",
  "דור למש",
  "ליאל מרום",
  "עדן מושויו",
  "סיגל פולטוב",
  "נתנאל אביב אוטמזגין",
  "גילי מורדוך",
  "שקד אדרי",
  "יונתן דניאל",
  "לידור יוסף",
  "טארק אבו סייף",
  "לויאור חזוט",
  "יובל שעשוע",
  "טליה טטיאנה ברוק",
  "הדס שוקרון",
  "נועה ישראל",
  "עמית רפאל",
  "לירון לוי",
  "רן רחמים משה",
  "עמית לוי",
  "אדיר קדם",
  "יואב קדוש",
  "שירי מור",
  "טופז אליה",
  "שי בנעים",
  "אסתי ויזל",
  "דניאלה זריהן",
  "גפן מברך",
  "אלמוג יעקב",
  "ספיר יעקובוב",
];

async function main() {
  const notFound: string[] = [];

  for (const fullName of HIRED_NAMES) {
    const candidate = await prisma.candidate.findFirst({
      where: { fullName: { equals: fullName, mode: "insensitive" } },
      include: { assignments: true },
    });

    if (!candidate) {
      notFound.push(fullName);
      console.log(`❌ לא נמצא: ${fullName}`);
      continue;
    }

    const toUpdate = candidate.assignments.filter(
      (a) => a.recruitmentStage !== "hired"
    );

    if (toUpdate.length === 0) {
      console.log(`✅ כבר מסומן כגויס: ${fullName}`);
      continue;
    }

    await prisma.jobAssignment.updateMany({
      where: { candidateId: candidate.id, recruitmentStage: { not: "hired" } },
      data: { recruitmentStage: "hired" },
    });

    console.log(`✅ עודכן כגויס: ${fullName}`);
  }

  if (notFound.length > 0) {
    console.log(`\n⚠️  לא נמצאו (${notFound.length}):`);
    notFound.forEach((n) => console.log(`  - ${n}`));
  }

  console.log("\nסיום.");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
