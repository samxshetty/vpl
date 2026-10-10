import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Keeps /admin behind a login. A visitor must be signed in AND have app_metadata.role = 'admin'.
 * (Row Level Security in the database enforces the same rule on every write, so this is the
 * friendly front door, not the only lock.)
 */
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isLogin = pathname === "/admin/login";

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // Not configured yet: only the login page (which explains what's missing) is reachable.
  if (!url || !key) {
    return isLogin ? NextResponse.next() : NextResponse.redirect(new URL("/admin/login", request.url));
  }

  let response = NextResponse.next({ request });

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (cookiesToSet) => {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });

  // getUser() re-validates the session with Supabase (unlike reading the cookie), so it can't be spoofed.
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const isAdmin = user?.app_metadata?.role === "admin";

  const redirect = (to: URL) => {
    const r = NextResponse.redirect(to);
    // Carry over any refreshed session cookies.
    response.cookies.getAll().forEach((c) => r.cookies.set(c));
    return r;
  };

  if (!isAdmin && !isLogin) {
    const to = new URL("/admin/login", request.url);
    if (pathname !== "/admin") to.searchParams.set("next", pathname);
    return redirect(to);
  }
  if (isAdmin && isLogin) return redirect(new URL("/admin", request.url));

  return response;
}

export const config = {
  matcher: ["/admin", "/admin/:path*"],
};
