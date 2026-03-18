import { type NextRequest, NextResponse } from "next/server";

const PUBLIC_ROUTES = ["/login", "/forgot-password", "/reset-password"];

/**
 * Edge Middleware: Kiểm tra auth token trước khi cho phép truy cập.
 * Vì auth dùng Zustand persist (localStorage), middleware chạy ở Edge
 * không đọc được localStorage. Ta dùng cookie 'noble-cert-auth' (được set
 * bởi Zustand persist storage) để kiểm tra nhanh tại Edge Runtime.
 *
 * Nếu không có cookie → redirect về /login.
 * Nếu đang ở /login mà đã có cookie → redirect về /dashboard.
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const authCookie = request.cookies.get("noble-cert-auth");
  const isAuthenticated = Boolean(authCookie?.value);

  const isPublicRoute = PUBLIC_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(route + "/"),
  );

  if (!isAuthenticated && !isPublicRoute) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("from", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (isAuthenticated && pathname === "/login") {
    return NextResponse.redirect(new URL("/courses", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths EXCEPT:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico
     * - api routes (nếu có)
     */
    "/((?!_next/static|_next/image|favicon.ico|api/).*)",
  ],
};
