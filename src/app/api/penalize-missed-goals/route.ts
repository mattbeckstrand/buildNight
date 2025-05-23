import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const data = await req.json();
  // For now, just log the payload
  console.log("[DUMMY INSTAGRAM POST] Would penalize:", data);
  return NextResponse.json({ status: "ok" });
}
