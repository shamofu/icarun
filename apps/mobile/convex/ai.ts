import { action } from "./_generated/server";
import { internal, api } from "./_generated/api";
import { v } from "convex/values";
import {
  aiCommandPreviewSchema,
  aiTaskActionSchema,
  requiresConfirmation,
  AiTaskAction
} from "./lib/aiSchemas";
import { chatJson, extractJson, OpenAiError } from "./lib/openai";
import { buildSystemPrompt, defaultPreviewMessage } from "./lib/prompt";

// Structured error carried back to the client with a stable code.
export class AiError extends Error {
  code: string;
  constructor(code: string, message: string) {
    super(message);
    this.code = code;
  }
}

// ---------------------------------------------------------------------------
// POST-equivalent: api.ai.preview
// Calls the LLM, validates output, returns proposed actions. NEVER mutates.
// ---------------------------------------------------------------------------
export const preview = action({
  args: { input: v.string() },
  handler: async (ctx, args) => {
    const input = args.input.trim();
    if (input.length === 0) {
      throw new AiError("VALIDATION_ERROR", "input must not be empty");
    }

    const tasks = await ctx.runQuery(internal.aiInternal.listForContext, {});
    const system = buildSystemPrompt(tasks, new Date().toISOString());

    let raw: string;
    try {
      raw = await chatJson([
        { role: "system", content: system },
        { role: "user", content: input }
      ]);
    } catch (err) {
      await ctx.runMutation(internal.aiInternal.logOperation, {
        input,
        status: "provider_error"
      });
      const message = err instanceof OpenAiError ? err.message : "AI provider error";
      throw new AiError("AI_PROVIDER_ERROR", message);
    }

    let parsed: unknown;
    try {
      parsed = extractJson(raw);
    } catch {
      await ctx.runMutation(internal.aiInternal.logOperation, {
        input,
        status: "parse_error"
      });
      throw new AiError("AI_PARSE_ERROR", "AI response was not valid JSON");
    }

    const result = aiCommandPreviewSchema.safeParse(parsed);
    if (!result.success) {
      await ctx.runMutation(internal.aiInternal.logOperation, {
        input,
        result: result.error.flatten(),
        status: "validation_error"
      });
      throw new AiError(
        "AI_VALIDATION_ERROR",
        "AI response did not match the expected action schema"
      );
    }

    const actions = result.data.actions;
    const message = result.data.message || defaultPreviewMessage(actions);
    const needsConfirm = requiresConfirmation(actions);

    await ctx.runMutation(internal.aiInternal.logOperation, {
      input,
      actions,
      status: "previewed"
    });

    return {
      message,
      actions,
      requiresConfirmation: needsConfirm
    };
  }
});
// ---------------------------------------------------------------------------
// POST-equivalent: api.ai.execute
// Re-validates actions, checks existence, enforces confirmation, then executes.
// ---------------------------------------------------------------------------
export const execute = action({
  args: {
    actions: v.array(v.any()),
    confirmed: v.optional(v.boolean())
  },
  handler: async (ctx, args) => {
    // Re-validate every action with Zod. Never trust the client.
    const actions: AiTaskAction[] = [];
    for (const candidate of args.actions) {
      const result = aiTaskActionSchema.safeParse(candidate);
      if (!result.success) {
        throw new AiError(
          "AI_VALIDATION_ERROR",
          "One or more actions did not match the expected schema"
        );
      }
      actions.push(result.data);
    }

    if (actions.length === 0) {
      throw new AiError("VALIDATION_ERROR", "actions must not be empty");
    }

    // Destructive / bulk actions require explicit confirmation.
    if (requiresConfirmation(actions) && args.confirmed !== true) {
      throw new AiError(
        "FORBIDDEN",
        "This operation requires confirmation (confirmed: true)"
      );
    }

    // Verify that update/delete targets exist before doing anything.
    const targetIds = actions
      .filter((a) => a.type === "update_task" || a.type === "delete_task")
      .map((a) => (a as { payload: { id: string } }).payload.id);

    if (targetIds.length > 0) {
      const existing = await ctx.runQuery(internal.aiInternal.getExistingIds, {
        ids: targetIds
      });
      const existingSet = new Set(existing);
      for (const id of targetIds) {
        if (!existingSet.has(id)) {
          throw new AiError("NOT_FOUND", "Task not found: " + id);
        }
      }
    }

    // Execute each allowed action through the public task mutations.
    const results: Array<Record<string, unknown>> = [];
    try {
      for (const actionItem of actions) {
        if (actionItem.type === "create_task") {
          const task = await ctx.runMutation(api.tasks.create, {
            title: actionItem.payload.title,
            description: actionItem.payload.description ?? null,
            priority: actionItem.payload.priority,
            dueDate: actionItem.payload.dueDate ?? null,
            tags: actionItem.payload.tags
          });
          results.push({ type: "create_task", taskId: task.id });
        } else if (actionItem.type === "update_task") {
          const task = await ctx.runMutation(api.tasks.update, {
            id: actionItem.payload.id as any,
            title: actionItem.payload.title,
            description: actionItem.payload.description ?? undefined,
            status: actionItem.payload.status,
            priority: actionItem.payload.priority,
            dueDate: actionItem.payload.dueDate ?? undefined,
            tags: actionItem.payload.tags
          });
          results.push({ type: "update_task", taskId: task.id });
        } else if (actionItem.type === "delete_task") {
          await ctx.runMutation(api.tasks.remove, {
            id: actionItem.payload.id as any
          });
          results.push({ type: "delete_task", taskId: actionItem.payload.id });
        } else if (actionItem.type === "summarize_tasks") {
          // Summaries are read-only and produce no mutation.
          results.push({ type: "summarize_tasks" });
        }
      }
    } catch (err) {
      await ctx.runMutation(internal.aiInternal.logOperation, {
        input: "",
        actions,
        result: { error: String(err) },
        status: "execution_error"
      });
      if (err instanceof AiError) throw err;
      throw new AiError("DATABASE_ERROR", "Failed to execute actions");
    }

    await ctx.runMutation(internal.aiInternal.logOperation, {
      input: "",
      actions,
      result: results,
      status: "executed"
    });

    return { ok: true, results };
  }
});