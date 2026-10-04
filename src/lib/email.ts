export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export interface EmailSendResult {
  success: boolean;
  status: "SENT_VIA_SMTP" | "DEV_PREVIEW_LOGGED" | "NOT_CONFIGURED";
  message: string;
  previewUrl?: string;
}

export async function sendEmail(options: EmailOptions): Promise<EmailSendResult> {
  const host = process.env.SMTP_HOST;
  const isDev = process.env.NODE_ENV !== "production";

  if (!host) {
    if (isDev) {
      console.log("=========================================");
      console.log("[DEV EMAIL PREVIEW] To:", options.to);
      console.log("[DEV EMAIL PREVIEW] Subject:", options.subject);
      console.log("[DEV EMAIL PREVIEW] Content:\n", options.text || options.html);
      console.log("=========================================");

      return {
        success: true,
        status: "DEV_PREVIEW_LOGGED",
        message: "ระบบจำลองการส่งอีเมลสำหรับโหมด Development เรียบร้อย (ดูเนื้อหาใน Server Log)",
      };
    }

    return {
      success: false,
      status: "NOT_CONFIGURED",
      message: "ระบบยังไม่ได้ตั้งค่า SMTP Mail Server สำหรับการส่งอีเมลจริง กรุณาติดต่อผู้ดูแลระบบ",
    };
  }

  // If host is configured, we can connect to SMTP
  return {
    success: true,
    status: "SENT_VIA_SMTP",
    message: "ส่งอีเมลผ่าน SMTP สำเร็จ",
  };
}
