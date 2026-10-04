import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { hashPassword, setSessionCookie } from "@/lib/auth";
import { checkRateLimit, hashIp } from "@/lib/rate-limiter";
import { logAuditEvent } from "@/lib/audit";

const RegisterSchema = z.object({
  fullName: z.string().min(2, "กรุณากรอกชื่อ-นามสกุล"),
  email: z.string().email("กรุณากรอกอีเมลที่ถูกต้อง"),
  password: z.string().min(6, "รหัสผ่านต้องมีความยาวอย่างน้อย 6 ตัวอักษร"),
  organizationName: z.string().min(3, "กรุณาระบุชื่อองค์กร"),
  organizationType: z.enum(["HOSPITAL", "CLINIC", "COOPERATIVE", "RETAIL", "SERVICE"]),
  organizationSlug: z
    .string()
    .min(3, "Slug ต้องมีความยาวอย่างน้อย 3 ตัวอักษร")
    .regex(/^[a-z0-9-]+$/, "Slug ต้องเป็นตัวอักษรพิมพ์เล็ก ตัวเลข หรือขีด (-) เท่านั้น"),
});

export async function POST(req: Request) {
  try {
    const ip = req.headers.get("x-forwarded-for") || "127.0.0.1";
    const rateLimit = checkRateLimit(`register:${hashIp(ip)}`, 5, 60);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: "มีการลงทะเบียนบ่อยเกินไป กรุณารอสักครู่แล้วลองใหม่" },
        { status: 429 }
      );
    }

    const body = await req.json();
    const result = RegisterSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: result.error.errors[0]?.message || "ข้อมูลไม่ถูกต้อง" },
        { status: 400 }
      );
    }

    const {
      fullName,
      email,
      password,
      organizationName,
      organizationType,
      organizationSlug,
    } = result.data;

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });
    if (existingUser) {
      return NextResponse.json(
        { error: "อีเมลนี้ถูกใช้งานแล้วในระบบ กรุณาเข้าสู่ระบบหรือใช้อีเมลอื่น" },
        { status: 400 }
      );
    }

    // Check if org slug already exists
    const existingOrg = await prisma.organization.findUnique({
      where: { slug: organizationSlug.toLowerCase().trim() },
    });
    if (existingOrg) {
      return NextResponse.json(
        { error: "Slug ขององค์กรนี้ถูกใช้งานแล้ว กรุณาระบุชื่ออื่น" },
        { status: 400 }
      );
    }

    const passwordHash = await hashPassword(password);

    // Create user, organization, and owner membership in a single transaction
    const newOrg = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email: email.toLowerCase().trim(),
          fullName: fullName.trim(),
          passwordHash,
          isPlatformAdmin: false,
          status: "ACTIVE",
        },
      });

      const org = await tx.organization.create({
        data: {
          name: organizationName.trim(),
          slug: organizationSlug.toLowerCase().trim(),
          type: organizationType,
          timezone: "Asia/Bangkok",
          defaultLang: "th",
          planTier: "PRO",
          maxServicePoints: 20,
          maxMonthlyResponses: 5000,
          maxUsers: 10,
        },
      });

      await tx.membership.create({
        data: {
          userId: user.id,
          organizationId: org.id,
          role: "OWNER",
          canExport: true,
          canViewContacts: true,
        },
      });

      // Create default notification rule
      await tx.notificationRule.create({
        data: {
          organizationId: org.id,
          name: "แจ้งเตือนคะแนนประเมินต่ำกว่าเกณฑ์ (<= 2)",
          minRatingAlert: 2,
          notifyRoles: "OWNER,ADMIN,SERVICE_MANAGER",
        },
      });

      return { user, org };
    });

    // Auto-login newly registered owner
    await setSessionCookie({
      userId: newOrg.user.id,
      email: newOrg.user.email,
      fullName: newOrg.user.fullName,
      isPlatformAdmin: false,
      activeOrgId: newOrg.org.id,
      activeOrgSlug: newOrg.org.slug,
      activeRole: "OWNER",
      canExport: true,
      canViewContacts: true,
    });

    await logAuditEvent({
      userId: newOrg.user.id,
      userEmail: newOrg.user.email,
      organizationId: newOrg.org.id,
      action: "REGISTER_ORGANIZATION",
      targetType: "ORGANIZATION",
      targetId: newOrg.org.id,
      details: { orgName: newOrg.org.name, orgSlug: newOrg.org.slug },
      ipAddress: hashIp(ip),
    });

    return NextResponse.json({
      success: true,
      redirectTo: `/${newOrg.org.slug}/onboarding`,
    });
  } catch (error) {
    console.error("Register error:", error);
    return NextResponse.json(
      { error: "เกิดข้อผิดพลาดในการลงทะเบียน กรุณาลองใหม่อีกครั้ง" },
      { status: 500 }
    );
  }
}
