"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Lock,
  Mail,
  ArrowRight,
  AlertCircle,
  Building2,
  ShieldCheck,
  CheckCircle2,
  Users,
  ChevronRight,
  Sparkles,
} from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "เข้าสู่ระบบไม่สำเร็จ");
      }

      router.push(data.redirectTo || "/");
      router.refresh();
    } catch (err: any) {
      setError(err.message || "เกิดข้อผิดพลาดในการเชื่อมต่อ");
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickLogin = (demoEmail: string, demoPass: string) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    setError(null);
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
          เข้าสู่ระบบการจัดการองค์กร
        </h2>
        <p className="mt-1 text-xs text-slate-500">
          หรือ{" "}
          <Link href="/register" className="font-semibold text-teal-700 hover:text-teal-800 underline">
            ลงทะเบียนสร้างองค์กรใหม่
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
                อีเมลผู้ใช้งาน
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full min-h-[46px] pl-9 pr-3 rounded-xl border border-slate-200 text-sm focus:border-teal-600 focus:ring-1 focus:ring-teal-600"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-bold text-slate-700">
                  รหัสผ่าน
                </label>
                <span className="text-[11px] text-slate-400">
                  ลืมรหัสผ่าน? ติดต่อ Admin
                </span>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full min-h-[46px] pl-9 pr-3 rounded-xl border border-slate-200 text-sm focus:border-teal-600 focus:ring-1 focus:ring-teal-600"
                />
              </div>
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
                  <span>เข้าสู่ระบบ</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Test Buttons */}
          <div className="mt-6 pt-6 border-t border-slate-100">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 mb-3">
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span>คลิกเพื่อทดสอบบัญชีสาธิต (Quick Demo Login)</span>
            </div>

            <div className="space-y-2">
              <button
                type="button"
                onClick={() => handleQuickLogin("owner.hospital@pdhfeedback.local", "Hospital@2026")}
                className="w-full text-left p-2.5 rounded-xl border border-slate-200 hover:border-teal-500 hover:bg-teal-50/50 transition-all flex items-center justify-between text-xs"
              >
                <div>
                  <span className="font-bold text-slate-800 block">
                    1. ผอ.โรงพยาบาล (Hospital Owner)
                  </span>
                  <span className="text-[10px] text-slate-400">
                    สิทธิ์เต็ม: ดู Dashboard, จัดการจุดบริการ, สมาชิก, Export
                  </span>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin("manager.pharm@pdhfeedback.local", "Pharm@2026")}
                className="w-full text-left p-2.5 rounded-xl border border-slate-200 hover:border-teal-500 hover:bg-teal-50/50 transition-all flex items-center justify-between text-xs"
              >
                <div>
                  <span className="font-bold text-slate-800 block">
                    2. หัวหน้าห้องยา (Service Manager)
                  </span>
                  <span className="text-[10px] text-slate-400">
                    จำกัดขอบเขต: เห็นเฉพาะจุดบริการห้องยา & ติดตามเคส
                  </span>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin("owner.coop@pdhfeedback.local", "Coop@2026")}
                className="w-full text-left p-2.5 rounded-xl border border-slate-200 hover:border-teal-500 hover:bg-teal-50/50 transition-all flex items-center justify-between text-xs"
              >
                <div>
                  <span className="font-bold text-slate-800 block">
                    3. ผู้จัดการสหกรณ์ (Coop Owner)
                  </span>
                  <span className="text-[10px] text-slate-400">
                    ทดสอบ Tenant Isolation: ไม่เห็นข้อมูลโรงพยาบาล
                  </span>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin("admin@pdhfeedback.local", "Pdh@Admin2026!")}
                className="w-full text-left p-2.5 rounded-xl border border-purple-200 bg-purple-50/40 hover:bg-purple-50 transition-all flex items-center justify-between text-xs"
              >
                <div>
                  <span className="font-bold text-purple-900 block">
                    4. ผู้ดูแลระบบแพลตฟอร์ม (Platform Super Admin)
                  </span>
                  <span className="text-[10px] text-purple-600">
                    จัดการทุกองค์กร, โควตาแพ็กเกจ และ System Audit
                  </span>
                </div>
                <ChevronRight className="w-4 h-4 text-purple-400" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
