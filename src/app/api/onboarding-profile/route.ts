import { supabase } from "@/utils/supabaseClient";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const { user_id, instagram_username } = await req.json();
  if (!user_id || !instagram_username) {
    return NextResponse.json(
      { error: "Missing user_id or instagram_username" },
      { status: 400 }
    );
  }
  // Upsert profile
  const { error } = await supabase.from("profiles").upsert({
    id: user_id,
    instagram_username,
  });
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ status: "ok" });
}
