import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import {
  taskStatusValidator,
  taskPriorityValidator
} from "./schema";
import { serializeTask, SerializedTask } from "./lib/serializers";

// ---------------------------------------------------------------------------
// Queries
// ---------------------------------------------------------------------------

// List tasks with optional filters. Mirrors GET /api/tasks query params.
export const list = query({
  args: {
    status: v.optional(taskStatusValidator),
    priority: v.optional(taskPriorityValidator),
    q: v.optional(v.string()),
    tag: v.optional(v.string())
  },
  handler: async (ctx, args): Promise<SerializedTask[]> => {
    let docs;
    if (args.status !== undefined) {
      const status = args.status;
      docs = await ctx.db
        .query("tasks")
        .withIndex("by_status", (qb) => qb.eq("status", status))
        .collect();
    } else if (args.priority !== undefined) {
      const priority = args.priority;
      docs = await ctx.db
        .query("tasks")
        .withIndex("by_priority", (qb) => qb.eq("priority", priority))
        .collect();
    } else {
      docs = await ctx.db.query("tasks").collect();
    }

    let tasks = docs.map(serializeTask);

    // Apply remaining filters in memory (simple + fine for MVP scale).
    if (args.status !== undefined && args.priority !== undefined) {
      tasks = tasks.filter((t) => t.priority === args.priority);
    }
    if (args.tag !== undefined) {
      const tag = args.tag;
      tasks = tasks.filter((t) => t.tags.includes(tag));
    }
    if (args.q !== undefined && args.q.trim() !== "") {
      const needle = args.q.trim().toLowerCase();
      tasks = tasks.filter(
        (t) =>
          t.title.toLowerCase().includes(needle) ||
          (t.description ?? "").toLowerCase().includes(needle)
      );
    }

    // Newest first.
    tasks.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
    return tasks;
  }
});

// Get a single task by id. Returns null if not found.
export const get = query({
  args: { id: v.id("tasks") },
  handler: async (ctx, args): Promise<SerializedTask | null> => {
    const doc = await ctx.db.get(args.id);
    return doc ? serializeTask(doc) : null;
  }
});
// ---------------------------------------------------------------------------
// Mutations
// ---------------------------------------------------------------------------

function nowIso(): string {
  return new Date().toISOString();
}

// Create a task. Mirrors POST /api/tasks.
export const create = mutation({
  args: {
    title: v.string(),
    description: v.optional(v.union(v.string(), v.null())),
    priority: v.optional(taskPriorityValidator),
    dueDate: v.optional(v.union(v.string(), v.null())),
    tags: v.optional(v.array(v.string()))
  },
  handler: async (ctx, args): Promise<SerializedTask> => {
    const id = await ctx.db.insert("tasks", {
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

// Update a task. Mirrors PATCH /api/tasks/:id. All fields optional.
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
    const existing = await ctx.db.get(args.id);
    if (!existing) throw new Error("NOT_FOUND");

    const patch: Record<string, unknown> = { updatedAt: nowIso() };
    if (args.title !== undefined) patch.title = args.title;
    if (args.description !== undefined) patch.description = args.description;
    if (args.status !== undefined) patch.status = args.status;
    if (args.priority !== undefined) patch.priority = args.priority;
    if (args.dueDate !== undefined) patch.dueDate = args.dueDate;
    if (args.tags !== undefined) patch.tags = args.tags;

    await ctx.db.patch(args.id, patch);
    const doc = await ctx.db.get(args.id);
    if (!doc) throw new Error("NOT_FOUND");
    return serializeTask(doc);
  }
});

// Delete a task. Mirrors DELETE /api/tasks/:id.
export const remove = mutation({
  args: { id: v.id("tasks") },
  handler: async (ctx, args): Promise<{ ok: true }> => {
    const existing = await ctx.db.get(args.id);
    if (!existing) throw new Error("NOT_FOUND");
    await ctx.db.delete(args.id);
    return { ok: true };
  }
});