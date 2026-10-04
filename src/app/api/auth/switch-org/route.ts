import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSession, setSessionCookie } from "@/lib/auth";
import { Role } from "@/lib/permissions";
import { logAuditEvent } from "@/lib/audit";

const SwitchOrgSchema = z.object({
  organizationId: z.string().min(1, "ระบุองค์กรที่ต้องการสลับ"),
});

export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "กรุณาเข้าสู่ระบบก่อน" }, { status: 401 });
    }

    const body = await req.json();
    const result = SwitchOrgSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json({ error: "ข้อมูลไม่ถูกต้อง" }, { status: 400 });
    }

    const targetOrgId = result.data.organizationId;

    // Check membership
    const membership = await prisma.membership.findUnique({
      where: {
        userId_organizationId: {
          userId: session.userId,
          organizationId: targetOrgId,
        },
      },
      include: {
        organization: true,
      },
    });

    // If platform admin and not a member directly, allow read-only platform switch
    if (!membership) {
      if (session.isPlatformAdmin) {
        const targetOrg = await prisma.organization.findUnique({
          where: { id: targetOrgId },
        });
        if (!targetOrg) {
          return NextResponse.json({ error: "ไม่พบองค์กรที่ระบุ" }, { status: 404 });
        }

        await setSessionCookie({
          userId: session.userId,
          email: session.email,
          fullName: session.fullName,
          isPlatformAdmin: true,
          activeOrgId: targetOrg.id,
          activeOrgSlug: targetOrg.slug,
          activeRole: "OWNER", // temporary elevated platform view
          servicePointScope: null,
          canExport: true,
          canViewContacts: true,
        });

        return NextResponse.json({
          success: true,
          activeOrgSlug: targetOrg.slug,
        });
      }

      return NextResponse.json(
        { error: "คุณไม่มีสิทธิ์เข้าถึงองค์กรนี้" },
        { status: 403 }
      );
    }

    if (membership.status !== "ACTIVE" || membership.organization.status !== "ACTIVE") {
      return NextResponse.json(
        { error: "สถานะสมาชิกหรือองค์กรไม่พร้อมใช้งาน" },
        { status: 403 }
      );
    }

    const servicePointScope = membership.servicePointScope
      ? JSON.parse(membership.servicePointScope)
      : null;

    await setSessionCookie({
      userId: session.userId,
      email: session.email,
      fullName: session.fullName,
      isPlatformAdmin: session.isPlatformAdmin,
      activeOrgId: membership.organizationId,
      activeOrgSlug: membership.organization.slug,
      activeRole: membership.role as Role,
      servicePointScope,
      canExport: membership.canExport,
      canViewContacts: membership.canViewContacts,
    });

    await logAuditEvent({
      userId: session.userId,
      userEmail: session.email,
      organizationId: membership.organizationId,
      action: "SWITCH_ORGANIZATION",
      targetType: "ORGANIZATION",
      targetId: membership.organizationId,
      details: { orgSlug: membership.organization.slug, role: membership.role },
    });

    return NextResponse.json({
      success: true,
      activeOrgSlug: membership.organization.slug,
    });
  } catch (error) {
    console.error("Switch org error:", error);
    return NextResponse.json(
      { error: "เกิดข้อผิดพลาดในการสลับองค์กร" },
      { status: 500 }
    );
  }
}
