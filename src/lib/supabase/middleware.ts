import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Refreshes the Supabase session on every request and enforces
 * role-based access to the (customer) and (admin) route groups.
 * Called from src/middleware.ts.
 */
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;
  const isAuthRoute = path.startsWith("/login");
  const isAdminRoute = path.startsWith("/admin");
  const isCustomerRoute =
    path.startsWith("/dashboard") ||
    path.startsWith("/catalog") ||
    path.startsWith("/quote") ||
    path.startsWith("/customization");

  if (!user && (isAdminRoute || isCustomerRoute)) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("redirectTo", path);
    return NextResponse.redirect(url);
  }

  // Catalog is the customer home page - /dashboard is still a real route,
  // just not where anyone lands by default.
  const CUSTOMER_HOME = "/catalog";
  const ADMIN_HOME = "/admin/dashboard";

  if (user && (isAdminRoute || isCustomerRoute || isAuthRoute)) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (isAdminRoute && profile?.role !== "admin") {
      const url = request.nextUrl.clone();
      url.pathname = CUSTOMER_HOME;
      return NextResponse.redirect(url);
    }
    if (isCustomerRoute && profile?.role === "admin") {
      // Admins land on the admin console, not the customer portal.
      const url = request.nextUrl.clone();
      url.pathname = ADMIN_HOME;
      return NextResponse.redirect(url);
    }
    if (isAuthRoute) {
      const url = request.nextUrl.clone();
      url.pathname = profile?.role === "admin" ? ADMIN_HOME : CUSTOMER_HOME;
      return NextResponse.redirect(url);
    }
  }

  return response;
}
