// OpenAI-compatible Chat Completions client used inside Convex actions.
//
// Secrets are read from the Convex deployment environment (set via
// `npx convex env set OPENAI_API_KEY ...`). They are NEVER exposed to the
// Expo client. This module only runs inside the Node.js Convex action runtime.

export type ChatMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

export class OpenAiError extends Error {}

type ChatCompletionResponse = {
  choices?: Array<{ message?: { content?: string | null } }>;
};

// Call an OpenAI-compatible chat completions endpoint and return the raw text
// content of the first choice. Retries once without response_format when the
// provider rejects that parameter.
export async function chatJson(messages: ChatMessage[]): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY;
  const baseUrl = process.env.OPENAI_BASE_URL ?? "https://api.openai.com/v1";
  const model = process.env.OPENAI_MODEL ?? "gpt-4.1-mini";

  if (!apiKey) {
    throw new OpenAiError("OPENAI_API_KEY is not configured on the Convex deployment");
  }

  const url = baseUrl.replace(/\/+$/, "") + "/chat/completions";

  async function send(withResponseFormat: boolean): Promise<Response> {
    const body: Record<string, unknown> = {
      model,
      messages,
      temperature: 0.1
    };
    if (withResponseFormat) {
      body.response_format = { type: "json_object" };
    }
    return fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + apiKey
      },
      body: JSON.stringify(body)
    });
  }

  let res = await send(true);

  // Some OpenAI-compatible providers reject response_format. Retry without it.
  if (!res.ok && (res.status === 400 || res.status === 422)) {
    res = await send(false);
  }

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new OpenAiError(
      "AI provider error: " + res.status + " " + text.slice(0, 500)
    );
  }

  const data = (await res.json()) as ChatCompletionResponse;
  const content = data.choices?.[0]?.message?.content;
  if (!content) {
    throw new OpenAiError("AI provider returned an empty response");
  }
  return content;
}

// Extract the first JSON object from a model response. Tolerates markdown fences
// even though the system prompt forbids them.
export function extractJson(raw: string): unknown {
  const trimmed = raw.trim();
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fenced ? fenced[1].trim() : trimmed;
  return JSON.parse(candidate);
}