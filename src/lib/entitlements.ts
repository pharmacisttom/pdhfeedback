/**
 * Central Feature Catalogue & Entitlement System for PdhFeedback SaaS
 * 
 * Provides server-side feature gating, quota limit resolution,
 * and subscription feature resolution.
 */

export type FeatureKey =
  | "custom_questions"
  | "conditional_questions"
  | "dashboard_filters"
  | "xlsx_export"
  | "pdf_reports"
  | "comparison_dashboard"
  | "feedback_tracking"
  | "feedback_assignment"
  | "invitation_links"
  | "email_notifications"
  | "scheduled_reports"
  | "multilingual_surveys"
  | "custom_styling"
  | "api_access"
  | "webhooks"
  | "embed_widget"
  | "advanced_roles"
  | "advanced_audit"
  | "scheduled_exports"
  | "custom_branding"
  | "hide_powered_by"
  | "custom_domain";

export interface FeatureMetadata {
  key: FeatureKey;
  name: string;
  description: string;
  category: "core" | "analytics" | "workflow" | "integration" | "branding";
  status: "AVAILABLE" | "COMING_SOON";
}

export const FEATURE_CATALOGUE: Record<FeatureKey, FeatureMetadata> = {
  custom_questions: {
    key: "custom_questions",
    name: "คำถามเพิ่มเติมและเทมเพลต",
    description: "สร้างคำถามเฉพาะทาง ตัวเลือก และเทมเพลตสำหรับแต่ละประเภทธุรกิจ",
    category: "core",
    status: "AVAILABLE",
  },
  conditional_questions: {
    key: "conditional_questions",
    name: "เงื่อนไขการแสดงคำถาม (Logic Branching)",
    description: "แสดงหรือซ่อนคำถามตามคะแนนหรือคำตอบก่อนหน้า",
    category: "core",
    status: "AVAILABLE",
  },
  dashboard_filters: {
    key: "dashboard_filters",
    name: "ตัวกรอง Dashboard ขั้นสูง",
    description: "กรองข้อมูลตามช่วงวันที่ จุดบริการ แผนก และคะแนน",
    category: "analytics",
    status: "AVAILABLE",
  },
  xlsx_export: {
    key: "xlsx_export",
    name: "ส่งออกไฟล์ Excel (XLSX)",
    description: "ดาวน์โหลดรายงานแบบตาราง Excel พร้อมจัดรูปแบบ",
    category: "analytics",
    status: "AVAILABLE",
  },
  pdf_reports: {
    key: "pdf_reports",
    name: "รายงานสรุปผู้บริหาร PDF",
    description: "สร้างเอกสารรายงานทางการพิมพ์ภาษาไทย",
    category: "analytics",
    status: "AVAILABLE",
  },
  comparison_dashboard: {
    key: "comparison_dashboard",
    name: "เปรียบเทียบจุดบริการและช่วงเวลา",
    description: "วิเคราะห์เทียบระหว่างสาขา แผนก และสถิติต่างช่วงเวลา",
    category: "analytics",
    status: "AVAILABLE",
  },
  feedback_tracking: {
    key: "feedback_tracking",
    name: "ติดตามข้อเสนอแนะและข้อร้องเรียน",
    description: "ระบบเปิด Case บันทึกสาเหตุและแนวทางแก้ไข",
    category: "workflow",
    status: "AVAILABLE",
  },
  feedback_assignment: {
    key: "feedback_assignment",
    name: "มอบหมายงานและกำหนดวันแล้วเสร็จ (SLA)",
    description: "จ่ายงานให้ผู้รับผิดชอบและติดตามกำหนดส่ง",
    category: "workflow",
    status: "AVAILABLE",
  },
  invitation_links: {
    key: "invitation_links",
    name: "ลิงก์คำเชิญแบบ One-time",
    description: "ส่งคำเชิญเฉพาะบุคคล ป้องกันการตอบซ้ำ",
    category: "workflow",
    status: "AVAILABLE",
  },
  email_notifications: {
    key: "email_notifications",
    name: "การแจ้งเตือนทางอีเมล",
    description: "แจ้งเตือนทันทีเมื่อพบคะแนนวิกฤต (Alert)",
    category: "workflow",
    status: "AVAILABLE",
  },
  scheduled_reports: {
    key: "scheduled_reports",
    name: "รายงานอัตโนมัติตามกำหนดเวลา",
    description: "ส่งสรุปผลประจำสัปดาห์หรือประจำเดือนทางอีเมล",
    category: "workflow",
    status: "AVAILABLE",
  },
  multilingual_surveys: {
    key: "multilingual_surveys",
    name: "แบบประเมินหลายภาษา",
    description: "รองรับภาษาอังกฤษและภาษาอื่นๆ โดยองค์กรกำหนดคำแปลเอง",
    category: "core",
    status: "AVAILABLE",
  },
  custom_styling: {
    key: "custom_styling",
    name: "ปรับสีธีมและข้อความขอบคุณ",
    description: "ปรับโทนสีปุ่ม ข้อความขอบคุณ และคำชี้แจง",
    category: "branding",
    status: "AVAILABLE",
  },
  api_access: {
    key: "api_access",
    name: "REST API Access",
    description: "เชื่อมต่อข้อมูลกับระบบภายนอกผ่าน Scoped API Keys",
    category: "integration",
    status: "AVAILABLE",
  },
  webhooks: {
    key: "webhooks",
    name: "HMAC Webhooks",
    description: "ส่ง Event แจ้งเตือนแบบเรียลไทม์พร้อมการลงลายมือชื่อ",
    category: "integration",
    status: "AVAILABLE",
  },
  embed_widget: {
    key: "embed_widget",
    name: "Widget / iFrame ฝังเว็บไซต์",
    description: "นำแบบประเมินไปติดตั้งบนหน้าเว็บขององค์กร",
    category: "integration",
    status: "AVAILABLE",
  },
  advanced_roles: {
    key: "advanced_roles",
    name: "สิทธิ์ผู้ใช้ขั้นสูงตามจุดบริการ",
    description: "กำหนดสิทธิ์ผู้จัดการเฉพาะจุดบริการและแผนก",
    category: "core",
    status: "AVAILABLE",
  },
  advanced_audit: {
    key: "advanced_audit",
    name: "ค้นหา Audit Log ขั้นสูง",
    description: "สืบค้นประวัติการทำงานและการเข้าถึงข้อมูลย้อนหลัง",
    category: "analytics",
    status: "AVAILABLE",
  },
  scheduled_exports: {
    key: "scheduled_exports",
    name: "ส่งออกข้อมูลตามรอบอัตโนมัติ",
    description: "Export ข้อมูลอัตโนมัติเข้า Cloud Storage หรืออีเมล",
    category: "analytics",
    status: "AVAILABLE",
  },
  custom_branding: {
    key: "custom_branding",
    name: "โลโก้และแบรนด์องค์กร",
    description: "แสดงตราสัญลักษณ์องค์กรบนหน้าแบบประเมินและรายงาน",
    category: "branding",
    status: "AVAILABLE",
  },
  hide_powered_by: {
    key: "hide_powered_by",
    name: "ซ่อนข้อความ Powered by Tomvis",
    description: "ตัดข้อความผู้พัฒนาระบบออกจากหน้าประเมิน",
    category: "branding",
    status: "AVAILABLE",
  },
  custom_domain: {
    key: "custom_domain",
    name: "Custom Domain",
    description: "ใช้งานชื่อโดเมนขององค์กรตนเอง (อยู่ระหว่างพัฒนา)",
    category: "branding",
    status: "COMING_SOON", // Clear coming soon indicator
  },
};

export interface PlanLimits {
  servicePoints: number;
  members: number;
  activeSurveys: number;
  responsesPerMonth: number;
}

export const PLAN_FEATURE_MATRIX: Record<
  string,
  { limits: PlanLimits; features: FeatureKey[] }
> = {
  FREE: {
    limits: {
      servicePoints: 1,
      members: 1,
      activeSurveys: 1,
      responsesPerMonth: 100,
    },
    features: [],
  },
  STARTER: {
    limits: {
      servicePoints: 5,
      members: 3,
      activeSurveys: 5,
      responsesPerMonth: 1000,
    },
    features: [
      "custom_questions",
      "dashboard_filters",
      "xlsx_export",
      "custom_branding",
      "feedback_tracking",
    ],
  },
  PROFESSIONAL: {
    limits: {
      servicePoints: 20,
      members: 10,
      activeSurveys: 20,
      responsesPerMonth: 5000,
    },
    features: [
      "custom_questions",
      "dashboard_filters",
      "xlsx_export",
      "custom_branding",
      "feedback_tracking",
      // Pro additions
      "comparison_dashboard",
      "pdf_reports",
      "conditional_questions",
      "invitation_links",
      "feedback_assignment",
      "email_notifications",
      "scheduled_reports",
      "multilingual_surveys",
      "custom_styling",
    ],
  },
  BUSINESS: {
    limits: {
      servicePoints: 100,
      members: 30,
      activeSurveys: 100,
      responsesPerMonth: 20000,
    },
    features: [
      "custom_questions",
      "dashboard_filters",
      "xlsx_export",
      "custom_branding",
      "feedback_tracking",
      "comparison_dashboard",
      "pdf_reports",
      "conditional_questions",
      "invitation_links",
      "feedback_assignment",
      "email_notifications",
      "scheduled_reports",
      "multilingual_surveys",
      "custom_styling",
      // Business additions
      "api_access",
      "webhooks",
      "embed_widget",
      "advanced_roles",
      "advanced_audit",
      "scheduled_exports",
      "hide_powered_by",
    ],
  },
  ENTERPRISE: {
    limits: {
      servicePoints: 999999,
      members: 999999,
      activeSurveys: 999999,
      responsesPerMonth: 999999,
    },
    features: [
      "custom_questions",
      "dashboard_filters",
      "xlsx_export",
      "custom_branding",
      "feedback_tracking",
      "comparison_dashboard",
      "pdf_reports",
      "conditional_questions",
      "invitation_links",
      "feedback_assignment",
      "email_notifications",
      "scheduled_reports",
      "multilingual_surveys",
      "custom_styling",
      "api_access",
      "webhooks",
      "embed_widget",
      "advanced_roles",
      "advanced_audit",
      "scheduled_exports",
      "hide_powered_by",
    ],
  },
};
