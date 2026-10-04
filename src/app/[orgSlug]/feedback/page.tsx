import { notFound, redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatThaiDate } from "@/lib/thai-date";
import FeedbackClient from "./FeedbackClient";

interface Props {
  params: { orgSlug: string };
  searchParams: {
    status?: string;
    category?: string;
  };
}

export default async function FeedbackPage({ params, searchParams }: Props) {
  const { orgSlug } = params;
  const session = await getSession();
  if (!session) redirect("/login");

  const org = await prisma.organization.findUnique({
    where: { slug: orgSlug },
    include: {
      memberships: {
        include: { user: true },
      },
      servicePoints: { where: { isArchived: false } },
    },
  });

  if (!org) notFound();

  // Scoping check for Service Manager
  const where: any = {
    organizationId: org.id,
  };

  if (session.activeRole === "SERVICE_MANAGER" && session.servicePointScope && session.servicePointScope.length > 0) {
    where.servicePointId = { in: session.servicePointScope };
  }

  if (searchParams.status) {
    where.status = searchParams.status;
  }

  if (searchParams.category) {
    where.category = searchParams.category;
  }

  const cases = await prisma.feedbackCase.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: {
      servicePoint: true,
      assignedUser: true,
      response: {
        include: {
          contact: true,
        },
      },
      notes: {
        include: { user: true },
        orderBy: { createdAt: "asc" },
      },
    },
  });

  const formattedCases = cases.map((c) => ({
    id: c.id,
    caseNumber: c.caseNumber,
    category: c.category,
    urgency: c.urgency,
    status: c.status,
    rootCause: c.rootCause,
    correctiveAction: c.correctiveAction,
    dueDate: c.dueDate ? formatThaiDate(c.dueDate, { includeTime: false }) : null,
    createdAt: formatThaiDate(c.createdAt, { includeTime: true }),
    resolvedAt: c.resolvedAt ? formatThaiDate(c.resolvedAt, { includeTime: true }) : null,
    servicePointName: c.servicePoint?.name || "จุดบริการทั่วไป",
    assignedUser: c.assignedUser ? { id: c.assignedUser.id, name: c.assignedUser.fullName } : null,
    response: {
      rating: c.response.overallRating,
      comment: c.response.commentText,
      contact: session.canViewContacts && c.response.contact
        ? {
            name: c.response.contact.name,
            phone: c.response.contact.phone,
          }
        : null,
    },
    notes: c.notes.map((n) => ({
      id: n.id,
      note: n.note,
      authorName: n.user.fullName,
      createdAt: formatThaiDate(n.createdAt, { includeTime: true }),
    })),
  }));

  const teamMembers = org.memberships.map((m) => ({
    id: m.user.id,
    name: m.user.fullName,
    role: m.role,
  }));

  return (
    <FeedbackClient
      orgSlug={orgSlug}
      cases={formattedCases}
      teamMembers={teamMembers}
      currentStatusFilter={searchParams.status || "ALL"}
      canManage={session.activeRole !== "VIEWER"}
    />
  );
}
