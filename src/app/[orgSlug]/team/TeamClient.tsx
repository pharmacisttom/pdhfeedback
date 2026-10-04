"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Swal from "sweetalert2";
import {
  Users,
  ShieldCheck,
  UserPlus,
  Mail,
  Check,
  X,
  Edit,
  MapPin,
  Lock,
  Layers,
} from "lucide-react";

interface MemberItem {
  id: string;
  userId: string;
  fullName: string;
  email: string;
  role: string;
  servicePointScope: string[] | null;
  canExport: boolean;
  canViewContacts: boolean;
  joinedAt: string;
}

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
  members: MemberItem[];
  servicePoints: ServicePointOption[];
  currentUserId: string;
  canManage: boolean;
  isOwner: boolean;
}

const ROLE_LABELS: Record<string, { th: string; badge: string; desc: string }> = {
  OWNER: { th: "Owner", badge: "bg-teal-100 text-teal-800", desc: "สิทธิ์เต็มทุกส่วน รวมถึงโควตาและสมาชิก" },
  ADMIN: { th: "Admin", badge: "bg-blue-100 text-blue-800", desc: "จัดการจุดบริการ แบบประเมิน และเคส" },
  SERVICE_MANAGER: { th: "Service Manager", badge: "bg-amber-100 text-amber-800", desc: "ดูข้อมูลและติดตามเคสเฉพาะจุดบริการที่กำหนด" },
  VIEWER: { th: "Viewer", badge: "bg-slate-100 text-slate-700", desc: "ดูแดชบอร์ดและรายงาน (อ่านอย่างเดียว)" },
};

export default function TeamClient({
  org,
  members,
  servicePoints,
  currentUserId,
  canManage,
  isOwner,
}: Props) {
  const router = useRouter();
  const [editingMember, setEditingMember] = useState<MemberItem | null>(null);

  // Edit form state
  const [role, setRole] = useState("VIEWER");
  const [selectedScopes, setSelectedScopes] = useState<string[]>([]);
  const [canExport, setCanExport] = useState(false);
  const [canViewContacts, setCanViewContacts] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const handleEditClick = (m: MemberItem) => {
    setEditingMember(m);
    setRole(m.role);
    setSelectedScopes(m.servicePointScope || []);
    setCanExport(m.canExport);
    setCanViewContacts(m.canViewContacts);
  };

  const handleSaveMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMember) return;
    setIsSaving(true);

    try {
      const res = await fetch("/api/team", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          membershipId: editingMember.id,
          role,
          servicePointScope: role === "SERVICE_MANAGER" ? selectedScopes : null,
          canExport: role === "OWNER" || role === "ADMIN" ? true : canExport,
          canViewContacts: role === "OWNER" || role === "ADMIN" ? true : canViewContacts,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "บันทึกข้อมูลไม่สำเร็จ");
      }

      Swal.fire({
        icon: "success",
        title: "อัปเดตสิทธิ์สมาชิกสำเร็จ",
        confirmButtonColor: "#0f766e",
      });

      setEditingMember(null);
      router.refresh();
    } catch (err: any) {
      Swal.fire({
        icon: "error",
        title: "เกิดข้อผิดพลาด",
        text: err.message,
        confirmButtonColor: "#0f766e",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const toggleScope = (spId: string) => {
    setSelectedScopes((prev) =>
      prev.includes(spId) ? prev.filter((id) => id !== spId) : [...prev, spId]
    );
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight">
            สมาชิกในทีมและสิทธิ์การใช้งาน (Team & RBAC)
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            กำหนดบทบาท ขอบเขตจุดบริการ และสิทธิ์การเข้าถึงข้อมูลอ่อนไหว
          </p>
        </div>
      </div>

      {/* Members List */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <span className="text-xs font-bold text-slate-700">
            สมาชิกทั้งหมด ({members.length} คน)
          </span>
        </div>

        <div className="divide-y divide-slate-100">
          {members.map((m) => {
            const roleMeta = ROLE_LABELS[m.role] || ROLE_LABELS.VIEWER;
            const isSelf = m.userId === currentUserId;

            return (
              <div
                key={m.id}
                className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/50 transition-colors"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="w-10 h-10 rounded-2xl bg-teal-700 text-white font-bold flex items-center justify-center text-sm shrink-0">
                    {m.fullName.charAt(0)}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-800 truncate">
                        {m.fullName}
                      </span>
                      {isSelf && (
                        <span className="text-[10px] font-bold bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded">
                          คุณ
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] text-slate-400 block truncate font-mono">
                      {m.email}
                    </span>

                    {/* Scoping details */}
                    {m.role === "SERVICE_MANAGER" && m.servicePointScope && (
                      <div className="mt-1 flex flex-wrap gap-1">
                        {m.servicePointScope.map((spId) => {
                          const sp = servicePoints.find((s) => s.id === spId);
                          return (
                            <span
                              key={spId}
                              className="text-[10px] bg-amber-50 text-amber-800 border border-amber-200 px-1.5 py-0.5 rounded-md flex items-center gap-0.5"
                            >
                              <MapPin className="w-2.5 h-2.5" />
                              {sp?.name || spId}
                            </span>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
                  <div className="text-right">
                    <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${roleMeta.badge}`}>
                      {roleMeta.th}
                    </span>
                    <div className="text-[10px] text-slate-400 mt-1">
                      {m.canExport ? "Export ได้" : "ห้าม Export"} •{" "}
                      {m.canViewContacts ? "ดูข้อมูลติดต่อได้" : "ซ่อนข้อมูลติดต่อ"}
                    </div>
                  </div>

                  {canManage && (
                    <button
                      type="button"
                      onClick={() => handleEditClick(m)}
                      className="p-2 rounded-xl text-slate-400 hover:text-teal-700 hover:bg-teal-50 transition-all"
                      title="แก้ไขสิทธิ์"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Permission Matrix Guide Card */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
        <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-teal-700" />
          <span>ตารางสิทธิ์ตามบทบาท (Permission Matrix)</span>
        </h3>

        <div className="overflow-x-auto text-xs">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-200 text-slate-400 font-semibold uppercase">
                <th className="py-2">บทบาท</th>
                <th className="py-2 text-center">ดู Dashboard</th>
                <th className="py-2 text-center">จัดการจุดบริการ</th>
                <th className="py-2 text-center">จัดการแบบประเมิน</th>
                <th className="py-2 text-center">แก้ Feedback</th>
                <th className="py-2 text-center">Export ข้อมูล</th>
                <th className="py-2 text-center">ดูข้อมูลติดต่อ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-600">
              <tr>
                <td className="py-2.5 font-bold text-teal-800">Owner</td>
                <td className="py-2.5 text-center text-emerald-600">✓</td>
                <td className="py-2.5 text-center text-emerald-600">✓</td>
                <td className="py-2.5 text-center text-emerald-600">✓</td>
                <td className="py-2.5 text-center text-emerald-600">✓</td>
                <td className="py-2.5 text-center text-emerald-600">✓</td>
                <td className="py-2.5 text-center text-emerald-600">✓</td>
              </tr>
              <tr>
                <td className="py-2.5 font-bold text-blue-800">Admin</td>
                <td className="py-2.5 text-center text-emerald-600">✓</td>
                <td className="py-2.5 text-center text-emerald-600">✓</td>
                <td className="py-2.5 text-center text-emerald-600">✓</td>
                <td className="py-2.5 text-center text-emerald-600">✓</td>
                <td className="py-2.5 text-center text-emerald-600">✓</td>
                <td className="py-2.5 text-center text-emerald-600">✓</td>
              </tr>
              <tr>
                <td className="py-2.5 font-bold text-amber-800">Service Manager</td>
                <td className="py-2.5 text-center text-amber-600">เฉพาะจุดที่กำหนด</td>
                <td className="py-2.5 text-center text-slate-300">-</td>
                <td className="py-2.5 text-center text-slate-300">-</td>
                <td className="py-2.5 text-center text-emerald-600">เฉพาะจุดที่กำหนด</td>
                <td className="py-2.5 text-center text-slate-300">-</td>
                <td className="py-2.5 text-center text-slate-300">-</td>
              </tr>
              <tr>
                <td className="py-2.5 font-bold text-slate-700">Viewer</td>
                <td className="py-2.5 text-center text-emerald-600">✓</td>
                <td className="py-2.5 text-center text-slate-300">-</td>
                <td className="py-2.5 text-center text-slate-300">-</td>
                <td className="py-2.5 text-center text-slate-300">-</td>
                <td className="py-2.5 text-center text-slate-500">ตามที่ให้สิทธิ์</td>
                <td className="py-2.5 text-center text-slate-500">ตามที่ให้สิทธิ์</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Member Modal */}
      {editingMember && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6 border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <h3 className="text-base font-bold text-slate-800 mb-1">
              แก้ไขสิทธิ์: {editingMember.fullName}
            </h3>
            <p className="text-xs text-slate-500 mb-4">{editingMember.email}</p>

            <form onSubmit={handleSaveMember} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  บทบาท (Role)
                </label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-semibold"
                >
                  <option value="OWNER">Owner (เจ้าขององค์กร)</option>
                  <option value="ADMIN">Admin (ผู้ดูแลระบบ)</option>
                  <option value="SERVICE_MANAGER">Service Manager (ผู้จัดการจุดบริการ)</option>
                  <option value="VIEWER">Viewer (ผู้ดูรายงาน)</option>
                </select>
              </div>

              {/* Service Point Scope Selection (if Service Manager) */}
              {role === "SERVICE_MANAGER" && (
                <div className="p-3.5 rounded-2xl bg-amber-50/70 border border-amber-200 space-y-2">
                  <span className="font-bold text-amber-900 block">
                    เลือกจุดบริการที่มอบหมายให้ดูแล:
                  </span>
                  <div className="space-y-1.5 max-h-36 overflow-y-auto">
                    {servicePoints.map((sp) => (
                      <label
                        key={sp.id}
                        className="flex items-center gap-2 text-slate-700 cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={selectedScopes.includes(sp.id)}
                          onChange={() => toggleScope(sp.id)}
                          className="rounded text-teal-700 focus:ring-teal-600"
                        />
                        <span>{sp.name} ({sp.code})</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {/* Explicit Permission Overrides for Viewer */}
              {role === "VIEWER" && (
                <div className="space-y-2 pt-2 border-t border-slate-100">
                  <span className="font-bold text-slate-700 block">สิทธิ์เพิ่มเติมพิเศษ:</span>
                  <label className="flex items-center gap-2 text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={canExport}
                      onChange={(e) => setCanExport(e.target.checked)}
                      className="rounded text-teal-700 focus:ring-teal-600"
                    />
                    <span>อนุญาตให้ส่งออกข้อมูล (Export CSV)</span>
                  </label>

                  <label className="flex items-center gap-2 text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={canViewContacts}
                      onChange={(e) => setCanViewContacts(e.target.checked)}
                      className="rounded text-teal-700 focus:ring-teal-600"
                    />
                    <span>อนุญาตให้อ่านข้อมูลติดต่อผู้ตอบแบบประเมิน</span>
                  </label>
                </div>
              )}

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingMember(null)}
                  className="px-4 py-2 rounded-xl font-bold text-slate-600 hover:bg-slate-100"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2.5 rounded-xl bg-teal-700 hover:bg-teal-800 disabled:bg-slate-300 text-white font-bold shadow-md transition-all"
                >
                  {isSaving ? "กำลังบันทึก..." : "บันทึกสิทธิ์"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
