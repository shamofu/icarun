import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { colors, spacing, statusLabel } from "#/theme";

const STATUSES: Array<"todo" | "in_progress" | "done" | "archived"> = [
  "todo",
  "in_progress",
  "done",
  "archived"
];

const PRIORITIES: Array<"low" | "medium" | "high"> = ["low", "medium", "high"];

export default function TaskDetailScreen() {
  const params = useLocalSearchParams<{ id: string }>();
  const taskId = params.id as Id<"tasks">;

  const task = useQuery(api.tasks.get, { id: taskId });
  const updateTask = useMutation(api.tasks.update);
  const removeTask = useMutation(api.tasks.remove);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (task) {
      setTitle(task.title);
      setDescription(task.description ?? "");
    }
  }, [task?.id]);

  if (task === undefined) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  if (task === null) {
    return (
      <View style={styles.center}>
        <Text style={styles.notFound}>タスクが見つかりません (NOT_FOUND)</Text>
        <Pressable style={styles.button} onPress={() => router.replace("/")}>
          <Text style={styles.buttonText}>一覧に戻る</Text>
        </Pressable>
      </View>
    );
  }

  async function onSave() {
    setBusy(true);
    try {
      await updateTask({
        id: taskId,
        title: title.trim(),
        description: description.trim() === "" ? null : description.trim()
      });
    } finally {
      setBusy(false);
    }
  }

  async function onSetStatus(next: (typeof STATUSES)[number]) {
    setBusy(true);
    try {
      await updateTask({ id: taskId, status: next });
    } finally {
      setBusy(false);
    }
  }

  async function onSetPriority(next: (typeof PRIORITIES)[number]) {
    setBusy(true);
    try {
      await updateTask({ id: taskId, priority: next });
    } finally {
      setBusy(false);
    }
  }

  async function onComplete() {
    await onSetStatus("done");
  }

  async function onDelete() {
    setBusy(true);
    try {
      await removeTask({ id: taskId });
      router.replace("/");
    } finally {
      setBusy(false);
    }
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.label}>Title</Text>
      <TextInput style={styles.input} value={title} onChangeText={setTitle} />

      <Text style={styles.label}>Description</Text>
      <TextInput
        style={[styles.input, styles.multiline]}
        value={description}
        onChangeText={setDescription}
        multiline
        placeholder="(なし)"
        placeholderTextColor={colors.textMuted}
      />

      <Text style={styles.label}>Status</Text>
      <View style={styles.chipRow}>
        {STATUSES.map((s) => (
          <Pressable
            key={s}
            style={[styles.chip, task.status === s && styles.chipActive]}
            onPress={() => onSetStatus(s)}
            disabled={busy}
          >
            <Text style={[styles.chipText, task.status === s && styles.chipTextActive]}>
              {statusLabel[s]}
            </Text>
          </Pressable>
        ))}
      </View>

      <Text style={styles.label}>Priority</Text>
      <View style={styles.chipRow}>
        {PRIORITIES.map((p) => (
          <Pressable
            key={p}
            style={[styles.chip, task.priority === p && styles.chipActive]}
            onPress={() => onSetPriority(p)}
            disabled={busy}
          >
            <Text style={[styles.chipText, task.priority === p && styles.chipTextActive]}>
              {p}
            </Text>
          </Pressable>
        ))}
      </View>

      <View style={styles.actions}>
        <Pressable style={[styles.button, styles.save]} onPress={onSave} disabled={busy}>
          <Text style={styles.buttonText}>Save</Text>
        </Pressable>
        <Pressable style={[styles.button, styles.complete]} onPress={onComplete} disabled={busy}>
          <Text style={styles.buttonText}>Complete</Text>
        </Pressable>
        <Pressable style={[styles.button, styles.delete]} onPress={onDelete} disabled={busy}>
          <Text style={styles.buttonText}>Delete</Text>
        </Pressable>
      </View>

      {busy ? <ActivityIndicator color={colors.primary} style={{ marginTop: spacing.md }} /> : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.lg, gap: spacing.sm },
  center: { flex: 1, backgroundColor: colors.bg, alignItems: "center", justifyContent: "center", gap: spacing.md },
  notFound: { color: colors.textMuted },
  label: { color: colors.textMuted, marginTop: spacing.sm, fontSize: 13 },
  input: {
    backgroundColor: colors.surfaceAlt,
    color: colors.text,
    borderRadius: 8,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border
  },
  multiline: { minHeight: 90, textAlignVertical: "top" },
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: spacing.xs },
  chip: {
    backgroundColor: colors.surfaceAlt,
    borderRadius: 16,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderWidth: 1,
    borderColor: colors.border
  },
  chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { color: colors.textMuted, fontSize: 13 },
  chipTextActive: { color: "#fff", fontWeight: "600" },
  actions: { flexDirection: "row", gap: spacing.sm, marginTop: spacing.lg },
  button: {
    flex: 1,
    borderRadius: 8,
    paddingVertical: spacing.md,
    alignItems: "center"
  },
  save: { backgroundColor: colors.primary },
  complete: { backgroundColor: colors.success },
  delete: { backgroundColor: colors.danger },
  buttonText: { color: "#fff", fontWeight: "700" }
});