"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
} from "recharts";
import {
  TrendingUp,
  TrendingDown,
  Star,
  Users,
  Award,
  LifeBuoy,
  MessageSquare,
  AlertTriangle,
  ChevronRight,
  Filter,
  Calendar,
  Layers,
  CheckCircle2,
  Table,
} from "lucide-react";

interface ServicePointOption {
  id: string;
  name: string;
  code: string;
}

interface QuestionStat {
  questionId: string;
  questionText: string;
  type: string;
  responseCount: number;
  averageScore: number | null;
  csatPercentage: number | null;
}

interface ServicePointStat {
  id: string;
  name: string;
  code: string;
  count: number;
  average: number | null;
  csat: number | null;
}

interface Props {
  orgSlug: string;
  totalResponses: number;
  priorResponseCount: number;
  responseGrowth: number | null;
  csat: number | null;
  avgOverall: number | null;
  npsMetrics: {
    totalResponses: number;
    promoters: number;
    passives: number;
    detractors: number;
    promoterPct: number;
    passivePct: number;
    detractorPct: number;
    npsScore: number | null;
  };
  ratingDistribution: { rating: number; count: number; percentage: number }[];
  questionBreakdown: QuestionStat[];
  servicePointBreakdown: ServicePointStat[];
  trendData: { date: string; count: number; avgRating: number }[];
  recentComments: {
    id: string;
    comment: string;
    rating: number | null;
    servicePointName: string;
    submittedAt: string;
  }[];
  pendingCasesCount: number;
  servicePoints: ServicePointOption[];
  currentRange: string;
  selectedServicePointId: string;
}

export default function DashboardClient({
  orgSlug,
  totalResponses,
  priorResponseCount,
  responseGrowth,
  csat,
  avgOverall,
  npsMetrics,
  ratingDistribution,
  questionBreakdown,
  servicePointBreakdown,
  trendData,
  recentComments,
  pendingCasesCount,
  servicePoints,
  currentRange,
  selectedServicePointId,
}: Props) {
  const router = useRouter();
  const [showAccessibleTable, setShowAccessibleTable] = useState(false);

  const handleFilterChange = (range: string, spId: string) => {
    const params = new URLSearchParams();
    if (range) params.set("range", range);
    if (spId) params.set("servicePointId", spId);
    router.push(`/${orgSlug}/dashboard?${params.toString()}`);
  };

  // Sort questions to spotlight lowest scores first for instant improvement actions
  const sortedQuestions = [...questionBreakdown].sort((a, b) => {
    if (a.averageScore === null) return 1;
    if (b.averageScore === null) return -1;
    return a.averageScore - b.averageScore;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Filter Bar */}
      <div className="bg-white p-4 sm:p-5 rounded-3xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight">
            แดชบอร์ดภาพรวมผลประเมิน (Analytics)
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            ข้อมูลแบบ Real-time ตามช่วงเวลาที่กำหนด • Timezone: Asia/Bangkok
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Service Point Selector */}
          <div className="relative shrink-0">
            <select
              value={selectedServicePointId}
              onChange={(e) => handleFilterChange(currentRange, e.target.value)}
              className="text-xs font-semibold px-3 py-2 rounded-xl border border-slate-200 bg-white text-slate-700 hover:border-teal-400 focus:ring-1 focus:ring-teal-600"
            >
              <option value="">ทุกจุดบริการ (All Service Points)</option>
              {servicePoints.map((sp) => (
                <option key={sp.id} value={sp.id}>
                  {sp.name} ({sp.code})
                </option>
              ))}
            </select>
          </div>

          {/* Date Range Selector */}
          <div className="inline-flex rounded-xl bg-slate-100 p-1 text-xs font-semibold">
            {[
              { id: "today", label: "วันนี้" },
              { id: "7d", label: "7 วัน" },
              { id: "30d", label: "30 วัน" },
              { id: "thisMonth", label: "เดือนนี้" },
              { id: "all", label: "ทั้งหมด" },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => handleFilterChange(tab.id, selectedServicePointId)}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  currentRange === tab.id
                    ? "bg-white text-teal-800 shadow-xs font-bold"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 1. Total Responses */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold">ผู้ตอบแบบประเมิน</span>
            <div className="w-8 h-8 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-800">
            {totalResponses.toLocaleString()}{" "}
            <span className="text-xs font-normal text-slate-400">คำตอบ</span>
          </div>
          <div className="mt-2 text-xs flex items-center gap-1.5">
            {responseGrowth !== null ? (
              responseGrowth >= 0 ? (
                <span className="text-emerald-600 font-bold inline-flex items-center gap-0.5">
                  <TrendingUp className="w-3.5 h-3.5" /> +{responseGrowth}%
                </span>
              ) : (
                <span className="text-red-500 font-bold inline-flex items-center gap-0.5">
                  <TrendingDown className="w-3.5 h-3.5" /> {responseGrowth}%
                </span>
              )
            ) : (
              <span className="text-slate-400">-</span>
            )}
            <span className="text-slate-400 text-[11px]">เทียบช่วงก่อนหน้า ({priorResponseCount} คน)</span>
          </div>
        </div>

        {/* 2. CSAT Score */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold">ความพึงพอใจรวม (CSAT)</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <Award className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-teal-700">
            {csat !== null ? `${csat}%` : "ยังไม่มีข้อมูล"}
          </div>
          <div className="mt-2 text-[11px] text-slate-400">
            สัดส่วนผู้ประเมินระดับ 4 - 5 ดาว
          </div>
        </div>

        {/* 3. Average Rating */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold">คะแนนเฉลี่ยภาพรวม</span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Star className="w-4 h-4 fill-amber-500 text-amber-500" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-800">
            {avgOverall !== null ? (
              <>
                {avgOverall}{" "}
                <span className="text-xs font-normal text-slate-400">/ 5.0</span>
              </>
            ) : (
              "ยังไม่มีข้อมูล"
            )}
          </div>
          <div className="mt-2 text-[11px] text-slate-400">
            คำนวณเฉพาะคำตอบที่ระบุคะแนนจริง
          </div>
        </div>

        {/* 4. NPS */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold">Net Promoter Score (NPS)</span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-blue-700">
            {npsMetrics.npsScore !== null ? (
              `${npsMetrics.npsScore > 0 ? "+" : ""}${npsMetrics.npsScore}`
            ) : (
              "ยังไม่มีข้อมูล"
            )}
          </div>
          <div className="mt-2 text-[11px] text-slate-400 flex items-center justify-between">
            <span>ผู้แนะนำ: {npsMetrics.promoterPct}%</span>
            <span>ตักเตือน: {npsMetrics.detractorPct}%</span>
          </div>
        </div>
      </div>

      {/* Pending Cases Alert Bar (If any) */}
      {pendingCasesCount > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs sm:text-sm font-bold text-amber-900">
                มีข้อเสนอแนะที่ต้องติดตาม {pendingCasesCount} รายการ
              </h4>
              <p className="text-[11px] text-amber-700">
                ได้รับคะแนนต่ำหรือข้อร้องเรียนที่ยังไม่ได้รับการแก้ไข
              </p>
            </div>
          </div>
          <Link
            href={`/${orgSlug}/feedback`}
            className="shrink-0 text-xs font-bold text-amber-800 hover:text-amber-950 bg-amber-200/70 hover:bg-amber-200 px-3.5 py-2 rounded-xl transition-all inline-flex items-center gap-1"
          >
            ไปที่รายการติดตาม <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      )}

      {/* Charts Row: Trend & Rating Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Trend Chart (2 columns) */}
        <div className="lg:col-span-2 bg-white p-5 sm:p-6 rounded-3xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-800">
                แนวโน้มจำนวนผู้ประเมินรายวัน (Daily Responses)
              </h3>
              <p className="text-xs text-slate-400">สถิติการตอบแบบประเมินย้อนหลัง</p>
            </div>
            <button
              type="button"
              onClick={() => setShowAccessibleTable(!showAccessibleTable)}
              className="text-xs text-slate-500 hover:text-slate-800 inline-flex items-center gap-1 border border-slate-200 rounded-lg px-2.5 py-1"
            >
              <Table className="w-3.5 h-3.5" />
              {showAccessibleTable ? "ซ่อนตาราง" : "ดูแบบตาราง"}
            </button>
          </div>

          {trendData.length > 0 ? (
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="date" tick={{ fontSize: 10 }} stroke="#94a3b8" />
                  <YAxis tick={{ fontSize: 10 }} stroke="#94a3b8" allowDecimals={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#0f172a",
                      color: "#ffffff",
                      borderRadius: "12px",
                      fontSize: "12px",
                      border: "none",
                    }}
                  />
                  <Bar dataKey="count" name="จำนวนคน" fill="#0f766e" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-64 flex items-center justify-center text-xs text-slate-400">
              ยังไม่มีข้อมูลการตอบในช่วงเวลานี้
            </div>
          )}

          {/* Accessible Table Fallback */}
          {showAccessibleTable && trendData.length > 0 && (
            <div className="mt-4 pt-4 border-t border-slate-100 overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500">
                    <th className="py-1.5">วันที่</th>
                    <th className="py-1.5 text-right">จำนวนผู้ตอบ (คน)</th>
                    <th className="py-1.5 text-right">คะแนนเฉลี่ย</th>
                  </tr>
                </thead>
                <tbody>
                  {trendData.map((d) => (
                    <tr key={d.date} className="border-b border-slate-100">
                      <td className="py-1.5">{d.date}</td>
                      <td className="py-1.5 text-right font-bold">{d.count}</td>
                      <td className="py-1.5 text-right">{d.avgRating} / 5</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Rating Distribution (1 column) */}
        <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200/80 shadow-xs">
          <h3 className="text-sm font-bold text-slate-800 mb-1">
            การกระจายคะแนน (Rating 1 - 5)
          </h3>
          <p className="text-xs text-slate-400 mb-4">ระดับความพึงพอใจของภาพรวม</p>

          <div className="space-y-3">
            {[5, 4, 3, 2, 1].map((star) => {
              const item = ratingDistribution.find((r) => r.rating === star);
              const count = item?.count || 0;
              const pct = item?.percentage || 0;

              return (
                <div key={star} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-700 flex items-center gap-1">
                      {star} <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                    </span>
                    <span className="text-slate-500">
                      {count} ({pct}%)
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                    <div
                      className={`h-2 rounded-full transition-all duration-300 ${
                        star >= 4
                          ? "bg-teal-600"
                          : star === 3
                          ? "bg-amber-400"
                          : "bg-red-400"
                      }`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Question Breakdown Table (Sorted by lowest score first) */}
      <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200/80 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
          <div>
            <h3 className="text-sm font-bold text-slate-800">
              วิเคราะห์แยกรายหัวข้อคำถาม (Topic Analysis)
            </h3>
            <p className="text-xs text-slate-400">
              เรียงลำดับจากคะแนนเฉลี่ยต่ำสุด เพื่อช่วยระบุจุดที่ควรปรับปรุงอย่างเร่งด่วน
            </p>
          </div>
          <span className="text-xs text-slate-500 bg-slate-100 px-3 py-1 rounded-full self-start">
            ทั้งหมด {sortedQuestions.length} หัวข้อ
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="border-b border-slate-200 text-slate-400 font-semibold uppercase tracking-wider">
                <th className="py-2.5 px-3">ข้อคำถาม</th>
                <th className="py-2.5 px-3 text-center">ประเภท</th>
                <th className="py-2.5 px-3 text-right">จำนวนผู้ตอบ</th>
                <th className="py-2.5 px-3 text-right">คะแนนเฉลี่ย</th>
                <th className="py-2.5 px-3 text-right">CSAT (4-5 ดาว)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {sortedQuestions.map((q, idx) => (
                <tr key={q.questionId} className="hover:bg-slate-50/60 transition-colors">
                  <td className="py-3 px-3 font-medium text-slate-800">
                    <span className="text-slate-400 mr-1.5">{idx + 1}.</span>
                    {q.questionText}
                  </td>
                  <td className="py-3 px-3 text-center">
                    <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md font-mono">
                      {q.type}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-right text-slate-600">
                    {q.responseCount}
                  </td>
                  <td className="py-3 px-3 text-right">
                    {q.averageScore !== null ? (
                      <span
                        className={`font-bold ${
                          q.averageScore < 4.0
                            ? "text-red-500"
                            : q.averageScore < 4.5
                            ? "text-amber-500"
                            : "text-emerald-600"
                        }`}
                      >
                        {q.averageScore} / 5.0
                      </span>
                    ) : (
                      <span className="text-slate-400">-</span>
                    )}
                  </td>
                  <td className="py-3 px-3 text-right font-bold text-teal-800">
                    {q.csatPercentage !== null ? `${q.csatPercentage}%` : "-"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Bottom Grid: Service Point Comparison & Recent Comments */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Service Point Breakdown */}
        <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200/80 shadow-xs">
          <h3 className="text-sm font-bold text-slate-800 mb-1">
            เปรียบเทียบตามจุดบริการ (Service Points)
          </h3>
          <p className="text-xs text-slate-400 mb-4">ผลการประเมินแยกตามเคาน์เตอร์และห้องตรวจ</p>

          <div className="space-y-3">
            {servicePointBreakdown.map((sp) => (
              <div
                key={sp.id}
                className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between"
              >
                <div>
                  <h4 className="text-xs font-bold text-slate-800">{sp.name}</h4>
                  <span className="text-[10px] text-slate-400 font-mono">รหัส: {sp.code}</span>
                </div>
                <div className="text-right">
                  <div className="text-xs font-bold text-teal-800">
                    CSAT: {sp.csat !== null ? `${sp.csat}%` : "-"}
                  </div>
                  <span className="text-[11px] text-slate-500">
                    {sp.count} คำตอบ • เฉลี่ย {sp.average ?? "-"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Comments */}
        <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-800">ความคิดเห็นและข้อเสนอแนะล่าสุด</h3>
              <p className="text-xs text-slate-400">เสียงสะท้อนจริงจากผู้รับบริการ</p>
            </div>
            <Link
              href={`/${orgSlug}/responses`}
              className="text-xs text-teal-700 hover:text-teal-900 font-semibold"
            >
              ดูทั้งหมด
            </Link>
          </div>

          <div className="space-y-3">
            {recentComments.length > 0 ? (
              recentComments.map((c) => (
                <div
                  key={c.id}
                  className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 text-xs space-y-1.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-teal-800">{c.servicePointName}</span>
                    <span className="text-[10px] text-slate-400">{c.submittedAt}</span>
                  </div>
                  <p className="text-slate-700 leading-relaxed italic">
                    “{c.comment}”
                  </p>
                  {typeof c.rating === "number" && (
                    <div className="flex items-center gap-1 text-[11px] text-amber-600">
                      <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                      <span>{c.rating} ดาว</span>
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="text-xs text-slate-400 text-center py-8">
                ยังไม่มีข้อคิดเห็นเพิ่มเติม
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
