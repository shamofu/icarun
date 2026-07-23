import { internalQuery, internalMutation } from "./_generated/server";
import { v } from "convex/values";
import { aiLogStatusValidator } from "./schema";
import { serializeTask } from "./lib/serializers";

export const listForContext = internalQuery({
  args: { ownerId: v.string() },
  handler: async (ctx, args) => {
    const docs = await ctx.db
      .query("tasks")
      .withIndex("by_owner", (qb) => qb.eq("ownerId", args.ownerId))
      .collect();
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

export const getExistingIds = internalQuery({
  args: { ownerId: v.string(), ids: v.array(v.string()) },
  handler: async (ctx, args): Promise<string[]> => {
    const existing: string[] = [];
    for (const raw of args.ids) {
      const id = ctx.db.normalizeId("tasks", raw);
      if (!id) continue;
      const doc = await ctx.db.get(id);
      if (doc && doc.ownerId === args.ownerId) existing.push(raw);
    }
    return existing;
  }
});

export const logOperation = internalMutation({
  args: {
    ownerId: v.optional(v.string()),
    input: v.string(),
    actions: v.optional(v.any()),
    result: v.optional(v.any()),
    status: aiLogStatusValidator
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("aiOperationLogs", {
      ownerId: args.ownerId,
      input: args.input,
      actions: args.actions,
      result: args.result,
      status: args.status
    });
  }
});
