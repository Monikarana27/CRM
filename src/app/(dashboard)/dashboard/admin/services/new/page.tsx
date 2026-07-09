import { DashboardHero } from "@/components/layout/dashboard-hero";
import { prisma } from "@/lib/db/prisma";
import { createServiceAction } from "@/actions/services/service.actions";
import { AttachServiceForm } from "./attach-service-form";

export default async function NewServicePage() {
  const [profiles, plans] = await Promise.all([
    prisma.profile.findMany({
      select: { id: true, name: true, profileCode: true },
      orderBy: { name: "asc" },
    }),
    prisma.plan.findMany({
      where: { active: true },
      select: { id: true, name: true, price: true, durationDays: true },
      orderBy: { price: "asc" },
    }),
  ]);

  return (
    <div className="space-y-6">
      <DashboardHero
        title="Attach Service"
        subtitle="Assign a subscription plan to a profile."
      />
      <AttachServiceForm
        profiles={profiles}
        plans={plans}
        action={createServiceAction}
      />
    </div>
  );
}