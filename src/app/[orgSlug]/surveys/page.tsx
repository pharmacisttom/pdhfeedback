import { notFound, redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import SurveysListClient from "./SurveysListClient";
import { SURVEY_TEMPLATES } from "@/lib/templates";

interface Props {
  params: { orgSlug: string };
}

export default async function SurveysPage({ params }: Props) {
  const { orgSlug } = params;
  const session = await getSession();
  if (!session) redirect("/login");

  const org = await prisma.organization.findUnique({
    where: { slug: orgSlug },
    include: {
      surveys: {
        where: { isArchived: false },
        orderBy: { createdAt: "desc" },
        include: {
          versions: {
            orderBy: { versionNumber: "desc" },
            include: {
              _count: {
                select: { questions: true, responses: true },
              },
            },
          },
        },
      },
    },
  });

  if (!org) notFound();

  const formattedSurveys = org.surveys.map((s) => {
    const latestVersion = s.versions[0];
    return {
      id: s.id,
      title: s.title,
      description: s.description,
      slug: s.slug,
      category: s.category,
      currentVersion: s.currentVersion,
      latestVersionId: latestVersion?.id,
      versionNumber: latestVersion?.versionNumber || 1,
      status: latestVersion?.status || "DRAFT",
      questionCount: latestVersion?._count.questions || 0,
      responseCount: latestVersion?._count.responses || 0,
    };
  });

  return (
    <SurveysListClient
      org={org}
      surveys={formattedSurveys}
      templates={SURVEY_TEMPLATES}
      canManage={session.activeRole === "OWNER" || session.activeRole === "ADMIN"}
    />
  );
}
