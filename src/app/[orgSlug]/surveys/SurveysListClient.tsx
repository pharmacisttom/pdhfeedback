"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Swal from "sweetalert2";
import {
  ClipboardList,
  Plus,
  Sparkles,
  CheckCircle2,
  Clock,
  ExternalLink,
  ChevronRight,
  Layers,
  Building2,
  Lock,
  Globe,
  Archive,
} from "lucide-react";
import { SurveyTemplate } from "@/lib/templates";

interface SurveyItem {
  id: string;
  title: string;
  description: string | null;
  slug: string;
  category: string;
  currentVersion: number;
  latestVersionId?: string;
  versionNumber: number;
  status: string;
  questionCount: number;
  responseCount: number;
}

interface OrgInfo {
  id: string;
  name: string;
  slug: string;
}

interface Props {
  org: OrgInfo;
  surveys: SurveyItem[];
  templates: SurveyTemplate[];
  canManage: boolean;
}

const STATUS_BADGES: Record<string, { th: string; badge: string }> = {
  PUBLISHED: { th: "เปิดรับคำตอบ (Published)", badge: "bg-emerald-100 text-emerald-800 border-emerald-200" },
  DRAFT: { th: "แบบร่าง (Draft)", badge: "bg-amber-100 text-amber-800 border-amber-200" },
  CLOSED: { th: "ปิดรับคำตอบ (Closed)", badge: "bg-slate-100 text-slate-700 border-slate-200" },
  ARCHIVED: { th: "เก็บถาวร (Archived)", badge: "bg-red-100 text-red-700 border-red-200" },
};

export default function SurveysListClient({
  org,
  surveys,
  templates,
  canManage,
}: Props) {
  const router = useRouter();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("hospital_opd");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleTemplateSelect = (tmpl: SurveyTemplate) => {
    setSelectedTemplateId(tmpl.id);
    setTitle(tmpl.name);
    setDescription(tmpl.description);
  };

  const handleCreateSurvey = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const res = await fetch("/api/surveys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          organizationId: org.id,
          title: title.trim(),
          description: description?.trim() || null,
          templateId: selectedTemplateId || null,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "สร้างแบบประเมินไม่สำเร็จ");
      }

      Swal.fire({
        icon: "success",
        title: "สร้างแบบประเมินสำเร็จ!",
        text: "คุณสามารถแก้ไขหัวข้อคำถาม หรือกดเผยแพร่เพื่อเริ่มรับคำตอบได้ทันที",
        confirmButtonColor: "#0f766e",
      });

      setIsCreateModalOpen(false);
      setTitle("");
      setDescription("");
      router.refresh();
    } catch (err: any) {
      Swal.fire({
        icon: "error",
        title: "เกิดข้อผิดพลาด",
        text: err.message || "ไม่สามารถสร้างแบบประเมินได้",
        confirmButtonColor: "#0f766e",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleStatus = async (versionId: string, currentStatus: string) => {
    const newAction = currentStatus === "PUBLISHED" ? "CLOSE" : "PUBLISH";
    const confirmTitle =
      newAction === "PUBLISH"
        ? "ยืนยันเผยแพร่แบบประเมิน?"
        : "ยืนยันปิดรับคำตอบแบบประเมิน?";

    const result = await Swal.fire({
      title: confirmTitle,
      text:
        newAction === "PUBLISH"
          ? "เมื่อเผยแพร่แล้ว ผู้รับบริการจะสามารถตอบแบบประเมินได้ผ่าน QR Code และลิงก์"
          : "เมื่อปิดรับคำตอบ ผู้ใช้จะไม่สามารถส่งคำตอบใหม่เข้ามาได้จนกว่าจะเปิดอีกครั้ง",
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: newAction === "PUBLISH" ? "#0f766e" : "#dc2626",
      confirmButtonText: newAction === "PUBLISH" ? "เผยแพร่ทันที" : "ปิดรับคำตอบ",
      cancelButtonText: "ยกเลิก",
    });

    if (result.isConfirmed) {
      const res = await fetch("/api/surveys", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ versionId, action: newAction }),
      });

      const data = await res.json();
      if (res.ok) {
        Swal.fire({
          icon: "success",
          title: "บันทึกสถานะเรียบร้อย",
          confirmButtonColor: "#0f766e",
        });
        router.refresh();
      } else {
        Swal.fire({
          icon: "error",
          title: "ไม่สามารถเปลี่ยนสถานะได้",
          text: data.error,
          confirmButtonColor: "#0f766e",
        });
      }
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight">
            แบบประเมินและเวอร์ชัน (Surveys & Versioning)
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            จัดการโครงสร้างแบบประเมิน สร้างจากเทมเพลตมาตรฐาน และควบคุมการเปิด/ปิดรับคำตอบ
          </p>
        </div>

        {canManage && (
          <button
            type="button"
            onClick={() => {
              const first = templates[0];
              if (first) handleTemplateSelect(first);
              setIsCreateModalOpen(true);
            }}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs shadow-md transition-all active:scale-95 shrink-0 self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            สร้างแบบประเมินใหม่
          </button>
        )}
      </div>

      {/* Survey Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {surveys.map((survey) => {
          const statusMeta = STATUS_BADGES[survey.status] || STATUS_BADGES.DRAFT;

          return (
            <div
              key={survey.id}
              className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs hover:border-teal-400 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-3">
                  <span
                    className={`text-[11px] font-bold px-2.5 py-1 rounded-full border ${statusMeta.badge}`}
                  >
                    {statusMeta.th}
                  </span>
                  <span className="text-xs font-mono font-bold bg-slate-100 text-slate-600 px-2.5 py-0.5 rounded-md">
                    v{survey.versionNumber}
                  </span>
                </div>

                <h3 className="text-base font-bold text-slate-800 leading-snug mb-1">
                  {survey.title}
                </h3>
                {survey.description && (
                  <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed mb-4">
                    {survey.description}
                  </p>
                )}

                <div className="grid grid-cols-2 gap-3 py-3 border-y border-slate-100 text-xs">
                  <div>
                    <span className="text-slate-400 block text-[11px]">จำนวนคำถาม:</span>
                    <span className="font-bold text-slate-800">{survey.questionCount} ข้อ</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">คำตอบที่ได้รับ:</span>
                    <span className="font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded-md">
                      {survey.responseCount} คน
                    </span>
                  </div>
                </div>
              </div>

              {/* Bottom Actions */}
              <div className="mt-5 pt-2 flex items-center justify-between gap-2">
                <span className="text-[11px] text-slate-400 font-mono truncate max-w-[180px]">
                  /{survey.slug}
                </span>

                <div className="flex items-center gap-2">
                  {canManage && survey.latestVersionId && (
                    <button
                      type="button"
                      onClick={() =>
                        handleToggleStatus(survey.latestVersionId!, survey.status)
                      }
                      className={`text-xs font-bold px-3 py-1.5 rounded-xl border transition-all ${
                        survey.status === "PUBLISHED"
                          ? "border-red-200 text-red-600 hover:bg-red-50"
                          : "border-teal-200 bg-teal-50 text-teal-800 hover:bg-teal-100"
                      }`}
                    >
                      {survey.status === "PUBLISHED" ? "ปิดรับคำตอบ" : "เผยแพร่ (Publish)"}
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {surveys.length === 0 && (
        <div className="text-center py-16 bg-white rounded-3xl border border-slate-200 p-8">
          <ClipboardList className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-800 mb-1">ยังไม่มีแบบประเมินในองค์กร</h3>
          <p className="text-xs text-slate-500 mb-6">
            เริ่มต้นสร้างแบบประเมินชุดแรกจากเทมเพลตมาตรฐานได้ทันที
          </p>
          <button
            type="button"
            onClick={() => setIsCreateModalOpen(true)}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs shadow-md"
          >
            <Plus className="w-4 h-4" />
            สร้างแบบประเมินจากเทมเพลต
          </button>
        </div>
      )}

      {/* Modal: Create Survey from Template */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-xl w-full p-6 border border-slate-200 max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-150">
            <h3 className="text-base font-bold text-slate-800 mb-1">
              สร้างแบบประเมินใหม่ (New Survey)
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              เลือกเทมเพลตมาตรฐานตามประเภทการบริการ หรือปรับแต่งชื่อตามต้องการ
            </p>

            <form onSubmit={handleCreateSurvey} className="space-y-4">
              {/* Template Picker */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2">
                  เลือกเทมเพลตมาตรฐาน:
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {templates.map((tmpl) => (
                    <button
                      key={tmpl.id}
                      type="button"
                      onClick={() => handleTemplateSelect(tmpl)}
                      className={`text-left p-3 rounded-2xl border text-xs transition-all ${
                        selectedTemplateId === tmpl.id
                          ? "bg-teal-50/80 border-teal-600 ring-1 ring-teal-600 text-teal-900"
                          : "border-slate-200 hover:border-slate-300 text-slate-700 hover:bg-slate-50"
                      }`}
                    >
                      <span className="font-bold block mb-0.5 leading-snug">{tmpl.name}</span>
                      <span className="text-[10px] text-slate-500 block line-clamp-2">
                        {tmpl.description}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  ชื่อแบบประเมิน <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="เช่น แบบประเมินความพึงพอใจ แผนกผู้ป่วยนอก"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:border-teal-600 focus:ring-1 focus:ring-teal-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  คำอธิบาย หรือข้อความชี้แจงผู้รับบริการ
                </label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="ขอความอนุเคราะห์ตอบแบบประเมินสั้นๆ เพื่อนำไปพัฒนาการบริการ..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:border-teal-600 focus:ring-1 focus:ring-teal-600"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 rounded-xl bg-teal-700 hover:bg-teal-800 disabled:bg-slate-300 text-white font-bold text-xs shadow-md transition-all"
                >
                  {isSubmitting ? "กำลังสร้าง..." : "สร้างแบบประเมิน"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
