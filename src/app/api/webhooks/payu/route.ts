import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { getActiveGateway } from "@/lib/payments";

export async function POST(req: NextRequest) {
  let payload: Record<string, string> = {};

  try {
    const formData = await req.formData();
    formData.forEach((value, key) => {
      payload[key] = value.toString();
    });
  } catch (err) {
    console.error("Failed to parse PayU webhook body:", err);
    return NextResponse.redirect(new URL("/pay/invalid", req.url));
  }

  console.log("PayU webhook raw payload:", payload);

  const gateway = getActiveGateway();
  const result = await gateway.verifyWebhook(payload, {});

  console.log("PayU webhook payload:", payload);
  console.log("PayU verify result:", result);

  if (!result.isValid || !result.gatewayOrderId) {
    return NextResponse.redirect(new URL("/pay/invalid", req.url));
  }

  const offer = await prisma.paymentOffer.findFirst({
    where: { paymentOrderId: result.gatewayOrderId },
    include: { profile: true, plan: true },
  });

  console.log("Looked up offer by gatewayOrderId:", result.gatewayOrderId, "found:", !!offer);

  if (!offer) {
    return NextResponse.redirect(new URL("/pay/invalid", req.url));
  }

  // Idempotency: if this offer is already PAID, don't process again —
  // gateways can and do deliver the same webhook more than once.
  if (offer.status === "PAID") {
    return NextResponse.redirect(new URL(`/pay/${offer.token}/success`, req.url));
  }

  if (result.status === "FAILED") {
    await prisma.paymentOffer.update({
      where: { id: offer.id },
      data: { status: "FAILED" },
    });
    return NextResponse.redirect(new URL(`/pay/${offer.token}/failed`, req.url));
  }

  // Amount verification — never trust the browser, only what we stored server-side.
  if (result.amount !== null && Math.abs(result.amount - offer.finalAmount) > 0.01) {
    await prisma.activityLog.create({
      data: {
        actorId: offer.createdById,
        action: "PAYMENT_AMOUNT_MISMATCH",
        entityType: "PaymentOffer",
        entityId: offer.id,
      },
    });
    return NextResponse.redirect(new URL(`/pay/${offer.token}/failed`, req.url));
  }

  await prisma.$transaction(async (tx) => {
    let subscription = await tx.subscription.findFirst({
      where: { profileId: offer.profileId, status: "ACTIVE" },
      orderBy: { createdAt: "desc" },
    });

    if (!subscription) {
      subscription = await tx.subscription.create({
        data: {
          profileId: offer.profileId,
          planId: offer.planId,
          status: "ACTIVE",
        },
      });
    }

    const payment = await tx.payment.create({
      data: {
        subscriptionId: subscription.id,
        amount: offer.finalAmount,
        method: "PAYU",
        status: "PAID",
        transactionId: result.gatewayTransactionId,
        paidAt: new Date(),
        currency: offer.currency,
        createdById: offer.createdById,
      },
    });

    await tx.paymentOffer.update({
      where: { id: offer.id },
      data: {
        status: "PAID",
        paidAt: new Date(),
        paymentTransactionId: result.gatewayTransactionId,
        paymentId: payment.id,
      },
    });

    await tx.activityLog.create({
      data: {
        actorId: offer.createdById,
        action: "PAYMENT_SUCCESS",
        entityType: "PaymentOffer",
        entityId: offer.id,
      },
    });

    await tx.notification.create({
      data: {
        recipientId: offer.createdById,
        type: "IMPORTANT_ANNOUNCEMENT",
        content: `Payment Received: ${offer.profile.name} paid ₹${offer.finalAmount.toLocaleString("en-IN")} for ${offer.plan.name} Membership.`,
      },
    });
  });

  return NextResponse.redirect(new URL(`/pay/${offer.token}/success`, req.url));
}