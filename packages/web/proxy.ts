import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

// Define which routes should be completely public/unprotected
const isPublicRoute = createRouteMatcher([
  "/cli-auth(.*)",
  "/api/cli-auth/continue(.*)",
]);

const clerkHandler = clerkMiddleware(async (auth, request) => {
  if (!isPublicRoute(request)) {
    await auth.protect();
  }
});

// Next.js 16 requires a named export called 'proxy'
export function proxy(request: any, event: any) {
  return clerkHandler(request, event);
}

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.[\\w]+$|_next/image|_next/static|favicon.ico).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
};