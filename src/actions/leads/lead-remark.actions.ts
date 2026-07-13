"use server";
import { prisma } from "@/lib/db/prisma";
import { auth } from "@/lib/auth/auth";
import { revalidatePath } from "next/cache";

export async function addLeadRemarkAction(
  leadId: string,
  outcome: "INTERESTED" | "FOLLOW_UP" | "NOT_INTERESTED" | "DNP",
  remark: string
) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  await prisma.leadRemark.create({
    data: { leadId, actorId: session.user.id, outcome, remark: remark || null },
  });

  const statusMap: Record<string, "CONTACTED" | "NOT_INTERESTED" | "PENDING"> = {
    INTERESTED: "CONTACTED",
    FOLLOW_UP: "PENDING",
    NOT_INTERESTED: "NOT_INTERESTED",
    DNP: "PENDING",
  };
  await prisma.lead.update({ where: { id: leadId }, data: { status: statusMap[outcome] } });

  await prisma.activityLog.create({
    data: { actorId: session.user.id, action: `LEAD_CALL_${outcome}`, entityType: "Lead", entityId: leadId },
  });

  revalidatePath(`/dashboard/admin/leads/${leadId}`);
}

export async function getLeadTimeline(leadId: string) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");
  return prisma.leadRemark.findMany({
    where: { leadId },
    orderBy: { createdAt: "desc" },
    include: { actor: { select: { name: true } } },
  });
}