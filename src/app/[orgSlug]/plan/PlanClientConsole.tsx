"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  CreditCard,
  CheckCircle2,
  AlertCircle,
  Clock,
  ArrowUpRight,
  UploadCloud,
  FileText,
  Building,
  Calendar,
  Layers,
  ChevronRight,
  ShieldCheck,
  X,
  FileCheck,
  QrCode,
  Image as ImageIcon,
  Trash2,
} from "lucide-react";
import { formatSatang, SEED_PLANS } from "@/lib/billing";
import { FEATURE_CATALOGUE, FeatureKey } from "@/lib/entitlements";

interface Props {
  orgSlug: string;
  organization: any;
  userRole: string;
  canManageBilling: boolean;
  subInfo: any;
  actualCounts: {
    servicePoints: number;
    members: number;
    activeSurveys: number;
    responses: number;
  };
  orders: any[];
  billingProfile: any;
  platformBankInfo: {
    bankName: string;
    accountNumber: string;
    accountName: string;
    promptPayId: string;
  };
}

export default function PlanClientConsole({
  orgSlug,
  organization,
  userRole,
  canManageBilling,
  subInfo,
  actualCounts,
  orders,
  billingProfile,
  platformBankInfo,
}: Props) {
  const router = useRouter();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPlanCode, setSelectedPlanCode] = useState<"STARTER" | "PROFESSIONAL" | "BUSINESS">("STARTER");
  const [selectedInterval, setSelectedInterval] = useState<"MONTHLY" | "ANNUAL">("ANNUAL");
  
  // Checkout flow state
  const [activeStep, setActiveStep] = useState<"SELECT" | "PAY" | "SUCCESS">("SELECT");
  const [createdOrder, setCreatedOrder] = useState<any | null>(null);
  const [promptPayData, setPromptPayData] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // File upload state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [userNotes, setUserNotes] = useState("");
  const [uploadSuccess, setUploadSuccess] = useState(false);

  // Active Plan details
  const planCode = subInfo?.planCode || "FREE";
  const limits = subInfo?.limits || {
    servicePoints: 1,
    members: 1,
    activeSurveys: 1,
    responsesPerMonth: 100,
  };

  const getPercent = (count: number, max: number) => {
    if (!max || max <= 0 || max >= 999999) return 0;
    return Math.min(100, Math.round((count / max) * 100));
  };

  const handleOpenUpgradeModal = (presetPlan?: "STARTER" | "PROFESSIONAL" | "BUSINESS") => {
    if (presetPlan) setSelectedPlanCode(presetPlan);
    setActiveStep("SELECT");
    setCreatedOrder(null);
    setSelectedFile(null);
    setFilePreview(null);
    setErrorMsg(null);
    setIsModalOpen(true);
  };

  const handleCreateOrder = async () => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const res = await fetch("/api/billing/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          organizationId: organization.id,
          planCode: selectedPlanCode,
          billingInterval: selectedInterval,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "เกิดข้อผิดพลาดในการสร้างคำสั่งซื้อ");
      }

      setCreatedOrder(data.order);

      // Fetch PromptPay QR payload for this order
      const ppRes = await fetch(`/api/billing/promptpay?orderId=${data.order.id}`);
      const ppData = await ppRes.json();
      setPromptPayData(ppData);

      setActiveStep("PAY");
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert("ขนาดไฟล์ต้องไม่เกิน 5 MB");
        return;
      }
      setSelectedFile(file);
      if (file.type.startsWith("image/")) {
        const reader = new FileReader();
        reader.onload = () => {
          setFilePreview(reader.result as string);
        };
        reader.readAsDataURL(file);
      } else {
        setFilePreview(null);
      }
    }
  };

  const handleUploadSlip = async () => {
    if (!selectedFile || !createdOrder) return;
    setIsLoading(true);
    setErrorMsg(null);

    try {
      const formData = new FormData();
      formData.append("billingOrderId", createdOrder.id);
      formData.append("file", selectedFile);
      if (userNotes) formData.append("userNotes", userNotes);

      const res = await fetch("/api/billing/upload-slip", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "อัปโหลดสลิปไม่สำเร็จ");
      }

      setActiveStep("SUCCESS");
      setUploadSuccess(true);
      router.refresh();
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Top Title & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-2">
            <CreditCard className="w-6 h-6 text-teal-700" />
            แพ็กเกจและการใช้งาน (Usage & Plan)
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            ตรวจสอบโควตาการใช้งาน จัดการแพ็กเกจ และประวัติการสั่งซื้อของ {organization.name}
          </p>
        </div>

        {canManageBilling && (
          <button
            onClick={() => handleOpenUpgradeModal()}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-teal-700 hover:bg-teal-800 text-white text-xs sm:text-sm font-bold shadow-md shadow-teal-700/20 active:scale-95 transition-all"
          >
            <ArrowUpRight className="w-4 h-4" />
            อัปเกรด / ต่ออายุแพ็กเกจ
          </button>
        )}
      </div>

      {/* Current Plan & Subscription Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm relative overflow-hidden">
        <div className="flex flex-col lg:flex-row justify-between lg:items-center gap-6">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">แพ็กเกจปัจจุบัน</span>
              <span
                className={`text-xs font-black px-3 py-1 rounded-full ${
                  planCode === "FREE"
                    ? "bg-slate-100 text-slate-700"
                    : planCode === "STARTER"
                    ? "bg-teal-100 text-teal-800"
                    : planCode === "PROFESSIONAL"
                    ? "bg-blue-100 text-blue-800"
                    : planCode === "BUSINESS"
                    ? "bg-indigo-100 text-indigo-800"
                    : "bg-purple-100 text-purple-800"
                }`}
              >
                {subInfo?.planName || planCode}
              </span>
              <span className="text-xs bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold px-2.5 py-0.5 rounded-full flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" />
                สถานะ: พร้อมใช้งาน (Active)
              </span>
            </div>

            <h2 className="text-3xl font-black text-slate-900 tracking-tight">
              {subInfo?.planName || planCode} Plan
            </h2>

            <div className="flex flex-wrap items-center gap-y-2 gap-x-6 text-xs text-slate-500">
              <div className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-slate-400" />
                <span>
                  รอบบริการ: <strong>{subInfo?.billingInterval === "ANNUAL" ? "รายปี (Annual)" : "รายเดือน (Monthly)"}</strong>
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-slate-400" />
                <span>
                  รอบการคิดเงินสิ้นสุด:{" "}
                  <strong>
                    {new Intl.DateTimeFormat("th-TH", { dateStyle: "medium" }).format(
                      new Date(subInfo?.currentPeriodEnd)
                    )}
                  </strong>
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-slate-400" />
                <span>
                  โควตารีเซ็ตทุกวันที่: <strong>{subInfo?.anchorDay || 1} ของทุกเดือน</strong>
                </span>
              </div>
            </div>
          </div>

          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 flex flex-col justify-center sm:min-w-[280px]">
            <span className="text-[11px] font-semibold text-slate-500">คำตอบที่บันทึกในรอบเดือนปัจจุบัน</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-3xl font-extrabold text-teal-800">{actualCounts.responses}</span>
              <span className="text-xs text-slate-500 font-medium">/ {limits.responsesPerMonth} คำตอบ</span>
            </div>
            <div className="w-full bg-slate-200 h-2 rounded-full mt-2 overflow-hidden">
              <div
                className="bg-teal-600 h-full rounded-full transition-all"
                style={{ width: `${getPercent(actualCounts.responses, limits.responsesPerMonth)}%` }}
              />
            </div>
            <span className="text-[10px] text-slate-400 mt-1.5">
              คงเหลือ {Math.max(0, limits.responsesPerMonth - actualCounts.responses)} คำตอบในรอบเดือนนี้
            </span>
          </div>
        </div>
      </div>

      {/* Quota Meters Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Service Points */}
        <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm">
          <span className="text-xs font-bold text-slate-500">จุดบริการ (Service Points)</span>
          <div className="flex items-baseline gap-1 mt-2">
            <span className="text-2xl font-black text-slate-800">{actualCounts.servicePoints}</span>
            <span className="text-xs text-slate-400">/ {limits.servicePoints >= 999999 ? "ไม่จำกัด" : limits.servicePoints}</span>
          </div>
          <div className="w-full bg-slate-100 h-2 rounded-full mt-3 overflow-hidden">
            <div
              className="bg-emerald-500 h-full rounded-full transition-all"
              style={{ width: `${getPercent(actualCounts.servicePoints, limits.servicePoints)}%` }}
            />
          </div>
          <p className="text-[11px] text-slate-400 mt-2">จุดรับบริการที่มีป้าย QR Code</p>
        </div>

        {/* Team Members */}
        <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm">
          <span className="text-xs font-bold text-slate-500">สมาชิกในองค์กร (Members)</span>
          <div className="flex items-baseline gap-1 mt-2">
            <span className="text-2xl font-black text-slate-800">{actualCounts.members}</span>
            <span className="text-xs text-slate-400">/ {limits.members >= 999999 ? "ไม่จำกัด" : limits.members}</span>
          </div>
          <div className="w-full bg-slate-100 h-2 rounded-full mt-3 overflow-hidden">
            <div
              className="bg-blue-500 h-full rounded-full transition-all"
              style={{ width: `${getPercent(actualCounts.members, limits.members)}%` }}
            />
          </div>
          <p className="text-[11px] text-slate-400 mt-2">ผู้บริหาร เจ้าหน้าที่ และผู้ดูรายงาน</p>
        </div>

        {/* Active Surveys */}
        <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm">
          <span className="text-xs font-bold text-slate-500">แบบประเมินที่เปิดรับ (Active Surveys)</span>
          <div className="flex items-baseline gap-1 mt-2">
            <span className="text-2xl font-black text-slate-800">{actualCounts.activeSurveys}</span>
            <span className="text-xs text-slate-400">/ {limits.activeSurveys >= 999999 ? "ไม่จำกัด" : limits.activeSurveys}</span>
          </div>
          <div className="w-full bg-slate-100 h-2 rounded-full mt-3 overflow-hidden">
            <div
              className="bg-amber-500 h-full rounded-full transition-all"
              style={{ width: `${getPercent(actualCounts.activeSurveys, limits.activeSurveys)}%` }}
            />
          </div>
          <p className="text-[11px] text-slate-400 mt-2">แบบประเมินที่กำลังเผยแพร่</p>
        </div>

        {/* Monthly Responses */}
        <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm">
          <span className="text-xs font-bold text-slate-500">คำตอบต่อเดือน (Monthly Quota)</span>
          <div className="flex items-baseline gap-1 mt-2">
            <span className="text-2xl font-black text-slate-800">{actualCounts.responses}</span>
            <span className="text-xs text-slate-400">/ {limits.responsesPerMonth}</span>
          </div>
          <div className="w-full bg-slate-100 h-2 rounded-full mt-3 overflow-hidden">
            <div
              className="bg-teal-500 h-full rounded-full transition-all"
              style={{ width: `${getPercent(actualCounts.responses, limits.responsesPerMonth)}%` }}
            />
          </div>
          <p className="text-[11px] text-slate-400 mt-2">คำตอบที่บันทึกสำเร็จจริงในรอบเดือน</p>
        </div>
      </div>

      {/* Feature Entitlements Badges */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm">
        <h3 className="text-base font-bold text-slate-900 mb-1 flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-teal-700" />
          สิทธิ์การใช้งานฟีเจอร์ในแพ็กเกจนี้ (Entitlements)
        </h3>
        <p className="text-xs text-slate-500 mb-4">
          ฟีเจอร์ที่ได้รับอนุญาตให้เข้าถึงตามแพ็กเกจปัจจุบัน
        </p>

        <div className="flex flex-wrap gap-2">
          {Object.entries(FEATURE_CATALOGUE).map(([key, feat]) => {
            const hasAccess = subInfo?.hasFeature(key as FeatureKey);
            return (
              <div
                key={key}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border ${
                  hasAccess
                    ? "bg-teal-50 text-teal-900 border-teal-200"
                    : "bg-slate-50 text-slate-400 border-slate-200 opacity-60"
                }`}
              >
                {hasAccess ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                ) : (
                  <X className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                )}
                <span>{feat.name}</span>
                {feat.status === "COMING_SOON" && (
                  <span className="text-[9px] bg-slate-200 text-slate-600 px-1.5 py-0.5 rounded-md font-bold">
                    Soon
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Orders & Payment History */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm">
        <h3 className="text-base font-bold text-slate-900 mb-1 flex items-center gap-2">
          <FileText className="w-5 h-5 text-teal-700" />
          ประวัติคำสั่งซื้อและการชำระเงิน (Billing Orders)
        </h3>
        <p className="text-xs text-slate-500 mb-6">
          รายการสั่งซื้อและเอกสารรับชำระเงินค่าบริการขององค์กร
        </p>

        {orders.length === 0 ? (
          <div className="text-center py-12 text-slate-400 text-xs">
            ยังไม่มีประวัติคำสั่งซื้อในระบบ
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 uppercase tracking-wider">
                  <th className="pb-3 px-3 font-semibold">เลขที่คำสั่งซื้อ</th>
                  <th className="pb-3 px-3 font-semibold">วันที่</th>
                  <th className="pb-3 px-3 font-semibold">แพ็กเกจ</th>
                  <th className="pb-3 px-3 font-semibold">รอบบริการ</th>
                  <th className="pb-3 px-3 font-semibold">ยอดชำระ</th>
                  <th className="pb-3 px-3 font-semibold">สถานะ</th>
                  <th className="pb-3 px-3 font-semibold text-right">เอกสาร</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {orders.map((o) => (
                  <tr key={o.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3 px-3 font-bold text-slate-800">{o.orderNumber}</td>
                    <td className="py-3 px-3 text-slate-500">
                      {new Intl.DateTimeFormat("th-TH", { dateStyle: "medium" }).format(new Date(o.createdAt))}
                    </td>
                    <td className="py-3 px-3 font-semibold text-slate-700">{o.planName}</td>
                    <td className="py-3 px-3 text-slate-600">
                      {o.billingInterval === "ANNUAL" ? "รายปี" : "รายเดือน"}
                    </td>
                    <td className="py-3 px-3 font-bold text-slate-900">
                      ฿{formatSatang(o.netAmountSatang)}
                    </td>
                    <td className="py-3 px-3">
                      {o.status === "APPROVED" && (
                        <span className="inline-flex items-center gap-1 text-[11px] bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full font-bold">
                          <CheckCircle2 className="w-3 h-3" /> ชำระแล้ว
                        </span>
                      )}
                      {o.status === "UNDER_REVIEW" && (
                        <span className="inline-flex items-center gap-1 text-[11px] bg-amber-100 text-amber-800 px-2.5 py-0.5 rounded-full font-bold">
                          <Clock className="w-3 h-3" /> รอการตรวจสอบ
                        </span>
                      )}
                      {o.status === "PENDING_PAYMENT" && (
                        <span className="inline-flex items-center gap-1 text-[11px] bg-sky-100 text-sky-800 px-2.5 py-0.5 rounded-full font-bold">
                          <Clock className="w-3 h-3" /> รอแนบสลิป
                        </span>
                      )}
                      {o.status === "REJECTED" && (
                        <span className="inline-flex items-center gap-1 text-[11px] bg-rose-100 text-rose-800 px-2.5 py-0.5 rounded-full font-bold" title={o.rejectionReason}>
                          <AlertCircle className="w-3 h-3" /> สลิปไม่ถูกต้อง
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-right">
                      {o.hasReceipt ? (
                        <a
                          href={`/api/billing/receipt/${o.id}`}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-xs font-bold text-teal-700 hover:text-teal-900 hover:underline"
                        >
                          <FileCheck className="w-3.5 h-3.5" />
                          ใบเสร็จ
                        </a>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Upgrade / Order Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl relative my-8">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 p-2 rounded-full hover:bg-slate-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Step 1: Select Plan */}
            {activeStep === "SELECT" && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-xl font-black text-slate-900">เลือกแพ็กเกจที่ต้องการอัปเกรด</h3>
                  <p className="text-xs text-slate-500 mt-1">
                    ระบบจะคำนวณยอดเงินและสร้างคำสั่งซื้อสำหรับการโอนเงินผ่าน Mobile Banking / PromptPay
                  </p>
                </div>

                {/* Interval Switcher */}
                <div className="flex bg-slate-100 p-1 rounded-2xl border border-slate-200">
                  <button
                    type="button"
                    onClick={() => setSelectedInterval("MONTHLY")}
                    className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${
                      selectedInterval === "MONTHLY"
                        ? "bg-white text-slate-900 shadow-sm"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    ชำระรายเดือน
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedInterval("ANNUAL")}
                    className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                      selectedInterval === "ANNUAL"
                        ? "bg-teal-700 text-white shadow-sm"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    <span>ชำระรายปี</span>
                    <span className="text-[10px] bg-emerald-400 text-teal-950 font-black px-1.5 py-0.2 rounded-md">
                      ฟรี 2 เดือน
                    </span>
                  </button>
                </div>

                {/* Plan Choices */}
                <div className="space-y-3">
                  {[
                    {
                      code: "STARTER",
                      name: "Starter",
                      desc: "5 จุดบริการ, 3 สมาชิก, 1,000 คำตอบ/เดือน",
                      monthly: 299,
                      annual: 2990,
                    },
                    {
                      code: "PROFESSIONAL",
                      name: "Professional (แนะนำ)",
                      desc: "20 จุดบริการ, 10 สมาชิก, 5,000 คำตอบ, เปรียบเทียบจุด, PDF Reports",
                      monthly: 799,
                      annual: 7990,
                    },
                    {
                      code: "BUSINESS",
                      name: "Business",
                      desc: "100 จุดบริการ, 30 สมาชิก, 20,000 คำตอบ, API, Webhooks, ซ่อนเครดิต",
                      monthly: 1990,
                      annual: 19900,
                    },
                  ].map((p) => {
                    const price = selectedInterval === "ANNUAL" ? p.annual : p.monthly;
                    const isSelected = selectedPlanCode === p.code;
                    return (
                      <div
                        key={p.code}
                        onClick={() => setSelectedPlanCode(p.code as any)}
                        className={`p-4 rounded-2xl border-2 cursor-pointer transition-all flex items-center justify-between ${
                          isSelected
                            ? "border-teal-600 bg-teal-50/50 shadow-sm"
                            : "border-slate-200 hover:border-slate-300 bg-white"
                        }`}
                      >
                        <div>
                          <div className="font-bold text-slate-900 text-sm">{p.name}</div>
                          <div className="text-xs text-slate-500 mt-0.5">{p.desc}</div>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-black text-slate-900">
                            ฿{new Intl.NumberFormat("th-TH").format(price)}
                          </div>
                          <div className="text-[10px] text-slate-500">
                            / {selectedInterval === "ANNUAL" ? "ปี" : "เดือน"}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {errorMsg && (
                  <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700">
                    {errorMsg}
                  </div>
                )}

                <div className="pt-4 border-t border-slate-100 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
                  >
                    ยกเลิก
                  </button>
                  <button
                    type="button"
                    disabled={isLoading}
                    onClick={handleCreateOrder}
                    className="px-6 py-2.5 rounded-xl text-xs font-bold text-white bg-teal-700 hover:bg-teal-800 shadow-md transition-all active:scale-95 disabled:opacity-50"
                  >
                    {isLoading ? "กำลังสร้างคำสั่งซื้อ..." : "ต่อไป: ชำระเงิน"}
                  </button>
                </div>
              </div>
            )}

            {/* Step 2: Payment & Slip Upload */}
            {activeStep === "PAY" && createdOrder && (
              <div className="space-y-6">
                <div>
                  <span className="text-[11px] font-bold text-teal-700 bg-teal-50 px-2.5 py-0.5 rounded-full">
                    คำสั่งซื้อ: {createdOrder.orderNumber}
                  </span>
                  <h3 className="text-xl font-black text-slate-900 mt-2">
                    ชำระเงินค่าบริการ ฿{formatSatang(createdOrder.netAmountSatang, true)}
                  </h3>
                  <p className="text-xs text-slate-500">
                    แพ็กเกจ {createdOrder.planName} • กรุณาโอนเงินตามยอดที่ระบุและแนบสลิปด้านล่าง
                  </p>
                </div>

                {/* PromptPay QR & Bank Details Box */}
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-center gap-6">
                  {promptPayData?.qrDataUrl ? (
                    <div className="bg-white p-2.5 rounded-xl border border-slate-200 shadow-sm shrink-0 text-center">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={promptPayData.qrDataUrl}
                        alt="PromptPay QR Code"
                        className="w-36 h-36 mx-auto"
                      />
                      <span className="text-[10px] font-bold text-slate-500 mt-1 block">
                        Thai QR PromptPay
                      </span>
                    </div>
                  ) : (
                    <div className="w-36 h-36 bg-slate-200 rounded-xl flex items-center justify-center text-xs text-slate-400">
                      กำลังโหลด QR...
                    </div>
                  )}

                  <div className="space-y-2 text-xs text-slate-700 w-full">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">ธนาคาร</span>
                      <strong>{platformBankInfo.bankName}</strong>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">เลขที่บัญชี</span>
                      <strong className="text-sm text-teal-800 tracking-wider">
                        {platformBankInfo.accountNumber}
                      </strong>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">ชื่อบัญชี</span>
                      <span>{platformBankInfo.accountName}</span>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">PromptPay ID</span>
                      <span>{platformBankInfo.promptPayId}</span>
                    </div>
                  </div>
                </div>

                {/* Slip Upload Input */}
                <div className="space-y-3">
                  <label className="block text-xs font-bold text-slate-800">
                    แนบหลักฐานการโอนเงิน (สลิป Mobile Banking)
                  </label>

                  {filePreview ? (
                    <div className="relative border border-slate-200 rounded-2xl p-2 bg-slate-50 flex items-center gap-4">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={filePreview}
                        alt="Slip preview"
                        className="w-16 h-16 object-cover rounded-xl border border-slate-200"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-slate-800 truncate">{selectedFile?.name}</p>
                        <p className="text-[10px] text-slate-400">
                          {selectedFile?.size ? (selectedFile.size / 1024).toFixed(1) : 0} KB
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedFile(null);
                          setFilePreview(null);
                        }}
                        className="text-slate-400 hover:text-rose-500 p-2"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="border-2 border-dashed border-slate-200 rounded-2xl p-6 text-center hover:border-teal-500 transition-colors">
                      <UploadCloud className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                      <label className="cursor-pointer">
                        <span className="text-xs font-bold text-teal-700 hover:underline">
                          เลือกรูปภาพสลิปจากเครื่อง หรือถ่ายภาพ
                        </span>
                        <input
                          type="file"
                          accept="image/jpeg,image/png,image/webp,application/pdf"
                          capture="environment"
                          onChange={handleFileChange}
                          className="hidden"
                        />
                      </label>
                      <p className="text-[10px] text-slate-400 mt-1">
                        รองรับไฟล์ JPG, PNG, WebP หรือ PDF (ไม่เกิน 5 MB)
                      </p>
                    </div>
                  )}

                  <input
                    type="text"
                    value={userNotes}
                    onChange={(e) => setUserNotes(e.target.value)}
                    placeholder="หมายเหตุเพิ่มเติม เช่น เวลาโอน หรือเลข 4 ตัวท้ายบัญชี (ไม่บังคับ)"
                    className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-teal-600"
                  />
                </div>

                {errorMsg && (
                  <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700">
                    {errorMsg}
                  </div>
                )}

                <div className="pt-4 border-t border-slate-100 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setActiveStep("SELECT")}
                    className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
                  >
                    ย้อนกลับ
                  </button>
                  <button
                    type="button"
                    disabled={!selectedFile || isLoading}
                    onClick={handleUploadSlip}
                    className="px-6 py-2.5 rounded-xl text-xs font-bold text-white bg-teal-700 hover:bg-teal-800 shadow-md transition-all active:scale-95 disabled:opacity-50"
                  >
                    {isLoading ? "กำลังส่งหลักฐาน..." : "ยืนยันและส่งหลักฐาน"}
                  </button>
                </div>
              </div>
            )}

            {/* Step 3: Success Screen */}
            {activeStep === "SUCCESS" && (
              <div className="text-center py-6 space-y-4">
                <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto text-2xl font-black">
                  ✓
                </div>
                <h3 className="text-xl font-black text-slate-900">
                  ส่งหลักฐานการชำระเงินเรียบร้อยแล้ว
                </h3>
                <p className="text-xs text-slate-600 max-w-sm mx-auto leading-relaxed">
                  เจ้าหน้าที่กำลังตรวจสอบรายการโอนเงินของท่าน คำสั่งซื้อจะได้รับการอนุมัติและปรับเพิ่มสิทธิ์ใช้งานโดยเร็ว
                </p>
                <div className="pt-4">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-6 py-2.5 rounded-xl text-xs font-bold text-white bg-slate-900 hover:bg-slate-800"
                  >
                    ปิดหน้าต่าง
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
