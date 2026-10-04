import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function GET() {
  try {
    const session = await getSession();
    if (!session || !session.activeOrgId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const where: any = {
      organizationId: session.activeOrgId,
      isArchived: false,
    };

    if (session.activeRole === "SERVICE_MANAGER" && session.servicePointScope && session.servicePointScope.length > 0) {
      where.id = { in: session.servicePointScope };
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

    return NextResponse.json({ success: true, servicePoints });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch service points" }, { status: 500 });
  }
}
