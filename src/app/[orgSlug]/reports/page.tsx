import { notFound, redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import ReportsClient from "./ReportsClient";

interface Props {
  params: { orgSlug: string };
}

export default async function ReportsPage({ params }: Props) {
  const { orgSlug } = params;
  const session = await getSession();
  if (!session) redirect("/login");

  const org = await prisma.organization.findUnique({
    where: { slug: orgSlug },
    include: {
      servicePoints: { where: { isArchived: false } },
      _count: {
        select: { responses: true },
      },
    },
  });

  if (!org) notFound();

  const canExport = Boolean(
    session.activeRole === "OWNER" ||
    session.activeRole === "ADMIN" ||
    session.canExport
  );

  return (
    <ReportsClient
      org={org}
      servicePoints={org.servicePoints.map((s) => ({ id: s.id, name: s.name, code: s.code }))}
      totalResponses={org._count.responses}
      canExport={canExport}
      canViewContacts={Boolean(session.canViewContacts || session.activeRole === "OWNER" || session.activeRole === "ADMIN")}
    />
  );
}
