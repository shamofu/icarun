import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import {
  taskStatusValidator,
  taskPriorityValidator
} from "./schema";
import { serializeTask, SerializedTask } from "./lib/serializers";
import { requireUserId } from "./lib/auth";

export const list = query({
  args: {
    status: v.optional(taskStatusValidator),
    priority: v.optional(taskPriorityValidator),
    q: v.optional(v.string()),
    tag: v.optional(v.string())
  },
  handler: async (ctx, args): Promise<SerializedTask[]> => {
    const ownerId = await requireUserId(ctx);

    let docs;
    if (args.status !== undefined) {
      docs = await ctx.db
        .query("tasks")
        .withIndex("by_owner_status", (qb) =>
          qb.eq("ownerId", ownerId).eq("status", args.status!)
        )
        .collect();
    } else if (args.priority !== undefined) {
      docs = await ctx.db
        .query("tasks")
        .withIndex("by_owner_priority", (qb) =>
          qb.eq("ownerId", ownerId).eq("priority", args.priority!)
        )
        .collect();
    } else {
      docs = await ctx.db
        .query("tasks")
        .withIndex("by_owner", (qb) => qb.eq("ownerId", ownerId))
        .collect();
    }

    let tasks = docs.map(serializeTask);

    if (args.status !== undefined && args.priority !== undefined) {
      tasks = tasks.filter((t) => t.priority === args.priority);
    }
    if (args.tag !== undefined) {
      tasks = tasks.filter((t) => t.tags.includes(args.tag!));
    }
    if (args.q !== undefined && args.q.trim() !== "") {
      const needle = args.q.trim().toLowerCase();
      tasks = tasks.filter(
        (t) =>
          t.title.toLowerCase().includes(needle) ||
          (t.description ?? "").toLowerCase().includes(needle)
      );
    }

    tasks.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
    return tasks;
  }
});

export const get = query({
  args: { id: v.id("tasks") },
  handler: async (ctx, args): Promise<SerializedTask | null> => {
    const ownerId = await requireUserId(ctx);
    const doc = await ctx.db.get(args.id);
    if (!doc || doc.ownerId !== ownerId) return null;
    return serializeTask(doc);
  }
});

function nowIso(): string {
  return new Date().toISOString();
}

export const create = mutation({
  args: {
    title: v.string(),
    description: v.optional(v.union(v.string(), v.null())),
    priority: v.optional(taskPriorityValidator),
    dueDate: v.optional(v.union(v.string(), v.null())),
    tags: v.optional(v.array(v.string()))
  },
  handler: async (ctx, args): Promise<SerializedTask> => {
    const ownerId = await requireUserId(ctx);
    const id = await ctx.db.insert("tasks", {
      ownerId,
      title: args.title,
      description: args.description ?? null,
      status: "todo",
      priority: args.priority ?? "medium",
      dueDate: args.dueDate ?? null,
      tags: args.tags ?? [],
      updatedAt: nowIso()
    });
    const doc = await ctx.db.get(id);
    if (!doc) throw new Error("Failed to load created task");
    return serializeTask(doc);
  }
});

export const update = mutation({
  args: {
    id: v.id("tasks"),
    title: v.optional(v.string()),
    description: v.optional(v.union(v.string(), v.null())),
    status: v.optional(taskStatusValidator),
    priority: v.optional(taskPriorityValidator),
    dueDate: v.optional(v.union(v.string(), v.null())),
    tags: v.optional(v.array(v.string()))
  },
  handler: async (ctx, args): Promise<SerializedTask> => {
    const ownerId = await requireUserId(ctx);
    const existing = await ctx.db.get(args.id);
    if (!existing || existing.ownerId !== ownerId) throw new Error("NOT_FOUND");

    const patch: Record<string, unknown> = { updatedAt: nowIso() };
    if (args.title !== undefined) patch.title = args.title;
    if (args.description !== undefined) patch.description = args.description;
    if (args.status !== undefined) patch.status = args.status;
    if (args.priority !== undefined) patch.priority = args.priority;
    if (args.dueDate !== undefined) patch.dueDate = args.dueDate;
    if (args.tags !== undefined) patch.tags = args.tags;

    await ctx.db.patch(args.id, patch);
    const doc = await ctx.db.get(args.id);
    if (!doc || doc.ownerId !== ownerId) throw new Error("NOT_FOUND");
    return serializeTask(doc);
  }
});

export const remove = mutation({
  args: { id: v.id("tasks") },
  handler: async (ctx, args): Promise<{ ok: true }> => {
    const ownerId = await requireUserId(ctx);
    const existing = await ctx.db.get(args.id);
    if (!existing || existing.ownerId !== ownerId) throw new Error("NOT_FOUND");
    await ctx.db.delete(args.id);
    return { ok: true };
  }
});
