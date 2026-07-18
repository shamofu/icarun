import { query } from "./_generated/server";

// Lightweight liveness/readiness check. Mirrors the old GET /api/health.
export const check = query({
  args: {},
  handler: async () => {
    return { ok: true as const };
  }
});