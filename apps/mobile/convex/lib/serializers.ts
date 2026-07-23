import { Doc } from "../_generated/dataModel";

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
