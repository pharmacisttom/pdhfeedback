import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { authenticateApiKey, apiError } from "@/lib/api-auth";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    let orgId: string | null = null;
    let servicePointScope: string[] | null = null;

    const authHeader = req.headers.get("authorization");
    if (authHeader?.startsWith("Bearer ")) {
      // Authenticate via Bearer API Key with scope 'service_points:read'
      const authResult = await authenticateApiKey(req, "service_points:read");
      if (!authResult.success) {
        return authResult.response;
      }
      orgId = authResult.organizationId;
      if (authResult.servicePointId) {
        servicePointScope = [authResult.servicePointId];
      }
    } else {
      // Fallback to active session
      const session = await getSession();
      if (!session || !session.activeOrgId) {
        return apiError("UNAUTHORIZED", "ต้องระบุ Bearer API Key หรือเข้าสู่ระบบ", 401);
      }
      orgId = session.activeOrgId;
      if (
        session.activeRole === "SERVICE_MANAGER" &&
        session.servicePointScope &&
        session.servicePointScope.length > 0
      ) {
        servicePointScope = session.servicePointScope;
      }
    }

    const where: any = {
      organizationId: orgId,
      isArchived: false,
    };

    if (servicePointScope && servicePointScope.length > 0) {
      where.id = { in: servicePointScope };
    }

    const servicePoints = await prisma.servicePoint.findMany({
      where,
      orderBy: { displayOrder: "asc" },
      select: {
        id: true,
        code: true,
        name: true,
        description: true,
        publicCode: true,
        branch: {
          select: { name: true, code: true },
        },
      },
    });

    return NextResponse.json({
      success: true,
      servicePoints: servicePoints.map((sp) => ({
        id: sp.id,
        code: sp.code,
        name: sp.name,
        description: sp.description,
        publicCode: sp.publicCode,
        branch: sp.branch ? { name: sp.branch.name, code: sp.branch.code } : null,
      })),
    });
  } catch (error) {
    console.error("Fetch service points error:", error);
    return apiError("INTERNAL_ERROR", "ไม่สามารถดึงข้อมูลจุดบริการได้", 500);
  }
}
