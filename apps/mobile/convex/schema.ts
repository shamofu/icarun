import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

// icarun Convex data model.
//
// Convex automatically adds `_id` and `_creationTime` to every document, so we
// do not declare an explicit `id` or `createdAt` column. Application code maps
// those system fields to the API-facing `id` / `createdAt` values (see
// convex/lib/serializers.ts).

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
    title: v.string(),
    description: v.union(v.string(), v.null()),
    status: taskStatusValidator,
    priority: taskPriorityValidator,
    // Stored as an ISO-8601 string or null to match the API contract.
    dueDate: v.union(v.string(), v.null()),
    tags: v.array(v.string()),
    // Application-managed update timestamp (ISO-8601 string). Creation time is
    // taken from the system `_creationTime` field.
    updatedAt: v.string()
  })
    .index("by_status", ["status"])
    .index("by_priority", ["priority"]),

  aiOperationLogs: defineTable({
    input: v.string(),
    actions: v.optional(v.any()),
    result: v.optional(v.any()),
    status: aiLogStatusValidator
  }).index("by_status", ["status"])
});