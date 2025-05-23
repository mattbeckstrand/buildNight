import { supabase } from "@/utils/supabaseClient";
import { NextResponse } from "next/server";

export async function POST() {
  // Find all goals where due_datetime < now, checked_in_datetime is null
  const { data: goals, error } = await supabase
    .from("goals")
    .select("id, user_id, title, due_datetime")
    .lt("due_datetime", new Date().toISOString())
    .is("checked_in_datetime", null);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  let penalized = 0;
  for (const goal of goals || []) {
    // Call the dummy penalize endpoint
    await fetch(
      `${
        process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"
      }/api/penalize-missed-goals`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(goal),
      }
    );
    penalized++;
  }

  return NextResponse.json({ penalized });
}
