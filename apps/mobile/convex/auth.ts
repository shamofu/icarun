import { createClient, type GenericCtx } from "@convex-dev/better-auth";
import { convex, crossDomain } from "@convex-dev/better-auth/plugins";
import { expo } from "@better-auth/expo";
import { betterAuth, type BetterAuthOptions } from "better-auth/minimal";
import { components } from "./_generated/api";
import type { DataModel } from "./_generated/dataModel";
import { query } from "./_generated/server";
import authConfig from "./auth.config";

export const authComponent = createClient<DataModel>(components.betterAuth);

const siteUrl = process.env.SITE_URL;
const appScheme = process.env.EXPO_APP_SCHEME ?? "icarun";

export const createAuthOptions = (ctx: GenericCtx<DataModel>) => {
  const trustedOrigins = [appScheme + "://"];
  if (siteUrl) trustedOrigins.push(siteUrl);

  return {
    baseURL: process.env.CONVEX_SITE_URL ?? process.env.CONVEX_SITE_ORIGIN,
    trustedOrigins,
    database: authComponent.adapter(ctx),
    emailAndPassword: {
      enabled: true,
      requireEmailVerification: false
    },
    plugins: [
      expo(),
      convex({ authConfig }),
      ...(siteUrl ? [crossDomain({ siteUrl })] : [])
    ]
  } satisfies BetterAuthOptions;
};

export const createAuth = (ctx: GenericCtx<DataModel>) => {
  return betterAuth(createAuthOptions(ctx));
};

export const getCurrentUser = query({
  args: {},
  handler: async (ctx) => {
    return authComponent.safeGetAuthUser(ctx);
  }
});

export const { getAuthUser } = authComponent.clientApi();
