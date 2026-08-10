import betterAuth from "@convex-dev/better-auth/convex.config";
import { defineApp } from "convex/server";
import { v } from "convex/values";

const app = defineApp({
  env: {
    BETTER_AUTH_SECRET: v.string(),
    SITE_URL: v.string(),
    EXPO_APP_SCHEME: v.optional(v.string()),
    OPENAI_API_KEY: v.optional(v.string()),
    OPENAI_BASE_URL: v.optional(v.string()),
    OPENAI_MODEL: v.optional(v.string())
  }
});
app.use(betterAuth);

export default app;
