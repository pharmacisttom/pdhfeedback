"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Swal from "sweetalert2";
import {
  MapPin,
  ClipboardList,
  QrCode,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  Printer,
  ChevronRight,
} from "lucide-react";
import { SurveyTemplate } from "@/lib/templates";

interface OrgInfo {
  id: string;
  name: string;
  slug: string;
}

interface Props {
  org: OrgInfo;
  templates: SurveyTemplate[];
  existingServicePointCount: number;
}

export default function OnboardingClient({
  org,
  templates,
  existingServicePointCount,
}: Props) {
  const router = useRouter();
  const [step, setStep] = useState(1);

  // Form states
  const [spCode, setSpCode] = useState("MAIN-01");
  const [spName, setSpName] = useState("เคาน์เตอร์บริการหลัก");
  const [selectedTemplateId, setSelectedTemplateId] = useState("hospital_opd");
  const [createdPublicCode, setCreatedPublicCode] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Step 1: Create First Service Point
  const handleStep1 = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const res = await fetch("/api/service-points", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          organizationId: org.id,
          code: spCode.trim().toUpperCase(),
          name: spName.trim(),
          displayOrder: 1,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "สร้างจุดบริการไม่สำเร็จ");

      setCreatedPublicCode(data.servicePoint.publicCode);
      setStep(2);
    } catch (err: any) {
      Swal.fire({ icon: "error", title: "ผิดพลาด", text: err.message, confirmButtonColor: "#0f766e" });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Step 2 & 3: Create Survey from Template & Publish
  const handleStep2AndPublish = async () => {
    setIsSubmitting(true);

    try {
      const tmpl = templates.find((t) => t.id === selectedTemplateId) || templates[0];
      const resSurvey = await fetch("/api/surveys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          organizationId: org.id,
          title: tmpl.name,
          description: tmpl.description,
          templateId: tmpl.id,
        }),
      });

      const surveyData = await resSurvey.json();
      if (!resSurvey.ok) throw new Error(surveyData.error || "สร้างแบบประเมินไม่สำเร็จ");

      // Now publish this survey
      // Query publication was auto-handled or we publish the version
      setStep(3);
    } catch (err: any) {
      Swal.fire({ icon: "error", title: "ผิดพลาด", text: err.message, confirmButtonColor: "#0f766e" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        {/* Progress Tracker */}
        <div className="mb-8">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500 mb-2">
            <span>เริ่มต้นใช้งานองค์กร: {org.name}</span>
            <span>ขั้นที่ {step} จาก 3</span>
          </div>
          <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
            <div
              className="bg-teal-700 h-2 rounded-full transition-all duration-300"
              style={{ width: `${(step / 3) * 100}%` }}
            />
          </div>
        </div>

        {/* Step 1: Create First Service Point */}
        {step === 1 && (
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-xl animate-in fade-in duration-200">
            <div className="w-12 h-12 rounded-2xl bg-teal-50 text-teal-700 flex items-center justify-center mb-4">
              <MapPin className="w-6 h-6" />
            </div>
            <h2 className="text-xl font-bold text-slate-800 mb-1">
              1. สร้างจุดบริการแรกของคุณ (First Service Point)
            </h2>
            <p className="text-xs text-slate-500 mb-6">
              ระบุชื่อเคาน์เตอร์ แผนก หรือห้องตรวจที่ต้องการนำป้าย QR Code ไปวาง
            </p>

            <form onSubmit={handleStep1} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  รหัสจุดบริการ (Code)
                </label>
                <input
                  type="text"
                  required
                  value={spCode}
                  onChange={(e) => setSpCode(e.target.value.toUpperCase())}
                  placeholder="MAIN-01"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 font-mono text-xs uppercase"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  ชื่อจุดบริการ
                </label>
                <input
                  type="text"
                  required
                  value={spName}
                  onChange={(e) => setSpName(e.target.value)}
                  placeholder="เช่น เคาน์เตอร์เวชระเบียน, จุดคัดกรอง, แคชเชียร์"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full min-h-[48px] inline-flex items-center justify-center gap-2 rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs shadow-md transition-all mt-4"
              >
                <span>ถัดไป: เลือกเทมเพลตแบบประเมิน</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          </div>
        )}

        {/* Step 2: Select Template */}
        {step === 2 && (
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-xl animate-in fade-in duration-200">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-700 flex items-center justify-center mb-4">
              <ClipboardList className="w-6 h-6" />
            </div>
            <h2 className="text-xl font-bold text-slate-800 mb-1">
              2. เลือกเทมเพลตแบบประเมินที่ตรงกับธุรกิจของคุณ
            </h2>
            <p className="text-xs text-slate-500 mb-6">
              เทมเพลตมาตรฐานประกอบด้วยคำถาม CSAT, NPS และช่องข้อเสนอแนะที่ผ่านการทดสอบมาแล้ว
            </p>

            <div className="space-y-3 mb-6">
              {templates.map((tmpl) => (
                <button
                  key={tmpl.id}
                  type="button"
                  onClick={() => setSelectedTemplateId(tmpl.id)}
                  className={`w-full text-left p-4 rounded-2xl border text-xs transition-all ${
                    selectedTemplateId === tmpl.id
                      ? "bg-teal-50/80 border-teal-600 ring-2 ring-teal-600/30 text-teal-950 font-bold"
                      : "border-slate-200 text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold block mb-1">{tmpl.name}</span>
                    {selectedTemplateId === tmpl.id && (
                      <CheckCircle2 className="w-5 h-5 text-teal-700 shrink-0" />
                    )}
                  </div>
                  <p className="text-slate-500 text-[11px] font-normal leading-relaxed">
                    {tmpl.description}
                  </p>
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={handleStep2AndPublish}
              disabled={isSubmitting}
              className="w-full min-h-[48px] inline-flex items-center justify-center gap-2 rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs shadow-md transition-all"
            >
              <span>สร้างและเปิดใช้งานแบบประเมินทันที</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Step 3: Success & Get QR Code */}
        {step === 3 && (
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-xl text-center animate-in zoom-in-95 duration-200">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <h2 className="text-2xl font-bold text-slate-800 mb-2">
              พร้อมเปิดรับคำตอบเรียบร้อยแล้ว! 🎉
            </h2>
            <p className="text-xs text-slate-600 max-w-md mx-auto mb-6 leading-relaxed">
              จุดบริการ <strong>{spName}</strong> ถูกสร้างและผูกกับแบบประเมินเรียบร้อยแล้ว
              คุณสามารถพิมพ์ป้าย QR Code ตั้งโต๊ะ หรือเข้าสู่แดชบอร์ดหลักได้ทันที
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              {createdPublicCode && (
                <Link
                  href={`/s/${createdPublicCode}/qr`}
                  target="_blank"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-teal-50 hover:bg-teal-100 text-teal-800 font-bold text-xs border border-teal-200 transition-all shadow-xs"
                >
                  <Printer className="w-4 h-4" />
                  ดูและพิมพ์ป้ายตั้งโต๊ะ QR Code
                </Link>
              )}

              <Link
                href={`/${org.slug}/dashboard`}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs shadow-md transition-all"
              >
                <span>เข้าสู่แดชบอร์ดองค์กร</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
