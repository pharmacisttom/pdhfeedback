import Link from "next/link";
import { ArrowLeft, ShieldAlert } from "lucide-react";

export default function PrivacyPolicyPage() {
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
          นโยบายความเป็นส่วนตัว (Privacy Notice Template)
        </h1>

        <div className="bg-amber-50/70 border border-amber-200 rounded-2xl p-4 text-xs text-amber-900 mb-6 flex items-start gap-2.5">
          <ShieldAlert className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
          <div>
            <strong>คำชี้แจงสำหรับองค์กรผู้ใช้งาน:</strong> ข้อความนี้เป็นโครงสร้างตัวอย่างตั้งต้นเพื่อให้แต่ละองค์กรนำไปปรับแก้ตามนโยบายและการประมวลผลข้อมูลจริงของท่าน
            ระบบ PdhFeedback ไม่ได้ให้คำปรึกษาทางกฎหมายหรือรับรองผลการปฏิบัติตามกฎหมายแทนองค์กร
          </div>
        </div>

        <div className="prose prose-slate prose-sm max-w-none space-y-4 text-slate-600 text-xs sm:text-sm leading-relaxed">
          <section>
            <h2 className="text-base font-bold text-slate-800 mb-1">1. ข้อมูลที่เราเก็บรวบรวม</h2>
            <p>
              ระบบ PdhFeedback ออกแบบมาเพื่อให้ผู้รับบริการสามารถประเมินความพึงพอใจได้โดยไม่ต้องระบุตัวตน (Anonymous by Default)
              ข้อมูลที่จัดเก็บหลักประกอบด้วย:
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li>คะแนนระดับความพึงพอใจและคำตอบตามคำถามในแบบประเมิน</li>
              <li>ความคิดเห็นหรือข้อเสนอแนะเพิ่มเติมที่ท่านกรอกโดยสมัครใจ</li>
              <li>จุดบริการ วันและเวลาที่ท่านส่งแบบประเมิน</li>
              <li>ข้อมูลทางเทคนิคเพื่อความปลอดภัย (เช่น Hash ของ IP Address ที่ผ่านการใส่ Salt เพื่อป้องกัน Spam และ Rate Limit)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-bold text-slate-800 mb-1">2. ข้อมูลการติดต่อกลับ (กรณีสมัครใจเท่านั้น)</h2>
            <p>
              ในกรณีที่ท่านประสงค์ให้เจ้าหน้าที่ติดต่อกลับเพื่อรับฟังหรือแก้ไขปัญหา ท่านสามารถเลือกกรอกชื่อ เบอร์โทรศัพท์ หรืออีเมลได้
              ข้อมูลนี้จะถูกจัดเก็บแยกต่างหาก และจำกัดสิทธิ์การเข้าถึงเฉพาะเจ้าหน้าที่ผู้รับผิดชอบงานบริการเท่านั้น
            </p>
          </section>

          <section>
            <h2 className="text-base font-bold text-slate-800 mb-1">3. วัตถุประสงค์ในการประมวลผลข้อมูล</h2>
            <p>
              ข้อมูลทั้งหมดนำไปใช้เพื่อ:
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li>วิเคราะห์และประเมินคุณภาพการให้บริการเพื่อการพัฒนาปรับปรุงการบริการอย่างต่อเนื่อง</li>
              <li>ติดตามและแก้ไขข้อร้องเรียนหรือปัญหาที่เกิดขึ้นตามความประสงค์ของท่าน</li>
              <li>จัดทำรายงานสถิติรวมขององค์กร (โดยไม่มีการระบุตัวตนของผู้ตอบ)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-bold text-slate-800 mb-1">4. ระยะเวลาการเก็บรักษาข้อมูล</h2>
            <p>
              ข้อมูลคะแนนประเมินจะถูกเก็บรักษาไว้ตามรอบการประเมินคุณภาพของแต่ละองค์กร (โดยปกติ 1–3 ปี)
              และข้อมูลการติดต่อกลับจะถูกลบหรือนิรนามข้อมูลเมื่อเคสการปรับปรุงบริการเสร็จสิ้นลง
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
