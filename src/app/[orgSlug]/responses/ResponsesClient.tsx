"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Swal from "sweetalert2";
import {
  MessageSquare,
  Search,
  Star,
  ShieldAlert,
  Flag,
  ChevronLeft,
  ChevronRight,
  Eye,
  Phone,
  User,
  X,
  AlertTriangle,
  Layers,
} from "lucide-react";

interface AnswerItem {
  questionText: string;
  type: string;
  ratingValue: number | null;
  textValue: string | null;
  booleanValue: boolean | null;
  selectedOptions: string[] | null;
}

interface ResponseItem {
  id: string;
  submittedAt: string;
  servicePointName: string;
  surveyTitle: string;
  overallRating: number | null;
  npsScore: number | null;
  commentText: string | null;
  isFlagged: boolean;
  flaggedReason: string | null;
  contact: {
    name: string | null;
    phone: string | null;
    email: string | null;
    preferredTime: string | null;
  } | null;
  hasContactRedacted: boolean;
  answers: AnswerItem[];
}

interface ServicePointOption {
  id: string;
  name: string;
  code: string;
}

interface Props {
  orgSlug: string;
  responses: ResponseItem[];
  totalCount: number;
  currentPage: number;
  totalPages: number;
  servicePoints: ServicePointOption[];
  selectedServicePointId: string;
  selectedRating: string;
  searchQuery: string;
  canManage: boolean;
}

export default function ResponsesClient({
  orgSlug,
  responses,
  totalCount,
  currentPage,
  totalPages,
  servicePoints,
  selectedServicePointId,
  selectedRating,
  searchQuery,
  canManage,
}: Props) {
  const router = useRouter();
  const [activeModalResponse, setActiveModalResponse] = useState<ResponseItem | null>(null);
  const [search, setSearch] = useState(searchQuery);

  const applyFilters = (spId: string, rating: string, q: string, page: number = 1) => {
    const params = new URLSearchParams();
    if (spId) params.set("servicePointId", spId);
    if (rating) params.set("rating", rating);
    if (q) params.set("search", q);
    if (page > 1) params.set("page", String(page));
    router.push(`/${orgSlug}/responses?${params.toString()}`);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    applyFilters(selectedServicePointId, selectedRating, search, 1);
  };

  const handleFlagResponse = async (resp: ResponseItem) => {
    const isCurrentlyFlagged = resp.isFlagged;
    if (!isCurrentlyFlagged) {
      const { value: reason } = await Swal.fire({
        title: "ระบุเหตุผลในการคัดออก (Flag)",
        input: "text",
        inputLabel: "เหตุผลที่แยกคำตอบนี้ออกจากการคำนวณ",
        inputPlaceholder: "เช่น ทดสอบระบบ, คำตอบสแปม, หรือข้อมูลไม่สมบูรณ์",
        showCancelButton: true,
        confirmButtonColor: "#dc2626",
        confirmButtonText: "คัดออกจากการคำนวณ",
        cancelButtonText: "ยกเลิก",
        inputValidator: (val) => {
          if (!val) return "กรุณาระบุเหตุผลการคัดออก";
        },
      });

      if (reason) {
        const res = await fetch("/api/responses/flag", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ responseId: resp.id, isFlagged: true, reason }),
        });
        if (res.ok) {
          Swal.fire({ icon: "success", title: "คัดออกเรียบร้อย", confirmButtonColor: "#0f766e" });
          router.refresh();
        }
      }
    } else {
      const res = await fetch("/api/responses/flag", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ responseId: resp.id, isFlagged: false }),
      });
      if (res.ok) {
        Swal.fire({ icon: "success", title: "นำกลับเข้ามาในการคำนวณแล้ว", confirmButtonColor: "#0f766e" });
        router.refresh();
      }
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight">
            รายการคำตอบแบบประเมิน (Responses)
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            ข้อมูลคำตอบทั้งหมด {totalCount.toLocaleString()} รายการ • รองรับการค้นหาและตรวจสอบรายละเอียด
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <form onSubmit={handleSearchSubmit} className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="ค้นหาข้อความในความคิดเห็น..."
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 text-xs focus:border-teal-600 focus:ring-1 focus:ring-teal-600"
          />
        </form>

        <div className="flex flex-wrap items-center gap-2">
          {/* Service Point Filter */}
          <select
            value={selectedServicePointId}
            onChange={(e) => applyFilters(e.target.value, selectedRating, search, 1)}
            className="text-xs font-medium px-3 py-2 rounded-xl border border-slate-200 bg-white"
          >
            <option value="">ทุกจุดบริการ</option>
            {servicePoints.map((sp) => (
              <option key={sp.id} value={sp.id}>
                {sp.name}
              </option>
            ))}
          </select>

          {/* Rating Filter */}
          <select
            value={selectedRating}
            onChange={(e) => applyFilters(selectedServicePointId, e.target.value, search, 1)}
            className="text-xs font-medium px-3 py-2 rounded-xl border border-slate-200 bg-white"
          >
            <option value="">ทุกระดับคะแนน</option>
            <option value="5">⭐⭐⭐⭐⭐ (5 ดาว)</option>
            <option value="4">⭐⭐⭐⭐ (4 ดาว)</option>
            <option value="3">⭐⭐⭐ (3 ดาว)</option>
            <option value="2">⭐⭐ (2 ดาว)</option>
            <option value="1">⭐ (1 ดาว)</option>
          </select>
        </div>
      </div>

      {/* Responses Table */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
                <th className="py-3 px-4">วันและเวลา</th>
                <th className="py-3 px-4">จุดบริการ</th>
                <th className="py-3 px-4 text-center">คะแนนภาพรวม</th>
                <th className="py-3 px-4 text-center">NPS</th>
                <th className="py-3 px-4">ความคิดเห็น</th>
                <th className="py-3 px-4">ข้อมูลติดต่อ</th>
                <th className="py-3 px-4 text-right">การจัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {responses.map((resp) => (
                <tr
                  key={resp.id}
                  className={`hover:bg-slate-50/60 transition-colors ${
                    resp.isFlagged ? "bg-red-50/30 opacity-70" : ""
                  }`}
                >
                  <td className="py-3 px-4 text-slate-500 font-mono text-[11px] whitespace-nowrap">
                    {resp.submittedAt}
                    {resp.isFlagged && (
                      <span className="block text-[10px] text-red-600 font-bold">
                        (คัดออก: {resp.flaggedReason})
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4 font-bold text-slate-800 whitespace-nowrap">
                    {resp.servicePointName}
                  </td>
                  <td className="py-3 px-4 text-center whitespace-nowrap">
                    {resp.overallRating !== null ? (
                      <span
                        className={`inline-flex items-center gap-1 font-bold px-2 py-0.5 rounded-full ${
                          resp.overallRating >= 4
                            ? "bg-teal-50 text-teal-800"
                            : resp.overallRating === 3
                            ? "bg-amber-50 text-amber-800"
                            : "bg-red-50 text-red-800"
                        }`}
                      >
                        <Star className="w-3 h-3 fill-current" />
                        {resp.overallRating} ดาว
                      </span>
                    ) : (
                      <span className="text-slate-400">-</span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-center font-bold text-blue-700 whitespace-nowrap">
                    {resp.npsScore !== null ? resp.npsScore : "-"}
                  </td>
                  <td className="py-3 px-4 text-slate-700 max-w-xs truncate">
                    {resp.commentText || <span className="text-slate-300">-</span>}
                  </td>
                  <td className="py-3 px-4 whitespace-nowrap">
                    {resp.contact ? (
                      <div className="text-[11px]">
                        <span className="font-bold text-slate-800 block">
                          {resp.contact.name || "ไม่ระบุชื่อ"}
                        </span>
                        <span className="text-slate-500 flex items-center gap-1">
                          <Phone className="w-3 h-3 text-teal-600" />
                          {resp.contact.phone}
                        </span>
                      </div>
                    ) : resp.hasContactRedacted ? (
                      <span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded-md flex items-center gap-1">
                        <ShieldAlert className="w-3 h-3 text-slate-400" />
                        ถูกซ่อนตามสิทธิ์
                      </span>
                    ) : (
                      <span className="text-slate-300">-</span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-right whitespace-nowrap">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        type="button"
                        onClick={() => setActiveModalResponse(resp)}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-teal-700 hover:bg-teal-50 transition-all"
                        title="ดูคำตอบทุกข้อ"
                      >
                        <Eye className="w-4 h-4" />
                      </button>

                      {canManage && (
                        <button
                          type="button"
                          onClick={() => handleFlagResponse(resp)}
                          className={`p-1.5 rounded-lg transition-all ${
                            resp.isFlagged
                              ? "text-red-600 bg-red-100"
                              : "text-slate-400 hover:text-red-500 hover:bg-slate-100"
                          }`}
                          title={resp.isFlagged ? "ยกเลิกการคัดออก" : "คัดออกจากการคำนวณ (Flag)"}
                        >
                          <Flag className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {responses.length === 0 && (
          <div className="text-center py-12 text-slate-400 text-xs">
            ไม่พบคำตอบตามเงื่อนไขที่เลือก
          </div>
        )}

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>
              หน้า {currentPage} จาก {totalPages}
            </span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                disabled={currentPage <= 1}
                onClick={() =>
                  applyFilters(selectedServicePointId, selectedRating, search, currentPage - 1)
                }
                className="p-1.5 rounded-lg border border-slate-200 disabled:opacity-40 hover:bg-slate-50"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                disabled={currentPage >= totalPages}
                onClick={() =>
                  applyFilters(selectedServicePointId, selectedRating, search, currentPage + 1)
                }
                className="p-1.5 rounded-lg border border-slate-200 disabled:opacity-40 hover:bg-slate-50"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Answer Detail Modal Drawer */}
      {activeModalResponse && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full p-6 border border-slate-200 max-h-[85vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-800">
                  รายละเอียดคำตอบผู้รับบริการ
                </h3>
                <span className="text-[11px] text-slate-400 font-mono">
                  {activeModalResponse.submittedAt} • {activeModalResponse.servicePointName}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setActiveModalResponse(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              {activeModalResponse.answers.map((a, idx) => (
                <div key={idx} className="bg-slate-50 p-3.5 rounded-2xl border border-slate-100">
                  <span className="font-bold text-slate-700 block mb-1">
                    {idx + 1}. {a.questionText}
                  </span>
                  <div className="text-teal-900 font-semibold pl-2">
                    {a.ratingValue !== null && <span>คะแนน: {a.ratingValue} ดาว</span>}
                    {a.booleanValue !== null && (
                      <span>{a.booleanValue ? "ใช่ / มี" : "ไม่ใช่ / ไม่มี"}</span>
                    )}
                    {a.textValue && <span>ข้อความ: “{a.textValue}”</span>}
                    {a.selectedOptions && <span>ตัวเลือก: {a.selectedOptions.join(", ")}</span>}
                  </div>
                </div>
              ))}

              {activeModalResponse.commentText && (
                <div className="bg-amber-50/70 p-3.5 rounded-2xl border border-amber-200 text-amber-900">
                  <span className="font-bold block mb-1">ข้อเสนอแนะเพิ่มเติม:</span>
                  <p className="italic">“{activeModalResponse.commentText}”</p>
                </div>
              )}

              {activeModalResponse.contact && (
                <div className="bg-teal-50/70 p-3.5 rounded-2xl border border-teal-200 text-teal-900">
                  <span className="font-bold block mb-1">ข้อมูลขอให้ติดต่อกลับ:</span>
                  <p>ชื่อ: {activeModalResponse.contact.name || "-"}</p>
                  <p>เบอร์โทรศัพท์: {activeModalResponse.contact.phone}</p>
                  <p>ช่วงเวลาที่สะดวก: {activeModalResponse.contact.preferredTime || "-"}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
