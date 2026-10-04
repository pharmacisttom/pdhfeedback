import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import fs from "fs/promises";
import path from "path";

export async function GET(
  req: Request,
  { params }: { params: { evidenceId: string } }
) {
  try {
    const user = await getAuthUser(req);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { evidenceId } = params;

    const evidence = await prisma.paymentEvidence.findUnique({
      where: { id: evidenceId },
      include: {
        billingOrder: true,
      },
    });

    if (!evidence) {
      return NextResponse.json({ error: "ไม่พบไฟล์หลักฐาน" }, { status: 404 });
    }

    // Check authorization: Must be platform admin OR belong to the organization
    if (!user.isPlatformAdmin) {
      const membership = await prisma.membership.findUnique({
        where: {
          userId_organizationId: {
            userId: user.id,
            organizationId: evidence.billingOrder.organizationId,
          },
        },
      });

      if (!membership) {
        return NextResponse.json({ error: "Access denied" }, { status: 403 });
      }
    }

    // Read file from private storage
    // fileKey is e.g. "evidence/slip_xxx.jpg"
    const filePath = path.join(process.cwd(), "storage", evidence.fileKey);

    try {
      const fileBuffer = await fs.readFile(filePath);
      return new NextResponse(fileBuffer, {
        headers: {
          "Content-Type": evidence.mimeType,
          "Content-Disposition": `inline; filename="${evidence.fileName}"`,
          "Cache-Control": "private, no-cache, no-store, must-revalidate",
        },
      });
    } catch {
      return NextResponse.json({ error: "ไม่พบไฟล์ในระบบจัดเก็บ" }, { status: 404 });
    }
  } catch (err: any) {
    console.error("Fetch evidence error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
