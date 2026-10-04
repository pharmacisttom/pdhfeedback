"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Check,
  X,
  HelpCircle,
  Building2,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Zap,
  PhoneCall,
  CheckCircle2,
  Mail,
  Info,
  Clock,
  ShieldAlert,
} from "lucide-react";
import { formatSatang } from "@/lib/billing";
import { BillingMode } from "@/lib/billing-config";

interface PricingClientProps {
  billingMode: BillingMode;
  isBillingDisabled: boolean;
}

export default function PricingClient({
  billingMode,
  isBillingDisabled,
}: PricingClientProps) {
  const [billingInterval, setBillingInterval] = useState<"MONTHLY" | "ANNUAL">("ANNUAL");
  const [contactModalPlan, setContactModalPlan] = useState<string | null>(null);

  const getPlanCta = (planName: string, isFree: boolean = false) => {
    if (isFree) {
      return (
        <Link
          href="/register"
          className="w-full block text-center py-2.5 px-4 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-800 transition-colors"
        >
          เริ่มใช้งานฟรี
        </Link>
      );
    }

    if (isBillingDisabled) {
      return (
        <button
          type="button"
          onClick={() => setContactModalPlan(planName)}
          className="w-full py-2.5 px-4 rounded-xl text-xs font-bold bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 transition-colors flex items-center justify-center gap-1.5"
        >
          <Mail className="w-3.5 h-3.5" />
          ติดต่อผู้ดูแลระบบ
        </button>
      );
    }

    return (
      <Link
        href="/login?redirect=/plan"
        className="w-full block text-center py-2.5 px-4 rounded-xl text-xs font-bold bg-teal-700 hover:bg-teal-800 text-white transition-colors"
      >
        เลือกแพ็กเกจนี้
      </Link>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      {/* Navigation Header */}
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-teal-700 to-emerald-500 flex items-center justify-center text-white font-extrabold text-xl shadow-md">
              P
            </div>
            <div>
              <span className="text-lg font-black tracking-tight text-slate-800">
                Pdh<span className="text-teal-700">Feedback</span>
              </span>
              <span className="hidden sm:inline-block ml-2 text-[10px] bg-teal-100 text-teal-800 font-bold px-2 py-0.5 rounded-full">
                Packages & Pricing
              </span>
            </div>
          </Link>

          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="text-xs sm:text-sm font-semibold text-slate-700 hover:text-slate-900 px-3 py-2"
            >
              เข้าสู่ระบบ
            </Link>
            <Link
              href="/register"
              className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-white bg-teal-700 hover:bg-teal-800 px-4 py-2 rounded-xl shadow-sm transition-all"
            >
              เริ่มต้นใช้งานฟรี
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </header>

      {/* Notice Banner when billing is disabled or sandbox */}
      {isBillingDisabled && (
        <div className="bg-amber-50 border-b border-amber-200 text-amber-900 px-4 py-3 text-xs sm:text-sm text-center">
          <div className="max-w-5xl mx-auto flex items-center justify-center gap-2">
            <Info className="w-4 h-4 text-amber-700 shrink-0" />
            <span>
              <strong>แพ็กเกจสำหรับเปิดบริการในอนาคต:</strong> ขณะนี้เปิดให้ใช้งานตามสิทธิ์ที่ผู้ดูแลกำหนด โดยยังไม่มีการเรียกเก็บเงินจริง หากต้องการปรับสิทธิ์หรือเพิ่มโควตา โปรดติดต่อผู้ดูแลระบบ
            </span>
          </div>
        </div>
      )}

      {billingMode === "sandbox" && (
        <div className="bg-sky-50 border-b border-sky-200 text-sky-900 px-4 py-3 text-xs sm:text-sm text-center">
          <div className="max-w-5xl mx-auto flex items-center justify-center gap-2">
            <ShieldAlert className="w-4 h-4 text-sky-700 shrink-0" />
            <span>
              <strong>โหมดทดสอบ (Sandbox):</strong> ข้อมูลและราคาเพื่อการทดสอบระบบ ไม่มีการเรียกเก็บเงินจริง
            </span>
          </div>
        </div>
      )}

      {/* Hero Section */}
      <section className="py-12 md:py-16 text-center px-4 max-w-5xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-teal-50 border border-teal-200 text-teal-800 text-xs sm:text-sm font-semibold mb-6">
          <Sparkles className="w-4 h-4 text-teal-600" />
          {isBillingDisabled
            ? "โครงสร้างแพ็กเกจและสิทธิ์การใช้งาน (Future Service Offerings)"
            : "แพ็กเกจที่ออกแบบมาเพื่อธุรกิจบริการ คลินิก และโรงพยาบาลทุกขนาด"}
        </div>
        <h1 className="text-3xl sm:text-5xl font-black text-slate-900 tracking-tight leading-tight">
          {isBillingDisabled
            ? "แพ็กเกจและสิทธิ์การใช้งานสำหรับอนาคต"
            : "เลือกแพ็กเกจที่ตอบโจทย์องค์กรคุณ"}
        </h1>
        <p className="mt-4 text-base sm:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
          {isBillingDisabled
            ? "ขณะนี้ระบบเปิดให้ใช้งานฟรีตามสิทธิ์ที่ผู้ดูแลระบบกำหนด โดยยังไม่มีการเรียกเก็บเงินจริง สามารถศึกษาฟีเจอร์และโควตาของแต่ละแพ็กเกจเพื่อวางแผนการใช้งาน"
            : "เริ่มต้นรับฟังเสียงผู้รับบริการฟรี อัปเกรดได้ทุกเมื่อเมื่อองค์กรเติบโต ไม่มีค่าธรรมเนียมแอบแฝง ชำระเงินง่ายผ่าน Mobile Banking และ PromptPay"}
        </p>

        {/* Monthly / Annual Toggle Switch */}
        <div className="mt-8 inline-flex items-center p-1.5 rounded-2xl bg-slate-200/80 border border-slate-300">
          <button
            type="button"
            onClick={() => setBillingInterval("MONTHLY")}
            className={`px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all ${
              billingInterval === "MONTHLY"
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            แสดงแบบรายเดือน
          </button>
          <button
            type="button"
            onClick={() => setBillingInterval("ANNUAL")}
            className={`px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 ${
              billingInterval === "ANNUAL"
                ? "bg-teal-700 text-white shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <span>แสดงแบบรายปี</span>
            <span
              className={`text-[10px] px-2 py-0.5 rounded-full font-extrabold ${
                billingInterval === "ANNUAL"
                  ? "bg-emerald-400 text-teal-950"
                  : "bg-teal-100 text-teal-800"
              }`}
            >
              ประหยัด ~17% (ฟรี 2 เดือน)
            </span>
          </button>
        </div>
      </section>

      {/* Pricing Cards Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6 items-stretch">
          {/* FREE */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
            <div>
              <div className="flex justify-between items-center mb-3">
                <span className="text-sm font-bold uppercase tracking-wider text-slate-500">Free</span>
                <span className="text-xs bg-slate-100 text-slate-600 px-2.5 py-1 rounded-full font-semibold">
                  เริ่มต้น
                </span>
              </div>
              <div className="mb-4">
                <span className="text-4xl font-extrabold text-slate-900">฿0</span>
                <span className="text-xs text-slate-500 ml-1">/ ตลอดชีพ</span>
              </div>
              <p className="text-xs text-slate-600 min-h-[36px] mb-6">
                สำหรับทดลองใช้ 1 จุดบริการ เริ่มต้นรับฟังเสียงผู้รับบริการทันที
              </p>

              <div className="space-y-3 py-4 border-t border-slate-100 text-xs">
                <div className="flex items-center gap-2 text-slate-700">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span><strong>1</strong> จุดบริการ (Service Point)</span>
                </div>
                <div className="flex items-center gap-2 text-slate-700">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span><strong>1</strong> สมาชิกในทีม</span>
                </div>
                <div className="flex items-center gap-2 text-slate-700">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span><strong>1</strong> แบบประเมินที่เปิดรับ</span>
                </div>
                <div className="flex items-center gap-2 text-slate-700">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span><strong>100</strong> คำตอบ / เดือน</span>
                </div>
                <div className="flex items-center gap-2 text-slate-700">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>ประเมินรูปดาว 1–5 และข้อเสนอแนะ</span>
                </div>
                <div className="flex items-center gap-2 text-slate-700">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>QR Code และ Dashboard พื้นฐาน</span>
                </div>
                <div className="flex items-center gap-2 text-slate-400">
                  <span className="text-[10px] text-slate-400">แสดง Powered by Tomvis</span>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-100">
              {getPlanCta("Free", true)}
            </div>
          </div>

          {/* STARTER */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
            <div>
              <div className="flex justify-between items-center mb-3">
                <span className="text-sm font-bold uppercase tracking-wider text-teal-700">Starter</span>
                <span className="text-xs bg-teal-50 text-teal-700 px-2.5 py-1 rounded-full font-semibold">
                  คลินิก/ร้านค้า
                </span>
              </div>
              <div className="mb-4">
                <span className="text-4xl font-extrabold text-slate-900">
                  {billingInterval === "ANNUAL" ? "฿2,990" : "฿299"}
                </span>
                <span className="text-xs text-slate-500 ml-1">
                  / {billingInterval === "ANNUAL" ? "ปี" : "เดือน"}
                </span>
                {billingInterval === "ANNUAL" && (
                  <div className="text-[11px] text-emerald-600 font-semibold mt-1">
                    เฉลี่ย ฿249.17 / เดือน
                  </div>
                )}
              </div>
              <p className="text-xs text-slate-600 min-h-[36px] mb-6">
                สำหรับคลินิก ร้านค้า สหกรณ์ หรือหน่วยงานขนาดเล็ก
              </p>

              <div className="space-y-3 py-4 border-t border-slate-100 text-xs">
                <div className="flex items-center gap-2 text-slate-700">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span><strong>5</strong> จุดบริการ</span>
                </div>
                <div className="flex items-center gap-2 text-slate-700">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span><strong>3</strong> สมาชิกในทีม</span>
                </div>
                <div className="flex items-center gap-2 text-slate-700">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span><strong>5</strong> แบบประเมินที่เปิดรับ</span>
                </div>
                <div className="flex items-center gap-2 text-slate-700">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span><strong>1,000</strong> คำตอบ / เดือน</span>
                </div>
                <div className="flex items-center gap-2 text-slate-700">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>คำถามเพิ่มเติม & Templates</span>
                </div>
                <div className="flex items-center gap-2 text-slate-700">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Dashboard Filters & Export XLSX</span>
                </div>
                <div className="flex items-center gap-2 text-slate-700">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>โลโก้องค์กร & Case Tracking</span>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-100">
              {getPlanCta("Starter")}
            </div>
          </div>

          {/* PROFESSIONAL (Highlighted) */}
          <div className="bg-gradient-to-b from-teal-900 to-slate-900 text-white rounded-3xl p-6 shadow-xl flex flex-col justify-between relative transform lg:-translate-y-2 border-2 border-teal-400">
            <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-teal-400 text-slate-950 text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full shadow-md">
              ★ ยอดนิยมสูงสุด
            </div>
            <div>
              <div className="flex justify-between items-center mb-3 mt-1">
                <span className="text-sm font-bold uppercase tracking-wider text-teal-300">Professional</span>
                <span className="text-xs bg-teal-500/20 text-teal-200 px-2.5 py-1 rounded-full font-semibold">
                  รพ.ชุมชน / ศบส.
                </span>
              </div>
              <div className="mb-4">
                <span className="text-4xl font-extrabold text-white">
                  {billingInterval === "ANNUAL" ? "฿7,990" : "฿799"}
                </span>
                <span className="text-xs text-teal-200 ml-1">
                  / {billingInterval === "ANNUAL" ? "ปี" : "เดือน"}
                </span>
                {billingInterval === "ANNUAL" && (
                  <div className="text-[11px] text-teal-300 font-semibold mt-1">
                    เฉลี่ย ฿665.83 / เดือน
                  </div>
                )}
              </div>
              <p className="text-xs text-slate-300 min-h-[36px] mb-6">
                สำหรับโรงพยาบาลชุมชน ศูนย์สาธารณสุข หรือธุรกิจบริการหลายสาขา
              </p>

              <div className="space-y-3 py-4 border-t border-slate-700/60 text-xs">
                <div className="flex items-center gap-2 text-slate-100">
                  <Check className="w-4 h-4 text-teal-400 shrink-0" />
                  <span><strong>20</strong> จุดบริการ</span>
                </div>
                <div className="flex items-center gap-2 text-slate-100">
                  <Check className="w-4 h-4 text-teal-400 shrink-0" />
                  <span><strong>10</strong> สมาชิกในทีม</span>
                </div>
                <div className="flex items-center gap-2 text-slate-100">
                  <Check className="w-4 h-4 text-teal-400 shrink-0" />
                  <span><strong>20</strong> แบบประเมินที่เปิดรับ</span>
                </div>
                <div className="flex items-center gap-2 text-slate-100">
                  <Check className="w-4 h-4 text-teal-400 shrink-0" />
                  <span><strong>5,000</strong> คำตอบ / เดือน</span>
                </div>
                <div className="flex items-center gap-2 text-slate-100">
                  <Check className="w-4 h-4 text-teal-400 shrink-0" />
                  <span>เปรียบเทียบจุดบริการและช่วงเวลา</span>
                </div>
                <div className="flex items-center gap-2 text-slate-100">
                  <Check className="w-4 h-4 text-teal-400 shrink-0" />
                  <span>รายงานสรุปผู้บริหาร PDF</span>
                </div>
                <div className="flex items-center gap-2 text-slate-100">
                  <Check className="w-4 h-4 text-teal-400 shrink-0" />
                  <span>Conditional Logic & ลิงก์คำเชิญ</span>
                </div>
                <div className="flex items-center gap-2 text-slate-100">
                  <Check className="w-4 h-4 text-teal-400 shrink-0" />
                  <span>Email Alerts & มอบหมายงาน (SLA)</span>
                </div>
                <div className="flex items-center gap-2 text-slate-100">
                  <Check className="w-4 h-4 text-teal-400 shrink-0" />
                  <span>รองรับหลายภาษา & ปรับแต่งธีม</span>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-700/60">
              {isBillingDisabled ? (
                <button
                  type="button"
                  onClick={() => setContactModalPlan("Professional")}
                  className="w-full py-2.5 px-4 rounded-xl text-xs font-bold bg-teal-400 hover:bg-teal-300 text-slate-950 transition-colors shadow-lg active:scale-95 flex items-center justify-center gap-1.5"
                >
                  <Mail className="w-3.5 h-3.5" />
                  ติดต่อขอรับสิทธิ์ใช้งาน
                </button>
              ) : (
                <Link
                  href="/login?redirect=/plan"
                  className="w-full block text-center py-2.5 px-4 rounded-xl text-xs font-bold bg-teal-400 hover:bg-teal-300 text-slate-950 transition-colors shadow-lg active:scale-95"
                >
                  เลือกแพ็กเกจนี้
                </Link>
              )}
            </div>
          </div>

          {/* BUSINESS */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
            <div>
              <div className="flex justify-between items-center mb-3">
                <span className="text-sm font-bold uppercase tracking-wider text-indigo-700">Business</span>
                <span className="text-xs bg-indigo-50 text-indigo-700 px-2.5 py-1 rounded-full font-semibold">
                  รพ.ทั่วไป/เครือข่าย
                </span>
              </div>
              <div className="mb-4">
                <span className="text-4xl font-extrabold text-slate-900">
                  {billingInterval === "ANNUAL" ? "฿19,900" : "฿1,990"}
                </span>
                <span className="text-xs text-slate-500 ml-1">
                  / {billingInterval === "ANNUAL" ? "ปี" : "เดือน"}
                </span>
                {billingInterval === "ANNUAL" && (
                  <div className="text-[11px] text-emerald-600 font-semibold mt-1">
                    เฉลี่ย ฿1,658.33 / เดือน
                  </div>
                )}
              </div>
              <p className="text-xs text-slate-600 min-h-[36px] mb-6">
                สำหรับโรงพยาบาลทั่วไป องค์กรขนาดใหญ่ หรือเครือข่ายหลายสาขา
              </p>

              <div className="space-y-3 py-4 border-t border-slate-100 text-xs">
                <div className="flex items-center gap-2 text-slate-700">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span><strong>100</strong> จุดบริการ</span>
                </div>
                <div className="flex items-center gap-2 text-slate-700">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span><strong>30</strong> สมาชิกในทีม</span>
                </div>
                <div className="flex items-center gap-2 text-slate-700">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span><strong>100</strong> แบบประเมินที่เปิดรับ</span>
                </div>
                <div className="flex items-center gap-2 text-slate-700">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span><strong>20,000</strong> คำตอบ / เดือน</span>
                </div>
                <div className="flex items-center gap-2 text-slate-700">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>API Access & HMAC Webhooks</span>
                </div>
                <div className="flex items-center gap-2 text-slate-700">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Widget / iframe ฝังเว็บไซต์</span>
                </div>
                <div className="flex items-center gap-2 text-slate-700">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>ซ่อน Powered by Tomvis</span>
                </div>
                <div className="flex items-center gap-2 text-slate-700">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Advanced Role Scopes & Audit</span>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-100">
              {getPlanCta("Business")}
            </div>
          </div>

          {/* ENTERPRISE */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
            <div>
              <div className="flex justify-between items-center mb-3">
                <span className="text-sm font-bold uppercase tracking-wider text-slate-700">Enterprise</span>
                <span className="text-xs bg-slate-100 text-slate-700 px-2.5 py-1 rounded-full font-semibold">
                  หน่วยงานรัฐ/เครือข่าย
                </span>
              </div>
              <div className="mb-4">
                <span className="text-3xl font-extrabold text-slate-900">ติดต่อฝ่ายขาย</span>
                <div className="text-[11px] text-slate-500 mt-1">ขอใบเสนอราคาตามสัญญารายปี</div>
              </div>
              <p className="text-xs text-slate-600 min-h-[36px] mb-6">
                สำหรับเครือข่ายสุขภาพระดับเขต มหาวิทยาลัย หรือระบบภาครัฐ
              </p>

              <div className="space-y-3 py-4 border-t border-slate-100 text-xs">
                <div className="flex items-center gap-2 text-slate-700">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>จุดบริการ & สมาชิกตามตกลง</span>
                </div>
                <div className="flex items-center gap-2 text-slate-700">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>โควตาคำตอบปรับแต่งตามสัญญา</span>
                </div>
                <div className="flex items-center gap-2 text-slate-700">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Dedicated Support & SLA 99.9%</span>
                </div>
                <div className="flex items-center gap-2 text-slate-700">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Custom Integration & Private Cloud Option</span>
                </div>
                <div className="flex items-center gap-2 text-slate-700">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>ใบเสนอราคาและเอกสารจัดซื้อจัดจ้างราชการ</span>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-100">
              <a
                href="mailto:support@pdhfeedback.local?subject=ขอใบเสนอราคา PdhFeedback Enterprise"
                className="w-full block text-center py-2.5 px-4 rounded-xl text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white transition-colors"
              >
                ขอใบเสนอราคา
              </a>
            </div>
          </div>
        </div>

        {/* Pricing Transparency Note */}
        <div className="mt-8 text-center text-xs text-slate-500 max-w-3xl mx-auto space-y-1">
          <p>
            {isBillingDisabled
              ? "* โครงสร้างแพ็กเกจและราคาแสดงเพื่อประกอบการวางแผนสิทธิ์ใช้งานในอนาคต ขณะนี้ไม่มีการเรียกเก็บเงินจริง"
              : "* ราคาทั้งหมดไม่รวมภาษีมูลค่าเพิ่ม (VAT) • ระบบนี้ชำระเพื่อต่ออายุตามรอบบริการ ไม่มีการหักเงินอัตโนมัติ"}
          </p>
          <p>
            * โควตาคำตอบจะถูกรีเซ็ตใหม่ทุกเดือนตามวันเริ่มต้นรอบ แม้จะเลือกชำระแบบรายปี
            เพื่อความต่อเนื่องของคุณภาพบริการ
          </p>
        </div>
      </section>

      {/* Feature Comparison Matrix */}
      <section className="bg-white border-y border-slate-200 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              เปรียบเทียบฟีเจอร์และสิทธิ์ใช้งานครบถ้วน
            </h2>
            <p className="mt-2 text-sm text-slate-600">
              ทุกฟีเจอร์มีการควบคุมสิทธิ์ (Server-side Entitlements) ทั้งหน้าจอ, API และการส่งออกข้อมูล
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-xs sm:text-sm">
              <thead>
                <tr className="border-b-2 border-slate-200 text-slate-600 bg-slate-50">
                  <th className="py-4 px-4 font-bold w-1/3">รายการฟีเจอร์และสิทธิ์</th>
                  <th className="py-4 px-3 text-center font-bold">Free</th>
                  <th className="py-4 px-3 text-center font-bold">Starter</th>
                  <th className="py-4 px-3 text-center font-bold text-teal-700 bg-teal-50/50">Professional</th>
                  <th className="py-4 px-3 text-center font-bold">Business</th>
                  <th className="py-4 px-3 text-center font-bold">Enterprise</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {/* Quotas */}
                <tr className="bg-slate-100/60 font-bold text-slate-700">
                  <td colSpan={6} className="py-2.5 px-4 text-xs uppercase tracking-wider text-slate-500">
                    1. ขีดจำกัดและโควตา (Quotas)
                  </td>
                </tr>
                <tr>
                  <td className="py-3 px-4 text-slate-800">จำนวนจุดบริการ (Service Points)</td>
                  <td className="py-3 px-3 text-center font-semibold">1</td>
                  <td className="py-3 px-3 text-center font-semibold">5</td>
                  <td className="py-3 px-3 text-center font-semibold text-teal-700 bg-teal-50/30">20</td>
                  <td className="py-3 px-3 text-center font-semibold">100</td>
                  <td className="py-3 px-3 text-center font-semibold">ไม่จำกัด*</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 text-slate-800">จำนวนสมาชิกในทีม (Team Members)</td>
                  <td className="py-3 px-3 text-center font-semibold">1</td>
                  <td className="py-3 px-3 text-center font-semibold">3</td>
                  <td className="py-3 px-3 text-center font-semibold text-teal-700 bg-teal-50/30">10</td>
                  <td className="py-3 px-3 text-center font-semibold">30</td>
                  <td className="py-3 px-3 text-center font-semibold">ไม่จำกัด*</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 text-slate-800">แบบประเมินที่เปิดรับพร้อมกัน</td>
                  <td className="py-3 px-3 text-center font-semibold">1</td>
                  <td className="py-3 px-3 text-center font-semibold">5</td>
                  <td className="py-3 px-3 text-center font-semibold text-teal-700 bg-teal-50/30">20</td>
                  <td className="py-3 px-3 text-center font-semibold">100</td>
                  <td className="py-3 px-3 text-center font-semibold">ไม่จำกัด*</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 text-slate-800">โควตาคำตอบต่อเดือน (Reset รายเดือน)</td>
                  <td className="py-3 px-3 text-center font-semibold">100</td>
                  <td className="py-3 px-3 text-center font-semibold">1,000</td>
                  <td className="py-3 px-3 text-center font-semibold text-teal-700 bg-teal-50/30">5,000</td>
                  <td className="py-3 px-3 text-center font-semibold">20,000</td>
                  <td className="py-3 px-3 text-center font-semibold">ตามสัญญา</td>
                </tr>

                {/* Core Features */}
                <tr className="bg-slate-100/60 font-bold text-slate-700">
                  <td colSpan={6} className="py-2.5 px-4 text-xs uppercase tracking-wider text-slate-500">
                    2. การสร้างแบบประเมินและการเก็บข้อมูล (Core Surveys)
                  </td>
                </tr>
                <tr>
                  <td className="py-3 px-4 text-slate-800">แบบประเมินรูปดาว 1–5 และข้อเสนอแนะ</td>
                  <td className="py-3 px-3 text-center"><Check className="w-4 h-4 text-emerald-600 mx-auto" /></td>
                  <td className="py-3 px-3 text-center"><Check className="w-4 h-4 text-emerald-600 mx-auto" /></td>
                  <td className="py-3 px-3 text-center bg-teal-50/30"><Check className="w-4 h-4 text-emerald-600 mx-auto" /></td>
                  <td className="py-3 px-3 text-center"><Check className="w-4 h-4 text-emerald-600 mx-auto" /></td>
                  <td className="py-3 px-3 text-center"><Check className="w-4 h-4 text-emerald-600 mx-auto" /></td>
                </tr>
                <tr>
                  <td className="py-3 px-4 text-slate-800">คำถามเพิ่มเติม & ตัวเลือก (Custom Questions)</td>
                  <td className="py-3 px-3 text-center"><X className="w-4 h-4 text-slate-300 mx-auto" /></td>
                  <td className="py-3 px-3 text-center"><Check className="w-4 h-4 text-emerald-600 mx-auto" /></td>
                  <td className="py-3 px-3 text-center bg-teal-50/30"><Check className="w-4 h-4 text-emerald-600 mx-auto" /></td>
                  <td className="py-3 px-3 text-center"><Check className="w-4 h-4 text-emerald-600 mx-auto" /></td>
                  <td className="py-3 px-3 text-center"><Check className="w-4 h-4 text-emerald-600 mx-auto" /></td>
                </tr>
                <tr>
                  <td className="py-3 px-4 text-slate-800">เงื่อนไขการแสดงผล (Conditional Questions)</td>
                  <td className="py-3 px-3 text-center"><X className="w-4 h-4 text-slate-300 mx-auto" /></td>
                  <td className="py-3 px-3 text-center"><X className="w-4 h-4 text-slate-300 mx-auto" /></td>
                  <td className="py-3 px-3 text-center bg-teal-50/30"><Check className="w-4 h-4 text-emerald-600 mx-auto" /></td>
                  <td className="py-3 px-3 text-center"><Check className="w-4 h-4 text-emerald-600 mx-auto" /></td>
                  <td className="py-3 px-3 text-center"><Check className="w-4 h-4 text-emerald-600 mx-auto" /></td>
                </tr>
                <tr>
                  <td className="py-3 px-4 text-slate-800">ลิงก์คำเชิญแบบใช้ครั้งเดียว (Invitation Links)</td>
                  <td className="py-3 px-3 text-center"><X className="w-4 h-4 text-slate-300 mx-auto" /></td>
                  <td className="py-3 px-3 text-center"><X className="w-4 h-4 text-slate-300 mx-auto" /></td>
                  <td className="py-3 px-3 text-center bg-teal-50/30"><Check className="w-4 h-4 text-emerald-600 mx-auto" /></td>
                  <td className="py-3 px-3 text-center"><Check className="w-4 h-4 text-emerald-600 mx-auto" /></td>
                  <td className="py-3 px-3 text-center"><Check className="w-4 h-4 text-emerald-600 mx-auto" /></td>
                </tr>
                <tr>
                  <td className="py-3 px-4 text-slate-800">แบบประเมินหลายภาษา (Multilingual)</td>
                  <td className="py-3 px-3 text-center"><X className="w-4 h-4 text-slate-300 mx-auto" /></td>
                  <td className="py-3 px-3 text-center"><X className="w-4 h-4 text-slate-300 mx-auto" /></td>
                  <td className="py-3 px-3 text-center bg-teal-50/30"><Check className="w-4 h-4 text-emerald-600 mx-auto" /></td>
                  <td className="py-3 px-3 text-center"><Check className="w-4 h-4 text-emerald-600 mx-auto" /></td>
                  <td className="py-3 px-3 text-center"><Check className="w-4 h-4 text-emerald-600 mx-auto" /></td>
                </tr>

                {/* Analytics & Reports */}
                <tr className="bg-slate-100/60 font-bold text-slate-700">
                  <td colSpan={6} className="py-2.5 px-4 text-xs uppercase tracking-wider text-slate-500">
                    3. แดชบอร์ด รายงาน และการส่งออกข้อมูล (Analytics & Exports)
                  </td>
                </tr>
                <tr>
                  <td className="py-3 px-4 text-slate-800">Dashboard CSAT & NPS สด</td>
                  <td className="py-3 px-3 text-center"><Check className="w-4 h-4 text-emerald-600 mx-auto" /></td>
                  <td className="py-3 px-3 text-center"><Check className="w-4 h-4 text-emerald-600 mx-auto" /></td>
                  <td className="py-3 px-3 text-center bg-teal-50/30"><Check className="w-4 h-4 text-emerald-600 mx-auto" /></td>
                  <td className="py-3 px-3 text-center"><Check className="w-4 h-4 text-emerald-600 mx-auto" /></td>
                  <td className="py-3 px-3 text-center"><Check className="w-4 h-4 text-emerald-600 mx-auto" /></td>
                </tr>
                <tr>
                  <td className="py-3 px-4 text-slate-800">ตัวกรองวันที่และจุดบริการขั้นสูง</td>
                  <td className="py-3 px-3 text-center"><X className="w-4 h-4 text-slate-300 mx-auto" /></td>
                  <td className="py-3 px-3 text-center"><Check className="w-4 h-4 text-emerald-600 mx-auto" /></td>
                  <td className="py-3 px-3 text-center bg-teal-50/30"><Check className="w-4 h-4 text-emerald-600 mx-auto" /></td>
                  <td className="py-3 px-3 text-center"><Check className="w-4 h-4 text-emerald-600 mx-auto" /></td>
                  <td className="py-3 px-3 text-center"><Check className="w-4 h-4 text-emerald-600 mx-auto" /></td>
                </tr>
                <tr>
                  <td className="py-3 px-4 text-slate-800">ส่งออกข้อมูล Excel (XLSX)</td>
                  <td className="py-3 px-3 text-center"><X className="w-4 h-4 text-slate-300 mx-auto" /></td>
                  <td className="py-3 px-3 text-center"><Check className="w-4 h-4 text-emerald-600 mx-auto" /></td>
                  <td className="py-3 px-3 text-center bg-teal-50/30"><Check className="w-4 h-4 text-emerald-600 mx-auto" /></td>
                  <td className="py-3 px-3 text-center"><Check className="w-4 h-4 text-emerald-600 mx-auto" /></td>
                  <td className="py-3 px-3 text-center"><Check className="w-4 h-4 text-emerald-600 mx-auto" /></td>
                </tr>
                <tr>
                  <td className="py-3 px-4 text-slate-800">เปรียบเทียบจุดบริการและช่วงเวลา (Comparison)</td>
                  <td className="py-3 px-3 text-center"><X className="w-4 h-4 text-slate-300 mx-auto" /></td>
                  <td className="py-3 px-3 text-center"><X className="w-4 h-4 text-slate-300 mx-auto" /></td>
                  <td className="py-3 px-3 text-center bg-teal-50/30"><Check className="w-4 h-4 text-emerald-600 mx-auto" /></td>
                  <td className="py-3 px-3 text-center"><Check className="w-4 h-4 text-emerald-600 mx-auto" /></td>
                  <td className="py-3 px-3 text-center"><Check className="w-4 h-4 text-emerald-600 mx-auto" /></td>
                </tr>
                <tr>
                  <td className="py-3 px-4 text-slate-800">รายงานสรุปผู้บริหาร PDF</td>
                  <td className="py-3 px-3 text-center"><X className="w-4 h-4 text-slate-300 mx-auto" /></td>
                  <td className="py-3 px-3 text-center"><X className="w-4 h-4 text-slate-300 mx-auto" /></td>
                  <td className="py-3 px-3 text-center bg-teal-50/30"><Check className="w-4 h-4 text-emerald-600 mx-auto" /></td>
                  <td className="py-3 px-3 text-center"><Check className="w-4 h-4 text-emerald-600 mx-auto" /></td>
                  <td className="py-3 px-3 text-center"><Check className="w-4 h-4 text-emerald-600 mx-auto" /></td>
                </tr>

                {/* Workflow & Automation */}
                <tr className="bg-slate-100/60 font-bold text-slate-700">
                  <td colSpan={6} className="py-2.5 px-4 text-xs uppercase tracking-wider text-slate-500">
                    4. การจัดการข้อร้องเรียนและการทำงานร่วมกัน (Workflow & Automation)
                  </td>
                </tr>
                <tr>
                  <td className="py-3 px-4 text-slate-800">ติดตามข้อเสนอแนะและข้อร้องเรียน (Case Tracking)</td>
                  <td className="py-3 px-3 text-center"><X className="w-4 h-4 text-slate-300 mx-auto" /></td>
                  <td className="py-3 px-3 text-center"><Check className="w-4 h-4 text-emerald-600 mx-auto" /></td>
                  <td className="py-3 px-3 text-center bg-teal-50/30"><Check className="w-4 h-4 text-emerald-600 mx-auto" /></td>
                  <td className="py-3 px-3 text-center"><Check className="w-4 h-4 text-emerald-600 mx-auto" /></td>
                  <td className="py-3 px-3 text-center"><Check className="w-4 h-4 text-emerald-600 mx-auto" /></td>
                </tr>
                <tr>
                  <td className="py-3 px-4 text-slate-800">มอบหมายงานและกำหนดวันแล้วเสร็จ (SLA)</td>
                  <td className="py-3 px-3 text-center"><X className="w-4 h-4 text-slate-300 mx-auto" /></td>
                  <td className="py-3 px-3 text-center"><X className="w-4 h-4 text-slate-300 mx-auto" /></td>
                  <td className="py-3 px-3 text-center bg-teal-50/30"><Check className="w-4 h-4 text-emerald-600 mx-auto" /></td>
                  <td className="py-3 px-3 text-center"><Check className="w-4 h-4 text-emerald-600 mx-auto" /></td>
                  <td className="py-3 px-3 text-center"><Check className="w-4 h-4 text-emerald-600 mx-auto" /></td>
                </tr>
                <tr>
                  <td className="py-3 px-4 text-slate-800">แจ้งเตือนคะแนนวิกฤตทางอีเมล (Email Alerts)</td>
                  <td className="py-3 px-3 text-center"><X className="w-4 h-4 text-slate-300 mx-auto" /></td>
                  <td className="py-3 px-3 text-center"><X className="w-4 h-4 text-slate-300 mx-auto" /></td>
                  <td className="py-3 px-3 text-center bg-teal-50/30"><Check className="w-4 h-4 text-emerald-600 mx-auto" /></td>
                  <td className="py-3 px-3 text-center"><Check className="w-4 h-4 text-emerald-600 mx-auto" /></td>
                  <td className="py-3 px-3 text-center"><Check className="w-4 h-4 text-emerald-600 mx-auto" /></td>
                </tr>
                <tr>
                  <td className="py-3 px-4 text-slate-800">รายงานอัตโนมัติตามกำหนดเวลา (Scheduled Reports)</td>
                  <td className="py-3 px-3 text-center"><X className="w-4 h-4 text-slate-300 mx-auto" /></td>
                  <td className="py-3 px-3 text-center"><X className="w-4 h-4 text-slate-300 mx-auto" /></td>
                  <td className="py-3 px-3 text-center bg-teal-50/30"><Check className="w-4 h-4 text-emerald-600 mx-auto" /></td>
                  <td className="py-3 px-3 text-center"><Check className="w-4 h-4 text-emerald-600 mx-auto" /></td>
                  <td className="py-3 px-3 text-center"><Check className="w-4 h-4 text-emerald-600 mx-auto" /></td>
                </tr>

                {/* Integration & Branding */}
                <tr className="bg-slate-100/60 font-bold text-slate-700">
                  <td colSpan={6} className="py-2.5 px-4 text-xs uppercase tracking-wider text-slate-500">
                    5. การเชื่อมต่อ แบรนด์ และความปลอดภัย (Integration & Branding)
                  </td>
                </tr>
                <tr>
                  <td className="py-3 px-4 text-slate-800">โลโก้และแบรนด์องค์กร (Custom Branding)</td>
                  <td className="py-3 px-3 text-center"><X className="w-4 h-4 text-slate-300 mx-auto" /></td>
                  <td className="py-3 px-3 text-center"><Check className="w-4 h-4 text-emerald-600 mx-auto" /></td>
                  <td className="py-3 px-3 text-center bg-teal-50/30"><Check className="w-4 h-4 text-emerald-600 mx-auto" /></td>
                  <td className="py-3 px-3 text-center"><Check className="w-4 h-4 text-emerald-600 mx-auto" /></td>
                  <td className="py-3 px-3 text-center"><Check className="w-4 h-4 text-emerald-600 mx-auto" /></td>
                </tr>
                <tr>
                  <td className="py-3 px-4 text-slate-800">ซ่อน Powered by Tomvis</td>
                  <td className="py-3 px-3 text-center"><X className="w-4 h-4 text-slate-300 mx-auto" /></td>
                  <td className="py-3 px-3 text-center"><X className="w-4 h-4 text-slate-300 mx-auto" /></td>
                  <td className="py-3 px-3 text-center bg-teal-50/30"><X className="w-4 h-4 text-slate-300 mx-auto" /></td>
                  <td className="py-3 px-3 text-center"><Check className="w-4 h-4 text-emerald-600 mx-auto" /></td>
                  <td className="py-3 px-3 text-center"><Check className="w-4 h-4 text-emerald-600 mx-auto" /></td>
                </tr>
                <tr>
                  <td className="py-3 px-4 text-slate-800">REST API Access & Scoped Keys</td>
                  <td className="py-3 px-3 text-center"><X className="w-4 h-4 text-slate-300 mx-auto" /></td>
                  <td className="py-3 px-3 text-center"><X className="w-4 h-4 text-slate-300 mx-auto" /></td>
                  <td className="py-3 px-3 text-center bg-teal-50/30"><X className="w-4 h-4 text-slate-300 mx-auto" /></td>
                  <td className="py-3 px-3 text-center"><Check className="w-4 h-4 text-emerald-600 mx-auto" /></td>
                  <td className="py-3 px-3 text-center"><Check className="w-4 h-4 text-emerald-600 mx-auto" /></td>
                </tr>
                <tr>
                  <td className="py-3 px-4 text-slate-800">HMAC Webhooks Real-time Events</td>
                  <td className="py-3 px-3 text-center"><X className="w-4 h-4 text-slate-300 mx-auto" /></td>
                  <td className="py-3 px-3 text-center"><X className="w-4 h-4 text-slate-300 mx-auto" /></td>
                  <td className="py-3 px-3 text-center bg-teal-50/30"><X className="w-4 h-4 text-slate-300 mx-auto" /></td>
                  <td className="py-3 px-3 text-center"><Check className="w-4 h-4 text-emerald-600 mx-auto" /></td>
                  <td className="py-3 px-3 text-center"><Check className="w-4 h-4 text-emerald-600 mx-auto" /></td>
                </tr>
                <tr>
                  <td className="py-3 px-4 text-slate-800">Widget / iframe ฝังหน้าเว็บ</td>
                  <td className="py-3 px-3 text-center"><X className="w-4 h-4 text-slate-300 mx-auto" /></td>
                  <td className="py-3 px-3 text-center"><X className="w-4 h-4 text-slate-300 mx-auto" /></td>
                  <td className="py-3 px-3 text-center bg-teal-50/30"><X className="w-4 h-4 text-slate-300 mx-auto" /></td>
                  <td className="py-3 px-3 text-center"><Check className="w-4 h-4 text-emerald-600 mx-auto" /></td>
                  <td className="py-3 px-3 text-center"><Check className="w-4 h-4 text-emerald-600 mx-auto" /></td>
                </tr>
                <tr>
                  <td className="py-3 px-4 text-slate-800">Custom Domain ของตนเอง</td>
                  <td colSpan={5} className="py-3 px-3 text-center text-slate-400 font-semibold italic">
                    Coming Soon (อยู่ระหว่างพัฒนาระบบ Certificate Management)
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 max-w-4xl mx-auto px-4 sm:px-6">
        <h2 className="text-2xl sm:text-3xl font-black text-slate-900 text-center mb-8">
          คำถามที่พบบ่อย (FAQ)
        </h2>

        <div className="space-y-4">
          <div className="bg-white rounded-2xl p-6 border border-slate-200">
            <h3 className="text-base font-bold text-slate-900 mb-2">
              ขณะนี้ระบบคิดค่าบริการหรือไม่?
            </h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              ในปัจจุบันแพลตฟอร์มยังไม่ได้เปิดการเรียกเก็บเงินจริง ผู้ใช้งานทุกองค์กรสามารถสมัครและใช้งานได้ฟรีตามสิทธิ์ที่ผู้ดูแลระบบกำหนด หากท่านต้องการเพิ่มโควตาจุดบริการ สมาชิก หรือคำตอบ สามารถติดต่อผู้ดูแลเพื่อขอรับสิทธิ์ใช้งานพิเศษ (Admin Grant) ได้ทันที
            </p>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-slate-200">
            <h3 className="text-base font-bold text-slate-900 mb-2">
              หากเปิดระบบรับชำระเงินในอนาคต จะมีการเรียกเก็บเงินย้อนหลังหรือไม่?
            </h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              <strong>ไม่มีการเรียกเก็บเงินย้อนหลังอย่างแน่นอน</strong> และจะไม่มีการตัดเงินหรือเปลี่ยนองค์กรที่ใช้ฟรีเป็นแบบเสียเงินโดยอัตโนมัติ เมื่อระบบเริ่มเปิดรับชำระเงิน องค์กรต้องเป็นผู้กดเลือกแพ็กเกจและยืนยันการชำระเงินด้วยตนเองเท่านั้น
            </p>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-slate-200">
            <h3 className="text-base font-bold text-slate-900 mb-2">
              เมื่อหมดอายุหรือลดแพ็กเกจ ข้อมูลเดิมจะสูญหายหรือไม่?
            </h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              ข้อมูลประวัติคำตอบ ข้อเสนอแนะ และสถิติเดิมขององค์กรจะไม่ถูกลบเด็ดขาด
              ผู้ดูแลองค์กรยังคงสามารถเข้าสู่ระบบเพื่อดูข้อมูลย้อนหลังและส่งออกไฟล์ได้ตามปกติ
              เพียงแต่จะไม่สามารถรับคำตอบใหม่เกินโควตาของแพ็กเกจปัจจุบันได้
            </p>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-slate-200">
            <h3 className="text-base font-bold text-slate-900 mb-2">
              ต้องการขอสิทธิ์ใช้งานหรือสอบถามข้อมูลเพิ่มเติม ติดต่อทางใด?
            </h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              สามารถติดต่อทีมผู้ดูแลระบบผ่านอีเมล{" "}
              <a href="mailto:support@pdhfeedback.local" className="text-teal-700 underline font-bold">
                support@pdhfeedback.local
              </a>{" "}
              พร้อมระบุชื่อองค์กรและแพ็กเกจที่ต้องการใช้งาน
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto bg-slate-900 text-slate-400 py-12 border-t border-slate-800 text-xs text-center">
        <div className="max-w-7xl mx-auto px-4">
          <p className="text-slate-300 font-semibold">PdhFeedback Multi-tenant SaaS Platform</p>
          <p className="mt-1">“รับฟังทุกบริการ เห็นผลชัด ปรับปรุงได้ทันที”</p>
          <p className="mt-4 text-slate-500">
            พัฒนาและให้บริการโดย บริษัท ทอมวิส ดิจิทัล จำกัด (Tomvis Digital Co., Ltd.) • สงวนลิขสิทธิ์ 2026
          </p>
        </div>
      </footer>

      {/* Contact Admin Modal */}
      {contactModalPlan && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl relative space-y-4">
            <button
              onClick={() => setContactModalPlan(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-2 rounded-full hover:bg-slate-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="w-12 h-12 rounded-2xl bg-teal-50 text-teal-700 flex items-center justify-center">
              <Mail className="w-6 h-6" />
            </div>

            <div>
              <h3 className="text-lg font-black text-slate-900">
                ขอรับสิทธิ์ใช้งานแพ็กเกจ {contactModalPlan}
              </h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                ขณะนี้ระบบยังไม่เปิดการเรียกเก็บเงินจริง องค์กรสามารถติดต่อผู้ดูแลระบบเพื่อขอรับสิทธิ์การใช้งาน (Admin Access Grant) ได้โดยไม่มีค่าใช้จ่าย
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs space-y-2 text-slate-700">
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>ไม่มีการเรียกเก็บเงินหรือผูกบัตร</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>เปิดสิทธิ์ฟีเจอร์และโควตาเต็มรูปแบบ</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>ไม่มีการเรียกเก็บย้อนหลังเมื่อเปิดระบบ Live</span>
              </div>
            </div>

            <div className="space-y-2 pt-2">
              <a
                href={`mailto:support@pdhfeedback.local?subject=ขอรับสิทธิ์ใช้งานแพ็กเกจ ${contactModalPlan}&body=เรียน ทีมงาน PdhFeedback,%0D%0A%0D%0Aองค์กรของข้าพเจ้ามีความประสงค์ขอรับสิทธิ์ใช้งานแพ็กเกจ ${contactModalPlan} สำหรับระบบประเมินความพึงพอใจ%0D%0Aชื่อองค์กร: %0D%0Aผู้ติดต่อ: %0D%0Aเบอร์โทรศัพท์: `}
                className="w-full py-3 px-4 rounded-xl text-xs font-bold text-white bg-teal-700 hover:bg-teal-800 text-center block shadow-md transition-all"
              >
                ส่งอีเมลติดต่อผู้ดูแล (support@pdhfeedback.local)
              </a>
              <button
                type="button"
                onClick={() => setContactModalPlan(null)}
                className="w-full py-2.5 px-4 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors"
              >
                ปิดหน้าต่าง
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
