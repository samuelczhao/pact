import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const code = searchParams.get("code");
  const error = searchParams.get("error");

  if (error) {
    return Response.redirect(
      new URL(`/auth/login?error=${encodeURIComponent(error)}`, request.url),
    );
  }

  if (!code) {
    return Response.redirect(new URL("/auth/login", request.url));
  }

  const supabase = await createClient();
  const { error: exchangeError } =
    await supabase.auth.exchangeCodeForSession(code);

  if (exchangeError) {
    return Response.redirect(
      new URL(
        `/auth/login?error=${encodeURIComponent(exchangeError.message)}`,
        request.url,
      ),
    );
  }

  return Response.redirect(new URL("/dashboard", request.url));
}
