import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { verifyPassword, setSessionCookie } from "@/lib/auth";
import { checkRateLimit, hashIp } from "@/lib/rate-limiter";
import { logAuditEvent } from "@/lib/audit";
import { Role } from "@/lib/permissions";

const LoginSchema = z.object({
  email: z.string().email("กรุณากรอกอีเมลที่ถูกต้อง"),
  password: z.string().min(6, "รหัสผ่านต้องมีความยาวอย่างน้อย 6 ตัวอักษร"),
});

export async function POST(req: Request) {
  try {
    const ip = req.headers.get("x-forwarded-for") || "127.0.0.1";
    const rateLimit = checkRateLimit(`login:${hashIp(ip)}`, 10, 60);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: `พยายามเข้าสู่ระบบมากเกินไป กรุณารออีก ${rateLimit.resetInSeconds} วินาที` },
        { status: 429 }
      );
    }

    const body = await req.json();
    const result = LoginSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: result.error.errors[0]?.message || "ข้อมูลไม่ถูกต้อง" },
        { status: 400 }
      );
    }

    const { email, password } = result.data;
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
      include: {
        memberships: {
          where: { status: "ACTIVE" },
          include: {
            organization: true,
          },
        },
      },
    });

    if (!user || !(await verifyPassword(password, user.passwordHash))) {
      return NextResponse.json(
        { error: "อีเมลหรือรหัสผ่านไม่ถูกต้อง" },
        { status: 401 }
      );
    }

    if (user.status !== "ACTIVE") {
      return NextResponse.json(
        { error: "บัญชีของคุณถูกระงับการใช้งาน กรุณาติดต่อผู้ดูแลระบบ" },
        { status: 403 }
      );
    }

    // Determine initial active organization
    let activeOrgId: string | undefined = undefined;
    let activeOrgSlug: string | undefined = undefined;
    let activeRole: Role | undefined = undefined;
    let servicePointScope: string[] | null = null;
    let canExport = false;
    let canViewContacts = false;

    if (user.memberships.length > 0) {
      const firstMembership = user.memberships[0];
      activeOrgId = firstMembership.organizationId;
      activeOrgSlug = firstMembership.organization.slug;
      activeRole = firstMembership.role as Role;
      servicePointScope = firstMembership.servicePointScope
        ? JSON.parse(firstMembership.servicePointScope)
        : null;
      canExport = firstMembership.canExport;
      canViewContacts = firstMembership.canViewContacts;
    }

    await setSessionCookie({
      userId: user.id,
      email: user.email,
      fullName: user.fullName,
      isPlatformAdmin: user.isPlatformAdmin,
      activeOrgId,
      activeOrgSlug,
      activeRole,
      servicePointScope,
      canExport,
      canViewContacts,
    });

    await logAuditEvent({
      userId: user.id,
      userEmail: user.email,
      organizationId: activeOrgId,
      action: "USER_LOGIN",
      targetType: "AUTH",
      details: { email: user.email, orgSlug: activeOrgSlug },
      ipAddress: hashIp(ip),
    });

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        isPlatformAdmin: user.isPlatformAdmin,
        activeOrgSlug,
        activeRole,
      },
      redirectTo: user.isPlatformAdmin && !activeOrgSlug ? "/platform" : activeOrgSlug ? `/${activeOrgSlug}/dashboard` : "/onboarding",
    });
  } catch (error) {
    console.error("Login API error:", error);
    return NextResponse.json(
      { error: "เกิดข้อผิดพลาดภายในระบบ กรุณาลองใหม่อีกครั้ง" },
      { status: 500 }
    );
  }
}
