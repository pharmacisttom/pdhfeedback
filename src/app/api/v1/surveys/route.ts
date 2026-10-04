import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { authenticateApiKey, apiError } from "@/lib/api-auth";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    let orgId: string | null = null;

    const authHeader = req.headers.get("authorization");
    if (authHeader?.startsWith("Bearer ")) {
      const authResult = await authenticateApiKey(req, "surveys:read");
      if (!authResult.success) {
        return authResult.response;
      }
      orgId = authResult.organizationId;
    } else {
      const session = await getSession();
      if (!session || !session.activeOrgId) {
        return apiError("UNAUTHORIZED", "ต้องระบุ Bearer API Key หรือเข้าสู่ระบบ", 401);
      }
      orgId = session.activeOrgId;
    }

    const surveys = await prisma.survey.findMany({
      where: {
        organizationId: orgId,
        isArchived: false,
      },
      include: {
        versions: {
          where: { status: "PUBLISHED" },
          orderBy: { versionNumber: "desc" },
          include: {
            questions: {
              orderBy: { displayOrder: "asc" },
              include: {
                options: { orderBy: { displayOrder: "asc" } },
              },
            },
            publications: {
              where: { isActive: true },
              include: {
                servicePoint: {
                  select: { id: true, code: true, name: true },
                },
              },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({
      success: true,
      surveys: surveys.map((s) => ({
        id: s.id,
        title: s.title,
        slug: s.slug,
        currentVersion: s.currentVersion,
        publishedVersions: s.versions.map((v) => ({
          id: v.id,
          versionNumber: v.versionNumber,
          title: v.title,
          description: v.description,
          language: v.language,
          thankYouTitle: v.thankYouTitle,
          questionsCount: v.questions.length,
          questions: v.questions.map((q) => ({
            id: q.id,
            type: q.type,
            questionText: q.questionText,
            helpText: q.helpText,
            isRequired: q.isRequired,
            displayOrder: q.displayOrder,
            options: q.options.map((opt) => ({
              id: opt.id,
              text: opt.optionText,
              value: opt.optionValue,
            })),
          })),
          publications: v.publications.map((p) => ({
            id: p.id,
            publicCode: p.publicCode,
            name: p.name,
            displayMode: p.displayMode,
            servicePoint: p.servicePoint,
            expiresAt: p.expiresAt?.toISOString() || null,
          })),
        })),
      })),
    });
  } catch (error) {
    console.error("Fetch surveys error:", error);
    return apiError("INTERNAL_ERROR", "ไม่สามารถดึงข้อมูลแบบประเมินได้", 500);
  }
}
