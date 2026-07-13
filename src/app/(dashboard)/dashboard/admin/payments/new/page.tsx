import { DashboardHero } from "@/components/layout/dashboard-hero";
import { prisma } from "@/lib/db/prisma";
import { createPaymentAction } from "@/actions/payments/payment.actions";
import { RecordPaymentForm } from "./record-payment-form";

export default async function NewPaymentPage() {
  const services = await prisma.subscription.findMany({
    include: {
      profile: { select: { id: true, name: true, profileCode: true } },
      plan: { select: { id: true, name: true, price: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <DashboardHero
        title="Record Payment"
        subtitle="Log a payment against an active service."
      />
      <RecordPaymentForm services={services} action={createPaymentAction} />
    </div>
  );
}
