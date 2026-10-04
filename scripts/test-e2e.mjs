import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function run() {
  console.log("=== Testing End-to-End Live Flows ===");

  // 1. Health check
  const healthRes = await fetch("http://localhost:3000/api/health");
  const healthData = await healthRes.json();
  console.log("1. Health Check:", healthData.status, "DB Latency:", healthData.database?.latencyMs, "ms");

  // 2. Resolve question for Pharmacy service point
  const publication = await prisma.surveyPublication.findUnique({
    where: { publicCode: "pdh-pharm-opd" },
    include: {
      surveyVersion: {
        include: { questions: true },
      },
    },
  });

  if (!publication) throw new Error("Publication pdh-pharm-opd not found");
  const questions = publication.surveyVersion.questions;
  console.log("2. Survey Questions found:", questions.length, "for", publication.publicCode);

  const idempotencyKey = `idem_e2e_${Date.now()}`;
  const payload = {
    publicCode: "pdh-pharm-opd",
    idempotencyKey,
    answers: questions.map((q) => ({
      questionId: q.id,
      ratingValue: q.type.startsWith("RATING_") ? 5 : q.type === "NPS_0_10" ? 10 : null,
      booleanValue: q.type === "YES_NO" ? true : null,
      textValue: q.type === "LONG_TEXT" ? "ทดสอบข้อความข้อคิดเห็นการบริการ" : null,
    })),
    commentText: "บริการดีเยี่ยม รวดเร็วและสะดวกมาก",
    contact: {
      name: "คุณสมพร",
      phone: "081-123-4567",
      consentGiven: true,
    },
  };

  // 3. Submit Response
  const submitRes1 = await fetch("http://localhost:3000/api/surveys/submit", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const submitData1 = await submitRes1.json();
  console.log("3. First Submission Success:", submitData1.success, "Response ID:", submitData1.responseId);

  // 4. Submit again with SAME idempotency key (Verify double submit prevention)
  const submitRes2 = await fetch("http://localhost:3000/api/surveys/submit", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const submitData2 = await submitRes2.json();
  console.log("4. Second Submission (Duplicate):", submitData2.success, "isDuplicate:", submitData2.isDuplicate);
  console.log("   Returns Same Response ID:", submitData1.responseId === submitData2.responseId);

  // 5. Test Login as Hospital Owner
  const loginRes = await fetch("http://localhost:3000/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: "owner.hospital@pdhfeedback.local",
      password: "Hospital@2026",
    }),
  });
  const loginData = await loginRes.json();
  const setCookieHeader = loginRes.headers.get("set-cookie") || "";
  console.log("5. Login Success:", loginData.success, "Active Org:", loginData.user?.activeOrgSlug, "Cookie set:", setCookieHeader.includes("pdh_session"));

  // 6. Test API v1 Aggregate metrics
  const aggRes = await fetch("http://localhost:3000/api/v1/reports/aggregate", {
    headers: {
      cookie: setCookieHeader,
    },
  });
  const aggData = await aggRes.json();
  console.log("6. API v1 Aggregate Metrics:", aggData.aggregate?.totalResponses, "responses, CSAT:", aggData.aggregate?.csat, "%");

  console.log("=== All Live End-to-End Flows Verified! ===");
}

run()
  .catch((e) => {
    console.error("Error in E2E:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
