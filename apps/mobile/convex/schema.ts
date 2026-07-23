import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export const taskStatusValidator = v.union(
  v.literal("todo"),
  v.literal("in_progress"),
  v.literal("done"),
  v.literal("archived")
);

export const taskPriorityValidator = v.union(
  v.literal("low"),
  v.literal("medium"),
  v.literal("high")
);

export const aiLogStatusValidator = v.union(
  v.literal("previewed"),
  v.literal("executed"),
  v.literal("rejected"),
  v.literal("parse_error"),
  v.literal("validation_error"),
  v.literal("provider_error"),
  v.literal("execution_error")
);

export default defineSchema({
  tasks: defineTable({
    ownerId: v.optional(v.string()),
    title: v.string(),
    description: v.union(v.string(), v.null()),
    status: taskStatusValidator,
    priority: taskPriorityValidator,
    dueDate: v.union(v.string(), v.null()),
    tags: v.array(v.string()),
    updatedAt: v.string()
  })
    .index("by_owner", ["ownerId"])
    .index("by_owner_status", ["ownerId", "status"])
    .index("by_owner_priority", ["ownerId", "priority"])
    .index("by_status", ["status"])
    .index("by_priority", ["priority"]),

  aiOperationLogs: defineTable({
    ownerId: v.optional(v.string()),
    input: v.string(),
    actions: v.optional(v.any()),
    result: v.optional(v.any()),
    status: aiLogStatusValidator
  })
    .index("by_owner", ["ownerId"])
    .index("by_status", ["status"])
});
