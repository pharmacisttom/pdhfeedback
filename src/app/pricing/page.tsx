import { getBillingMode, isBillingDisabled, shouldShowPricingPage } from "@/lib/billing-config";
import PricingClient from "./PricingClient";
import Link from "next/link";
import { ShieldAlert, ArrowLeft } from "lucide-react";

export const metadata = {
  title: "แพ็กเกจและราคา - PdhFeedback Multi-tenant SaaS",
  description:
    "รายละเอียดแพ็กเกจ โควตา และสิทธิ์การใช้งานระบบประเมินความพึงพอใจ PdhFeedback สำหรับคลินิก โรงพยาบาล และหน่วยงานบริการ",
};

export default function PricingPage() {
  const showPage = shouldShowPricingPage();
  const billingMode = getBillingMode();
  const billingDisabled = isBillingDisabled();

  if (!showPage) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 font-sans">
        <div className="max-w-md w-full bg-white p-8 rounded-3xl border border-slate-200 shadow-xl text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 mx-auto flex items-center justify-center">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <h1 className="text-xl font-black text-slate-900">
            หน้ารายละเอียดแพ็กเกจปิดปรับปรุง
          </h1>
          <p className="text-xs text-slate-600 leading-relaxed">
            ระบบยังไม่เปิดแสดงหน้าราคาในขณะนี้ หากต้องการสอบถามข้อมูลหรือขอสิทธิ์ใช้งาน กรุณาติดต่อผู้ดูแลระบบที่{" "}
            <a href="mailto:support@pdhfeedback.local" className="text-teal-700 underline font-bold">
              support@pdhfeedback.local
            </a>
          </p>
          <div className="pt-2">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-teal-700 bg-teal-50 hover:bg-teal-100 border border-teal-200 px-4 py-2.5 rounded-xl transition-all"
            >
              <ArrowLeft className="w-4 h-4" /> กลับสู่หน้าหลัก
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <PricingClient
      billingMode={billingMode}
      isBillingDisabled={billingDisabled}
    />
  );
}
