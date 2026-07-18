# Product Context

icarun helps users manage tasks through both manual UI controls and natural language commands.

The user should be able to type commands such as:

```txt
明日の朝9時に請求書確認のタスクを追加して
```

The app should convert that input into a safe, structured task operation.

## User Experience Goals

The app should feel:

- fast
- simple
- predictable
- safe
- web-first
- realtime
- AI-assisted but user-controlled

## AI Interaction Model

AI should not silently change data.

The expected flow is:

```txt
User enters natural language
  -> App calls Convex preview action
  -> Convex action calls OpenAI-compatible API
  -> Convex action validates AI output
  -> App displays proposed changes
  -> User confirms
  -> Convex execute action applies validated mutations
```

## Safety Principle

The user remains in control.

AI can propose actions, but the backend validates them and the user confirms them before execution.

## Provider Flexibility

The app should support OpenAI-compatible providers through Convex deployment environment variables:

```env
OPENAI_API_KEY
OPENAI_BASE_URL
OPENAI_MODEL
```

This allows use with:

- OpenAI
- OpenRouter
- Azure OpenAI-compatible endpoints
- local OpenAI-compatible servers