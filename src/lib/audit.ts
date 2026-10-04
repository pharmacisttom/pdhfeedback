import { prisma } from "./prisma";

export interface LogAuditParams {
  organizationId?: string | null;
  userId?: string | null;
  userEmail?: string | null;
  action: string;
  targetType: string;
  targetId?: string | null;
  details?: Record<string, unknown> | string;
  ipAddress?: string | null;
}

export async function logAuditEvent(params: LogAuditParams): Promise<void> {
  try {
    let detailsString: string | undefined;
    if (typeof params.details === "object" && params.details !== null) {
      // Scrub potential sensitive keys
      const safeDetails = { ...params.details };
      delete safeDetails.password;
      delete safeDetails.token;
      delete safeDetails.secret;
      delete safeDetails.apiKey;
      delete safeDetails.phone;
      delete safeDetails.idCard;
      detailsString = JSON.stringify(safeDetails);
    } else if (typeof params.details === "string") {
      detailsString = params.details;
    }

    await prisma.auditLog.create({
      data: {
        organizationId: params.organizationId || null,
        userId: params.userId || null,
        userEmail: params.userEmail || null,
        action: params.action,
        targetType: params.targetType,
        targetId: params.targetId || null,
        details: detailsString,
        ipAddress: params.ipAddress || null,
      },
    });
  } catch (error) {
    // Fail silently in audit logging to not disrupt user flows, but log warning in server console
    console.error("Audit log failed to write:", error);
  }
}
