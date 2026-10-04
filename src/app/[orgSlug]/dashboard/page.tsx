import { notFound, redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getDateRangePreset, formatThaiDate } from "@/lib/thai-date";
import { calculateCSAT, calculateNPS, calculateAverage, calculateGrowth } from "@/lib/metrics";
import DashboardClient from "./DashboardClient";

interface Props {
  params: { orgSlug: string };
  searchParams: {
    range?: "today" | "7d" | "30d" | "thisMonth" | "all";
    servicePointId?: string;
    surveyId?: string;
  };
}

export default async function OrgDashboardPage({ params, searchParams }: Props) {
  const { orgSlug } = params;
  const session = await getSession();
  if (!session) redirect(`/login`);

  const org = await prisma.organization.findUnique({
    where: { slug: orgSlug },
    include: {
      servicePoints: {
        where: { isArchived: false },
        orderBy: { displayOrder: "asc" },
      },
      surveys: {
        where: { isArchived: false },
      },
    },
  });

  if (!org) notFound();

  // Scoping check for Service Manager
  let effectiveServicePointId = searchParams.servicePointId;
  if (session.activeRole === "SERVICE_MANAGER" && session.servicePointScope && session.servicePointScope.length > 0) {
    if (!effectiveServicePointId || !session.servicePointScope.includes(effectiveServicePointId)) {
      effectiveServicePointId = session.servicePointScope[0];
    }
  }

  // Date Range Filtering
  const rangePreset = searchParams.range || "30d";
  const { startDate, endDate } = getDateRangePreset(rangePreset);

  // Construct current period query filter
  const currentWhere: any = {
    organizationId: org.id,
    isFlagged: false, // exclude flagged responses from standard analytics
  };

  if (effectiveServicePointId) {
    currentWhere.servicePointId = effectiveServicePointId;
  }

  if (searchParams.surveyId) {
    currentWhere.surveyVersion = {
      surveyId: searchParams.surveyId,
    };
  }

  if (startDate && endDate) {
    currentWhere.submittedAt = {
      gte: startDate,
      lte: endDate,
    };
  }

  // Fetch current period responses with answers
  const responses = await prisma.response.findMany({
    where: currentWhere,
    include: {
      answers: {
        include: {
          question: true,
        },
      },
      servicePoint: true,
    },
    orderBy: { submittedAt: "desc" },
  });

  // Calculate prior comparison period (same duration immediately preceding)
  let priorResponseCount = 0;
  if (startDate && endDate) {
    const durationMs = endDate.getTime() - startDate.getTime();
    const priorStart = new Date(startDate.getTime() - durationMs);
    const priorEnd = new Date(startDate.getTime());

    priorResponseCount = await prisma.response.count({
      where: {
        ...currentWhere,
        submittedAt: {
          gte: priorStart,
          lt: priorEnd,
        },
      },
    });
  }

  // 1. Overall Metrics
  const totalResponses = responses.length;
  const overallRatings = responses
    .map((r) => r.overallRating)
    .filter((r): r is number => typeof r === "number");

  const csat = calculateCSAT(overallRatings);
  const avgOverall = calculateAverage(overallRatings);
  const responseGrowth = calculateGrowth(totalResponses, priorResponseCount);

  // NPS
  const npsScores = responses
    .map((r) => r.npsScore)
    .filter((s): s is number => typeof s === "number");
  const npsMetrics = calculateNPS(npsScores);

  // 2. Rating Distribution (1-5)
  const distributionCounts: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  for (const r of overallRatings) {
    if (r >= 1 && r <= 5) distributionCounts[r] = (distributionCounts[r] || 0) + 1;
  }
  const ratingDistribution = [1, 2, 3, 4, 5].map((score) => ({
    rating: score,
    count: distributionCounts[score] || 0,
    percentage:
      totalResponses > 0
        ? Number((((distributionCounts[score] || 0) / totalResponses) * 100).toFixed(1))
        : 0,
  }));

  // 3. Question breakdown metrics
  const questionMap = new Map<
    string,
    {
      id: string;
      text: string;
      type: string;
      ratings: number[];
    }
  >();

  for (const r of responses) {
    for (const a of r.answers) {
      if (!questionMap.has(a.questionId)) {
        questionMap.set(a.questionId, {
          id: a.questionId,
          text: a.question.questionText,
          type: a.question.type,
          ratings: [],
        });
      }
      if (typeof a.ratingValue === "number") {
        questionMap.get(a.questionId)!.ratings.push(a.ratingValue);
      }
    }
  }

  const questionBreakdown = Array.from(questionMap.values()).map((q) => ({
    questionId: q.id,
    questionText: q.text,
    type: q.type,
    responseCount: q.ratings.length,
    averageScore: calculateAverage(q.ratings),
    csatPercentage: q.type.startsWith("RATING_") ? calculateCSAT(q.ratings) : null,
  }));

  // 4. Service Point Breakdown
  const spMap = new Map<string, { id: string; name: string; code: string; ratings: number[] }>();
  for (const sp of org.servicePoints) {
    spMap.set(sp.id, { id: sp.id, name: sp.name, code: sp.code, ratings: [] });
  }

  for (const r of responses) {
    if (r.servicePointId && spMap.has(r.servicePointId)) {
      if (typeof r.overallRating === "number") {
        spMap.get(r.servicePointId)!.ratings.push(r.overallRating);
      }
    }
  }

  const servicePointBreakdown = Array.from(spMap.values())
    .map((sp) => ({
      id: sp.id,
      name: sp.name,
      code: sp.code,
      count: sp.ratings.length,
      average: calculateAverage(sp.ratings),
      csat: calculateCSAT(sp.ratings),
    }))
    .filter((sp) => !effectiveServicePointId || sp.id === effectiveServicePointId);

  // 5. Daily Trend Aggregation
  const dayTrendMap = new Map<string, { date: string; count: number; avgRating: number; total: number }>();
  for (const r of responses) {
    const dayKey = formatThaiDate(r.submittedAt, { includeTime: false });
    if (!dayTrendMap.has(dayKey)) {
      dayTrendMap.set(dayKey, { date: dayKey, count: 0, avgRating: 0, total: 0 });
    }
    const entry = dayTrendMap.get(dayKey)!;
    entry.count += 1;
    if (typeof r.overallRating === "number") {
      entry.total += r.overallRating;
      entry.avgRating = Number((entry.total / entry.count).toFixed(2));
    }
  }
  const trendData = Array.from(dayTrendMap.values()).reverse();

  // 6. Recent Comments
  const recentComments = responses
    .filter((r) => r.commentText && r.commentText.trim().length > 0)
    .slice(0, 5)
    .map((r) => ({
      id: r.id,
      comment: r.commentText!,
      rating: r.overallRating,
      servicePointName: r.servicePoint?.name || "จุดบริการทั่วไป",
      submittedAt: formatThaiDate(r.submittedAt, { includeTime: true }),
    }));

  // 7. Pending Feedback Cases count
  const pendingCasesCount = await prisma.feedbackCase.count({
    where: {
      organizationId: org.id,
      status: { in: ["NEW", "ACKNOWLEDGED", "IN_PROGRESS"] },
      ...(effectiveServicePointId ? { servicePointId: effectiveServicePointId } : {}),
    },
  });

  return (
    <DashboardClient
      orgSlug={orgSlug}
      totalResponses={totalResponses}
      priorResponseCount={priorResponseCount}
      responseGrowth={responseGrowth}
      csat={csat}
      avgOverall={avgOverall}
      npsMetrics={npsMetrics}
      ratingDistribution={ratingDistribution}
      questionBreakdown={questionBreakdown}
      servicePointBreakdown={servicePointBreakdown}
      trendData={trendData}
      recentComments={recentComments}
      pendingCasesCount={pendingCasesCount}
      servicePoints={org.servicePoints.map((s) => ({ id: s.id, name: s.name, code: s.code }))}
      currentRange={rangePreset}
      selectedServicePointId={effectiveServicePointId || ""}
    />
  );
}
