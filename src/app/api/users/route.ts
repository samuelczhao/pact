import { createClient } from "@/lib/supabase/server";

const MAX_RESULTS = 10;

export async function GET(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q");

  let query = supabase
    .from("profiles")
    .select("id, display_name, avatar_url")
    .neq("id", user.id)
    .eq("onboarded", true)
    .limit(MAX_RESULTS);

  if (q && q.trim().length > 0) {
    query = query.ilike("display_name", `%${q.trim()}%`);
  }

  const { data, error } = await query;

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json(data);
}
