import { getAuthConfigProvider } from "@convex-dev/better-auth/auth-config";
import type { AuthConfig } from "convex/server";

// @convex-dev/better-auth expects CONVEX_SITE_URL when constructing the JWT
// issuer/JWKS URL. Self-hosted Convex deployments often document the equivalent
// value as CONVEX_SITE_ORIGIN, so mirror it when only that name is present.
const convexSiteUrl = process.env.CONVEX_SITE_URL ?? process.env.CONVEX_SITE_ORIGIN;
if (convexSiteUrl && !process.env.CONVEX_SITE_URL) {
  process.env.CONVEX_SITE_URL = convexSiteUrl;
}

export default {
  providers: [getAuthConfigProvider()]
} satisfies AuthConfig;
