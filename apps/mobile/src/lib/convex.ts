import { ConvexReactClient } from "convex/react";

const convexUrl = process.env.EXPO_PUBLIC_CONVEX_URL;

if (!convexUrl) {
  console.warn(
    "EXPO_PUBLIC_CONVEX_URL is not set. Run `pnpm convex:dev` to create a " +
      "deployment and populate apps/mobile/.env.local."
  );
}

export const convex = new ConvexReactClient(convexUrl ?? "", {
  unsavedChangesWarning: false,
  expectAuth: true
});
