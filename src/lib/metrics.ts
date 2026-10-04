export interface QuestionMetrics {
  questionId: string;
  questionText: string;
  type: string;
  totalValidResponses: number;
  averageScore: number | null; // null if not a numeric/rating question
  csatPercentage: number | null; // 4-5 stars % (null if not a 1-5 rating question)
  distribution: { [score: number]: number }; // e.g. {1: 0, 2: 1, 3: 4, 4: 10, 5: 25}
}

export interface NpsMetrics {
  totalResponses: number;
  promoters: number; // 9-10
  passives: number; // 7-8
  detractors: number; // 0-6
  promoterPct: number;
  passivePct: number;
  detractorPct: number;
  npsScore: number | null; // promoters% - detractors% (-100 to +100)
}

export interface CalculatedDashboardMetrics {
  totalResponses: number;
  overallSatisfactionScore: number | null; // Average of overall question
  overallCsatPercentage: number | null; // CSAT % of overall question
  nps: NpsMetrics | null;
  ratingDistribution: { rating: number; count: number; percentage: number }[];
  questionMetrics: QuestionMetrics[];
  previousPeriodResponses?: number;
  responseGrowthRate?: number | null; // percentage change vs previous period
}

/**
 * Calculates CSAT: (Count of answers with score 4 or 5) / (Total valid responses) * 100
 */
export function calculateCSAT(ratings: number[]): number | null {
  const validRatings = ratings.filter((r) => r >= 1 && r <= 5);
  if (validRatings.length === 0) return null;

  const top2 = validRatings.filter((r) => r === 4 || r === 5).length;
  return Number(((top2 / validRatings.length) * 100).toFixed(1));
}

/**
 * Calculates Net Promoter Score (NPS): % Promoters (9-10) - % Detractors (0-6)
 */
export function calculateNPS(scores: number[]): NpsMetrics {
  const validScores = scores.filter((s) => s >= 0 && s <= 10);
  if (validScores.length === 0) {
    return {
      totalResponses: 0,
      promoters: 0,
      passives: 0,
      detractors: 0,
      promoterPct: 0,
      passivePct: 0,
      detractorPct: 0,
      npsScore: null,
    };
  }

  const promoters = validScores.filter((s) => s >= 9).length;
  const passives = validScores.filter((s) => s >= 7 && s <= 8).length;
  const detractors = validScores.filter((s) => s <= 6).length;
  const total = validScores.length;

  const promoterPct = Number(((promoters / total) * 100).toFixed(1));
  const passivePct = Number(((passives / total) * 100).toFixed(1));
  const detractorPct = Number(((detractors / total) * 100).toFixed(1));
  const npsScore = Math.round(promoterPct - detractorPct);

  return {
    totalResponses: total,
    promoters,
    passives,
    detractors,
    promoterPct,
    passivePct,
    detractorPct,
    npsScore,
  };
}

/**
 * Computes average score. Optional non-answers are excluded (do NOT treat missing as 0).
 */
export function calculateAverage(numbers: number[]): number | null {
  if (numbers.length === 0) return null;
  const sum = numbers.reduce((acc, curr) => acc + curr, 0);
  return Number((sum / numbers.length).toFixed(2));
}

/**
 * Computes percentage change compared to previous period.
 * If previous period count was 0, returns null (or real change count).
 */
export function calculateGrowth(current: number, previous: number): number | null {
  if (previous === 0) {
    return current > 0 ? 100 : 0;
  }
  return Number((((current - previous) / previous) * 100).toFixed(1));
}
