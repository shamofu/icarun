import { Doc } from "../_generated/dataModel";

// API-facing task shape. Matches docs/api-contract.md.
export type SerializedTask = {
  id: string;
  title: string;
  description: string | null;
  status: "todo" | "in_progress" | "done" | "archived";
  priority: "low" | "medium" | "high";
  dueDate: string | null;
  tags: string[];
  createdAt: string;
  updatedAt: string;
};

// Convert a Convex task document into the API-facing task shape.
// Convex system fields (`_id`, `_creationTime`) are mapped to `id` / `createdAt`.
export function serializeTask(doc: Doc<"tasks">): SerializedTask {
  return {
    id: doc._id,
    title: doc.title,
    description: doc.description,
    status: doc.status,
    priority: doc.priority,
    dueDate: doc.dueDate,
    tags: doc.tags,
    createdAt: new Date(doc._creationTime).toISOString(),
    updatedAt: doc.updatedAt
  };
}