import { notFound, redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { SURVEY_TEMPLATES } from "@/lib/templates";
import OnboardingClient from "./OnboardingClient";

interface Props {
  params: { orgSlug: string };
}

export default async function OnboardingPage({ params }: Props) {
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

  return (
    <OnboardingClient
      org={org}
      templates={SURVEY_TEMPLATES}
      existingServicePointCount={org.servicePoints.length}
    />
  );
}
