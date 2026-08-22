import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { getNextSalesAssignee, createWelcomeCallEntry } from "@/lib/assignment/auto-assign";
import { getSystemUserId } from "@/lib/system-user";
import { z } from "zod";

const websiteLeadSchema = z.object({
  name: z.string().min(2),
  phone: z.string().min(6),
  email: z.string().email().optional(),
  gender: z.enum(["MALE", "FEMALE", "OTHER"]).optional(),
  notes: z.string().optional(),
});

export async function POST(request: NextRequest) {
  const apiKey = request.headers.get("x-api-key");
  if (apiKey !== process.env.WEBSITE_API_KEY) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = websiteLeadSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }

  const existing = await prisma.lead.findFirst({ where: { phone: parsed.data.phone } });
  if (existing) {
    return NextResponse.json({ success: true, leadId: existing.id, note: "Lead already existed" });
  }

  const systemUserId = await getSystemUserId();
  const autoAssignedToId = await getNextSalesAssignee();

  const lead = await prisma.lead.create({
    data: {
      name: parsed.data.name,
      phone: parsed.data.phone,
      email: parsed.data.email || null,
      gender: parsed.data.gender || null,
      source: "Website",
      status: "NEW",
      notes: parsed.data.notes || null,
      createdById: systemUserId,
      assignedToId: autoAssignedToId,
    },
  });

  if (autoAssignedToId) {
    await prisma.leadAssignmentHistory.create({
      data: { leadId: lead.id, fromEmployeeId: null, toEmployeeId: autoAssignedToId, changedById: systemUserId },
    });
    await createWelcomeCallEntry({ leadId: lead.id, assignedToId: autoAssignedToId });
  }

  await prisma.activityLog.create({
    data: { actorId: systemUserId, action: "WEBSITE_LEAD_CREATED", entityType: "Lead", entityId: lead.id },
  });

  return NextResponse.json({ success: true, leadId: lead.id });
}