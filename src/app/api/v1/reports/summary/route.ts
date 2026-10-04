import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { calculateCSAT, calculateNPS, calculateAverage } from "@/lib/metrics";
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
        return apiError("INVALID_DATE_FORMAT", "รูปแบบวันที่ไม่ถูกต้อง ต้องเป็น ISO 8601 เช่น 2026-01-01T00:00:00Z", 400);
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
        npsScore: true,
      },
    });

    const overallRatings = responses
      .map((r) => r.overallRating)
      .filter((r): r is number => typeof r === "number");
    const npsScores = responses
      .map((r) => r.npsScore)
      .filter((s): s is number => typeof s === "number");

    return NextResponse.json({
      success: true,
      metrics: {
        totalResponses: responses.length,
        csat: calculateCSAT(overallRatings),
        averageScore: calculateAverage(overallRatings),
        nps: calculateNPS(npsScores),
      },
      period: {
        range,
        startDate: startDate ? startDate.toISOString() : null,
        endDate: endDate ? endDate.toISOString() : null,
        timezone: "Asia/Bangkok (UTC+07:00)",
      },
      filter: {
        servicePointId: targetServicePointId || null,
      },
    });
  } catch (error) {
    console.error("Summary report error:", error);
    return apiError("INTERNAL_ERROR", "ไม่สามารถสร้างรายงานสรุปได้", 500);
  }
}
