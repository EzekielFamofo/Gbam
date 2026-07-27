import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

const isPublicRoute = createRouteMatcher([
  "/",
  "/docs(.*)",
  "/get-started(.*)",
  "/pricing(.*)",
  "/dashboard(.*)",
  "/cli-auth(.*)",
  "/auth/callback(.*)",
  "/api/cli-auth/continue(.*)",
]);

const clerkHandler = clerkMiddleware(async (auth, request) => {
  if (!isPublicRoute(request)) {
    await auth.protect();
  }
});

export function proxy(request: any, event: any) {
  return clerkHandler(request, event);
}

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.[\\w]+$|_next/image|_next/static|favicon.ico).*)",
    "/(api|trpc)(.*)",
  ],
};