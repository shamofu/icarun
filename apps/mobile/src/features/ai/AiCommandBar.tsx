import { useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View
} from "react-native";
import { useAction } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { AiTaskAction } from "@/convex/lib/aiSchemas";
import { colors, spacing } from "#/theme";

type PreviewState = {
  message: string;
  actions: AiTaskAction[];
  requiresConfirmation: boolean;
};

// AI command bar implementing the preview -> confirm -> execute flow.
// It never executes AI output immediately; the user must confirm first.
export function AiCommandBar() {
  const previewAction = useAction(api.ai.preview);
  const executeAction = useAction(api.ai.execute);

  const [input, setInput] = useState("");
  const [preview, setPreview] = useState<PreviewState | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onPreview() {
    setError(null);
    setBusy(true);
    try {
      const result = await previewAction({ input });
      setPreview(result as PreviewState);
    } catch (err) {
      setError(readableError(err));
    } finally {
      setBusy(false);
    }
  }

  async function onExecute() {
    if (!preview) return;
    setError(null);
    setBusy(true);
    try {
      await executeAction({
        actions: preview.actions,
        confirmed: true
      });
      setPreview(null);
      setInput("");
    } catch (err) {
      setError(readableError(err));
    } finally {
      setBusy(false);
    }
  }

  function onCancel() {
    setPreview(null);
    setError(null);
  }

  return (
    <View style={styles.container}>
      <View style={styles.row}>
        <TextInput
          style={styles.input}
          placeholder="AIに依頼... (例: 明日の朝9時に請求書確認を追加)"
          placeholderTextColor={colors.textMuted}
          value={input}
          onChangeText={setInput}
          editable={!busy}
          onSubmitEditing={onPreview}
        />
        <Pressable
          style={[styles.button, (busy || input.trim() === "") && styles.buttonDisabled]}
          disabled={busy || input.trim() === ""}
          onPress={onPreview}
        >
          <Text style={styles.buttonText}>Preview</Text>
        </Pressable>
      </View>

      {busy ? <ActivityIndicator color={colors.primary} style={styles.spinner} /> : null}
      {error ? <Text style={styles.error}>{error}</Text> : null}

      {preview ? (
        <View style={styles.preview}>
          <Text style={styles.previewMessage}>{preview.message}</Text>
          {preview.actions.map((action, index) => (
            <Text key={index} style={styles.actionLine}>
              {"- "}
              {describeAction(action)}
            </Text>
          ))}
          {preview.actions.length === 0 ? (
            <Text style={styles.actionLine}>(提案されたアクションはありません)</Text>
          ) : null}

          <View style={styles.previewButtons}>
            <Pressable style={[styles.button, styles.cancel]} onPress={onCancel} disabled={busy}>
              <Text style={styles.buttonText}>Cancel</Text>
            </Pressable>
            <Pressable
              style={[styles.button, (busy || preview.actions.length === 0) && styles.buttonDisabled]}
              onPress={onExecute}
              disabled={busy || preview.actions.length === 0}
            >
              <Text style={styles.buttonText}>
                {preview.requiresConfirmation ? "Confirm & Execute" : "Execute"}
              </Text>
            </Pressable>
          </View>
        </View>
      ) : null}
    </View>
  );
}

function describeAction(action: AiTaskAction): string {
  switch (action.type) {
    case "create_task":
      return "Create: " + action.payload.title;
    case "update_task":
      return "Update: " + action.payload.id;
    case "delete_task":
      return "Delete: " + action.payload.id;
    case "summarize_tasks":
      return "Summarize tasks";
    default:
      return "Unknown action";
  }
}

function readableError(err: unknown): string {
  if (err instanceof Error) return err.message;
  return "Something went wrong";
}

const styles = StyleSheet.create({
  container: { gap: spacing.sm },
  row: { flexDirection: "row", gap: spacing.sm },
  input: {
    flex: 1,
    backgroundColor: colors.surfaceAlt,
    color: colors.text,
    borderRadius: 8,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border
  },
  button: {
    backgroundColor: colors.primary,
    borderRadius: 8,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    justifyContent: "center"
  },
  buttonDisabled: { opacity: 0.5 },
  cancel: { backgroundColor: colors.surfaceAlt },
  buttonText: { color: colors.text, fontWeight: "600" },
  spinner: { marginVertical: spacing.sm },
  error: { color: colors.danger },
  preview: {
    backgroundColor: colors.surface,
    borderRadius: 10,
    padding: spacing.md,
    gap: spacing.xs,
    borderWidth: 1,
    borderColor: colors.border
  },
  previewMessage: { color: colors.text, fontWeight: "600", marginBottom: spacing.xs },
  actionLine: { color: colors.textMuted },
  previewButtons: { flexDirection: "row", gap: spacing.sm, marginTop: spacing.sm }
});