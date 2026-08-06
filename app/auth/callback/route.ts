import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

// Exchange the OAuth authorization code for a real Supabase session.
// Supabase redirects the browser here with ?code=... after the user
// authenticates on Google / Discord. The server client writes the session
// cookies, then we send the visitor back to the site.
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/";

  if (code) {
    const supabase = await createSupabaseServerClient();
    if (supabase) {
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      if (!error) {
        return NextResponse.redirect(`${origin}${next}`);
      }
    }
  }

  // Fallback for a missing/invalid code — keep the visitor on the site
  // instead of a dead end, and let the hero report the failure gracefully.
  return NextResponse.redirect(`${origin}/?auth=failed`);
}
