import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { calculateCSAT, calculateNPS, calculateAverage } from "@/lib/metrics";
import { getDateRangePreset } from "@/lib/thai-date";

export async function GET(req: Request) {
  try {
    const session = await getSession();
    if (!session || !session.activeOrgId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const range = (searchParams.get("range") as any) || "30d";
    const { startDate, endDate } = getDateRangePreset(range);

    const where: any = {
      organizationId: session.activeOrgId,
      isFlagged: false,
    };

    if (session.activeRole === "SERVICE_MANAGER" && session.servicePointScope && session.servicePointScope.length > 0) {
      where.servicePointId = { in: session.servicePointScope };
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
      aggregate: {
        totalResponses: responses.length,
        csat: calculateCSAT(overallRatings),
        averageScore: calculateAverage(overallRatings),
        nps: calculateNPS(npsScores),
      },
    });
  } catch (error) {
    return NextResponse.json({ error: "Failed to generate aggregate report" }, { status: 500 });
  }
}
