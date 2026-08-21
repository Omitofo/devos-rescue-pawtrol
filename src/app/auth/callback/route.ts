/**
 * Auth callback — WP-03.
 *
 * Handles redirects from Supabase email links (magic link / OTP email).
 * Exchanges the code for a session, then redirects into the app.
 *
 * Configure in Supabase Dashboard → Authentication → URL configuration:
 *   Redirect URLs: http://localhost:3000/auth/callback
 *                  https://<production-domain>/auth/callback
 */

import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { grantElevatedWindow } from "@/lib/auth/elevated";
import { logger } from "@/lib/logger";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/";

  if (code) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && data.session) {
      // If this is an org_user, open the elevated window (email link counts as re-auth).
      const role = data.user?.app_metadata?.role as string | undefined;
      if (role === "org_user") {
        await grantElevatedWindow();
      }

      logger.info("auth.callback_ok", { userId: data.user?.id, role });
      return NextResponse.redirect(`${origin}${next}`);
    }

    logger.warn("auth.callback_failed", { message: error?.message });
  }

  // Fallback: send to login with a generic error flag
  return NextResponse.redirect(`${origin}/auth/login?error=callback`);
}
