import Link from "next/link";
import {
  BarChart3,
  QrCode,
  ShieldCheck,
  CheckCircle2,
  Building2,
  Users,
  Smartphone,
  TrendingUp,
  HeartPulse,
  Store,
  GraduationCap,
  Sparkles,
  ArrowRight,
  ChevronRight,
  Sliders,
} from "lucide-react";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Top Navbar */}
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-teal-700 to-emerald-500 flex items-center justify-center text-white font-extrabold text-xl shadow-md">
              T
            </div>
            <div>
              <span className="text-lg font-black tracking-tight text-slate-800">
                Tomvis<span className="text-teal-700">Feedback</span>
              </span>
              <span className="hidden sm:inline-block ml-2 text-[10px] bg-teal-100 text-teal-800 font-bold px-2 py-0.5 rounded-full">
                SaaS Multi-tenant
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/pricing"
              className="text-xs sm:text-sm font-semibold text-slate-700 hover:text-teal-700 px-3 py-2 transition-colors"
            >
              แพ็กเกจและราคา
            </Link>
            <Link
              href="/s/pdh-reg-opd"
              target="_blank"
              className="hidden md:inline-flex items-center gap-1.5 text-xs font-semibold text-teal-700 bg-teal-50 hover:bg-teal-100 border border-teal-200 px-3.5 py-2 rounded-xl transition-all"
            >
              <Smartphone className="w-3.5 h-3.5" />
              ทดลองตอบบนมือถือ
            </Link>
            <Link
              href="/login"
              className="text-xs sm:text-sm font-semibold text-slate-700 hover:text-slate-900 px-3 py-2"
            >
              เข้าสู่ระบบ
            </Link>
            <Link
              href="/register"
              className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-white bg-teal-700 hover:bg-teal-800 px-4 py-2 rounded-xl shadow-sm transition-all active:scale-95"
            >
              เริ่มต้นใช้งานฟรี
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-16 pb-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-teal-50/50 via-white to-slate-50 border-b border-slate-200/60">
        <div className="max-w-5xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-teal-100/80 text-teal-800 text-xs font-bold mb-6 animate-pulse">
            <Sparkles className="w-3.5 h-3.5" />
            ระบบประเมินความพึงพอใจรุ่นใหม่ สำหรับองค์กรยุคดิจิทัล
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-slate-900 tracking-tight leading-tight sm:leading-tight mb-6">
            “รับฟังทุกบริการ <span className="text-teal-700">เห็นผลชัด</span>{" "}
            <br className="hidden sm:inline" />
            ปรับปรุงได้ทันที”
          </h1>

          <p className="max-w-2xl mx-auto text-base sm:text-lg text-slate-600 mb-8 leading-relaxed">
            เปลี่ยนข้อเสนอแนะของผู้รับบริการให้กลายเป็นพลังพัฒนาองค์กร ด้วยระบบ Multi-tenant SaaS
            ที่ออกแบบเฉพาะสำหรับโรงพยาบาล คลินิก สหกรณ์ และธุรกิจบริการ รองรับ QR Code ประจำจุด ตอบง่ายบนมือถือ
            และวิเคราะห์ผลแบบ Real-time
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 max-w-md mx-auto mb-12">
            <Link
              href="/register"
              className="w-full sm:w-auto min-h-[50px] inline-flex items-center justify-center gap-2 px-6 py-3 rounded-2xl bg-teal-700 hover:bg-teal-800 text-white font-bold text-base shadow-lg shadow-teal-700/20 transition-all active:scale-98"
            >
              เปิดใช้งานองค์กรของคุณ
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              href="/login"
              className="w-full sm:w-auto min-h-[50px] inline-flex items-center justify-center gap-2 px-6 py-3 rounded-2xl bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 font-bold text-base shadow-xs transition-all"
            >
              ทดลองดูระบบสาธิต (Demo)
            </Link>
          </div>

          {/* Real Live Preview Metrics Card */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-2xl max-w-4xl mx-auto text-left relative overflow-hidden">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
              <div>
                <span className="text-[11px] font-bold text-teal-700 uppercase tracking-wider bg-teal-50 px-2.5 py-1 rounded-md">
                  ตัวอย่าง Dashboard สถิติจริง (ข้อมูลสาธิต)
                </span>
                <h3 className="text-lg font-bold text-slate-800 mt-1">
                  โรงพยาบาลปทุมธานี เฮลท์แคร์ • ภาพรวมสัปดาห์นี้
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                  Live Sync
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 pt-6">
              <div className="bg-slate-50/80 p-4 rounded-2xl border border-slate-100">
                <span className="text-xs text-slate-500 block mb-1">จำนวนผู้ประเมิน</span>
                <div className="text-2xl sm:text-3xl font-black text-slate-800">45 <span className="text-xs font-normal text-slate-400">คน</span></div>
                <span className="text-[11px] text-emerald-600 font-medium mt-1 inline-flex items-center gap-0.5">
                  <TrendingUp className="w-3 h-3" /> +15.4% จากสัปดาห์ก่อน
                </span>
              </div>

              <div className="bg-slate-50/80 p-4 rounded-2xl border border-slate-100">
                <span className="text-xs text-slate-500 block mb-1">ความพึงพอใจรวม (CSAT)</span>
                <div className="text-2xl sm:text-3xl font-black text-teal-700">88.9%</div>
                <span className="text-[11px] text-slate-400 font-medium mt-1 block">
                  เกณฑ์คะแนน 4-5 ดาว
                </span>
              </div>

              <div className="bg-slate-50/80 p-4 rounded-2xl border border-slate-100">
                <span className="text-xs text-slate-500 block mb-1">คะแนนเฉลี่ยโดยรวม</span>
                <div className="text-2xl sm:text-3xl font-black text-amber-500">4.62 <span className="text-xs font-normal text-slate-400">/ 5</span></div>
                <span className="text-[11px] text-slate-400 font-medium mt-1 block">
                  จาก 5 หัวข้อประเมิน
                </span>
              </div>

              <div className="bg-slate-50/80 p-4 rounded-2xl border border-slate-100">
                <span className="text-xs text-slate-500 block mb-1">Net Promoter Score (NPS)</span>
                <div className="text-2xl sm:text-3xl font-black text-blue-600">+62</div>
                <span className="text-[11px] text-blue-600 font-medium mt-1 block">
                  ความภักดีระดับดีเยี่ยม
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Target Industries */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-white border-b border-slate-200">
        <div className="max-w-6xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-800 mb-3">
              ออกแบบมาเพื่อธุรกิจและบริการที่ใส่ใจเสียงของลูกค้า
            </h2>
            <p className="text-sm text-slate-500">
              พร้อมเทมเพลตมาตรฐานตามประเภทกิจการ เริ่มต้นใช้งานได้ทันทีใน 5 นาที
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-slate-50/70 p-6 rounded-2xl border border-slate-200 hover:border-teal-400 transition-all hover:shadow-md">
              <div className="w-12 h-12 rounded-xl bg-teal-100 text-teal-700 flex items-center justify-center mb-4">
                <HeartPulse className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-800 mb-2">โรงพยาบาลและคลินิก</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                ครอบคลุมจุดคัดกรอง เวชระเบียน ห้องตรวจ ห้องยา และบริการพยาบาล
                พร้อมระบบเตือนคะแนนต่ำและติดตามเคสแก้ไข
              </p>
            </div>

            <div className="bg-slate-50/70 p-6 rounded-2xl border border-slate-200 hover:border-teal-400 transition-all hover:shadow-md">
              <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center mb-4">
                <Building2 className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-800 mb-2">สหกรณ์และการเงิน</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                วัดความแม่นยำของธุรกรรม ความโปร่งใส และความสุภาพของเคาน์เตอร์บริการ
                เพื่อยกระดับความเชื่อมั่นของสมาชิก
              </p>
            </div>

            <div className="bg-slate-50/70 p-6 rounded-2xl border border-slate-200 hover:border-teal-400 transition-all hover:shadow-md">
              <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center mb-4">
                <Store className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-800 mb-2">ร้านค้าและงานบริการทั่วไป</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                สร้าง QR Code วางหน้าร้านหรือแนบใบเสร็จ ลูกค้าสแกนตอบสั้นๆ ใน 30 วินาที
                ไม่ต้องกรอกข้อมูลยุ่งยาก
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Product Highlights */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-slate-50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-800 mb-3">
              ฟังก์ชันระดับ Enterprise ที่พร้อมใช้งานทันที
            </h2>
            <p className="text-sm text-slate-500">
              มั่นใจในความปลอดภัยและประสิทธิภาพด้วยสถาปัตยกรรมมาตรฐานสากล
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
              <QrCode className="w-7 h-7 text-teal-600 mb-3" />
              <h4 className="font-bold text-slate-800 text-sm mb-1">QR Code ประจำจุดบริการ</h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                สร้างรหัสถาวร ดาวน์โหลดป้ายตั้งโต๊ะ PDF หรือไฟล์ SVG/PNG ความละเอียดสูงได้ทันที
              </p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
              <Smartphone className="w-7 h-7 text-blue-600 mb-3" />
              <h4 className="font-bold text-slate-800 text-sm mb-1">Mobile-First UI</h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                ตอบง่ายด้วยมือเดียว ปุ่มคะแนนใหญ่ ชัดเจน ไม่ต้องล็อกอิน มีระบบป้องกันการกดส่งซ้ำ
              </p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
              <ShieldCheck className="w-7 h-7 text-emerald-600 mb-3" />
              <h4 className="font-bold text-slate-800 text-sm mb-1">Multi-tenant Isolation</h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                แยกข้อมูลระหว่างองค์กรอย่างเคร่งครัด พร้อมระบบ RBAC กำหนดสิทธิ์รายบุคคลและจุดบริการ
              </p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
              <BarChart3 className="w-7 h-7 text-indigo-600 mb-3" />
              <h4 className="font-bold text-slate-800 text-sm mb-1">CSAT & NPS Dashboard</h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                คำนวณสูตรแม่นยำตามมาตรฐานสากล เปรียบเทียบย้อนหลัง และส่งออกข้อมูล CSV/PDF ปลอดภัย
              </p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
              <CheckCircle2 className="w-7 h-7 text-amber-600 mb-3" />
              <h4 className="font-bold text-slate-800 text-sm mb-1">Feedback Action Workflow</h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                เปลี่ยนเสียงติชมเป็นงานติดตาม (New → In Progress → Resolved) มอบหมายผู้รับผิดชอบชัดเจน
              </p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
              <Sliders className="w-7 h-7 text-teal-600 mb-3" />
              <h4 className="font-bold text-slate-800 text-sm mb-1">Survey Versioning</h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                ไม่ทำลายข้อมูลเก่าย้อนหลัง เมื่อแก้ไขแบบประเมินระบบจะสร้าง Version ใหม่อย่างปลอดภัย
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto bg-white border-t border-slate-200 py-10 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-800">Tomvisfeedback</span>
            <span>• ระบบประเมินความพึงพอใจในการรับบริการแบบ Multi-tenant SaaS</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/privacy" className="hover:text-slate-800">
              นโยบายความเป็นส่วนตัว (Privacy)
            </Link>
            <Link href="/terms" className="hover:text-slate-800">
              ข้อกำหนดการให้บริการ (Terms)
            </Link>
            <Link href="/login" className="text-teal-700 font-semibold hover:underline">
              เข้าสู่ระบบทีมงาน
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
