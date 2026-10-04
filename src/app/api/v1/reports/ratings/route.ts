import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { getDateRangePreset } from "@/lib/thai-date";
import { authenticateApiKey, apiError } from "@/lib/api-auth";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    let orgId: string | null = null;
    let keyServicePointId: string | null = null;

    const authHeader = req.headers.get("authorization");
    if (authHeader?.startsWith("Bearer ")) {
      const authResult = await authenticateApiKey(req, "reports:read");
      if (!authResult.success) {
        return authResult.response;
      }
      orgId = authResult.organizationId;
      keyServicePointId = authResult.servicePointId || null;
    } else {
      const session = await getSession();
      if (!session || !session.activeOrgId) {
        return apiError("UNAUTHORIZED", "ต้องระบุ Bearer API Key หรือเข้าสู่ระบบ", 401);
      }
      orgId = session.activeOrgId;
    }

    const { searchParams } = new URL(req.url);
    const range = (searchParams.get("range") as any) || "30d";
    const customStart = searchParams.get("startDate");
    const customEnd = searchParams.get("endDate");
    const paramServicePointId = searchParams.get("servicePointId");

    let startDate: Date | null | undefined;
    let endDate: Date | null | undefined;

    if (customStart && customEnd) {
      startDate = new Date(customStart);
      endDate = new Date(customEnd);
      if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        return apiError("INVALID_DATE_FORMAT", "รูปแบบวันที่ไม่ถูกต้อง ต้องเป็น ISO 8601", 400);
      }
    } else {
      const preset = getDateRangePreset(range);
      startDate = preset.startDate;
      endDate = preset.endDate;
    }

    const where: any = {
      organizationId: orgId,
      isFlagged: false,
    };

    const targetServicePointId = paramServicePointId || keyServicePointId;
    if (targetServicePointId) {
      where.servicePointId = targetServicePointId;
    }

    if (startDate && endDate) {
      where.submittedAt = { gte: startDate, lte: endDate };
    }

    const responses = await prisma.response.findMany({
      where,
      select: {
        overallRating: true,
      },
    });

    const starCounts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    let validRatingsTotal = 0;

    responses.forEach((r) => {
      if (r.overallRating && r.overallRating >= 1 && r.overallRating <= 5) {
        starCounts[r.overallRating as 1 | 2 | 3 | 4 | 5]++;
        validRatingsTotal++;
      }
    });

    const breakdown = [1, 2, 3, 4, 5].map((stars) => {
      const count = starCounts[stars as 1 | 2 | 3 | 4 | 5];
      const percentage = validRatingsTotal > 0 ? Math.round((count / validRatingsTotal) * 1000) / 10 : 0;
      return {
        stars,
        count,
        percentage,
      };
    });

    return NextResponse.json({
      success: true,
      totalResponses: responses.length,
      ratedResponses: validRatingsTotal,
      ratingBreakdown: breakdown,
      period: {
        range,
        startDate: startDate ? startDate.toISOString() : null,
        endDate: endDate ? endDate.toISOString() : null,
        timezone: "Asia/Bangkok (UTC+07:00)",
      },
    });
  } catch (error) {
    console.error("Ratings report error:", error);
    return apiError("INTERNAL_ERROR", "ไม่สามารถดึงข้อมูลการแจกแจงคะแนนดาวได้", 500);
  }
}
