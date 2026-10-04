import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { hasPermission } from "@/lib/permissions";
import { SURVEY_TEMPLATES } from "@/lib/templates";
import { logAuditEvent } from "@/lib/audit";

const CreateSurveySchema = z.object({
  organizationId: z.string(),
  title: z.string().min(3, "ชื่อแบบประเมินต้องมีอย่างน้อย 3 ตัวอักษร"),
  description: z.string().optional().nullable(),
  category: z.string().default("HOSPITAL"),
  templateId: z.string().optional().nullable(),
});

export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session || !hasPermission(session, "canManageSurveys")) {
      return NextResponse.json({ error: "คุณไม่มีสิทธิ์จัดการแบบประเมิน" }, { status: 403 });
    }

    const body = await req.json();
    const result = CreateSurveySchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: result.error.errors[0]?.message || "ข้อมูลไม่ถูกต้อง" },
        { status: 400 }
      );
    }

    const { organizationId, title, description, category, templateId } = result.data;

    // Check slug uniqueness
    const slug = `${title
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "-")
      .replace(/-+/g, "-")
      .substring(0, 30)}-${Math.random().toString(36).substring(2, 6)}`;

    // Create survey & version 1 in a transaction
    const newSurvey = await prisma.$transaction(async (tx) => {
      const survey = await tx.survey.create({
        data: {
          organizationId,
          title,
          description: description || null,
          slug,
          category,
          currentVersion: 1,
        },
      });

      const version = await tx.surveyVersion.create({
        data: {
          surveyId: survey.id,
          versionNumber: 1,
          title: `${title} (v1)`,
          description: description || null,
          status: "DRAFT",
          allowComments: true,
          allowContactRequest: false,
        },
      });

      // Populate from template if selected
      const selectedTemplate = SURVEY_TEMPLATES.find((t) => t.id === templateId);
      if (selectedTemplate) {
        let overallQuestionId: string | null = null;

        for (let i = 0; i < selectedTemplate.questions.length; i++) {
          const tq = selectedTemplate.questions[i];
          const question = await tx.surveyQuestion.create({
            data: {
              surveyVersionId: version.id,
              questionText: tq.questionText,
              type: tq.type,
              helpText: tq.helpText || null,
              isRequired: tq.isRequired,
              isOverallCSAT: Boolean(tq.isOverallCSAT),
              displayOrder: i + 1,
            },
          });

          if (tq.isOverallCSAT) {
            overallQuestionId = question.id;
          }
        }

        if (overallQuestionId) {
          await tx.surveyVersion.update({
            where: { id: version.id },
            data: { overallQuestionId },
          });
        }
      } else {
        // Create 1 default overall satisfaction question
        const qOverall = await tx.surveyQuestion.create({
          data: {
            surveyVersionId: version.id,
            questionText: "ความพึงพอใจโดยรวมต่อการเข้ารับบริการในครั้งนี้",
            type: "RATING_1_5",
            isRequired: true,
            isOverallCSAT: true,
            displayOrder: 1,
          },
        });

        await tx.surveyVersion.update({
          where: { id: version.id },
          data: { overallQuestionId: qOverall.id },
        });
      }

      return { survey, version };
    });

    await logAuditEvent({
      userId: session.userId,
      userEmail: session.email,
      organizationId,
      action: "CREATE_SURVEY",
      targetType: "SURVEY",
      targetId: newSurvey.survey.id,
      details: { title, templateId },
    });

    return NextResponse.json({ success: true, surveyId: newSurvey.survey.id });
  } catch (error) {
    console.error("Create survey error:", error);
    return NextResponse.json({ error: "สร้างแบบประเมินไม่สำเร็จ" }, { status: 500 });
  }
}

// Publish Survey Version
export async function PUT(req: Request) {
  try {
    const session = await getSession();
    if (!session || !hasPermission(session, "canPublishSurveys")) {
      return NextResponse.json({ error: "คุณไม่มีสิทธิ์เผยแพร่แบบประเมิน" }, { status: 403 });
    }

    const { versionId, action } = await req.json();
    if (!versionId) return NextResponse.json({ error: "ระบุ Version ID" }, { status: 400 });

    const version = await prisma.surveyVersion.findUnique({
      where: { id: versionId },
      include: {
        questions: true,
        survey: true,
      },
    });

    if (!version) return NextResponse.json({ error: "ไม่พบแบบประเมิน" }, { status: 404 });

    // Validate that survey version has at least 1 question before publishing
    if (action === "PUBLISH") {
      if (version.questions.length === 0) {
        return NextResponse.json(
          { error: "แบบประเมินต้องมีคำถามอย่างน้อย 1 ข้อจึงจะสามารถเผยแพร่ได้" },
          { status: 400 }
        );
      }

      await prisma.surveyVersion.update({
        where: { id: versionId },
        data: {
          status: "PUBLISHED",
          publishedAt: new Date(),
        },
      });

      await logAuditEvent({
        userId: session.userId,
        userEmail: session.email,
        organizationId: version.survey.organizationId,
        action: "PUBLISH_SURVEY_VERSION",
        targetType: "SURVEY_VERSION",
        targetId: version.id,
      });

      return NextResponse.json({ success: true, status: "PUBLISHED" });
    }

    if (action === "CLOSE") {
      await prisma.surveyVersion.update({
        where: { id: versionId },
        data: { status: "CLOSED" },
      });
      return NextResponse.json({ success: true, status: "CLOSED" });
    }

    return NextResponse.json({ error: "Action ไม่ถูกต้อง" }, { status: 400 });
  } catch (error) {
    console.error("Update survey version error:", error);
    return NextResponse.json({ error: "ดำเนินการไม่สำเร็จ" }, { status: 500 });
  }
}
