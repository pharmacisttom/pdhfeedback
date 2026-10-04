import { notFound, redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatThaiDate } from "@/lib/thai-date";
import ResponsesClient from "./ResponsesClient";

interface Props {
  params: { orgSlug: string };
  searchParams: {
    page?: string;
    servicePointId?: string;
    rating?: string;
    search?: string;
  };
}

export default async function ResponsesPage({ params, searchParams }: Props) {
  const { orgSlug } = params;
  const session = await getSession();
  if (!session) redirect("/login");

  const org = await prisma.organization.findUnique({
    where: { slug: orgSlug },
    include: {
      servicePoints: { where: { isArchived: false } },
    },
  });

  if (!org) notFound();

  // Scoping check for Service Manager
  let effectiveServicePointId = searchParams.servicePointId;
  if (session.activeRole === "SERVICE_MANAGER" && session.servicePointScope && session.servicePointScope.length > 0) {
    if (!effectiveServicePointId || !session.servicePointScope.includes(effectiveServicePointId)) {
      effectiveServicePointId = session.servicePointScope[0];
    }
  }

  const page = Math.max(1, parseInt(searchParams.page || "1", 10));
  const pageSize = 15;
  const skip = (page - 1) * pageSize;

  const where: any = {
    organizationId: org.id,
  };

  if (effectiveServicePointId) {
    where.servicePointId = effectiveServicePointId;
  }

  if (searchParams.rating) {
    where.overallRating = parseInt(searchParams.rating, 10);
  }

  if (searchParams.search) {
    where.commentText = {
      contains: searchParams.search,
    };
  }

  const [totalCount, responses] = await Promise.all([
    prisma.response.count({ where }),
    prisma.response.findMany({
      where,
      orderBy: { submittedAt: "desc" },
      skip,
      take: pageSize,
      include: {
        servicePoint: true,
        surveyVersion: true,
        contact: true,
        answers: {
          include: {
            question: true,
          },
        },
      },
    }),
  ]);

  const canViewContacts = Boolean(
    session.activeRole === "OWNER" ||
    session.activeRole === "ADMIN" ||
    session.canViewContacts
  );

  const formattedResponses = responses.map((r) => ({
    id: r.id,
    submittedAt: formatThaiDate(r.submittedAt, { includeTime: true }),
    servicePointName: r.servicePoint?.name || "จุดบริการทั่วไป",
    surveyTitle: r.surveyVersion.title,
    overallRating: r.overallRating,
    npsScore: r.npsScore,
    commentText: r.commentText,
    isFlagged: r.isFlagged,
    flaggedReason: r.flaggedReason,
    contact: canViewContacts && r.contact
      ? {
          name: r.contact.name,
          phone: r.contact.phone,
          email: r.contact.email,
          preferredTime: r.contact.preferredTime,
        }
      : null,
    hasContactRedacted: !canViewContacts && Boolean(r.contact),
    answers: r.answers.map((a) => ({
      questionText: a.question.questionText,
      type: a.question.type,
      ratingValue: a.ratingValue,
      textValue: a.textValue,
      booleanValue: a.booleanValue,
      selectedOptions: a.selectedOptions ? JSON.parse(a.selectedOptions) : null,
    })),
  }));

  return (
    <ResponsesClient
      orgSlug={orgSlug}
      responses={formattedResponses}
      totalCount={totalCount}
      currentPage={page}
      totalPages={Math.ceil(totalCount / pageSize)}
      servicePoints={org.servicePoints.map((s) => ({ id: s.id, name: s.name, code: s.code }))}
      selectedServicePointId={effectiveServicePointId || ""}
      selectedRating={searchParams.rating || ""}
      searchQuery={searchParams.search || ""}
      canManage={session.activeRole === "OWNER" || session.activeRole === "ADMIN"}
    />
  );
}
