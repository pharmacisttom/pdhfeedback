import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { hasPermission } from "@/lib/permissions";
import { logAuditEvent } from "@/lib/audit";

const FlagResponseSchema = z.object({
  responseId: z.string(),
  isFlagged: z.boolean(),
  reason: z.string().optional().nullable(),
});

export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session || !hasPermission(session, "canResolveFeedback")) {
      return NextResponse.json({ error: "ไม่มีสิทธิ์ดำเนินการ" }, { status: 403 });
    }

    const body = await req.json();
    const result = FlagResponseSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json({ error: "ข้อมูลไม่ถูกต้อง" }, { status: 400 });
    }

    const { responseId, isFlagged, reason } = result.data;

    const resp = await prisma.response.update({
      where: { id: responseId },
      data: {
        isFlagged,
        flaggedReason: isFlagged ? reason || "ระบุโดยผู้ดูแลระบบ" : null,
      },
    });

    await logAuditEvent({
      userId: session.userId,
      userEmail: session.email,
      organizationId: resp.organizationId,
      action: isFlagged ? "FLAG_RESPONSE_EXCLUDED" : "UNFLAG_RESPONSE_INCLUDED",
      targetType: "RESPONSE",
      targetId: resp.id,
      details: { reason, isFlagged },
    });

    return NextResponse.json({ success: true, isFlagged: resp.isFlagged });
  } catch (error) {
    console.error("Flag response error:", error);
    return NextResponse.json({ error: "เกิดข้อผิดพลาด" }, { status: 500 });
  }
}
