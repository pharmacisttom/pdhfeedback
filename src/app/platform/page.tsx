import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatThaiDate } from "@/lib/thai-date";
import PlatformClient from "./PlatformClient";

export default async function PlatformAdminPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  if (!session.isPlatformAdmin) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-3xl shadow-xl p-8 text-center border border-slate-200">
          <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl font-bold">
            🚫
          </div>
          <h1 className="text-xl font-bold text-slate-800 mb-2">เฉพาะผู้ดูแลระบบแพลตฟอร์ม</h1>
          <p className="text-xs text-slate-500 mb-6">
            คุณไม่มีสิทธิ์เข้าถึงส่วนควบคุม Platform Super Admin
          </p>
          <a
            href="/"
            className="px-5 py-2.5 rounded-xl bg-slate-800 text-white text-xs font-bold"
          >
            กลับสู่หน้าหลัก
          </a>
        </div>
      </div>
    );
  }

  // Fetch all organizations with stats
  const [totalOrgs, totalUsers, totalResponses, orgs, platformAuditLogs] = await Promise.all([
    prisma.organization.count(),
    prisma.user.count(),
    prisma.response.count(),
    prisma.organization.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        _count: {
          select: {
            servicePoints: true,
            memberships: true,
            responses: true,
          },
        },
      },
    }),
    prisma.auditLog.findMany({
      orderBy: { timestamp: "desc" },
      take: 15,
      include: { organization: true },
    }),
  ]);

  const formattedOrgs = orgs.map((o) => ({
    id: o.id,
    name: o.name,
    slug: o.slug,
    type: o.type,
    status: o.status,
    planTier: o.planTier,
    maxServicePoints: o.maxServicePoints,
    maxMonthlyResponses: o.maxMonthlyResponses,
    servicePointCount: o._count.servicePoints,
    memberCount: o._count.memberships,
    responseCount: o._count.responses,
    createdAt: formatThaiDate(o.createdAt, { includeTime: false }),
  }));

  const formattedLogs = platformAuditLogs.map((l) => ({
    id: l.id,
    action: l.action,
    userEmail: l.userEmail || "System",
    orgName: l.organization?.name || "Platform",
    timestamp: formatThaiDate(l.timestamp, { includeTime: true }),
    details: l.details,
  }));

  return (
    <PlatformClient
      totalOrgs={totalOrgs}
      totalUsers={totalUsers}
      totalResponses={totalResponses}
      organizations={formattedOrgs}
      auditLogs={formattedLogs}
      adminUser={session}
    />
  );
}
