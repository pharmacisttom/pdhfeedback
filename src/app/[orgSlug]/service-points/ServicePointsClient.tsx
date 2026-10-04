"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Swal from "sweetalert2";
import {
  MapPin,
  Plus,
  QrCode,
  ExternalLink,
  Copy,
  Archive,
  Search,
  Building,
  Check,
  Printer,
  ChevronRight,
  Layers,
} from "lucide-react";

interface Branch {
  id: string;
  code: string;
  name: string;
}

interface ServicePointItem {
  id: string;
  code: string;
  name: string;
  description: string | null;
  displayOrder: number;
  publicCode: string;
  branchId: string | null;
  branchName: string | null;
  responseCount: number;
}

interface OrgInfo {
  id: string;
  name: string;
  slug: string;
}

interface Props {
  org: OrgInfo;
  branches: Branch[];
  servicePoints: ServicePointItem[];
  canManage: boolean;
}

export default function ServicePointsClient({
  org,
  branches,
  servicePoints,
  canManage,
}: Props) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [selectedBranch, setSelectedBranch] = useState<string>("ALL");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // New Service Point Form
  const [newCode, setNewCode] = useState("");
  const [newName, setNewName] = useState("");
  const [newBranchId, setNewBranchId] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const filteredPoints = servicePoints.filter((sp) => {
    const matchesSearch =
      sp.name.toLowerCase().includes(search.toLowerCase()) ||
      sp.code.toLowerCase().includes(search.toLowerCase());
    const matchesBranch =
      selectedBranch === "ALL" || sp.branchId === selectedBranch;
    return matchesSearch && matchesBranch;
  });

  const handleCopyLink = (publicCode: string) => {
    const url = `${window.location.origin}/s/${publicCode}`;
    navigator.clipboard.writeText(url);
    setCopiedCode(publicCode);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const handleCreateServicePoint = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const res = await fetch("/api/service-points", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          organizationId: org.id,
          branchId: newBranchId || null,
          code: newCode,
          name: newName,
          description: newDesc || null,
          displayOrder: servicePoints.length + 1,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "สร้างจุดบริการไม่สำเร็จ");
      }

      Swal.fire({
        icon: "success",
        title: "สร้างจุดบริการสำเร็จ!",
        text: `สร้าง ${newName} และผูกกับ QR Code พร้อมใช้งานแล้ว`,
        confirmButtonColor: "#0f766e",
      });

      setIsAddModalOpen(false);
      setNewCode("");
      setNewName("");
      setNewDesc("");
      setNewBranchId("");
      router.refresh();
    } catch (err: any) {
      Swal.fire({
        icon: "error",
        title: "เกิดข้อผิดพลาด",
        text: err.message || "ไม่สามารถสร้างจุดบริการได้",
        confirmButtonColor: "#0f766e",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleArchive = async (id: string, name: string) => {
    const result = await Swal.fire({
      title: `ยืนยันปิดการใช้งาน ${name}?`,
      text: "จุดบริการนี้จะถูกซ่อนจากรายการ แต่ข้อมูลคำตอบเดิมจะยังคงอยู่และไม่สูญหาย",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#dc2626",
      cancelButtonColor: "#64748b",
      confirmButtonText: "ปิดการใช้งาน (Archive)",
      cancelButtonText: "ยกเลิก",
    });

    if (result.isConfirmed) {
      const res = await fetch(`/api/service-points?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        Swal.fire({
          icon: "success",
          title: "ปิดการใช้งานเรียบร้อย",
          confirmButtonColor: "#0f766e",
        });
        router.refresh();
      }
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight">
            การจัดการจุดบริการและป้าย QR Code
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            สร้างจุดบริการ พิมพ์ป้ายตั้งโต๊ะ และติดตามจำนวนคำตอบประจำแต่ละจุด
          </p>
        </div>

        {canManage && (
          <button
            type="button"
            onClick={() => setIsAddModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs shadow-md transition-all active:scale-95 shrink-0 self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            เพิ่มจุดบริการใหม่
          </button>
        )}
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="ค้นหาชื่อจุดบริการ หรือรหัส..."
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 text-xs bg-white focus:border-teal-600 focus:ring-1 focus:ring-teal-600"
          />
        </div>

        {branches.length > 0 && (
          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-400 font-semibold">สาขา/อาคาร:</span>
            <select
              value={selectedBranch}
              onChange={(e) => setSelectedBranch(e.target.value)}
              className="px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs text-slate-700 font-medium"
            >
              <option value="ALL">ทั้งหมด ({servicePoints.length})</option>
              {branches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Service Points Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredPoints.map((sp) => {
          const isCopied = copiedCode === sp.publicCode;

          return (
            <div
              key={sp.id}
              className="bg-white rounded-3xl border border-slate-200/80 p-5 shadow-xs hover:border-teal-400 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="w-10 h-10 rounded-2xl bg-teal-50 text-teal-700 flex items-center justify-center font-bold text-sm shrink-0">
                    <MapPin className="w-5 h-5" />
                  </div>
                  <span className="text-[11px] font-mono bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md font-bold">
                    {sp.code}
                  </span>
                </div>

                <h3 className="text-sm font-bold text-slate-800 leading-snug">
                  {sp.name}
                </h3>
                {sp.branchName && (
                  <span className="text-[11px] text-teal-700 font-medium block mt-0.5">
                    {sp.branchName}
                  </span>
                )}
                {sp.description && (
                  <p className="text-xs text-slate-500 mt-2 line-clamp-2 leading-relaxed">
                    {sp.description}
                  </p>
                )}

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="text-slate-400">คำตอบที่บันทึกแล้ว:</span>
                  <span className="font-bold text-teal-800 bg-teal-50 px-2.5 py-0.5 rounded-full">
                    {sp.responseCount} คำตอบ
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-5 pt-3 border-t border-slate-100 space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <Link
                    href={`/s/${sp.publicCode}/qr`}
                    target="_blank"
                    className="inline-flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl bg-teal-50 hover:bg-teal-100 text-teal-800 font-bold text-xs transition-all border border-teal-200"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    ป้ายพิมพ์ QR
                  </Link>

                  <Link
                    href={`/s/${sp.publicCode}`}
                    target="_blank"
                    className="inline-flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-all"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    เปิดหน้าตอบ
                  </Link>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <button
                    type="button"
                    onClick={() => handleCopyLink(sp.publicCode)}
                    className="text-xs text-slate-500 hover:text-slate-800 inline-flex items-center gap-1"
                  >
                    {isCopied ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span className="text-emerald-600 font-medium">คัดลอกแล้ว!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>คัดลอกลิงก์</span>
                      </>
                    )}
                  </button>

                  {canManage && (
                    <button
                      type="button"
                      onClick={() => handleArchive(sp.id, sp.name)}
                      className="text-[11px] text-slate-400 hover:text-red-500"
                    >
                      ปิดใช้งาน (Archive)
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {filteredPoints.length === 0 && (
        <div className="text-center py-12 bg-white rounded-3xl border border-slate-200/80 p-8">
          <MapPin className="w-10 h-10 text-slate-300 mx-auto mb-2" />
          <p className="text-sm font-bold text-slate-700">ไม่พบจุดบริการที่ค้นหา</p>
          <p className="text-xs text-slate-400 mt-1">ลองเปลี่ยนคำค้นหา หรือกดปุ่มเพิ่มจุดบริการใหม่</p>
        </div>
      )}

      {/* Modal: Add New Service Point */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6 border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <h3 className="text-base font-bold text-slate-800 mb-1">
              เพิ่มจุดบริการใหม่ (New Service Point)
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              ระบบจะสร้างรหัสสาธารณะและ QR Code แบบถาวรให้ทันที
            </p>

            <form onSubmit={handleCreateServicePoint} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  รหัสจุดบริการ (Code) <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={newCode}
                  onChange={(e) => setNewCode(e.target.value.toUpperCase())}
                  placeholder="เช่น OPD-EYE, COUNTER-02"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-mono uppercase focus:border-teal-600 focus:ring-1 focus:ring-teal-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  ชื่อจุดบริการ <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="เช่น ห้องตรวจจักษุและสายตา"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:border-teal-600 focus:ring-1 focus:ring-teal-600"
                />
              </div>

              {branches.length > 0 && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    สาขา / อาคาร
                  </label>
                  <select
                    value={newBranchId}
                    onChange={(e) => setNewBranchId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white"
                  >
                    <option value="">ไม่ระบุสาขา</option>
                    {branches.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name} ({b.code})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  คำอธิบายเพิ่มเติม
                </label>
                <textarea
                  rows={2}
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  placeholder="รายละเอียดตำแหน่งที่ตั้ง หรือหน้าที่ของจุดบริการ"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:border-teal-600 focus:ring-1 focus:ring-teal-600"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 rounded-xl bg-teal-700 hover:bg-teal-800 disabled:bg-slate-300 text-white font-bold text-xs shadow-sm transition-all"
                >
                  {isSubmitting ? "กำลังบันทึก..." : "บันทึกจุดบริการ"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
