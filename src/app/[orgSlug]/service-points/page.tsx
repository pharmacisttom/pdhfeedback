import { notFound, redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import ServicePointsClient from "./ServicePointsClient";

interface Props {
  params: { orgSlug: string };
}

export default async function ServicePointsPage({ params }: Props) {
  const { orgSlug } = params;
  const session = await getSession();
  if (!session) redirect("/login");

  const org = await prisma.organization.findUnique({
    where: { slug: orgSlug },
    include: {
      branches: {
        where: { isArchived: false },
        orderBy: { code: "asc" },
      },
      servicePoints: {
        where: { isArchived: false },
        orderBy: { displayOrder: "asc" },
        include: {
          branch: true,
          _count: {
            select: { responses: true },
          },
        },
      },
    },
  });

  if (!org) notFound();

  return (
    <ServicePointsClient
      org={org}
      branches={org.branches}
      servicePoints={org.servicePoints.map((s) => ({
        id: s.id,
        code: s.code,
        name: s.name,
        description: s.description,
        displayOrder: s.displayOrder,
        publicCode: s.publicCode,
        branchId: s.branchId,
        branchName: s.branch?.name || null,
        responseCount: s._count.responses,
      }))}
      canManage={session.activeRole === "OWNER" || session.activeRole === "ADMIN"}
    />
  );
}
