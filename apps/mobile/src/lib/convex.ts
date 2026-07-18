import { ConvexReactClient } from "convex/react";

// The Convex deployment URL is public and safe to bundle into the client.
// It is written to apps/mobile/.env.local automatically by `npx convex dev`.
const convexUrl = process.env.EXPO_PUBLIC_CONVEX_URL;

if (!convexUrl) {
  // Surface a clear error during development if the URL is missing.
  console.warn(
    "EXPO_PUBLIC_CONVEX_URL is not set. Run `pnpm convex:dev` to create a " +
      "deployment and populate apps/mobile/.env.local."
  );
}

export const convex = new ConvexReactClient(convexUrl ?? "", {
  unsavedChangesWarning: false
});