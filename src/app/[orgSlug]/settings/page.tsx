import { notFound, redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatThaiDate } from "@/lib/thai-date";
import SettingsClient from "./SettingsClient";

interface Props {
  params: { orgSlug: string };
}

export default async function SettingsPage({ params }: Props) {
  const { orgSlug } = params;
  const session = await getSession();
  if (!session) redirect("/login");

  const org = await prisma.organization.findUnique({
    where: { slug: orgSlug },
    include: {
      notificationRules: true,
      apiKeys: {
        where: { isRevoked: false },
        orderBy: { createdAt: "desc" },
      },
      auditLogs: {
        orderBy: { timestamp: "desc" },
        take: 10,
      },
      _count: {
        select: {
          servicePoints: { where: { isArchived: false } },
          memberships: { where: { status: "ACTIVE" } },
          responses: true,
        },
      },
    },
  });

  if (!org) notFound();

  const formattedAuditLogs = org.auditLogs.map((log) => ({
    id: log.id,
    action: log.action,
    userEmail: log.userEmail || "System",
    timestamp: formatThaiDate(log.timestamp, { includeTime: true }),
    details: log.details,
  }));

  const canManage = session.activeRole === "OWNER";

  return (
    <SettingsClient
      org={org}
      stats={{
        usedServicePoints: org._count.servicePoints,
        usedUsers: org._count.memberships,
        totalResponses: org._count.responses,
      }}
      auditLogs={formattedAuditLogs}
      canManage={canManage}
    />
  );
}
