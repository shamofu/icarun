import { z } from "zod";

// Zod schemas used to validate AI (LLM) output before anything is executed.
// The AI must only ever propose these structured actions. Unknown action types
// are rejected. The AI never touches the database and never emits SQL.

export const taskStatusSchema = z.enum([
  "todo",
  "in_progress",
  "done",
  "archived"
]);

export const taskPrioritySchema = z.enum(["low", "medium", "high"]);

export const createTaskActionSchema = z.object({
  type: z.literal("create_task"),
  payload: z.object({
    title: z.string().min(1),
    description: z.string().nullish(),
    priority: taskPrioritySchema.optional(),
    dueDate: z.string().nullish(),
    tags: z.array(z.string()).optional()
  })
});

export const updateTaskActionSchema = z.object({
  type: z.literal("update_task"),
  payload: z.object({
    id: z.string().min(1),
    title: z.string().min(1).optional(),
    description: z.string().nullish(),
    status: taskStatusSchema.optional(),
    priority: taskPrioritySchema.optional(),
    dueDate: z.string().nullish(),
    tags: z.array(z.string()).optional()
  })
});

export const deleteTaskActionSchema = z.object({
  type: z.literal("delete_task"),
  payload: z.object({
    id: z.string().min(1)
  })
});

export const summarizeTasksActionSchema = z.object({
  type: z.literal("summarize_tasks"),
  payload: z.object({
    status: taskStatusSchema.optional()
  })
});

export const aiTaskActionSchema = z.discriminatedUnion("type", [
  createTaskActionSchema,
  updateTaskActionSchema,
  deleteTaskActionSchema,
  summarizeTasksActionSchema
]);

export const aiCommandPreviewSchema = z.object({
  message: z.string(),
  actions: z.array(aiTaskActionSchema),
  requiresConfirmation: z.boolean().optional()
});

export type AiTaskAction = z.infer<typeof aiTaskActionSchema>;
export type AiCommandPreview = z.infer<typeof aiCommandPreviewSchema>;

// Every AI execution must be explicitly confirmed by the user.
// Delete and bulk actions are especially dangerous, but even a single create or
// update still requires preview -> confirmation -> execute.
export function requiresConfirmation(actions: AiTaskAction[]): boolean {
  return actions.length > 0;
}