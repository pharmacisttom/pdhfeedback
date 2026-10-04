"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Building2,
  Users,
  MessageSquare,
  ShieldCheck,
  Server,
  ArrowRight,
  ExternalLink,
  Search,
  Activity,
  LogOut,
  Layers,
  CreditCard,
} from "lucide-react";

interface OrgItem {
  id: string;
  name: string;
  slug: string;
  type: string;
  status: string;
  planTier: string;
  maxServicePoints: number;
  maxMonthlyResponses: number;
  servicePointCount: number;
  memberCount: number;
  responseCount: number;
  createdAt: string;
}

interface AuditLogItem {
  id: string;
  action: string;
  userEmail: string;
  orgName: string;
  timestamp: string;
  details: string | null;
}

interface AdminUser {
  userId: string;
  fullName: string;
  email: string;
}

interface Props {
  totalOrgs: number;
  totalUsers: number;
  totalResponses: number;
  organizations: OrgItem[];
  auditLogs: AuditLogItem[];
  adminUser: AdminUser;
}

export default function PlatformClient({
  totalOrgs,
  totalUsers,
  totalResponses,
  organizations,
  auditLogs,
  adminUser,
}: Props) {
  const router = useRouter();
  const [search, setSearch] = useState("");

  const filteredOrgs = organizations.filter(
    (o) =>
      o.name.toLowerCase().includes(search.toLowerCase()) ||
      o.slug.toLowerCase().includes(search.toLowerCase())
  );

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col">
      {/* Top Navbar */}
      <header className="bg-slate-900 text-white border-b border-slate-800 px-6 py-4 flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-purple-600 flex items-center justify-center font-extrabold text-white text-xl shadow-lg">
            👑
          </div>
          <div>
            <span className="text-base font-bold tracking-tight block">
              PdhFeedback Platform Console
            </span>
            <span className="text-[11px] text-purple-300 font-mono">
              Super Admin Oversight • All Tenants
            </span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <Link
            href="/platform/billing"
            className="px-3.5 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm"
          >
            <CreditCard className="w-4 h-4" />
            <span>ระบบการเงิน & สมาชิก</span>
          </Link>
          <div className="text-right hidden sm:block text-xs">
            <span className="font-bold text-white block">{adminUser.fullName}</span>
            <span className="text-slate-400 font-mono text-[10px]">{adminUser.email}</span>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className="p-2 rounded-xl text-slate-400 hover:text-red-400 hover:bg-slate-800 transition-all"
            title="ออกจากระบบ"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        {/* KPI Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-semibold">องค์กรทั้งหมด (Tenants)</span>
              <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center">
                <Building2 className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-black text-slate-800">
              {totalOrgs}{" "}
              <span className="text-xs font-normal text-slate-400">องค์กร</span>
            </div>
            <span className="text-[11px] text-emerald-600 font-semibold mt-1 block">
              สถานะ: เปิดใช้งานทุกองค์กร
            </span>
          </div>

          <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-semibold">ผู้ใช้งานในระบบ (Accounts)</span>
              <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center">
                <Users className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-black text-slate-800">
              {totalUsers}{" "}
              <span className="text-xs font-normal text-slate-400">บัญชี</span>
            </div>
            <span className="text-[11px] text-slate-400 mt-1 block">
              รวมทุกบทบาทและเจ้าของ
            </span>
          </div>

          <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-semibold">คำตอบประเมินรวมทั้งระบบ</span>
              <div className="w-8 h-8 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center">
                <MessageSquare className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-black text-teal-700">
              {totalResponses.toLocaleString()}
            </div>
            <span className="text-[11px] text-slate-400 mt-1 block">
              บันทึกแบบแยก Tenant Isolation
            </span>
          </div>

          <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-semibold">ความสมบูรณ์ของระบบ (Health)</span>
              <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
                <Activity className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-black text-emerald-600">
              100%
            </div>
            <span className="text-[11px] text-emerald-600 font-semibold mt-1 block">
              MySQL 8 & API ปกติ
            </span>
          </div>
        </div>

        {/* Organizations Table */}
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-slate-800">
                รายชื่อองค์กรในแพลตฟอร์ม (Multi-tenant Organizations)
              </h2>
              <p className="text-xs text-slate-400">
                ตรวจสอบสถานะ แพ็กเกจ และกระโดดเข้าดูแดชบอร์ดเฉพาะองค์กร
              </p>
            </div>

            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="ค้นหาชื่อหรือ Slug..."
                className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-slate-200 text-xs"
              />
            </div>
          </div>

          <div className="overflow-x-auto text-xs">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-200 text-slate-400 font-semibold uppercase">
                  <th className="py-2.5 px-3">ชื่อองค์กร</th>
                  <th className="py-2.5 px-3">ประเภท</th>
                  <th className="py-2.5 px-3">แพ็กเกจ</th>
                  <th className="py-2.5 px-3 text-center">จุดบริการ</th>
                  <th className="py-2.5 px-3 text-center">สมาชิก</th>
                  <th className="py-2.5 px-3 text-right">คำตอบสะสม</th>
                  <th className="py-2.5 px-3 text-right">การจัดการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredOrgs.map((o) => (
                  <tr key={o.id} className="hover:bg-slate-50/50">
                    <td className="py-3 px-3">
                      <span className="font-bold text-slate-800 block text-xs">{o.name}</span>
                      <span className="text-[10px] text-teal-700 font-mono font-medium">
                        /{o.slug}
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      <span className="text-[10px] font-bold bg-slate-100 text-slate-700 px-2 py-0.5 rounded">
                        {o.type}
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      <span className="font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-md border border-purple-200 text-[10px]">
                        {o.planTier}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-center text-slate-600 font-semibold">
                      {o.servicePointCount} / {o.maxServicePoints}
                    </td>
                    <td className="py-3 px-3 text-center text-slate-600">
                      {o.memberCount} คน
                    </td>
                    <td className="py-3 px-3 text-right font-bold text-teal-800">
                      {o.responseCount.toLocaleString()}
                    </td>
                    <td className="py-3 px-3 text-right">
                      <Link
                        href={`/${o.slug}/dashboard`}
                        target="_blank"
                        className="inline-flex items-center gap-1 text-[11px] font-bold text-purple-700 bg-purple-50 hover:bg-purple-100 border border-purple-200 px-2.5 py-1 rounded-lg transition-all"
                      >
                        เข้าสู่คอนโซล <ExternalLink className="w-3 h-3" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Global Security Audit Log */}
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-purple-600" />
              <span>บันทึกความปลอดภัยรวมทั้งระบบ (Platform Security Audit Logs)</span>
            </h3>
            <span className="text-[11px] text-slate-400">ไม่มีข้อมูลคำตอบส่วนบุคคล</span>
          </div>

          <div className="overflow-x-auto text-xs">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-200 text-slate-400 font-semibold uppercase">
                  <th className="py-2 px-2">เวลา</th>
                  <th className="py-2 px-2">องค์กร</th>
                  <th className="py-2 px-2">ผู้กระทำ</th>
                  <th className="py-2 px-2">การกระทำ</th>
                  <th className="py-2 px-2">รายละเอียด</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {auditLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/50">
                    <td className="py-2.5 px-2 text-slate-500 font-mono text-[11px] whitespace-nowrap">
                      {log.timestamp}
                    </td>
                    <td className="py-2.5 px-2 font-semibold text-slate-800 whitespace-nowrap">
                      {log.orgName}
                    </td>
                    <td className="py-2.5 px-2 text-slate-700 whitespace-nowrap">
                      {log.userEmail}
                    </td>
                    <td className="py-2.5 px-2">
                      <span className="font-mono font-bold text-[10px] bg-slate-100 text-purple-900 px-2 py-0.5 rounded">
                        {log.action}
                      </span>
                    </td>
                    <td className="py-2.5 px-2 text-slate-600 max-w-xs truncate font-mono text-[11px]">
                      {log.details || "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
