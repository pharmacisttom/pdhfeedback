import { NextResponse } from "next/server";
import { clearSessionCookie, getSession } from "@/lib/auth";
import { logAuditEvent } from "@/lib/audit";

export async function POST() {
  const session = await getSession();
  if (session) {
    await logAuditEvent({
      userId: session.userId,
      userEmail: session.email,
      organizationId: session.activeOrgId,
      action: "USER_LOGOUT",
      targetType: "AUTH",
    });
  }

  clearSessionCookie();
  return NextResponse.json({ success: true });
}
