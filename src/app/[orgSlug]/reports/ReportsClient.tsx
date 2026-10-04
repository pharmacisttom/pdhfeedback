"use client";

import React, { useState } from "react";
import {
  FileSpreadsheet,
  Download,
  Printer,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Layers,
  Lock,
} from "lucide-react";

interface ServicePointOption {
  id: string;
  name: string;
  code: string;
}

interface OrgInfo {
  id: string;
  name: string;
  slug: string;
}

interface Props {
  org: OrgInfo;
  servicePoints: ServicePointOption[];
  totalResponses: number;
  canExport: boolean;
  canViewContacts: boolean;
}

export default function ReportsClient({
  org,
  servicePoints,
  totalResponses,
  canExport,
  canViewContacts,
}: Props) {
  const [rangePreset, setRangePreset] = useState("30d");
  const [selectedServicePoint, setSelectedServicePoint] = useState("");
  const [isExporting, setIsExporting] = useState(false);

  const handleDownloadCsv = () => {
    if (!canExport) return;
    setIsExporting(true);

    const params = new URLSearchParams();
    params.set("orgSlug", org.slug);
    params.set("range", rangePreset);
    if (selectedServicePoint) params.set("servicePointId", selectedServicePoint);

    window.location.href = `/api/export?${params.toString()}`;

    setTimeout(() => {
      setIsExporting(false);
    }, 2000);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight">
            ศูนย์ส่งออกข้อมูลและรายงาน (Reports & Export)
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            ดาวน์โหลดไฟล์ CSV สำหรับ Excel พร้อมระบบป้องกัน Formula Injection และสอดคล้องกับสิทธิ์การเข้าถึง
          </p>
        </div>
      </div>

      {/* Export Controls Card */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-5">
        <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
          <FileSpreadsheet className="w-5 h-5 text-teal-700" />
          <span>ส่งออกชุดข้อมูลการประเมิน (Export Responses Dataset)</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              ช่วงเวลาที่ต้องการส่งออก
            </label>
            <select
              value={rangePreset}
              onChange={(e) => setRangePreset(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-medium"
            >
              <option value="today">เฉพาะวันนี้ (Today)</option>
              <option value="7d">ย้อนหลัง 7 วันล่าสุด</option>
              <option value="30d">ย้อนหลัง 30 วันล่าสุด</option>
              <option value="thisMonth">เดือนปัจจุบัน</option>
              <option value="all">ข้อมูลทั้งหมด ({totalResponses.toLocaleString()} รายการ)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              จุดบริการ
            </label>
            <select
              value={selectedServicePoint}
              onChange={(e) => setSelectedServicePoint(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-medium"
            >
              <option value="">ทุกจุดบริการ (All Service Points)</option>
              {servicePoints.map((sp) => (
                <option key={sp.id} value={sp.id}>
                  {sp.name} ({sp.code})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Permission Notes */}
        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 text-xs space-y-1.5 text-slate-600">
          <div className="flex items-center gap-2 font-bold text-slate-800">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>มาตรฐานความปลอดภัยและการปกป้องข้อมูล:</span>
          </div>
          <p>
            • ไฟล์ CSV รองรับภาษาไทย 100% ด้วย UTF-8 BOM สำหรับ Microsoft Excel บน Windows และ Mac
          </p>
          <p>
            • ป้องกัน Spreadsheet Formula Injection (ข้อความที่ขึ้นต้นด้วย =, +, -, @ จะถูกใส่ Single Quote อัตโนมัติ)
          </p>
          <p>
            • สิทธิ์การอ่านข้อมูลติดต่อ:{" "}
            {canViewContacts ? (
              <span className="text-emerald-700 font-bold">เปิดใช้งาน (รวมข้อมูลติดต่อในไฟล์)</span>
            ) : (
              <span className="text-amber-700 font-bold">ถูกปิด (ไม่รวมข้อมูลติดต่อในไฟล์เพื่อความปลอดภัย)</span>
            )}
          </p>
        </div>

        {/* Export Button */}
        <div>
          {canExport ? (
            <button
              type="button"
              onClick={handleDownloadCsv}
              disabled={isExporting}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-teal-700 hover:bg-teal-800 disabled:bg-slate-300 text-white font-bold text-xs shadow-md transition-all active:scale-95"
            >
              {isExporting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>กำลังจัดเตรียมไฟล์...</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  <span>ดาวน์โหลดไฟล์ CSV (Excel Ready)</span>
                </>
              )}
            </button>
          ) : (
            <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-center gap-2">
              <Lock className="w-4 h-4 text-amber-600 shrink-0" />
              <span>
                บทบาทของคุณไม่มีสิทธิ์ Export ข้อมูล กรุณาติดต่อ Owner ขององค์กรเพื่อขอสิทธิ์
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Metric Definitions Card */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
        <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
          <HelpCircle className="w-5 h-5 text-teal-700" />
          <span>นิยามและสูตรคำนวณมาตรฐานในรายงาน (Metric Definitions)</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
            <h4 className="font-bold text-slate-800 mb-1">1. Customer Satisfaction (CSAT)</h4>
            <p className="text-slate-600 mb-2 leading-relaxed">
              คำนวณจากร้อยละของผู้ตอบที่ให้คะแนนความพึงพอใจระดับ 4 หรือ 5 จากคำถามความพึงพอใจภาพรวม
            </p>
            <div className="p-2 bg-white rounded-lg border font-mono text-[11px] text-teal-800 font-semibold">
              CSAT = (จำนวนผู้ให้ 4-5 ดาว / จำนวนผู้ตอบทั้งหมดของข้อนั้น) × 100
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
            <h4 className="font-bold text-slate-800 mb-1">2. Net Promoter Score (NPS)</h4>
            <p className="text-slate-600 mb-2 leading-relaxed">
              วัดความภักดีและความเต็มใจที่จะแนะนำบริการให้ผู้อื่น (สเกล 0 ถึง 10)
            </p>
            <div className="p-2 bg-white rounded-lg border font-mono text-[11px] text-blue-800 font-semibold">
              NPS = % Promoters (9-10) − % Detractors (0-6)
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
            <h4 className="font-bold text-slate-800 mb-1">3. คะแนนเฉลี่ย (Average Score)</h4>
            <p className="text-slate-600 leading-relaxed">
              คำนวณเฉพาะข้อที่ผู้รับบริการตอบจริง คำถามที่เป็นทางเลือก (Optional) และไม่ได้ตอบจะไม่ถูกนำมานับเป็นศูนย์ เพื่อป้องกันการดึงคะแนนเฉลี่ยผิดพลาด
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
            <h4 className="font-bold text-slate-800 mb-1">4. เขตเวลา (Timezone)</h4>
            <p className="text-slate-600 leading-relaxed">
              ระบบจัดเก็บเวลาสากล (UTC) ในฐานข้อมูล และทำการแปลงขอบเขตวันเวลาในการจัดทำรายงานตามเขตเวลา Asia/Bangkok (+07:00) และแสดงปี พ.ศ. ภาษาไทย
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
