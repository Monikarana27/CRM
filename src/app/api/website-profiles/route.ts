import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { generateProfileCode } from "@/lib/utils/profile-code";
import { z } from "zod";

const websiteProfileSchema = z.object({
  name: z.string().min(2),
  phone: z.string().min(6),
  email: z.string().email().optional(),
  gender: z.enum(["MALE", "FEMALE", "OTHER"]),
});

export async function POST(request: NextRequest) {
  const apiKey = request.headers.get("x-api-key");
  if (apiKey !== process.env.WEBSITE_API_KEY) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = websiteProfileSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }

  const profileCode = await generateProfileCode(parsed.data.gender);

  const profile = await prisma.profile.create({
    data: {
      profileCode,
      name: parsed.data.name,
      phone: parsed.data.phone,
      email: parsed.data.email || null,
      gender: parsed.data.gender,
      source: "Website",
      status: "UNASSIGNED",
      partnerPreference: { create: {} },
    },
  });

  return NextResponse.json({ success: true, profileId: profile.id, profileCode: profile.profileCode });
}