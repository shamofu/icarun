import { internalQuery, internalMutation } from "./_generated/server";
import { v } from "convex/values";
import { aiLogStatusValidator } from "./schema";
import { serializeTask } from "./lib/serializers";

// Internal (server-only) helpers used by the AI actions in convex/ai.ts.
// These are never exposed to the client directly.

// Compact task list passed to the LLM as grounding context so it can reference
// real task IDs when proposing update/delete actions.
export const listForContext = internalQuery({
  args: {},
  handler: async (ctx) => {
    const docs = await ctx.db.query("tasks").collect();
    return docs.map(serializeTask).map((t) => ({
      id: t.id,
      title: t.title,
      status: t.status,
      priority: t.priority,
      dueDate: t.dueDate,
      tags: t.tags
    }));
  }
});

// Given a list of candidate id strings, return the subset that are valid,
// existing task ids. Used to verify update/delete targets before execution.
export const getExistingIds = internalQuery({
  args: { ids: v.array(v.string()) },
  handler: async (ctx, args): Promise<string[]> => {
    const existing: string[] = [];
    for (const raw of args.ids) {
      const id = ctx.db.normalizeId("tasks", raw);
      if (!id) continue;
      const doc = await ctx.db.get(id);
      if (doc) existing.push(raw);
    }
    return existing;
  }
});

// Append an entry to the AI operation audit log.
export const logOperation = internalMutation({
  args: {
    input: v.string(),
    actions: v.optional(v.any()),
    result: v.optional(v.any()),
    status: aiLogStatusValidator
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("aiOperationLogs", {
      input: args.input,
      actions: args.actions,
      result: args.result,
      status: args.status
    });
  }
});