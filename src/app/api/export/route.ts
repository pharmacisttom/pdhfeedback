import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { hasPermission } from "@/lib/permissions";
import { generateSafeCsv } from "@/lib/anti-injection";
import { getDateRangePreset, formatThaiDate } from "@/lib/thai-date";
import { logAuditEvent } from "@/lib/audit";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return new Response("Unauthorized", { status: 401 });
    }

    if (!hasPermission(session, "canExport")) {
      return new Response("Forbidden: You do not have export permission", { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const orgSlug = searchParams.get("orgSlug");
    const rangePreset = (searchParams.get("range") as any) || "30d";
    const servicePointId = searchParams.get("servicePointId");

    const org = await prisma.organization.findUnique({
      where: { slug: orgSlug || session.activeOrgSlug || "" },
    });

    if (!org) return new Response("Organization not found", { status: 404 });

    const format = (searchParams.get("format") || "csv").toLowerCase();
    if (format === "xlsx") {
      const { requireFeature } = await import("@/lib/billing");
      const featCheck = await requireFeature(org.id, "xlsx_export");
      if (!featCheck.allowed) {
        return new Response(featCheck.error || "แพ็กเกจปัจจุบันไม่รองรับการส่งออกไฟล์ Excel (XLSX) กรุณาอัปเกรดแพ็กเกจ", { status: 403 });
      }
    }

    const { startDate, endDate } = getDateRangePreset(rangePreset);

    const where: any = {
      organizationId: org.id,
      isFlagged: false,
    };

    if (servicePointId) {
      where.servicePointId = servicePointId;
    }

    if (startDate && endDate) {
      where.submittedAt = { gte: startDate, lte: endDate };
    }

    const responses = await prisma.response.findMany({
      where,
      orderBy: { submittedAt: "desc" },
      include: {
        servicePoint: true,
        surveyVersion: true,
        contact: session.canViewContacts,
      },
    });

    // Build headers
    const headers = [
      "รหัสคำตอบ (Response ID)",
      "วันและเวลาที่ส่ง (Bangkok Time)",
      "จุดบริการ (Service Point)",
      "รหัสจุดบริการ (Code)",
      "แบบประเมิน (Survey Title)",
      "เวอร์ชัน (Version)",
      "คะแนนความพึงพอใจโดยรวม (CSAT)",
      "คะแนนความน่าจะแนะนำ (NPS)",
      "ความคิดเห็น/ข้อเสนอแนะ (Comments)",
    ];

    if (session.canViewContacts) {
      headers.push("ชื่อผู้ขอติดต่อกลับ", "เบอร์โทรศัพท์", "ช่วงเวลาที่สะดวก");
    }

    // Build safe rows
    const rows = responses.map((r) => {
      const row = [
        r.id,
        formatThaiDate(r.submittedAt, { includeTime: true }),
        r.servicePoint?.name || "จุดบริการทั่วไป",
        r.servicePoint?.code || "-",
        r.surveyVersion.title,
        `v${r.surveyVersion.versionNumber}`,
        r.overallRating !== null ? String(r.overallRating) : "-",
        r.npsScore !== null ? String(r.npsScore) : "-",
        r.commentText || "",
      ];

      if (session.canViewContacts) {
        row.push(
          r.contact?.name || "",
          r.contact?.phone || "",
          r.contact?.preferredTime || ""
        );
      }

      return row;
    });

    const csvContent = generateSafeCsv(headers, rows);

    await logAuditEvent({
      userId: session.userId,
      userEmail: session.email,
      organizationId: org.id,
      action: "EXPORT_RESPONSES_CSV",
      targetType: "EXPORT",
      details: {
        recordCount: responses.length,
        range: rangePreset,
        withContacts: Boolean(session.canViewContacts),
      },
    });

    const filename = `pdhfeedback_${org.slug}_${Date.now()}.csv`;

    return new Response(csvContent, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error("Export error:", error);
    return new Response("Export generation failed", { status: 500 });
  }
}
