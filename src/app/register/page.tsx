"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Building2,
  Lock,
  Mail,
  User,
  ArrowRight,
  AlertCircle,
  Sparkles,
  CheckCircle2,
} from "lucide-react";

export default function RegisterPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [organizationName, setOrganizationName] = useState("");
  const [organizationType, setOrganizationType] = useState("HOSPITAL");
  const [organizationSlug, setOrganizationSlug] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Auto-generate slug suggestion from name
  const handleOrgNameChange = (val: string) => {
    setOrganizationName(val);
    if (!organizationSlug || organizationSlug.startsWith("org-")) {
      const generated = val
        .toLowerCase()
        .replace(/[^a-z0-9]/g, "-")
        .replace(/-+/g, "-")
        .replace(/^-|-$/g, "");
      if (generated) setOrganizationSlug(generated);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName,
          email,
          password,
          organizationName,
          organizationType,
          organizationSlug,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "ลงทะเบียนไม่สำเร็จ");
      }

      router.push(data.redirectTo || `/${organizationSlug}/onboarding`);
      router.refresh();
    } catch (err: any) {
      setError(err.message || "เกิดข้อผิดพลาดในการลงทะเบียน");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <Link href="/" className="inline-flex items-center gap-2 mb-4">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-teal-700 to-emerald-500 flex items-center justify-center text-white font-black text-2xl shadow-md">
            P
          </div>
          <span className="text-2xl font-black tracking-tight text-slate-800">
            Pdh<span className="text-teal-700">Feedback</span>
          </span>
        </Link>
        <h2 className="text-2xl font-bold tracking-tight text-slate-900">
          เริ่มต้นสร้างองค์กรและใช้งานฟรี
        </h2>
        <p className="mt-1 text-xs text-slate-500">
          มีบัญชีอยู่แล้ว?{" "}
          <Link href="/login" className="font-semibold text-teal-700 hover:text-teal-800 underline">
            เข้าสู่ระบบที่นี่
          </Link>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 shadow-xl rounded-3xl border border-slate-200/80 sm:px-10">
          {error && (
            <div className="mb-5 p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                ชื่อ-นามสกุล ของคุณ
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="เช่น นพ.สมศักดิ์ รักดี"
                  className="w-full min-h-[46px] pl-9 pr-3 rounded-xl border border-slate-200 text-sm focus:border-teal-600 focus:ring-1 focus:ring-teal-600"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                อีเมลสำหรับเข้าสู่ระบบ (Owner Account)
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@myorganization.com"
                  className="w-full min-h-[46px] pl-9 pr-3 rounded-xl border border-slate-200 text-sm focus:border-teal-600 focus:ring-1 focus:ring-teal-600"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                รหัสผ่าน (อย่างน้อย 6 ตัวอักษร)
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
                <input
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full min-h-[46px] pl-9 pr-3 rounded-xl border border-slate-200 text-sm focus:border-teal-600 focus:ring-1 focus:ring-teal-600"
                />
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100">
              <label className="block text-xs font-bold text-slate-700 mb-1">
                ชื่อองค์กร / โรงพยาบาล / กิจการ
              </label>
              <div className="relative">
                <Building2 className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
                <input
                  type="text"
                  required
                  value={organizationName}
                  onChange={(e) => handleOrgNameChange(e.target.value)}
                  placeholder="เช่น โรงพยาบาลปทุมธานี เฮลท์แคร์"
                  className="w-full min-h-[46px] pl-9 pr-3 rounded-xl border border-slate-200 text-sm focus:border-teal-600 focus:ring-1 focus:ring-teal-600"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  ประเภทกิจการ
                </label>
                <select
                  value={organizationType}
                  onChange={(e) => setOrganizationType(e.target.value)}
                  className="w-full min-h-[46px] px-3 rounded-xl border border-slate-200 text-sm bg-white focus:border-teal-600 focus:ring-1 focus:ring-teal-600"
                >
                  <option value="HOSPITAL">โรงพยาบาล</option>
                  <option value="CLINIC">คลินิก</option>
                  <option value="COOPERATIVE">สหกรณ์/การเงิน</option>
                  <option value="RETAIL">ร้านค้า/จุดบริการ</option>
                  <option value="SERVICE">งานบริการทั่วไป</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  URL Slug ประจำองค์กร
                </label>
                <input
                  type="text"
                  required
                  value={organizationSlug}
                  onChange={(e) => setOrganizationSlug(e.target.value.toLowerCase())}
                  placeholder="pdh-hospital"
                  className="w-full min-h-[46px] px-3 rounded-xl border border-slate-200 text-sm font-mono focus:border-teal-600 focus:ring-1 focus:ring-teal-600"
                />
              </div>
            </div>

            <div className="text-[11px] text-slate-400">
              เมื่อลงทะเบียน ถือว่าคุณยอมรับ{" "}
              <Link href="/terms" target="_blank" className="underline hover:text-slate-600">
                ข้อกำหนดการให้บริการ
              </Link>{" "}
              และ{" "}
              <Link href="/privacy" target="_blank" className="underline hover:text-slate-600">
                นโยบายความเป็นส่วนตัว
              </Link>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full min-h-[48px] inline-flex items-center justify-center gap-2 rounded-xl bg-teal-700 hover:bg-teal-800 disabled:bg-slate-300 text-white font-bold text-sm shadow-md transition-all active:scale-98"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <span>สร้างองค์กรและเริ่มต้น</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
