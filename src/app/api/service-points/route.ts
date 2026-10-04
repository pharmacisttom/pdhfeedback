import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { hasPermission } from "@/lib/permissions";
import { logAuditEvent } from "@/lib/audit";

const CreateServicePointSchema = z.object({
  organizationId: z.string(),
  branchId: z.string().optional().nullable(),
  code: z.string().min(2, "รหัสจุดบริการต้องมีอย่างน้อย 2 ตัวอักษร"),
  name: z.string().min(2, "ชื่อจุดบริการต้องมีอย่างน้อย 2 ตัวอักษร"),
  description: z.string().optional().nullable(),
  displayOrder: z.number().int().default(0),
});

export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "กรุณาเข้าสู่ระบบก่อน" }, { status: 401 });
    }

    if (!hasPermission(session, "canManageServicePoints")) {
      return NextResponse.json({ error: "คุณไม่มีสิทธิ์จัดการจุดบริการ" }, { status: 403 });
    }

    const body = await req.json();
    const result = CreateServicePointSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: result.error.errors[0]?.message || "ข้อมูลไม่ถูกต้อง" },
        { status: 400 }
      );
    }

    const { organizationId, branchId, code, name, description, displayOrder } = result.data;

    // Check organization quota for max service points
    const org = await prisma.organization.findUnique({
      where: { id: organizationId },
      include: {
        _count: {
          select: { servicePoints: { where: { isArchived: false } } },
        },
      },
    });

    if (!org) {
      return NextResponse.json({ error: "ไม่พบองค์กร" }, { status: 404 });
    }

    if (org._count.servicePoints >= org.maxServicePoints) {
      return NextResponse.json(
        { error: `จำนวนจุดบริการเต็มโควตาแพ็กเกจแล้ว (สูงสุด ${org.maxServicePoints} จุด)` },
        { status: 403 }
      );
    }

    // Stable permanent publicCode for QR
    const publicCode = `${org.slug}-${code.toLowerCase().replace(/[^a-z0-9]/g, "-")}-${Math.random().toString(36).substring(2, 6)}`;

    // Create service point
    const servicePoint = await prisma.servicePoint.create({
      data: {
        organizationId,
        branchId: branchId || null,
        code: code.trim(),
        name: name.trim(),
        description: description?.trim() || null,
        displayOrder,
        publicCode,
      },
    });

    // Check if there is an active published survey to bind automatically
    const defaultSurveyVersion = await prisma.surveyVersion.findFirst({
      where: {
        survey: { organizationId },
        status: "PUBLISHED",
      },
      orderBy: { createdAt: "desc" },
    });

    if (defaultSurveyVersion) {
      await prisma.surveyPublication.create({
        data: {
          organizationId,
          surveyVersionId: defaultSurveyVersion.id,
          servicePointId: servicePoint.id,
          publicCode,
          isActive: true,
        },
      });
    }

    await logAuditEvent({
      userId: session.userId,
      userEmail: session.email,
      organizationId,
      action: "CREATE_SERVICE_POINT",
      targetType: "SERVICE_POINT",
      targetId: servicePoint.id,
      details: { code: servicePoint.code, name: servicePoint.name, publicCode },
    });

    return NextResponse.json({ success: true, servicePoint });
  } catch (error: any) {
    console.error("Create service point error:", error);
    if (error.code === "P2002") {
      return NextResponse.json({ error: "รหัสจุดบริการนี้มีอยู่แล้วในองค์กร" }, { status: 400 });
    }
    return NextResponse.json({ error: "เกิดข้อผิดพลาดในการสร้างจุดบริการ" }, { status: 500 });
  }
}

// Archive service point (Soft delete to prevent breaking links/data history)
export async function DELETE(req: Request) {
  try {
    const session = await getSession();
    if (!session || !hasPermission(session, "canManageServicePoints")) {
      return NextResponse.json({ error: "ไม่มีสิทธิ์" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "ระบุ ID" }, { status: 400 });

    const sp = await prisma.servicePoint.update({
      where: { id },
      data: { isArchived: true },
    });

    await logAuditEvent({
      userId: session.userId,
      userEmail: session.email,
      organizationId: sp.organizationId,
      action: "ARCHIVE_SERVICE_POINT",
      targetType: "SERVICE_POINT",
      targetId: sp.id,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "ลบจุดบริการไม่สำเร็จ" }, { status: 500 });
  }
}
