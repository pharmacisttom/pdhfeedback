"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Swal from "sweetalert2";
import {
  LifeBuoy,
  AlertTriangle,
  Clock,
  CheckCircle2,
  User,
  MessageSquare,
  Star,
  Send,
  X,
  ChevronRight,
  Filter,
  Layers,
} from "lucide-react";

interface NoteItem {
  id: string;
  note: string;
  authorName: string;
  createdAt: string;
}

interface CaseItem {
  id: string;
  caseNumber: string;
  category: string;
  urgency: string;
  status: string;
  rootCause: string | null;
  correctiveAction: string | null;
  dueDate: string | null;
  createdAt: string;
  resolvedAt: string | null;
  servicePointName: string;
  assignedUser: { id: string; name: string } | null;
  response: {
    rating: number | null;
    comment: string | null;
    contact: { name: string | null; phone: string | null } | null;
  };
  notes: NoteItem[];
}

interface TeamMember {
  id: string;
  name: string;
  role: string;
}

interface Props {
  orgSlug: string;
  cases: CaseItem[];
  teamMembers: TeamMember[];
  currentStatusFilter: string;
  canManage: boolean;
}

const STATUS_CONFIG: Record<string, { th: string; badge: string; color: string }> = {
  NEW: { th: "รอดำเนินการ (New)", badge: "bg-red-100 text-red-800 border-red-200", color: "text-red-600" },
  ACKNOWLEDGED: { th: "รับเรื่องแล้ว (Ack)", badge: "bg-amber-100 text-amber-800 border-amber-200", color: "text-amber-600" },
  IN_PROGRESS: { th: "กำลังดำเนินการ (In Progress)", badge: "bg-blue-100 text-blue-800 border-blue-200", color: "text-blue-600" },
  RESOLVED: { th: "แก้ไขแล้ว (Resolved)", badge: "bg-emerald-100 text-emerald-800 border-emerald-200", color: "text-emerald-600" },
  CLOSED: { th: "ปิดเคสเรียบร้อย (Closed)", badge: "bg-slate-100 text-slate-700 border-slate-200", color: "text-slate-600" },
};

const URGENCY_CONFIG: Record<string, { th: string; badge: string }> = {
  CRITICAL: { th: "วิกฤต (Critical)", badge: "bg-red-500 text-white" },
  HIGH: { th: "เร่งด่วน (High)", badge: "bg-amber-500 text-white" },
  MEDIUM: { th: "ปานกลาง (Medium)", badge: "bg-blue-500 text-white" },
  LOW: { th: "ทั่วไป (Low)", badge: "bg-slate-400 text-white" },
};

const CATEGORY_NAMES: Record<string, string> = {
  SPEED: "ความรวดเร็ว",
  COMMUNICATION: "การสื่อสาร/การพูดจา",
  CLEANLINESS: "ความสะอาด/สถานที่",
  QUALITY: "คุณภาพบริการ",
  SERVICE: "งานบริการทั่วไป",
  OTHER: "อื่นๆ",
};

export default function FeedbackClient({
  orgSlug,
  cases,
  teamMembers,
  currentStatusFilter,
  canManage,
}: Props) {
  const router = useRouter();
  const [selectedCase, setSelectedCase] = useState<CaseItem | null>(null);

  // Edit form states
  const [status, setStatus] = useState("NEW");
  const [category, setCategory] = useState("GENERAL");
  const [urgency, setUrgency] = useState("MEDIUM");
  const [assignedUserId, setAssignedUserId] = useState<string>("");
  const [rootCause, setRootCause] = useState("");
  const [correctiveAction, setCorrectiveAction] = useState("");
  const [newNote, setNewNote] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const handleOpenCase = (c: CaseItem) => {
    setSelectedCase(c);
    setStatus(c.status);
    setCategory(c.category);
    setUrgency(c.urgency);
    setAssignedUserId(c.assignedUser?.id || "");
    setRootCause(c.rootCause || "");
    setCorrectiveAction(c.correctiveAction || "");
    setNewNote("");
  };

  const handleStatusFilter = (st: string) => {
    const params = new URLSearchParams();
    if (st !== "ALL") params.set("status", st);
    router.push(`/${orgSlug}/feedback?${params.toString()}`);
  };

  const handleSaveCase = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCase) return;
    setIsSaving(true);

    try {
      const res = await fetch("/api/feedback", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          caseId: selectedCase.id,
          status,
          category,
          urgency,
          assignedUserId: assignedUserId || null,
          rootCause,
          correctiveAction,
          internalNote: newNote || null,
        }),
      });

      if (!res.ok) throw new Error("ไม่สามารถบันทึกได้");

      Swal.fire({
        icon: "success",
        title: "บันทึกผลการติดตามสำเร็จ",
        confirmButtonColor: "#0f766e",
      });

      setSelectedCase(null);
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

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight">
            งานติดตามข้อเสนอแนะและปรับปรุงบริการ (Feedback Workflow)
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            กระบวนการติดตามแก้ไขปัญหา: New → Acknowledged → In Progress → Resolved → Closed
          </p>
        </div>
      </div>

      {/* Status Filter Tabs */}
      <div className="flex flex-wrap items-center gap-1.5 bg-slate-100 p-1.5 rounded-2xl text-xs font-semibold">
        {[
          { id: "ALL", label: "ทั้งหมด" },
          { id: "NEW", label: "รอดำเนินการ (New)" },
          { id: "ACKNOWLEDGED", label: "รับเรื่องแล้ว (Ack)" },
          { id: "IN_PROGRESS", label: "กำลังแก้ไข (In Progress)" },
          { id: "RESOLVED", label: "แก้ไขแล้ว (Resolved)" },
          { id: "CLOSED", label: "ปิดเคส (Closed)" },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => handleStatusFilter(tab.id)}
            className={`px-3 py-1.5 rounded-xl transition-all ${
              currentStatusFilter === tab.id
                ? "bg-white text-teal-800 shadow-xs font-bold"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Cases Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {cases.map((c) => {
          const statusMeta = STATUS_CONFIG[c.status] || STATUS_CONFIG.NEW;
          const urgencyMeta = URGENCY_CONFIG[c.urgency] || URGENCY_CONFIG.MEDIUM;

          return (
            <div
              key={c.id}
              className="bg-white rounded-3xl border border-slate-200/80 p-5 shadow-xs hover:border-teal-400 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <span className="font-mono text-xs font-bold text-slate-500">
                    {c.caseNumber}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${urgencyMeta.badge}`}>
                      {urgencyMeta.th.split(" ")[0]}
                    </span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${statusMeta.badge}`}>
                      {statusMeta.th.split(" ")[0]}
                    </span>
                  </div>
                </div>

                <div className="text-xs text-slate-400 mb-2">
                  จุดบริการ: <span className="font-semibold text-slate-700">{c.servicePointName}</span> • {c.createdAt}
                </div>

                {/* Rating & User Comment */}
                <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-100 text-xs mb-3">
                  {typeof c.response.rating === "number" && (
                    <div className="flex items-center gap-1 text-amber-600 font-bold mb-1">
                      <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                      <span>{c.response.rating} ดาว</span>
                    </div>
                  )}
                  <p className="text-slate-700 italic">
                    “{c.response.comment || "ไม่มีข้อความเพิ่มเติม"}”
                  </p>
                </div>

                {/* Assignee & Category */}
                <div className="space-y-1 text-xs text-slate-500">
                  <div className="flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-slate-400" />
                    <span>ผู้รับผิดชอบ: {c.assignedUser?.name || "ยังไม่ได้มอบหมาย"}</span>
                  </div>
                  <div>
                    หมวดหมู่: <span className="font-semibold text-slate-700">{CATEGORY_NAMES[c.category] || c.category}</span>
                  </div>
                  {c.correctiveAction && (
                    <div className="pt-2 text-[11px] text-emerald-700">
                      <strong>ผลการแก้ไข:</strong> {c.correctiveAction}
                    </div>
                  )}
                </div>
              </div>

              {/* Action Button */}
              <div className="mt-4 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => handleOpenCase(c)}
                  className="w-full min-h-[40px] inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-teal-50 hover:bg-teal-100 text-teal-800 font-bold text-xs transition-all border border-teal-200"
                >
                  <span>เปิดเคสและบันทึกการแก้ไข</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {cases.length === 0 && (
        <div className="text-center py-16 bg-white rounded-3xl border border-slate-200 p-8">
          <LifeBuoy className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-800 mb-1">ไม่มีข้อเสนอแนะในสถานะนี้</h3>
          <p className="text-xs text-slate-500">
            เมื่อมีผู้รับบริการให้คะแนนต่ำ หรือส่งข้อร้องเรียน ระบบจะสร้างเคสเพื่อติดตามให้อัตโนมัติ
          </p>
        </div>
      )}

      {/* Case Resolution Drawer Modal */}
      {selectedCase && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-xl w-full p-6 border border-slate-200 max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div>
                <h3 className="text-base font-bold text-slate-800">
                  จัดการเคสข้อเสนอแนะ {selectedCase.caseNumber}
                </h3>
                <span className="text-xs text-slate-400">
                  {selectedCase.servicePointName} • {selectedCase.createdAt}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setSelectedCase(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCase} className="space-y-4 text-xs">
              {/* Voice of Respondent */}
              <div className="bg-amber-50/70 p-3.5 rounded-2xl border border-amber-200">
                <span className="font-bold text-amber-900 block mb-1">
                  ความคิดเห็นจากผู้รับบริการ ({selectedCase.response.rating} ดาว):
                </span>
                <p className="text-amber-950 italic">
                  “{selectedCase.response.comment || "ไม่มีข้อความเพิ่มเติม"}”
                </p>
                {selectedCase.response.contact && (
                  <div className="mt-2 pt-2 border-t border-amber-200/60 text-amber-900">
                    <strong>ผู้ขอรับการติดต่อกลับ:</strong> {selectedCase.response.contact.name || "ไม่ระบุชื่อ"} (โทร. {selectedCase.response.contact.phone})
                  </div>
                )}
              </div>

              {/* Status and Urgency Selectors */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    สถานะการดำเนินการ (Workflow)
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-semibold"
                  >
                    <option value="NEW">1. รอดำเนินการ (New)</option>
                    <option value="ACKNOWLEDGED">2. รับเรื่องแล้ว (Acknowledged)</option>
                    <option value="IN_PROGRESS">3. กำลังดำเนินการ (In Progress)</option>
                    <option value="RESOLVED">4. ดำเนินการแก้ไขแล้ว (Resolved)</option>
                    <option value="CLOSED">5. ปิดเคสเรียบร้อย (Closed)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    ความเร่งด่วน
                  </label>
                  <select
                    value={urgency}
                    onChange={(e) => setUrgency(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white"
                  >
                    <option value="LOW">ทั่วไป (Low)</option>
                    <option value="MEDIUM">ปานกลาง (Medium)</option>
                    <option value="HIGH">เร่งด่วน (High)</option>
                    <option value="CRITICAL">วิกฤต (Critical)</option>
                  </select>
                </div>
              </div>

              {/* Category and Assignee */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    หมวดหมู่ข้อร้องเรียน
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white"
                  >
                    <option value="SPEED">ความรวดเร็ว</option>
                    <option value="COMMUNICATION">การสื่อสาร/การพูดจา</option>
                    <option value="CLEANLINESS">ความสะอาด/สถานที่</option>
                    <option value="QUALITY">คุณภาพบริการ</option>
                    <option value="SERVICE">งานบริการทั่วไป</option>
                    <option value="OTHER">อื่นๆ</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    ผู้รับผิดชอบเคส (Assignee)
                  </label>
                  <select
                    value={assignedUserId}
                    onChange={(e) => setAssignedUserId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white"
                  >
                    <option value="">ยังไม่มอบหมาย</option>
                    {teamMembers.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name} ({m.role})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Root Cause & Corrective Action */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  สาเหตุของปัญหา (Root Cause)
                </label>
                <textarea
                  rows={2}
                  value={rootCause}
                  onChange={(e) => setRootCause(e.target.value)}
                  placeholder="ระบุสาเหตุที่แท้จริงหลังจากตรวจสอบ..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-200"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  แนวทางการแก้ไขและป้องกันการเกิดซ้ำ (Corrective Action)
                </label>
                <textarea
                  rows={2}
                  value={correctiveAction}
                  onChange={(e) => setCorrectiveAction(e.target.value)}
                  placeholder="ระบุมาตรการปรับปรุง เช่น ปรับเวรเจ้าหน้าที่, ซ่อมแซมระบบ..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 font-medium text-teal-900"
                />
              </div>

              {/* Internal Notes History & New Note */}
              <div className="pt-2 border-t border-slate-100">
                <span className="font-bold text-slate-700 block mb-2">
                  บันทึกภายในทีม (Internal Notes)
                </span>
                <div className="space-y-2 mb-3 max-h-36 overflow-y-auto">
                  {selectedCase.notes.map((n) => (
                    <div key={n.id} className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                      <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1">
                        <span className="font-bold text-slate-700">{n.authorName}</span>
                        <span>{n.createdAt}</span>
                      </div>
                      <p className="text-slate-600">{n.note}</p>
                    </div>
                  ))}
                  {selectedCase.notes.length === 0 && (
                    <div className="text-[11px] text-slate-400 italic">
                      ยังไม่มีบันทึกภายใน
                    </div>
                  )}
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    placeholder="พิมพ์บันทึกข้อความภายในเพิ่ม..."
                    className="flex-1 px-3 py-2 rounded-xl border border-slate-200"
                  />
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedCase(null)}
                  className="px-4 py-2 rounded-xl font-bold text-slate-600 hover:bg-slate-100"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2.5 rounded-xl bg-teal-700 hover:bg-teal-800 disabled:bg-slate-300 text-white font-bold shadow-md transition-all"
                >
                  {isSaving ? "กำลังบันทึก..." : "บันทึกผลการติดตาม"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
