import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getOrganizationSubscription } from "@/lib/billing";
import { apiError } from "@/lib/api-auth";

export const dynamic = "force-dynamic";

export async function GET(
  req: Request,
  { params }: { params: { publicationId: string } }
) {
  try {
    const { publicationId } = params;

    const publication = await prisma.surveyPublication.findFirst({
      where: {
        OR: [{ publicCode: publicationId }, { id: publicationId }],
      },
      include: {
        organization: {
          select: {
            id: true,
            name: true,
            slug: true,
            logoUrl: true,
            status: true,
          },
        },
        servicePoint: {
          select: {
            id: true,
            code: true,
            name: true,
            description: true,
          },
        },
        surveyVersion: {
          include: {
            questions: {
              orderBy: { displayOrder: "asc" },
              include: {
                options: { orderBy: { displayOrder: "asc" } },
              },
            },
          },
        },
      },
    });

    if (!publication || !publication.isActive || publication.revokedAt) {
      return apiError(
        "PUBLICATION_NOT_FOUND",
        "ไม่พบรหัสแบบประเมิน หรือแบบประเมินนี้ถูกปิดการเชื่อมต่อ",
        404
      );
    }

    if (publication.expiresAt && publication.expiresAt < new Date()) {
      return apiError(
        "PUBLICATION_EXPIRED",
        "แบบประเมินนี้หมดอายุการเปิดรับคำตอบแล้ว",
        410
      );
    }

    if (publication.organization.status !== "ACTIVE") {
      return apiError(
        "ORGANIZATION_INACTIVE",
        "หน่วยงานนี้ไม่ได้อยู่ในสถานะเปิดให้บริการ",
        403
      );
    }

    // Resolve Entitlements
    const subInfo = await getOrganizationSubscription(publication.organizationId);
    const hidePoweredBy = subInfo?.allFeatures.includes("hide_powered_by") ?? false;

    let allowedOrigins: string[] = [];
    try {
      if (publication.allowedOrigins) {
        allowedOrigins = JSON.parse(publication.allowedOrigins);
      }
    } catch {}

    let widgetConfig: any = {};
    try {
      if (publication.widgetConfig) {
        widgetConfig = JSON.parse(publication.widgetConfig);
      }
    } catch {}

    const version = publication.surveyVersion;

    return NextResponse.json(
      {
        success: true,
        publication: {
          id: publication.id,
          publicCode: publication.publicCode,
          displayMode: publication.displayMode,
          allowedOrigins,
          widgetConfig,
          organization: {
            name: publication.organization.name,
            logoUrl: publication.organization.logoUrl,
          },
          servicePoint: publication.servicePoint,
          survey: {
            id: version.id,
            title: version.title,
            description: version.description,
            language: version.language,
            thankYouTitle: version.thankYouTitle,
            thankYouMessage: version.thankYouMessage,
            allowComments: version.allowComments,
            questions: version.questions.map((q) => ({
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
          },
          hidePoweredBy,
        },
      },
      {
        headers: {
          "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120",
        },
      }
    );
  } catch (error) {
    console.error("Public survey fetch error:", error);
    return apiError("INTERNAL_ERROR", "ไม่สามารถดึงข้อมูลแบบประเมินได้", 500);
  }
}
