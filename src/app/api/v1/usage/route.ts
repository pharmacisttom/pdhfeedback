import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { getOrganizationSubscription } from "@/lib/billing";
import { authenticateApiKey, apiError } from "@/lib/api-auth";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    let orgId: string | null = null;

    const authHeader = req.headers.get("authorization");
    if (authHeader?.startsWith("Bearer ")) {
      const authResult = await authenticateApiKey(req, "usage:read");
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

    const subInfo = await getOrganizationSubscription(orgId);
    if (!subInfo) {
      return apiError("ORGANIZATION_NOT_FOUND", "ไม่พบข้อมูลองค์กร", 404);
    }

    const [activeServicePointsCount, activeSurveysCount, membersCount] = await Promise.all([
      prisma.servicePoint.count({ where: { organizationId: orgId, isArchived: false } }),
      prisma.survey.count({ where: { organizationId: orgId, isArchived: false } }),
      prisma.membership.count({ where: { organizationId: orgId } }),
    ]);

    return NextResponse.json({
      success: true,
      usage: {
        planCode: subInfo.planCode,
        planName: subInfo.planName,
        subscriptionType: subInfo.subscriptionType,
        isGrant: subInfo.isGrant,
        billingInterval: subInfo.billingInterval,
        currentPeriod: {
          start: subInfo.currentPeriodStart,
          end: subInfo.currentPeriodEnd,
        },
        responses: {
          monthlyQuota: subInfo.limits.responsesPerMonth,
          monthlyUsed: subInfo.monthlyUsage,
          remaining: subInfo.remainingResponses,
          percentUsed:
            subInfo.limits.responsesPerMonth > 0
              ? Math.min(
                  100,
                  Math.round((subInfo.monthlyUsage / subInfo.limits.responsesPerMonth) * 1000) / 10
                )
              : 0,
        },
        limits: {
          servicePoints: {
            current: activeServicePointsCount,
            max: subInfo.limits.servicePoints,
          },
          surveys: {
            current: activeSurveysCount,
            max: subInfo.limits.activeSurveys,
          },
          members: {
            current: membersCount,
            max: subInfo.limits.members,
          },
        },
      },
    });
  } catch (error) {
    console.error("Usage endpoint error:", error);
    return apiError("INTERNAL_ERROR", "ไม่สามารถดึงข้อมูลการใช้งานได้", 500);
  }
}
