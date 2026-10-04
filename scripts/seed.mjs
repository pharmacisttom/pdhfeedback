import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting idempotent PdhFeedback database seeding...");

  // Clean existing demo data safely
  await prisma.auditLog.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.notificationRule.deleteMany();
  await prisma.feedbackNote.deleteMany();
  await prisma.feedbackCase.deleteMany();
  await prisma.responseContact.deleteMany();
  await prisma.responseAnswer.deleteMany();
  await prisma.response.deleteMany();
  await prisma.surveyInvitation.deleteMany();
  await prisma.surveyPublication.deleteMany();
  await prisma.questionOption.deleteMany();
  await prisma.surveyQuestion.deleteMany();
  await prisma.surveyVersion.deleteMany();
  await prisma.survey.deleteMany();
  await prisma.servicePoint.deleteMany();
  await prisma.branch.deleteMany();
  await prisma.membership.deleteMany();
  await prisma.invitation.deleteMany();
  await prisma.exportJob.deleteMany();
  await prisma.apiKey.deleteMany();
  await prisma.organization.deleteMany();
  await prisma.user.deleteMany();

  // Create Users
  const superAdminPassword = await bcrypt.hash("Pdh@Admin2026!", 10);
  const hospitalOwnerPassword = await bcrypt.hash("Hospital@2026", 10);
  const pharmManagerPassword = await bcrypt.hash("Pharm@2026", 10);
  const hospitalViewerPassword = await bcrypt.hash("Viewer@2026", 10);
  const coopOwnerPassword = await bcrypt.hash("Coop@2026", 10);

  const superAdmin = await prisma.user.create({
    data: {
      email: "admin@pdhfeedback.local",
      fullName: "ผู้ดูแลระบบแพลตฟอร์ม (Platform Admin)",
      passwordHash: superAdminPassword,
      isPlatformAdmin: true,
      status: "ACTIVE",
    },
  });

  const hospitalOwner = await prisma.user.create({
    data: {
      email: "owner.hospital@pdhfeedback.local",
      fullName: "นพ.ประจักษ์ เกียรติดำรง (Hospital Director & Owner)",
      passwordHash: hospitalOwnerPassword,
      isPlatformAdmin: false,
      status: "ACTIVE",
    },
  });

  const pharmManager = await prisma.user.create({
    data: {
      email: "manager.pharm@pdhfeedback.local",
      fullName: "ภก.อนุชา วงศ์สว่าง (หัวหน้างานบริการห้องยา)",
      passwordHash: pharmManagerPassword,
      isPlatformAdmin: false,
      status: "ACTIVE",
    },
  });

  const hospitalViewer = await prisma.user.create({
    data: {
      email: "viewer.hospital@pdhfeedback.local",
      fullName: "นางสาวศิริพร พัฒนา (เจ้าหน้าที่วิเคราะห์คุณภาพ)",
      passwordHash: hospitalViewerPassword,
      isPlatformAdmin: false,
      status: "ACTIVE",
    },
  });

  const coopOwner = await prisma.user.create({
    data: {
      email: "owner.coop@pdhfeedback.local",
      fullName: "นายสมชาย เจริญสุข (ผู้จัดการสหกรณ์)",
      passwordHash: coopOwnerPassword,
      isPlatformAdmin: false,
      status: "ACTIVE",
    },
  });

  // Create Organization 1: Hospital
  const hospitalOrg = await prisma.organization.create({
    data: {
      name: "โรงพยาบาลปทุมธานี เฮลท์แคร์ (สาธิต)",
      slug: "pdh-hospital",
      type: "HOSPITAL",
      timezone: "Asia/Bangkok",
      defaultLang: "th",
      planTier: "ENTERPRISE",
      maxServicePoints: 100,
      maxMonthlyResponses: 50000,
      maxUsers: 50,
    },
  });

  // Create Organization 2: Cooperative
  const coopOrg = await prisma.organization.create({
    data: {
      name: "สหกรณ์บริการสินเชื่อเพื่อพัฒนา (สาธิต)",
      slug: "pdh-coop",
      type: "COOPERATIVE",
      timezone: "Asia/Bangkok",
      defaultLang: "th",
      planTier: "PRO",
      maxServicePoints: 20,
      maxMonthlyResponses: 5000,
      maxUsers: 10,
    },
  });

  // Branches & Service Points for Hospital
  const opdBranch = await prisma.branch.create({
    data: {
      organizationId: hospitalOrg.id,
      code: "BR-OPD",
      name: "อาคารผู้ป่วยนอกและบริการปฐมภูมิ",
      description: "แผนกตรวจผู้ป่วยนอก เวชระเบียน และห้องยา",
    },
  });

  const erBranch = await prisma.branch.create({
    data: {
      organizationId: hospitalOrg.id,
      code: "BR-ER",
      name: "อาคารอุบัติเหตุและฉุกเฉิน",
      description: "แผนกอุบัติเหตุ ฉุกเฉิน และช่วยชีวิต",
    },
  });

  const spRegistration = await prisma.servicePoint.create({
    data: {
      organizationId: hospitalOrg.id,
      branchId: opdBranch.id,
      code: "OPD-REG",
      name: "เคาน์เตอร์เวชระเบียนและจุดคัดกรอง",
      description: "บริการลงทะเบียน ทำบัตรใหม่ และตรวจคัดกรองเบื้องต้น",
      displayOrder: 1,
      publicCode: "pdh-reg-opd",
    },
  });

  const spMedicine = await prisma.servicePoint.create({
    data: {
      organizationId: hospitalOrg.id,
      branchId: opdBranch.id,
      code: "OPD-MED",
      name: "ห้องตรวจโรคอายุรกรรม 1-4",
      description: "บริการตรวจรักษาโรคทั่วไปและโรคไม่ติดต่อเรื้อรัง",
      displayOrder: 2,
      publicCode: "pdh-med-opd",
    },
  });

  const spPharmacy = await prisma.servicePoint.create({
    data: {
      organizationId: hospitalOrg.id,
      branchId: opdBranch.id,
      code: "OPD-PHARM",
      name: "เคาน์เตอร์ห้องจ่ายยาผู้ป่วยนอก",
      description: "บริการตรวจสอบยา จ่ายยา และให้คำปรึกษาการใช้ยา",
      displayOrder: 3,
      publicCode: "pdh-pharm-opd",
    },
  });

  // Service point for Cooperative
  const spCoopMain = await prisma.servicePoint.create({
    data: {
      organizationId: coopOrg.id,
      code: "COOP-MAIN",
      name: "เคาน์เตอร์ฝาก-ถอน และบริการสินเชื่อสมาชิก",
      description: "บริการธุรกรรมสมาชิกสหกรณ์",
      displayOrder: 1,
      publicCode: "coop-counter-01",
    },
  });

  // Memberships for Hospital
  await prisma.membership.create({
    data: {
      userId: hospitalOwner.id,
      organizationId: hospitalOrg.id,
      role: "OWNER",
      canExport: true,
      canViewContacts: true,
    },
  });

  await prisma.membership.create({
    data: {
      userId: pharmManager.id,
      organizationId: hospitalOrg.id,
      role: "SERVICE_MANAGER",
      servicePointScope: JSON.stringify([spPharmacy.id]), // Scoped only to Pharmacy!
      canExport: false,
      canViewContacts: false,
    },
  });

  await prisma.membership.create({
    data: {
      userId: hospitalViewer.id,
      organizationId: hospitalOrg.id,
      role: "VIEWER",
      canExport: false,
      canViewContacts: false,
    },
  });

  // Memberships for Coop
  await prisma.membership.create({
    data: {
      userId: coopOwner.id,
      organizationId: coopOrg.id,
      role: "OWNER",
      canExport: true,
      canViewContacts: true,
    },
  });

  // Survey 1: Hospital OPD Survey
  const opdSurvey = await prisma.survey.create({
    data: {
      organizationId: hospitalOrg.id,
      title: "แบบประเมินความพึงพอใจการรับบริการผู้ป่วยนอก (OPD)",
      description: "แบบประเมินคุณภาพการบริการ เพื่อพัฒนาการดูแลผู้รับบริการให้ดียิ่งขึ้น",
      slug: "opd-satisfaction-survey",
      category: "HOSPITAL",
      currentVersion: 1,
    },
  });

  const opdVersion = await prisma.surveyVersion.create({
    data: {
      surveyId: opdSurvey.id,
      versionNumber: 1,
      title: "แบบประเมินความพึงพอใจผู้ป่วยนอก ประจำปี 2569",
      description: "ขอความอนุเคราะห์ตอบแบบประเมินสั้นๆ ประมาณ 1 นาที",
      status: "PUBLISHED",
      publishedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      allowComments: true,
      allowContactRequest: true,
    },
  });

  const q1 = await prisma.surveyQuestion.create({
    data: {
      surveyVersionId: opdVersion.id,
      type: "RATING_1_5",
      questionText: "ความสะดวกรวดเร็วในการรอรับบริการ",
      helpText: "1 = น้อยที่สุด, 5 = มากที่สุด",
      isRequired: true,
      displayOrder: 1,
    },
  });

  const q2 = await prisma.surveyQuestion.create({
    data: {
      surveyVersionId: opdVersion.id,
      type: "RATING_1_5",
      questionText: "ความสุภาพ การเอาใจใส่ และการให้คำแนะนำของบุคลากร",
      isRequired: true,
      displayOrder: 2,
    },
  });

  const q3 = await prisma.surveyQuestion.create({
    data: {
      surveyVersionId: opdVersion.id,
      type: "RATING_1_5",
      questionText: "ความสะอาด ความเป็นระเบียบ และความสะดวกสบายของสถานที่",
      isRequired: true,
      displayOrder: 3,
    },
  });

  const qOverall = await prisma.surveyQuestion.create({
    data: {
      surveyVersionId: opdVersion.id,
      type: "RATING_1_5",
      questionText: "ความพึงพอใจโดยรวมต่อการเข้ารับบริการในวันนี้",
      isRequired: true,
      displayOrder: 4,
      isOverallCSAT: true,
    },
  });

  // Update version overall question pointer
  await prisma.surveyVersion.update({
    where: { id: opdVersion.id },
    data: { overallQuestionId: qOverall.id },
  });

  const qNps = await prisma.surveyQuestion.create({
    data: {
      surveyVersionId: opdVersion.id,
      type: "NPS_0_10",
      questionText: "ท่านยินดีจะแนะนำโรงพยาบาลแห่งนี้แก่คนใกล้ชิดเมื่อต้องการรับการรักษาหรือไม่ (NPS)",
      helpText: "0 = ไม่แนะนำแน่นอน, 10 = แนะนำอย่างแน่นอน",
      isRequired: false,
      displayOrder: 5,
    },
  });

  const qComment = await prisma.surveyQuestion.create({
    data: {
      surveyVersionId: opdVersion.id,
      type: "LONG_TEXT",
      questionText: "ข้อเสนอแนะเพิ่มเติมเพื่อการปรับปรุงการบริการ",
      helpText: "กรุณาไม่ระบุเลขบัตรประชาชน ข้อมูลสุขภาพ หรือข้อมูลส่วนบุคคลของผู้อื่น",
      isRequired: false,
      displayOrder: 6,
    },
  });

  // Public Publications for Service Points
  await prisma.surveyPublication.create({
    data: {
      organizationId: hospitalOrg.id,
      surveyVersionId: opdVersion.id,
      servicePointId: spRegistration.id,
      publicCode: spRegistration.publicCode,
      isActive: true,
    },
  });

  await prisma.surveyPublication.create({
    data: {
      organizationId: hospitalOrg.id,
      surveyVersionId: opdVersion.id,
      servicePointId: spMedicine.id,
      publicCode: spMedicine.publicCode,
      isActive: true,
    },
  });

  await prisma.surveyPublication.create({
    data: {
      organizationId: hospitalOrg.id,
      surveyVersionId: opdVersion.id,
      servicePointId: spPharmacy.id,
      publicCode: spPharmacy.publicCode,
      isActive: true,
    },
  });

  // Seed Realistic Responses for Hospital (45 realistic responses over the past 14 days)
  console.log("📝 Generating 45 realistic responses for Hospital...");
  const commentsPool = [
    "เจ้าหน้าที่บริการรวดเร็วและพูดจาสุภาพมาก ประทับใจมากค่ะ",
    "หมอตรวจละเอียด ให้คำแนะนำการปฏิบัติตัวชัดเจนดีมาก",
    "จุดรอพักคอยสะอาด แอร์เย็นสบาย มีน้ำดื่มบริการ",
    "ช่วงบ่ายคิวห้องยาค่อนข้างนาน อยากให้เพิ่มช่องจ่ายยา",
    "การจัดคิวชัดเจน มีป้ายบอกทางสะดวก ไม่หลง",
    "พยาบาลจุดคัดกรองยิ้มแย้ม ให้ข้อมูลเป็นกันเอง",
    "ที่จอดรถค่อนข้างเต็ม ควรมีระบบจัดการที่จอดรถดีกว่านี้",
    "ทุกอย่างเรียบร้อยดีมากครับ สะดวกกว่าเดิมเยอะ",
    "อยากให้มีจอแสดงคิวแบบออนไลน์ผ่านมือถือ",
  ];

  const servicePoints = [spRegistration, spMedicine, spPharmacy];

  for (let i = 1; i <= 45; i++) {
    const sp = servicePoints[i % 3];
    const daysAgo = Math.floor(i / 4);
    const submittedAt = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000 - (i * 17 * 60 * 1000));

    // Distribution skewed toward high satisfaction (hospital CSAT ~85-90%)
    let overall = 5;
    if (i % 7 === 0) overall = 3;
    else if (i % 11 === 0) overall = 4;
    else if (i === 13 || i === 29) overall = 2; // low rating triggers

    let nps = overall === 5 ? (i % 2 === 0 ? 10 : 9) : overall === 4 ? 8 : overall === 3 ? 6 : 4;
    const comment = i % 3 === 0 ? commentsPool[i % commentsPool.length] : null;

    const resp = await prisma.response.create({
      data: {
        organizationId: hospitalOrg.id,
        surveyVersionId: opdVersion.id,
        servicePointId: sp.id,
        submittedAt,
        overallRating: overall,
        npsScore: nps,
        commentText: comment,
        userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15",
      },
    });

    // Answers
    await prisma.responseAnswer.createMany({
      data: [
        {
          responseId: resp.id,
          questionId: q1.id,
          ratingValue: Math.max(1, Math.min(5, overall + (i % 2 === 0 ? 0 : -1))),
        },
        {
          responseId: resp.id,
          questionId: q2.id,
          ratingValue: Math.max(1, Math.min(5, overall)),
        },
        {
          responseId: resp.id,
          questionId: q3.id,
          ratingValue: Math.max(1, Math.min(5, overall + (i % 3 === 0 ? 0 : 1))),
        },
        {
          responseId: resp.id,
          questionId: qOverall.id,
          ratingValue: overall,
        },
        {
          responseId: resp.id,
          questionId: qNps.id,
          ratingValue: nps,
        },
        ...(comment
          ? [
              {
                responseId: resp.id,
                questionId: qComment.id,
                textValue: comment,
              },
            ]
          : []),
      ],
    });

    // If low rating or negative comment, create FeedbackCase
    if (overall <= 2 || i === 4) {
      await prisma.feedbackCase.create({
        data: {
          organizationId: hospitalOrg.id,
          responseId: resp.id,
          servicePointId: sp.id,
          caseNumber: `CASE-202610-00${i}`,
          category: i === 4 ? "SPEED" : "SERVICE",
          urgency: overall <= 2 ? "HIGH" : "MEDIUM",
          status: i === 4 ? "IN_PROGRESS" : "NEW",
          assignedUserId: pharmManager.id,
          dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
          rootCause: i === 4 ? "ช่วงบ่ายมีเจ้าหน้าที่อบรม ทำให้เหลือช่องจ่ายยาเพียง 2 ช่อง" : null,
          correctiveAction: i === 4 ? "จัดเวรเหลื่อมเวลา และเตรียมเพิ่มช่องจ่ายยาช่วงเวลาเร่งด่วน" : null,
        },
      });
    }

    // A few contact callbacks
    if (i === 4 || i === 13) {
      await prisma.responseContact.create({
        data: {
          responseId: resp.id,
          organizationId: hospitalOrg.id,
          name: i === 4 ? "คุณวิภาวรรณ (ผู้รับบริการ)" : "คุณกิตติศักดิ์",
          phone: i === 4 ? "081-999-XXXX" : "089-777-XXXX",
          email: i === 4 ? "wipawan.demo@example.com" : null,
          preferredTime: "ช่วงบ่าย 13:00 - 16:00 น.",
          consentGiven: true,
        },
      });
    }
  }

  // Create In-App Notification for Hospital
  await prisma.notification.create({
    data: {
      organizationId: hospitalOrg.id,
      title: "แจ้งเตือนคะแนนประเมินต่ำกว่าเกณฑ์",
      message: "มีผู้รับบริการให้คะแนน 2/5 ณ เคาน์เตอร์ห้องจ่ายยาผู้ป่วยนอก กรุณาตรวจสอบและดำเนินการติดตาม",
      type: "LOW_RATING",
      link: `/pdh-hospital/feedback`,
    },
  });

  // Seed Organization 2 (Cooperative) - 10 responses to verify isolation
  console.log("📝 Generating responses for Cooperative...");
  const coopSurvey = await prisma.survey.create({
    data: {
      organizationId: coopOrg.id,
      title: "แบบประเมินความพึงพอใจการให้บริการสมาชิกสหกรณ์",
      slug: "coop-satisfaction",
      category: "COOP",
      currentVersion: 1,
    },
  });

  const coopVersion = await prisma.surveyVersion.create({
    data: {
      surveyId: coopSurvey.id,
      versionNumber: 1,
      title: "แบบประเมินสมาชิกสหกรณ์ 2569",
      status: "PUBLISHED",
      publishedAt: new Date(),
    },
  });

  const cq1 = await prisma.surveyQuestion.create({
    data: {
      surveyVersionId: coopVersion.id,
      type: "RATING_1_5",
      questionText: "ความถูกต้องและความชัดเจนของข้อมูลเงินกู้และเงินฝาก",
      isRequired: true,
      displayOrder: 1,
      isOverallCSAT: true,
    },
  });

  await prisma.surveyPublication.create({
    data: {
      organizationId: coopOrg.id,
      surveyVersionId: coopVersion.id,
      servicePointId: spCoopMain.id,
      publicCode: spCoopMain.publicCode,
      isActive: true,
    },
  });

  for (let j = 1; j <= 12; j++) {
    const cResp = await prisma.response.create({
      data: {
        organizationId: coopOrg.id,
        surveyVersionId: coopVersion.id,
        servicePointId: spCoopMain.id,
        overallRating: 5,
        npsScore: 10,
        commentText: "บริการดี เจ้าหน้าที่ให้คำแนะนำเงินกู้สมาชิกชัดเจนมาก",
      },
    });

    await prisma.responseAnswer.create({
      data: {
        responseId: cResp.id,
        questionId: cq1.id,
        ratingValue: 5,
      },
    });
  }

  // Audit Logs
  await prisma.auditLog.create({
    data: {
      organizationId: hospitalOrg.id,
      userId: hospitalOwner.id,
      userEmail: hospitalOwner.email,
      action: "INITIAL_SEED_BOOTSTRAP",
      targetType: "ORGANIZATION",
      targetId: hospitalOrg.id,
      details: "Initial system bootstrap with demo branches, service points, and survey.",
    },
  });

  console.log("✅ Database seeding completed successfully!");
  console.log("----------------------------------------------------------------");
  console.log("Demo Accounts Available:");
  console.log("1. Platform Super Admin: admin@pdhfeedback.local / Pdh@Admin2026!");
  console.log("2. Hospital Owner:       owner.hospital@pdhfeedback.local / Hospital@2026");
  console.log("3. Pharmacy Manager:     manager.pharm@pdhfeedback.local / Pharm@2026");
  console.log("4. Hospital Viewer:      viewer.hospital@pdhfeedback.local / Viewer@2026");
  console.log("5. Cooperative Owner:    owner.coop@pdhfeedback.local / Coop@2026");
  console.log("----------------------------------------------------------------");
}

main()
  .catch((e) => {
    console.error("❌ Seeding failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
