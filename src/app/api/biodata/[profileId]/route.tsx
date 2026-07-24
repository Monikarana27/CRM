import { NextRequest, NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { auth } from "@/lib/auth/auth";
import { buildBiodataData } from "@/lib/biodata/build-biodata-data";
import { BiodataDocument } from "@/lib/biodata/biodata-document";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ profileId: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { profileId } = await params;
  const data = await buildBiodataData(profileId);
  if (!data) {
    return NextResponse.json({ error: "Profile not found" }, { status: 404 });
  }

  const buffer = await renderToBuffer(<BiodataDocument data={data} />);

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${data.profileCode}-biodata.pdf"`,
    },
  });
}