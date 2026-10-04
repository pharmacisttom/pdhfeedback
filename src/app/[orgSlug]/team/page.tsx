import { notFound, redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatThaiDate } from "@/lib/thai-date";
import TeamClient from "./TeamClient";

interface Props {
  params: { orgSlug: string };
}

export default async function TeamPage({ params }: Props) {
  const { orgSlug } = params;
  const session = await getSession();
  if (!session) redirect("/login");

  const org = await prisma.organization.findUnique({
    where: { slug: orgSlug },
    include: {
      servicePoints: { where: { isArchived: false } },
      memberships: {
        where: { status: "ACTIVE" },
        include: {
          user: true,
        },
      },
    },
  });

  if (!org) notFound();

  const formattedMembers = org.memberships.map((m) => ({
    id: m.id,
    userId: m.user.id,
    fullName: m.user.fullName,
    email: m.user.email,
    role: m.role,
    servicePointScope: m.servicePointScope ? JSON.parse(m.servicePointScope) : null,
    canExport: m.canExport,
    canViewContacts: m.canViewContacts,
    joinedAt: formatThaiDate(m.createdAt, { includeTime: false }),
  }));

  const canManage = session.activeRole === "OWNER" || session.activeRole === "ADMIN";

  return (
    <TeamClient
      org={org}
      members={formattedMembers}
      servicePoints={org.servicePoints.map((s) => ({ id: s.id, name: s.name, code: s.code }))}
      currentUserId={session.userId}
      canManage={canManage}
      isOwner={session.activeRole === "OWNER"}
    />
  );
}
