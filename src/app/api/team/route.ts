import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { hasPermission } from "@/lib/permissions";
import { logAuditEvent } from "@/lib/audit";

const UpdateMemberSchema = z.object({
  membershipId: z.string(),
  role: z.enum(["OWNER", "ADMIN", "SERVICE_MANAGER", "VIEWER"]),
  servicePointScope: z.array(z.string()).optional().nullable(),
  canExport: z.boolean().optional(),
  canViewContacts: z.boolean().optional(),
});

export async function PUT(req: Request) {
  try {
    const session = await getSession();
    if (!session || !hasPermission(session, "canManageTeam")) {
      return NextResponse.json({ error: "ไม่มีสิทธิ์จัดการทีม" }, { status: 403 });
    }

    const body = await req.json();
    const result = UpdateMemberSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json({ error: "ข้อมูลไม่ถูกต้อง" }, { status: 400 });
    }

    const { membershipId, role, servicePointScope, canExport, canViewContacts } = result.data;

    const targetMembership = await prisma.membership.findUnique({
      where: { id: membershipId },
    });

    if (!targetMembership) {
      return NextResponse.json({ error: "ไม่พบข้อมูลสมาชิก" }, { status: 404 });
    }

    // Safety: Prevent removing or demoting the LAST Owner!
    if (targetMembership.role === "OWNER" && role !== "OWNER") {
      const ownerCount = await prisma.membership.count({
        where: {
          organizationId: targetMembership.organizationId,
          role: "OWNER",
          status: "ACTIVE",
        },
      });

      if (ownerCount <= 1) {
        return NextResponse.json(
          { error: "ไม่สามารถลดระดับหรือถอดบทบาทของ Owner คนสุดท้ายได้" },
          { status: 400 }
        );
      }
    }

    const updated = await prisma.membership.update({
      where: { id: membershipId },
      data: {
        role,
        servicePointScope: servicePointScope ? JSON.stringify(servicePointScope) : null,
        canExport: canExport !== undefined ? canExport : false,
        canViewContacts: canViewContacts !== undefined ? canViewContacts : false,
      },
    });

    await logAuditEvent({
      userId: session.userId,
      userEmail: session.email,
      organizationId: targetMembership.organizationId,
      action: "UPDATE_MEMBER_ROLE",
      targetType: "MEMBERSHIP",
      targetId: updated.id,
      details: { role, servicePointScope },
    });

    return NextResponse.json({ success: true, membership: updated });
  } catch (error) {
    console.error("Update team error:", error);
    return NextResponse.json({ error: "บันทึกข้อมูลสมาชิกไม่สำเร็จ" }, { status: 500 });
  }
}
