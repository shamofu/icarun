import { useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View
} from "react-native";
import { Link } from "expo-router";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { AiCommandBar } from "#/features/ai/AiCommandBar";
import { colors, priorityColor, spacing, statusLabel } from "#/theme";

type StatusFilter = "all" | "todo" | "in_progress" | "done" | "archived";

const STATUS_FILTERS: StatusFilter[] = [
  "all",
  "todo",
  "in_progress",
  "done",
  "archived"
];

export default function TaskListScreen() {
  const [status, setStatus] = useState<StatusFilter>("all");
  const [search, setSearch] = useState("");
  const [newTitle, setNewTitle] = useState("");

  const tasks = useQuery(api.tasks.list, {
    status: status === "all" ? undefined : status,
    q: search.trim() === "" ? undefined : search.trim()
  });
  const createTask = useMutation(api.tasks.create);

  const loading = tasks === undefined;

  const emptyLabel = useMemo(() => {
    if (loading) return "";
    return search.trim() !== ""
      ? "一致するタスクはありません"
      : "タスクはまだありません";
  }, [loading, search]);

  async function onAddTask() {
    const title = newTitle.trim();
    if (title === "") return;
    await createTask({ title });
    setNewTitle("");
  }

  return (
    <View style={styles.container}>
      <View style={styles.section}>
        <AiCommandBar />
      </View>

      <View style={styles.section}>
        <View style={styles.newRow}>
          <TextInput
            style={styles.input}
            placeholder="新しいタスクのタイトル"
            placeholderTextColor={colors.textMuted}
            value={newTitle}
            onChangeText={setNewTitle}
            onSubmitEditing={onAddTask}
          />
          <Pressable
            style={[styles.addButton, newTitle.trim() === "" && styles.disabled]}
            onPress={onAddTask}
            disabled={newTitle.trim() === ""}
          >
            <Text style={styles.addButtonText}>+ New</Text>
          </Pressable>
        </View>

        <TextInput
          style={styles.input}
          placeholder="検索..."
          placeholderTextColor={colors.textMuted}
          value={search}
          onChangeText={setSearch}
        />

        <View style={styles.filterRow}>
          {STATUS_FILTERS.map((f) => (
            <Pressable
              key={f}
              style={[styles.chip, status === f && styles.chipActive]}
              onPress={() => setStatus(f)}
            >
              <Text style={[styles.chipText, status === f && styles.chipTextActive]}>
                {f === "all" ? "All" : statusLabel[f]}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      {loading ? (
        <ActivityIndicator color={colors.primary} style={{ marginTop: spacing.xl }} />
      ) : (
        <FlatList
          data={tasks}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={<Text style={styles.empty}>{emptyLabel}</Text>}
          renderItem={({ item }) => (
            <Link href={{ pathname: "/tasks/[id]", params: { id: item.id } }} asChild>
              <Pressable style={styles.card}>
                <View style={styles.cardHeader}>
                  <Text style={styles.cardTitle} numberOfLines={1}>
                    {item.title}
                  </Text>
                  <View
                    style={[
                      styles.priorityDot,
                      { backgroundColor: priorityColor[item.priority] }
                    ]}
                  />
                </View>
                <View style={styles.cardMeta}>
                  <Text style={styles.metaText}>{statusLabel[item.status]}</Text>
                  {item.dueDate ? (
                    <Text style={styles.metaText}>
                      {new Date(item.dueDate).toLocaleDateString()}
                    </Text>
                  ) : null}
                  {item.tags.length > 0 ? (
                    <Text style={styles.metaText}>#{item.tags.join(" #")}</Text>
                  ) : null}
                </View>
              </Pressable>
            </Link>
          )}
        />
      )}

      <Link href="/settings" asChild>
        <Pressable style={styles.settingsLink}>
          <Text style={styles.settingsText}>Settings</Text>
        </Pressable>
      </Link>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg, padding: spacing.lg, gap: spacing.md },
  section: { gap: spacing.sm },
  newRow: { flexDirection: "row", gap: spacing.sm },
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
  addButton: {
    backgroundColor: colors.success,
    borderRadius: 8,
    paddingHorizontal: spacing.md,
    justifyContent: "center"
  },
  addButtonText: { color: "#fff", fontWeight: "700" },
  disabled: { opacity: 0.5 },
  filterRow: { flexDirection: "row", flexWrap: "wrap", gap: spacing.xs },
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
  listContent: { gap: spacing.sm, paddingBottom: spacing.xl },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 10,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.xs
  },
  cardHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  cardTitle: { color: colors.text, fontSize: 16, fontWeight: "600", flex: 1 },
  priorityDot: { width: 10, height: 10, borderRadius: 5, marginLeft: spacing.sm },
  cardMeta: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  metaText: { color: colors.textMuted, fontSize: 12 },
  empty: { color: colors.textMuted, textAlign: "center", marginTop: spacing.xl },
  settingsLink: { alignSelf: "center", padding: spacing.sm },
  settingsText: { color: colors.primary }
});