// middleware.ts
import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

// 3a) Define what should be protected
// Example: protect dashboard, account, and all non-public API routes
const isProtectedRoute = createRouteMatcher([
  "/dashboard(.*)",
  "/account(.*)",
  "/carts(.*)"
]);

// 3b) Apply protection
export default clerkMiddleware(async (auth, req) => {
  if (isProtectedRoute(req)) {
    await auth.protect(); // redirects unauthenticated users to /sign-in
  }
});

// 3c) Recommended matcher from Clerk docs (covers API + skips static assets)
export const config = {
  matcher: [
    // Skip Next.js internals and static files (unless in query string)
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};
