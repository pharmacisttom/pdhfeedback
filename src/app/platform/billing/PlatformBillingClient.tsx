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
} from "lucide-react";
import { formatSatang } from "@/lib/billing";

interface Props {
  adminUser: {
    userId: string;
    fullName: string;
    email: string;
  };
  metrics: {
    totalCollectedSatang: number;
    totalPendingSatang: number;
    mrrSatang: number;
    arrSatang: number;
    pendingReviewCount: number;
    activeSubscriptionsCount: number;
  };
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
  metrics,
  orders,
  subscriptions,
  plans,
  bankSettings,
}: Props) {
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<"REVIEW" | "ORDERS" | "SUBSCRIPTIONS" | "PLANS">("REVIEW");
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const pendingOrders = orders.filter((o) => ["UNDER_REVIEW", "PENDING_PAYMENT"].includes(o.status));

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
            <span className="text-base font-bold tracking-tight block">
              PdhFeedback Platform Billing Console
            </span>
            <span className="text-[11px] text-teal-300 font-mono">
              การเงิน สมาชิก และการอนุมัติการชำระเงิน
            </span>
          </div>
        </div>

        <div className="text-right hidden sm:block text-xs">
          <span className="font-bold text-white block">{adminUser.fullName}</span>
          <span className="text-slate-400 font-mono text-[10px]">{adminUser.email}</span>
        </div>
      </header>

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
              จากคำสั่งซื้อที่อนุมัติแล้ว (APPROVED)
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
              Normalized Monthly Recurring Revenue
            </span>
          </div>

          {/* ARR */}
          <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-semibold">รายได้ประเมินต่อปี (ARR)</span>
              <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center">
                <Calendar className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-black text-indigo-900">
              ฿{formatSatang(metrics.arrSatang)}
            </div>
            <span className="text-[11px] text-slate-400 mt-1 block">
              คำนวณจาก MRR × 12 เดือน
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
                        <td className="py-3 px-3 font-bold text-slate-800">{o.orderNumber}</td>
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
                      <td className="py-3 px-3 font-bold text-slate-800">{o.orderNumber}</td>
                      <td className="py-3 px-3 font-semibold text-slate-700">{o.orgName}</td>
                      <td className="py-3 px-3 text-slate-500">
                        {new Intl.DateTimeFormat("th-TH", { dateStyle: "medium" }).format(new Date(o.createdAt))}
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
            <h2 className="text-base font-bold text-slate-800">
              สถานะสมาชิกปัจจุบันของแต่ละองค์กร (Subscriptions)
            </h2>

            <div className="overflow-x-auto text-xs">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-400 font-semibold uppercase">
                    <th className="py-2.5 px-3">องค์กร</th>
                    <th className="py-2.5 px-3">แพ็กเกจ</th>
                    <th className="py-2.5 px-3">รอบบริการ</th>
                    <th className="py-2.5 px-3">วันเริ่มต้นรอบ</th>
                    <th className="py-2.5 px-3">วันหมดอายุ / ต่ออายุ</th>
                    <th className="py-2.5 px-3 text-center">วันรีเซ็ตโควตา</th>
                    <th className="py-2.5 px-3">สถานะ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {subscriptions.map((s) => (
                    <tr key={s.id} className="hover:bg-slate-50/50">
                      <td className="py-3 px-3 font-bold text-slate-800">{s.orgName}</td>
                      <td className="py-3 px-3 font-semibold text-teal-800">{s.planName}</td>
                      <td className="py-3 px-3 text-slate-600">
                        {s.billingInterval === "ANNUAL" ? "รายปี" : "รายเดือน"}
                      </td>
                      <td className="py-3 px-3 text-slate-500">
                        {new Intl.DateTimeFormat("th-TH", { dateStyle: "medium" }).format(new Date(s.currentPeriodStart))}
                      </td>
                      <td className="py-3 px-3 text-slate-700 font-semibold">
                        {new Intl.DateTimeFormat("th-TH", { dateStyle: "medium" }).format(new Date(s.currentPeriodEnd))}
                      </td>
                      <td className="py-3 px-3 text-center text-slate-600">วันที่ {s.anchorDay}</td>
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
                  <div key={p.id} className="p-5 rounded-2xl border border-slate-200 bg-slate-50/50 space-y-3 text-xs">
                    <div className="flex justify-between items-center">
                      <span className="font-extrabold text-sm text-slate-800">{p.name} ({p.code})</span>
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
                      <div>คำตอบต่อเดือน: {p.monthlyResponseQuota >= 999999 ? "ไม่จำกัด" : p.monthlyResponseQuota}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </main>

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
                แพ็กเกจ {selectedOrder.planName} • ยอดที่ต้องชำระ: ฿{formatSatang(selectedOrder.netAmountSatang, true)}
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
