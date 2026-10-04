# PdhFeedback (ระบบประเมินความพึงพอใจการบริการแบบ Multi-tenant SaaS)

> **ข้อความหลักของผลิตภัณฑ์:**  
> **“รับฟังทุกบริการ เห็นผลชัด ปรับปรุงได้ทันที”**

PdhFeedback เป็นแพลตฟอร์ม Web Application แบบ Multi-tenant SaaS ที่พัฒนาขึ้นเพื่อโรงพยาบาล คลินิก สหกรณ์ ร้านค้า และธุรกิจบริการทุกประเภท ช่วยให้แต่ละองค์กรสามารถเปิดใช้งาน สร้างแบบประเมิน แชร์ QR Code / ลิงก์สาธารณะ รับคำตอบจากผู้รับบริการผ่านสมาร์ตโฟน และวิเคราะห์สถิติความพึงพอใจผ่านแดชบอร์ดแบบ Real-time

---

## จุดเด่นของระบบ

1. **Mobile-First Respondent Experience:**
   - ใช้งานมือเดียวได้สะดวก ไม่บังคับ Login
   - ปุ่มให้คะแนนขนาดใหญ่พร้อมคำอธิบาย (1 = ควรปรับปรุง ถึง 5 = ดีมาก)
   - รองรับสเกล NPS 0–10, Yes/No, ตัวเลือกเดี่ยว, ตัวเลือกหลายข้อ, ข้อความสั้น/ยาว
   - มีคำเตือนความปลอดภัยข้อมูลส่วนบุคคล: *"กรุณาไม่ระบุเลขบัตรประชาชน ข้อมูลสุขภาพ หรือข้อมูลส่วนบุคคลของผู้อื่น"*
   - ป้องกันการกดส่งซ้ำด้วย **Client & Server Idempotency Key**

2. **Multi-tenant Data Isolation:**
   - ฐานข้อมูลเดียวแต่แยกข้อมูลระหว่างองค์กรอย่างเคร่งครัด (Scoping by `organizationId`)
   - ระบบสลับองค์กร (Organization Switcher) สำหรับผู้ใช้งานที่สังกัดหลายองค์กร
   - ป้องกันข้อมูลรั่วไหลข้ามองค์กรผ่าน Server-side Authorization

3. **Role-Based Access Control (RBAC):**
   - **Platform Super Admin:** ตรวจสอบภาพรวมทุกองค์กร โควตาแพ็กเกจ และ Audit Log ระดับแพลตฟอร์ม
   - **Organization Owner:** จัดการองค์กร สมาชิก สิทธิ์ แบบประเมิน และการตั้งค่า
   - **Organization Admin:** จัดการจุดบริการ แบบประเมิน และทีมงาน
   - **Service Manager:** ดูข้อมูลและติดตามข้อเสนอแนะเฉพาะจุดบริการที่ได้รับมอบหมาย (Scoped Service Points)
   - **Analyst/Viewer:** ดู Dashboard และรายงาน (สิทธิ์ Export และข้อมูลติดต่อแยกเฉพาะ)
   - **Respondent:** ผู้ตอบแบบประเมินสาธารณะ

4. **Accurate Formulas & Analytics:**
   - **CSAT:** (จำนวนผู้ให้คะแนน 4–5 ดาว / จำนวนคำตอบที่ถูกต้องของข้อนั้น) × 100
   - **NPS:** % Promoters (9–10) − % Detractors (0–6)
   - เปรียบเทียบช่วงเวลาก่อนหน้า (Period Comparison) พร้อมการจัดการค่าก่อนหน้าเท่ากับศูนย์
   - Timezone รองรับ `Asia/Bangkok` (+07:00) และป้ายวันที่ พ.ศ. ภาษาไทย

5. **Survey Versioning & Immutability:**
   - แบบประเมินที่เปิดรับคำตอบแล้วจะไม่ถูกแก้ไขโครงสร้างย้อนหลัง เพื่อรักษาความถูกต้องของข้อมูลประวัติ
   - การแก้ไขโครงสร้างจะทำการแตก Version ใหม่อย่างปลอดภัย

6. **Feedback Case Resolution Workflow:**
   - New → Acknowledged → In Progress → Resolved → Closed
   - บันทึกสาเหตุ (Root Cause), มาตรการแก้ไข (Corrective Action), ผู้รับผิดชอบ และ Internal Notes

7. **Secure Data Export:**
   - ส่งออกข้อมูลเป็น CSV รองรับ Excel (UTF-8 BOM)
   - ป้องกัน **Spreadsheet Formula Injection** โดยใส่ Single Quote นำหน้าอักขระ `=`, `+`, `-`, `@`
   - ข้อมูลติดต่อ (Contact Data) ถูกซ่อนเป็นค่าเริ่มต้นและแยกเก็บคนละตาราง

---

## บัญชีสาธิตสำหรับทดสอบ (Demo Accounts)

ฐานข้อมูลเริ่มต้นมาพร้อมข้อมูลจำลอง 2 องค์กร ได้แก่ **โรงพยาบาลปทุมธานี เฮลท์แคร์** และ **สหกรณ์บริการสินเชื่อเพื่อพัฒนา** พร้อม 45+ คำตอบจริง

| บทบาท (Role) | อีเมล (Email) | รหัสผ่าน (Password) | ขอบเขตการเข้าถึง |
|---|---|---|---|
| **Platform Super Admin** | `admin@pdhfeedback.local` | `Pdh@Admin2026!` | ดูแลระบบแพลตฟอร์มทั้งหมด |
| **Hospital Owner** | `owner.hospital@pdhfeedback.local` | `Hospital@2026` | ผอ. รพ. (สิทธิ์เต็ม รพ.) |
| **Pharmacy Manager** | `manager.pharm@pdhfeedback.local` | `Pharm@2026` | จำกัดสิทธิ์เฉพาะเคาน์เตอร์ห้องยา |
| **Hospital Viewer** | `viewer.hospital@pdhfeedback.local` | `Viewer@2026` | อ่านอย่างเดียว (ห้าม Export) |
| **Coop Owner** | `owner.coop@pdhfeedback.local` | `Coop@2026` | เจ้าของสหกรณ์ (ทดสอบ Tenant Isolation) |

*(หมายเหตุ: หน้าเข้าสู่ระบบ `/login` มีปุ่มคลิกเดียวเพื่อเติมข้อมูลบัญชีสาธิตได้ทันที)*

---

## ขั้นตอนการติดตั้งและรันในเครื่อง (Local Quickstart)

### 1. ติดตั้ง Dependencies
```bash
npm install
```

### 2. ตั้งค่า Environment Variables
ไฟล์ `.env`:
```ini
PORT=3000
NEXT_PUBLIC_APP_URL="http://localhost:3000"
DATABASE_URL="mysql://root:@localhost:3306/pdhfeedback"
AUTH_SECRET="pdhfeedback_super_secure_auth_secret_key_2026_dev_only"
AUTH_SALT="pdhfeedback_ip_hasher_salt_2026"
NODE_ENV="development"
```

### 3. Sync Database และ Seed ข้อมูล
```bash
npx prisma db push
npm run prisma:seed
```

### 4. รัน Unit & Integration Tests
```bash
npm test
```

### 5. รัน Development Server
```bash
npm run dev
```
เปิดบราวเซอร์ที่: `http://localhost:3000`

---

## ลิงก์หน้าสำคัญในระบบ

- **หน้าหลัก (Landing Page):** `http://localhost:3000/`
- **หน้าเข้าสู่ระบบ (Login):** `http://localhost:3000/login`
- **หน้าลงทะเบียนองค์กรใหม่ (Register):** `http://localhost:3000/register`
- **แดชบอร์ดโรงพยาบาล (Dashboard):** `http://localhost:3000/pdh-hospital/dashboard`
- **หน้าตอบแบบประเมินบนมือถือ (Public Survey):** `http://localhost:3000/s/pdh-pharm-opd`
- **หน้าป้ายตั้งโต๊ะ QR Code (Printable Stand):** `http://localhost:3000/s/pdh-pharm-opd/qr`
- **ศูนย์ควบคุม Platform Admin:** `http://localhost:3000/platform`
- **Health Check Endpoint:** `http://localhost:3000/api/health`

---

## สถาปัตยกรรมและการ Deploy บน Production VPS
ดูรายละเอียดเพิ่มเติมได้ที่:
- [ARCHITECTURE.md](file:///d:/pdhfeedback/ARCHITECTURE.md)
- [DEPLOYMENT.md](file:///d:/pdhfeedback/DEPLOYMENT.md)
