import Link from "next/link";
import { ArrowLeft, ShieldAlert } from "lucide-react";

export default function TermsOfServicePage() {
  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto bg-white p-8 sm:p-10 rounded-3xl shadow-sm border border-slate-200">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          กลับหน้าหลัก
        </Link>

        <div className="flex items-center gap-2 mb-2">
          <span className="text-xs font-bold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-md border border-amber-200">
            เอกสารร่างเริ่มต้น (Template)
          </span>
        </div>

        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-4">
          ข้อกำหนดและเงื่อนไขการให้บริการ (Terms of Service Template)
        </h1>

        <div className="prose prose-slate prose-sm max-w-none space-y-4 text-slate-600 text-xs sm:text-sm leading-relaxed">
          <section>
            <h2 className="text-base font-bold text-slate-800 mb-1">1. การใช้งานระบบ</h2>
            <p>
              PdhFeedback เป็นแพลตฟอร์มแบบ SaaS สำหรับการสำรวจความคิดเห็นและความพึงพอใจ
              ผู้ใช้งานและองค์กรต้องใช้ระบบเพื่อวัตถุประสงค์ที่ชอบด้วยกฎหมาย
              ห้ามนำไปใช้เพื่อการคุกคาม เผยแพร่ข้อความเท็จ หรือล่วงละเมิดสิทธิส่วนบุคคลของผู้อื่น
            </p>
          </section>

          <section>
            <h2 className="text-base font-bold text-slate-800 mb-1">2. ความรับผิดชอบในข้อมูล</h2>
            <p>
              แต่ละองค์กรเป็นผู้ควบคุมข้อมูล (Data Controller) ของแบบประเมินและข้อมูลคำตอบในองค์กรของตน
              ระบบมีหน้าที่รักษาความมั่นคงปลอดภัยสารสนเทศและการแยกข้อมูล (Tenant Isolation) อย่างเคร่งครัด
            </p>
          </section>

          <section>
            <h2 className="text-base font-bold text-slate-800 mb-1">3. ความต่อเนื่องในการให้บริการ (SLA)</h2>
            <p>
              เรามุ่งมั่นให้บริการระบบด้วยความเสถียรสูงสุด ทั้งนี้อาจมีการปิดปรับปรุงระบบตามรอบบำรุงรักษา
              โดยจะมีการแจ้งล่วงหน้าผ่านทางหน้ากระดานแจ้งเตือนของระบบ
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
