import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

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
            request.cookies.set(name, value),
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  // Redirect ke login jika belum login dan akses dashboard
  if (!user && pathname.startsWith("/episodes") ||
      !user && pathname.startsWith("/characters") ||
      !user && pathname.startsWith("/assets") ||
      !user && pathname.startsWith("/production") ||
      !user && pathname.startsWith("/review") ||
      !user && pathname.startsWith("/publishing") ||
      !user && pathname.startsWith("/analytics")) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Redirect ke dashboard jika sudah login dan akses halaman auth
  if (user && (pathname === "/login" || pathname === "/register")) {
    return NextResponse.redirect(new URL("/episodes", request.url));
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
