"use server";

import { prisma } from "@/lib/db/prisma";
import { auth } from "@/lib/auth/auth";
import { paymentSchema } from "@/lib/validations/payment.schema";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

async function requireStaff() {
  const session = await auth();
  if (!session?.user) {
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
  await requireStaff();
  return prisma.payment.findMany({
    where: filter?.status ? { status: filter.status } : {},
    orderBy: { createdAt: "desc" },
    include: {
      service: {
        include: {
          profile: { select: { id: true, name: true, profileCode: true } },
          plan: { select: { id: true, name: true } },
        },
      },
    },
  });
}

export async function getPaymentById(id: string) {
  await requireStaff();
  return prisma.payment.findUnique({
    where: { id },
    include: { service: { include: { profile: true, plan: true } } },
  });
}

export async function createPaymentAction(
  _prevState: unknown,
  formData: FormData
) {
  const session = await requireStaff();

  const parsed = paymentSchema.safeParse({
    serviceId: formData.get("serviceId"),
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
      serviceId: parsed.data.serviceId,
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

  revalidatePath("/dashboard/admin/payments");
  redirect("/dashboard/admin/payments");
}

export async function updatePaymentStatusAction(
  paymentId: string,
  status: "PAID" | "PENDING" | "FAILED"
) {
  const session = await requireStaff();

  await prisma.payment.update({
    where: { id: paymentId },
    data: {
      status,
      paidAt: status === "PAID" ? new Date() : null,
    },
  });

  await logActivity(session.user.id, `PAYMENT_STATUS_${status}`, paymentId);

  revalidatePath("/dashboard/admin/payments");
}