"use server";

import { prisma } from "@/lib/db/prisma";
import { auth } from "@/lib/auth/auth";
import { can } from "@/lib/permissions/can";
import { paymentSchema } from "@/lib/validations/payment.schema";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { reassignProfileToServiceOnPayment } from "@/lib/assignment/auto-assign";

async function requirePayments(minAction: "VIEW" | "CREATE" | "EDIT" | "FULL") {
  const session = await auth();
  if (!session?.user) {
    throw new Error("Unauthorized");
  }
  const allowed = await can(session.user.role, "Payments", minAction);
  if (!allowed) {
    throw new Error("Unauthorized");
  }
  return session;
}

async function logActivity(actorId: string, action: string, entityId: string) {
  await prisma.activityLog.create({
    data: { actorId, action, entityType: "Payment", entityId },
  });
}

export async function getPayments(filter?: { status?: "PAID" | "PENDING" | "FAILED" }) {
  await requirePayments("VIEW");
  return prisma.payment.findMany({
    where: filter?.status ? { status: filter.status } : {},
    orderBy: { createdAt: "desc" },
    include: {
      subscription: {
        include: {
          profile: { select: { id: true, name: true, profileCode: true } },
          plan: { select: { id: true, name: true } },
        },
      },
    },
  });
}

export async function getPaymentById(id: string) {
  await requirePayments("VIEW");
  return prisma.payment.findUnique({
    where: { id },
    include: { subscription: { include: { profile: true, plan: true } } },
  });
}

export async function createPaymentAction(
  _prevState: unknown,
  formData: FormData
) {
  const session = await requirePayments("CREATE");

  const parsed = paymentSchema.safeParse({
    subscriptionId: formData.get("subscriptionId"),
    amount: formData.get("amount"),
    method: formData.get("method") || "OTHER",
    status: formData.get("status") || "PENDING",
    transactionId: formData.get("transactionId"),
    paymentLinkUrl: formData.get("paymentLinkUrl"),
    notes: formData.get("notes"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const payment = await prisma.payment.create({
    data: {
      subscriptionId: parsed.data.subscriptionId,
      amount: parsed.data.amount,
      method: parsed.data.method,
      status: parsed.data.status,
      transactionId: parsed.data.transactionId || null,
      paymentLinkUrl: parsed.data.paymentLinkUrl || null,
      notes: parsed.data.notes || null,
      paidAt: parsed.data.status === "PAID" ? new Date() : null,
      createdById: session.user.id,
    },
  });

  await logActivity(session.user.id, "CREATE_PAYMENT", payment.id);

  if (parsed.data.status === "PAID") {
    const sub = await prisma.subscription.findUnique({
      where: { id: parsed.data.subscriptionId },
      select: { profileId: true },
    });
    if (sub) {
      await reassignProfileToServiceOnPayment(sub.profileId, session.user.id);
    }
  }

  revalidatePath("/dashboard/admin/payments");
  redirect("/dashboard/admin/payments");
}

export async function updatePaymentStatusAction(
  paymentId: string,
  status: "PAID" | "PENDING" | "FAILED"
) {
  const session = await requirePayments("EDIT");

  await prisma.payment.update({
    where: { id: paymentId },
    data: {
      status,
      paidAt: status === "PAID" ? new Date() : null,
    },
  });

  await logActivity(session.user.id, `PAYMENT_STATUS_${status}`, paymentId);

  if (status === "PAID") {
    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
      select: { subscription: { select: { profileId: true } } },
    });
    if (payment?.subscription) {
      await reassignProfileToServiceOnPayment(payment.subscription.profileId, session.user.id);
    }
  }

  revalidatePath("/dashboard/admin/payments");
}