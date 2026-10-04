import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { hasPermission } from "@/lib/permissions";
import { logAuditEvent } from "@/lib/audit";

const UpdateCaseSchema = z.object({
  caseId: z.string(),
  status: z.enum(["NEW", "ACKNOWLEDGED", "IN_PROGRESS", "RESOLVED", "CLOSED"]).optional(),
  category: z.string().optional(),
  urgency: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]).optional(),
  assignedUserId: z.string().optional().nullable(),
  rootCause: z.string().optional().nullable(),
  correctiveAction: z.string().optional().nullable(),
  internalNote: z.string().optional().nullable(),
});

export async function PUT(req: Request) {
  try {
    const session = await getSession();
    if (!session || !hasPermission(session, "canResolveFeedback")) {
      return NextResponse.json({ error: "ไม่มีสิทธิ์จัดการข้อเสนอแนะ" }, { status: 403 });
    }

    const body = await req.json();
    const result = UpdateCaseSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json({ error: "ข้อมูลไม่ถูกต้อง" }, { status: 400 });
    }

    const {
      caseId,
      status,
      category,
      urgency,
      assignedUserId,
      rootCause,
      correctiveAction,
      internalNote,
    } = result.data;

    const existingCase = await prisma.feedbackCase.findUnique({
      where: { id: caseId },
    });

    if (!existingCase) {
      return NextResponse.json({ error: "ไม่พบเคสข้อเสนอแนะ" }, { status: 404 });
    }

    // Execute atomic update
    const updated = await prisma.$transaction(async (tx) => {
      const updateData: any = {};
      if (status) {
        updateData.status = status;
        if (status === "RESOLVED" || status === "CLOSED") {
          updateData.resolvedAt = new Date();
        }
      }
      if (category) updateData.category = category;
      if (urgency) updateData.urgency = urgency;
      if (assignedUserId !== undefined) updateData.assignedUserId = assignedUserId;
      if (rootCause !== undefined) updateData.rootCause = rootCause;
      if (correctiveAction !== undefined) updateData.correctiveAction = correctiveAction;

      const c = await tx.feedbackCase.update({
        where: { id: caseId },
        data: updateData,
      });

      if (internalNote && internalNote.trim().length > 0) {
        await tx.feedbackNote.create({
          data: {
            feedbackCaseId: caseId,
            userId: session.userId,
            note: internalNote.trim(),
          },
        });
      }

      return c;
    });

    await logAuditEvent({
      userId: session.userId,
      userEmail: session.email,
      organizationId: updated.organizationId,
      action: "UPDATE_FEEDBACK_CASE",
      targetType: "FEEDBACK_CASE",
      targetId: updated.id,
      details: { status: updated.status, urgency: updated.urgency },
    });

    return NextResponse.json({ success: true, feedbackCase: updated });
  } catch (error) {
    console.error("Update feedback case error:", error);
    return NextResponse.json({ error: "บันทึกข้อเสนอแนะไม่สำเร็จ" }, { status: 500 });
  }
}
