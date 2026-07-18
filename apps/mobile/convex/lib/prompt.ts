import { AiTaskAction } from "./aiSchemas";

// System prompt for the AI task controller. Instructs the model to return only
// JSON, use only allowed action types, never emit SQL, and never invent task
// IDs. It must use existing task IDs (supplied as context) for update/delete.
export function buildSystemPrompt(
  tasks: Array<{
    id: string;
    title: string;
    status: string;
    priority: string;
    dueDate: string | null;
    tags: string[];
  }>,
  nowIso: string
): string {
  return [
    "You are icarun's task assistant.",
    "Convert the user request into structured task actions.",
    "",
    "Rules:",
    "- Return ONLY a JSON object. No markdown, no code fences, no prose.",
    "- The JSON shape is: { \"message\": string, \"actions\": AiTaskAction[] }.",
    "- Allowed action types: create_task, update_task, delete_task, summarize_tasks.",
    "- Never generate SQL.",
    "- Never invent task IDs. Use only IDs from the provided task list.",
    "- Use existing task IDs only when updating or deleting.",
    "- If unsure, return an empty actions array and ask for clarification in message.",
    "- priority is one of: low, medium, high.",
    "- status is one of: todo, in_progress, done, archived.",
    "- dueDate must be an ISO-8601 timestamp string or null.",
    "- Write message in the same language as the user input.",
    "",
    "Current time (ISO-8601): " + nowIso,
    "",
    "Existing tasks (JSON):",
    JSON.stringify(tasks)
  ].join("\n");
}

// Human-readable default preview message when the model omits one.
export function defaultPreviewMessage(actions: AiTaskAction[]): string {
  if (actions.length === 0) return "No actions were proposed.";
  return "Proposed " + actions.length + " action(s).";
}