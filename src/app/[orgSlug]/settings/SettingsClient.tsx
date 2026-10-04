"use client";

import React, { useState } from "react";
import {
  Settings,
  ShieldCheck,
  Building2,
  HardDrive,
  Users,
  Bell,
  Key,
  Clock,
  Sparkles,
  AlertCircle,
  Layers,
} from "lucide-react";

interface AuditLogItem {
  id: string;
  action: string;
  userEmail: string;
  timestamp: string;
  details: string | null;
}

interface OrgInfo {
  id: string;
  name: string;
  slug: string;
  type: string;
  timezone: string;
  defaultLang: string;
  planTier: string;
  maxServicePoints: number;
  maxMonthlyResponses: number;
  maxUsers: number;
}

interface StatsInfo {
  usedServicePoints: number;
  usedUsers: number;
  totalResponses: number;
}

interface Props {
  org: OrgInfo;
  stats: StatsInfo;
  auditLogs: AuditLogItem[];
  canManage: boolean;
}

export default function SettingsClient({
  org,
  stats,
  auditLogs,
  canManage,
}: Props) {
  const spPct = Math.min(100, Math.round((stats.usedServicePoints / org.maxServicePoints) * 100));
  const userPct = Math.min(100, Math.round((stats.usedUsers / org.maxUsers) * 100));

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200/80 shadow-xs">
        <h1 className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight">
          ตั้งค่าองค์กรและสถานะแพ็กเกจ (Settings & Quotas)
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          จัดการข้อมูลทั่วไป โควตาการใช้งาน และบันทึกประวัติความปลอดภัย (Audit Log)
        </p>
      </div>

      {/* Plan & Quotas Card */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <span className="text-[10px] font-bold text-teal-700 uppercase bg-teal-50 px-2 py-0.5 rounded">
              Active Tier
            </span>
            <h3 className="text-base font-bold text-slate-800 mt-1">
              แพ็กเกจ: {org.planTier}
            </h3>
          </div>
          <span className="text-xs text-slate-500">
            คำตอบสะสมทั้งหมด: <strong className="text-slate-800">{stats.totalResponses.toLocaleString()}</strong>
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 pt-2">
          {/* Service Points Quota */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-700">จุดบริการที่เปิดใช้งาน</span>
              <span className="font-semibold text-slate-500">
                {stats.usedServicePoints} / {org.maxServicePoints} จุด
              </span>
            </div>
            <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
              <div
                className="bg-teal-700 h-2 rounded-full transition-all duration-300"
                style={{ width: `${spPct}%` }}
              />
            </div>
            <span className="text-[11px] text-slate-400 block">ใช้งานไป {spPct}%</span>
          </div>

          {/* Users Quota */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-700">สมาชิกในทีม</span>
              <span className="font-semibold text-slate-500">
                {stats.usedUsers} / {org.maxUsers} คน
              </span>
            </div>
            <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${userPct}%` }}
              />
            </div>
            <span className="text-[11px] text-slate-400 block">ใช้งานไป {userPct}%</span>
          </div>
        </div>
      </div>

      {/* Organization Info */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
        <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
          <Building2 className="w-4 h-4 text-teal-700" />
          <span>ข้อมูลองค์กรและการกำหนดค่าภาษา/เวลา</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100">
            <span className="text-slate-400 block mb-0.5">ชื่อองค์กร:</span>
            <span className="font-bold text-slate-800 text-sm">{org.name}</span>
          </div>

          <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100">
            <span className="text-slate-400 block mb-0.5">รหัส URL Slug:</span>
            <span className="font-mono font-bold text-slate-800 text-sm">{org.slug}</span>
          </div>

          <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100">
            <span className="text-slate-400 block mb-0.5">เขตเวลา (Timezone):</span>
            <span className="font-bold text-slate-800">{org.timezone} (UTC+07:00)</span>
          </div>

          <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100">
            <span className="text-slate-400 block mb-0.5">ภาษาตั้งต้น:</span>
            <span className="font-bold text-slate-800">ภาษาไทย (th-TH) พร้อมตัวเลือกปี พ.ศ.</span>
          </div>
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-teal-700" />
            <span>ประวัติการดำเนินงานความปลอดภัย (Audit Log ล่าสุด)</span>
          </h3>
          <span className="text-[11px] text-slate-400">ปลอดภัย • ไม่เปิดเผยรหัสผ่านหรือข้อมูลลับ</span>
        </div>

        <div className="overflow-x-auto text-xs">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-200 text-slate-400 font-semibold uppercase">
                <th className="py-2 px-2">วันและเวลา</th>
                <th className="py-2 px-2">ผู้กระทำ (Actor)</th>
                <th className="py-2 px-2">การกระทำ (Action)</th>
                <th className="py-2 px-2">รายละเอียด</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {auditLogs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50/50">
                  <td className="py-2.5 px-2 text-slate-500 font-mono text-[11px] whitespace-nowrap">
                    {log.timestamp}
                  </td>
                  <td className="py-2.5 px-2 font-bold text-slate-700 whitespace-nowrap">
                    {log.userEmail}
                  </td>
                  <td className="py-2.5 px-2">
                    <span className="font-mono font-bold text-[10px] bg-slate-100 text-teal-900 px-2 py-0.5 rounded">
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
    </div>
  );
}
