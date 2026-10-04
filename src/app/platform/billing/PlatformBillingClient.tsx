"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  CreditCard,
  DollarSign,
  TrendingUp,
  Clock,
  CheckCircle2,
  AlertCircle,
  FileText,
  Search,
  ExternalLink,
  Building2,
  Calendar,
  Layers,
  ArrowLeft,
  X,
  FileCheck,
  Eye,
  Check,
  ShieldCheck,
  Gift,
  PlusCircle,
  ShieldAlert,
  Info,
} from "lucide-react";
import { formatSatang } from "@/lib/billing";
import { BillingMode } from "@/lib/billing-config";

interface Props {
  adminUser: {
    userId: string;
    fullName: string;
    email: string;
  };
  billingMode: BillingMode;
  metrics: {
    totalCollectedSatang: number;
    totalPendingSatang: number;
    sandboxCollectedSatang: number;
    mrrSatang: number;
    arrSatang: number;
    pendingReviewCount: number;
    activeSubscriptionsCount: number;
    adminGrantsCount: number;
  };
  organizations: {
    id: string;
    name: string;
    slug: string;
  }[];
  orders: any[];
  subscriptions: any[];
  plans: any[];
  bankSettings: {
    bankName: string;
    accountNumber: string;
    accountName: string;
    promptPayId: string;
  };
}

export default function PlatformBillingClient({
  adminUser,
  billingMode,
  metrics,
  organizations,
  orders,
  subscriptions,
  plans,
  bankSettings,
}: Props) {
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<
    "REVIEW" | "ORDERS" | "SUBSCRIPTIONS" | "PLANS"
  >("REVIEW");
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Admin Grant Modal State
  const [isGrantModalOpen, setIsGrantModalOpen] = useState(false);
  const [selectedOrgId, setSelectedOrgId] = useState(organizations[0]?.id || "");
  const [grantPlanCode, setGrantPlanCode] = useState("PROFESSIONAL");
  const [grantDuration, setGrantDuration] = useState<"INDEFINITE" | "30_DAYS" | "90_DAYS" | "1_YEAR">("1_YEAR");
  const [grantFallbackPlan, setGrantFallbackPlan] = useState("FREE");
  const [grantReason, setGrantReason] = useState("");

  const pendingOrders = orders.filter((o) =>
    ["UNDER_REVIEW", "PENDING_PAYMENT"].includes(o.status)
  );

  const handleOpenReview = (order: any) => {
    setSelectedOrder(order);
    setRejectionReason("");
    setErrorMsg(null);
    setIsReviewModalOpen(true);
  };

  const handleReviewAction = async (action: "APPROVE" | "REJECT") => {
    if (!selectedOrder) return;
    if (action === "REJECT" && !rejectionReason.trim()) {
      setErrorMsg("กรุณาระบุเหตุผลการปฏิเสธหลักฐานการชำระเงิน");
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      const res = await fetch("/api/billing/review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId: selectedOrder.id,
          action,
          rejectionReason: action === "REJECT" ? rejectionReason : undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "ดำเนินการไม่สำเร็จ");
      }

      setIsReviewModalOpen(false);
      setSelectedOrder(null);
      router.refresh();
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateGrant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrgId) {
      setErrorMsg("กรุณาเลือกองค์กรที่ต้องการมอบสิทธิ์");
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const now = new Date();
      let expiresAt: string | null = null;
      if (grantDuration === "30_DAYS") {
        const d = new Date(now);
        d.setDate(d.getDate() + 30);
        expiresAt = d.toISOString();
      } else if (grantDuration === "90_DAYS") {
        const d = new Date(now);
        d.setDate(d.getDate() + 90);
        expiresAt = d.toISOString();
      } else if (grantDuration === "1_YEAR") {
        const d = new Date(now);
        d.setFullYear(d.getFullYear() + 1);
        expiresAt = d.toISOString();
      }

      const res = await fetch("/api/platform/access-grant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          organizationId: selectedOrgId,
          planCode: grantPlanCode,
          expiresAt,
          fallbackPlanCode: grantFallbackPlan,
          reason: grantReason || "Platform Admin Direct Access Grant",
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "มอบสิทธิ์ไม่สำเร็จ");
      }

      setSuccessMsg("มอบสิทธิ์ให้แก่องค์กรเรียบร้อยแล้ว (ไม่สร้างยอดขายหรือการเรียกเก็บเงิน)");
      setTimeout(() => {
        setIsGrantModalOpen(false);
        setSuccessMsg(null);
        router.refresh();
      }, 1200);
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans">
      {/* Top Navbar */}
      <header className="bg-slate-900 text-white border-b border-slate-800 px-6 py-4 flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <Link
            href="/platform"
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            title="กลับไปยังภาพรวม Platform"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-base font-bold tracking-tight block">
                Tomvisfeedback Platform Billing Console
              </span>
              <span
                className={`text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider ${
                  billingMode === "live"
                    ? "bg-emerald-500 text-white"
                    : billingMode === "sandbox"
                    ? "bg-amber-400 text-slate-950"
                    : "bg-rose-500/20 text-rose-300 border border-rose-500/40"
                }`}
              >
                MODE: {billingMode}
              </span>
            </div>
            <span className="text-[11px] text-teal-300 font-mono">
              การเงิน สมาชิก สิทธิ์ผู้ดูแล และการอนุมัติการชำระเงิน
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => {
              setErrorMsg(null);
              setSuccessMsg(null);
              setIsGrantModalOpen(true);
            }}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-white bg-teal-600 hover:bg-teal-500 px-3.5 py-2 rounded-xl shadow-sm transition-all"
          >
            <Gift className="w-4 h-4" />
            มอบสิทธิ์องค์กร (Admin Grant)
          </button>

          <div className="text-right hidden sm:block text-xs border-l border-slate-700 pl-3">
            <span className="font-bold text-white block">{adminUser.fullName}</span>
            <span className="text-slate-400 font-mono text-[10px]">{adminUser.email}</span>
          </div>
        </div>
      </header>

      {/* Mode Banner */}
      {billingMode === "disabled" && (
        <div className="bg-amber-500/10 border-b border-amber-500/30 px-6 py-2.5 text-xs text-amber-900 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-amber-700 shrink-0" />
            <span>
              <strong>โหมดปิดการเรียกเก็บเงิน (BILLING_MODE=disabled):</strong>{" "}
              การสั่งซื้อและชำระเงินขององค์กรถูกปิดฝั่ง Server ป้องกันการทำธุรกรรมเงินจริง •
              องค์กรใช้งานตาม Free plan หรือสิทธิ์ที่ Platform Admin มอบให้ (Admin Access Grant)
            </span>
          </div>
          <span className="text-[10px] bg-amber-200/80 text-amber-900 font-bold px-2 py-0.5 rounded-full">
            Safe Mode Active
          </span>
        </div>
      )}

      {billingMode === "sandbox" && (
        <div className="bg-sky-500/10 border-b border-sky-500/30 px-6 py-2.5 text-xs text-sky-900 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-sky-700 shrink-0" />
            <span>
              <strong>โหมดทดสอบ (BILLING_MODE=sandbox):</strong>{" "}
              ข้อมูลทดสอบ ไม่มีการเรียกเก็บเงินจริง คำสั่งซื้อทั้งหมดในโหมดนี้ถูกแยกออกจากรายงานรายได้จริง
            </span>
          </div>
          <span className="text-[10px] bg-sky-200/80 text-sky-900 font-bold px-2 py-0.5 rounded-full">
            Sandbox Active
          </span>
        </div>
      )}

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        {/* Revenue KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Total Collected */}
          <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-semibold">ยอดเงินจริงที่รับแล้ว (Cash)</span>
              <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
                <DollarSign className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-black text-slate-800">
              ฿{formatSatang(metrics.totalCollectedSatang)}
            </div>
            <span className="text-[11px] text-emerald-600 font-semibold mt-1 block">
              {billingMode === "disabled"
                ? "ไม่มีการเรียกเก็บเงินใน disabled mode"
                : "จากคำสั่งซื้อจริงที่อนุมัติแล้ว (APPROVED)"}
            </span>
          </div>

          {/* MRR */}
          <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-semibold">รายได้ประจำต่อเดือน (MRR)</span>
              <div className="w-8 h-8 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center">
                <TrendingUp className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-black text-teal-800">
              ฿{formatSatang(metrics.mrrSatang)}
            </div>
            <span className="text-[11px] text-slate-400 mt-1 block">
              เฉพาะ Paid Subscriptions (ไม่นับ Admin Grants)
            </span>
          </div>

          {/* Admin Grants */}
          <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-semibold">สิทธิ์พิเศษที่มอบให้ (Admin Grants)</span>
              <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center">
                <Gift className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-black text-purple-900">
              {metrics.adminGrantsCount}{" "}
              <span className="text-xs font-normal text-slate-400">องค์กร</span>
            </div>
            <span className="text-[11px] text-purple-600 font-semibold mt-1 block">
              ฿0 รายได้ (ไม่สร้าง payment ปลอม)
            </span>
          </div>

          {/* Pending Review Queue */}
          <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-semibold">รอตรวจสอบหลักฐาน (Review)</span>
              <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center">
                <Clock className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-black text-amber-700">
              {metrics.pendingReviewCount}{" "}
              <span className="text-xs font-normal text-slate-400">รายการ</span>
            </div>
            <span className="text-[11px] text-amber-700 font-semibold mt-1 block">
              ยอดเงินค้าง: ฿{formatSatang(metrics.totalPendingSatang)}
            </span>
          </div>
        </div>

        {/* Console Navigation Tabs */}
        <div className="flex border-b border-slate-200 text-xs sm:text-sm font-bold gap-2">
          <button
            type="button"
            onClick={() => setActiveTab("REVIEW")}
            className={`pb-3 px-4 border-b-2 transition-all flex items-center gap-2 ${
              activeTab === "REVIEW"
                ? "border-teal-700 text-teal-800"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <span>รอตรวจสอบการโอนเงิน</span>
            {pendingOrders.length > 0 && (
              <span className="text-[10px] bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full font-black">
                {pendingOrders.length}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("ORDERS")}
            className={`pb-3 px-4 border-b-2 transition-all ${
              activeTab === "ORDERS"
                ? "border-teal-700 text-teal-800"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            คำสั่งซื้อทั้งหมด ({orders.length})
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("SUBSCRIPTIONS")}
            className={`pb-3 px-4 border-b-2 transition-all ${
              activeTab === "SUBSCRIPTIONS"
                ? "border-teal-700 text-teal-800"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            สมาชิกและแพ็กเกจ ({subscriptions.length})
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("PLANS")}
            className={`pb-3 px-4 border-b-2 transition-all ${
              activeTab === "PLANS"
                ? "border-teal-700 text-teal-800"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            แพ็กเกจในระบบ ({plans.length})
          </button>
        </div>

        {/* Tab 1: Pending Review Queue */}
        {activeTab === "REVIEW" && (
          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-6 space-y-4">
            <div>
              <h2 className="text-base font-bold text-slate-800">
                รายการแจ้งชำระเงินที่รอการอนุมัติ (Payment Review Queue)
              </h2>
              <p className="text-xs text-slate-400">
                ตรวจสอบความถูกต้องของสลิป ยอดเงิน บัญชีปลายทาง และเวลาโอน ก่อนกดอนุมัติสิทธิ์ใช้งาน
              </p>
            </div>

            {pendingOrders.length === 0 ? (
              <div className="text-center py-12 text-slate-400 text-xs">
                ไม่มีรายการค้างตรวจสอบในขณะนี้
              </div>
            ) : (
              <div className="overflow-x-auto text-xs">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-400 font-semibold uppercase">
                      <th className="py-2.5 px-3">เลขที่คำสั่งซื้อ</th>
                      <th className="py-2.5 px-3">องค์กร</th>
                      <th className="py-2.5 px-3">แพ็กเกจที่เลือก</th>
                      <th className="py-2.5 px-3">ยอดเงินที่ต้องชำระ</th>
                      <th className="py-2.5 px-3">สถานะสลิป</th>
                      <th className="py-2.5 px-3 text-right">ดำเนินการ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {pendingOrders.map((o) => (
                      <tr key={o.id} className="hover:bg-slate-50/50">
                        <td className="py-3 px-3 font-bold text-slate-800">
                          {o.orderNumber}
                          {o.isSandbox && (
                            <span className="ml-1 text-[9px] bg-sky-100 text-sky-800 px-1.5 py-0.5 rounded font-black">
                              SANDBOX
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-3 font-semibold text-slate-800">{o.orgName}</td>
                        <td className="py-3 px-3 text-slate-600">
                          {o.planName} ({o.billingInterval === "ANNUAL" ? "รายปี" : "รายเดือน"})
                        </td>
                        <td className="py-3 px-3 font-black text-slate-900">
                          ฿{formatSatang(o.netAmountSatang)}
                        </td>
                        <td className="py-3 px-3">
                          {o.evidence ? (
                            <span className="inline-flex items-center gap-1 text-[11px] bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full font-bold">
                              <CheckCircle2 className="w-3 h-3" /> มีสลิปแนบ ({o.evidence.fileName})
                            </span>
                          ) : (
                            <span className="text-[11px] text-slate-400">ยังไม่แนบสลิป</span>
                          )}
                        </td>
                        <td className="py-3 px-3 text-right">
                          <button
                            type="button"
                            onClick={() => handleOpenReview(o)}
                            className="inline-flex items-center gap-1 text-xs font-bold text-teal-700 bg-teal-50 hover:bg-teal-100 border border-teal-200 px-3 py-1.5 rounded-xl transition-all"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            ตรวจสอบสลิป
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Tab 2: All Orders */}
        {activeTab === "ORDERS" && (
          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-6 space-y-4">
            <h2 className="text-base font-bold text-slate-800">
              ประวัติคำสั่งซื้อทั้งหมดในแพลตฟอร์ม
            </h2>

            <div className="overflow-x-auto text-xs">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-400 font-semibold uppercase">
                    <th className="py-2.5 px-3">เลขที่คำสั่งซื้อ</th>
                    <th className="py-2.5 px-3">องค์กร</th>
                    <th className="py-2.5 px-3">วันที่สั่งซื้อ</th>
                    <th className="py-2.5 px-3">แพ็กเกจ</th>
                    <th className="py-2.5 px-3">ยอดชำระ</th>
                    <th className="py-2.5 px-3">สถานะ</th>
                    <th className="py-2.5 px-3 text-right">เอกสาร</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {orders.map((o) => (
                    <tr key={o.id} className="hover:bg-slate-50/50">
                      <td className="py-3 px-3 font-bold text-slate-800">
                        {o.orderNumber}
                        {o.isSandbox && (
                          <span className="ml-1 text-[9px] bg-sky-100 text-sky-800 px-1.5 py-0.5 rounded font-black">
                            SANDBOX
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-3 font-semibold text-slate-700">{o.orgName}</td>
                      <td className="py-3 px-3 text-slate-500">
                        {new Intl.DateTimeFormat("th-TH", { dateStyle: "medium" }).format(
                          new Date(o.createdAt)
                        )}
                      </td>
                      <td className="py-3 px-3 text-slate-600">{o.planName}</td>
                      <td className="py-3 px-3 font-black text-slate-900">
                        ฿{formatSatang(o.netAmountSatang)}
                      </td>
                      <td className="py-3 px-3">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            o.status === "APPROVED"
                              ? "bg-emerald-100 text-emerald-800"
                              : o.status === "UNDER_REVIEW"
                              ? "bg-amber-100 text-amber-800"
                              : o.status === "REJECTED"
                              ? "bg-rose-100 text-rose-800"
                              : "bg-slate-100 text-slate-600"
                          }`}
                        >
                          {o.status}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right">
                        {o.hasReceipt && (
                          <a
                            href={`/api/billing/receipt/${o.id}`}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 font-bold text-teal-700 hover:underline"
                          >
                            <FileCheck className="w-3.5 h-3.5" />
                            ใบเสร็จ
                          </a>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 3: Subscriptions */}
        {activeTab === "SUBSCRIPTIONS" && (
          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-6 space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-base font-bold text-slate-800">
                  สถานะสมาชิกและสิทธิ์ปัจจุบันของแต่ละองค์กร (Subscriptions & Grants)
                </h2>
                <p className="text-xs text-slate-400">
                  แสดงสิทธิ์ทั้งแบบ Administrative Access Grant และ Paid Subscription
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setErrorMsg(null);
                  setSuccessMsg(null);
                  setIsGrantModalOpen(true);
                }}
                className="inline-flex items-center gap-1 text-xs font-bold text-teal-700 bg-teal-50 hover:bg-teal-100 border border-teal-200 px-3 py-1.5 rounded-xl transition-all"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                มอบสิทธิ์ใหม่
              </button>
            </div>

            <div className="overflow-x-auto text-xs">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-400 font-semibold uppercase">
                    <th className="py-2.5 px-3">องค์กร</th>
                    <th className="py-2.5 px-3">ประเภทสิทธิ์</th>
                    <th className="py-2.5 px-3">แพ็กเกจ</th>
                    <th className="py-2.5 px-3">วันหมดอายุ / ต่ออายุ</th>
                    <th className="py-2.5 px-3">แพ็กเกจสำรอง (Fallback)</th>
                    <th className="py-2.5 px-3">สถานะ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {subscriptions.map((s) => (
                    <tr key={s.id} className="hover:bg-slate-50/50">
                      <td className="py-3 px-3 font-bold text-slate-800">{s.orgName}</td>
                      <td className="py-3 px-3">
                        {s.subscriptionType === "ADMIN_GRANT" ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-purple-100 text-purple-800 px-2 py-0.5 rounded-full">
                            <Gift className="w-3 h-3" /> ผู้ดูแลมอบให้
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full">
                            PAID
                          </span>
                        )}
                        {s.isSandbox && (
                          <span className="ml-1 text-[9px] bg-sky-100 text-sky-800 px-1 py-0.2 rounded font-black">
                            SANDBOX
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-3 font-semibold text-teal-800">{s.planName}</td>
                      <td className="py-3 px-3 text-slate-700 font-semibold">
                        {new Intl.DateTimeFormat("th-TH", { dateStyle: "medium" }).format(
                          new Date(s.currentPeriodEnd)
                        )}
                      </td>
                      <td className="py-3 px-3 text-slate-500">
                        {s.fallbackPlanCode || "FREE"}
                      </td>
                      <td className="py-3 px-3">
                        <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                          {s.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 4: Plans & Pricing */}
        {activeTab === "PLANS" && (
          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-6 space-y-4">
            <h2 className="text-base font-bold text-slate-800">
              กำหนดค่าแพ็กเกจและโควตาเริ่มต้น (SaaS Packages)
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {plans.map((p) => {
                const monthly = p.prices.find((pr: any) => pr.interval === "MONTHLY")?.priceSatang;
                const annual = p.prices.find((pr: any) => pr.interval === "ANNUAL")?.priceSatang;
                return (
                  <div
                    key={p.id}
                    className="p-5 rounded-2xl border border-slate-200 bg-slate-50/50 space-y-3 text-xs"
                  >
                    <div className="flex justify-between items-center">
                      <span className="font-extrabold text-sm text-slate-800">
                        {p.name} ({p.code})
                      </span>
                      <span className="text-[10px] bg-teal-100 text-teal-800 font-bold px-2 py-0.5 rounded-full">
                        {p.subscriptionsCount} องค์กร
                      </span>
                    </div>
                    <p className="text-slate-500">{p.description}</p>
                    <div className="pt-2 border-t border-slate-200/60 space-y-1">
                      <div>
                        รายเดือน: <strong>฿{monthly ? formatSatang(monthly) : "0"}</strong>
                      </div>
                      <div>
                        รายปี: <strong>฿{annual ? formatSatang(annual) : "0"}</strong>
                      </div>
                    </div>
                    <div className="pt-2 border-t border-slate-200/60 text-slate-600 space-y-0.5 text-[11px]">
                      <div>จุดบริการ: {p.maxServicePoints >= 999999 ? "ไม่จำกัด" : p.maxServicePoints}</div>
                      <div>สมาชิก: {p.maxMembers >= 999999 ? "ไม่จำกัด" : p.maxMembers}</div>
                      <div>
                        คำตอบต่อเดือน: {p.monthlyResponseQuota >= 999999 ? "ไม่จำกัด" : p.monthlyResponseQuota}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </main>

      {/* Admin Grant Modal */}
      {isGrantModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl relative space-y-5 my-8">
            <button
              onClick={() => setIsGrantModalOpen(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 p-2 rounded-full hover:bg-slate-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-700 flex items-center justify-center">
                <Gift className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-900">
                  มอบสิทธิ์แพ็กเกจ (Admin Access Grant)
                </h3>
                <p className="text-xs text-slate-500">
                  สิทธิ์ที่ผู้ดูแลมอบให้โดยตรง ไม่สร้างยอดชำระเงินหรือรายได้เท็จ
                </p>
              </div>
            </div>

            <form onSubmit={handleCreateGrant} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">เลือกองค์กร</label>
                <select
                  value={selectedOrgId}
                  onChange={(e) => setSelectedOrgId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white focus:outline-none focus:border-purple-600 font-semibold"
                >
                  {organizations.map((org) => (
                    <option key={org.id} value={org.id}>
                      {org.name} ({org.slug})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">แพ็กเกจที่มอบให้</label>
                <select
                  value={grantPlanCode}
                  onChange={(e) => setGrantPlanCode(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white focus:outline-none focus:border-purple-600 font-semibold"
                >
                  <option value="STARTER">Starter (5 จุดบริการ, 1,000 คำตอบ/เดือน)</option>
                  <option value="PROFESSIONAL">Professional (20 จุดบริการ, 5,000 คำตอบ/เดือน)</option>
                  <option value="BUSINESS">Business (100 จุดบริการ, 20,000 คำตอบ/เดือน)</option>
                  <option value="ENTERPRISE">Enterprise (ไม่จำกัดจุดบริการ & คำตอบ)</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">ระยะเวลาการมอบสิทธิ์</label>
                <select
                  value={grantDuration}
                  onChange={(e: any) => setGrantDuration(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white focus:outline-none focus:border-purple-600 font-semibold"
                >
                  <option value="1_YEAR">1 ปี (365 วัน)</option>
                  <option value="90_DAYS">90 วัน (3 เดือน)</option>
                  <option value="30_DAYS">30 วัน (1 เดือน)</option>
                  <option value="INDEFINITE">ใช้งานต่อเนื่องจนกว่าจะเปลี่ยนแปลง (ไม่มีวันหมดอายุ)</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  แพ็กเกจสำรองเมื่อหมดอายุ (Fallback Plan)
                </label>
                <select
                  value={grantFallbackPlan}
                  onChange={(e) => setGrantFallbackPlan(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white focus:outline-none focus:border-purple-600"
                >
                  <option value="FREE">Free (ไม่ลบข้อมูลเดิม ลดโควตาเป็นค่าเริ่มต้นฟรี)</option>
                  <option value="STARTER">Starter</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  เหตุผลและบันทึก Audit Log
                </label>
                <input
                  type="text"
                  value={grantReason}
                  onChange={(e) => setGrantReason(e.target.value)}
                  placeholder="เช่น มอบสิทธิ์ทดลองใช้ความร่วมมือโรงพยาบาลนำร่อง"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-purple-600"
                />
              </div>

              {errorMsg && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700">
                  {errorMsg}
                </div>
              )}

              {successMsg && (
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800">
                  {successMsg}
                </div>
              )}

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsGrantModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-purple-700 hover:bg-purple-800 shadow-md transition-all active:scale-95 disabled:opacity-50 flex items-center gap-1.5"
                >
                  <Gift className="w-4 h-4" />
                  {isSubmitting ? "กำลังบันทึก..." : "ยืนยันและมอบสิทธิ์ทันที"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Review & Slip Modal */}
      {isReviewModalOpen && selectedOrder && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl relative my-8 space-y-6">
            <button
              onClick={() => setIsReviewModalOpen(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 p-2 rounded-full hover:bg-slate-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div>
              <span className="text-[11px] font-bold text-teal-700 bg-teal-50 px-2.5 py-0.5 rounded-full">
                {selectedOrder.orderNumber}
              </span>
              <h3 className="text-xl font-black text-slate-900 mt-2">
                ตรวจสอบการชำระเงิน - {selectedOrder.orgName}
              </h3>
              <p className="text-xs text-slate-500">
                แพ็กเกจ {selectedOrder.planName} • ยอดที่ต้องชำระ: ฿
                {formatSatang(selectedOrder.netAmountSatang, true)}
              </p>
            </div>

            {/* Slip Preview Box */}
            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 space-y-3">
              <span className="text-xs font-bold text-slate-700 block">หลักฐานสลิปการโอนเงิน</span>

              {selectedOrder.evidence ? (
                <div className="space-y-3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={`/api/billing/evidence/${selectedOrder.evidence.id}`}
                    alt="Payment Slip Evidence"
                    className="max-h-72 w-auto mx-auto rounded-xl border border-slate-200 shadow-xs object-contain"
                  />
                  <div className="text-xs text-slate-500 flex justify-between items-center px-2">
                    <span>ชื่อไฟล์: {selectedOrder.evidence.fileName}</span>
                    <span>ขนาด: {(selectedOrder.evidence.fileSize / 1024).toFixed(1)} KB</span>
                  </div>
                  {selectedOrder.evidence.userNotes && (
                    <div className="bg-white p-2.5 rounded-xl border border-slate-200 text-xs text-slate-700">
                      <strong>หมายเหตุจากผู้โอน:</strong> {selectedOrder.evidence.userNotes}
                    </div>
                  )}
                </div>
              ) : (
                <div className="py-8 text-center text-slate-400 text-xs">
                  ยังไม่มีการแนบไฟล์หลักฐานสำหรับคำสั่งซื้อนี้
                </div>
              )}
            </div>

            {/* Rejection input */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-slate-600">
                เหตุผลการปฏิเสธ (กรณีสลิปไม่ถูกต้อง หรือยอดเงินไม่ตรง)
              </label>
              <input
                type="text"
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="ระบุเหตุผล เช่น ไม่พบยอดเงินโอนเข้า หรือ สลิปซ้ำ"
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
                disabled={isSubmitting}
                onClick={() => handleReviewAction("REJECT")}
                className="px-4 py-2.5 rounded-xl text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition-colors disabled:opacity-50"
              >
                ปฏิเสธคำสั่งซื้อ
              </button>
              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => handleReviewAction("APPROVE")}
                className="px-6 py-2.5 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-md transition-all active:scale-95 disabled:opacity-50 flex items-center gap-1.5"
              >
                <Check className="w-4 h-4" />
                {isSubmitting ? "กำลังบันทึก..." : "อนุมัติและเปิดสิทธิ์ทันที"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
