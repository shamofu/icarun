import { StyleSheet, Text, View } from "react-native";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { colors, spacing } from "#/theme";

export default function SettingsScreen() {
  const health = useQuery(api.health.check);
  const convexUrl = process.env.EXPO_PUBLIC_CONVEX_URL ?? "(not set)";

  const status =
    health === undefined ? "connecting..." : health.ok ? "connected" : "error";

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Server Status</Text>
      <View style={styles.card}>
        <Row label="Convex" value={status} />
        <Row label="Deployment URL" value={convexUrl} />
      </View>

      <Text style={styles.heading}>About</Text>
      <View style={styles.card}>
        <Text style={styles.body}>
          icarun は Expo / React Native Web と Convex で構築されたタスク管理アプリです。
        </Text>
        <Text style={styles.body}>
          データベース・API・AI処理はすべて Convex バックエンド上で実行されます。
        </Text>
      </View>
    </View>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue} numberOfLines={1}>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg, padding: spacing.lg, gap: spacing.sm },
  heading: { color: colors.textMuted, marginTop: spacing.md, fontSize: 13 },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 10,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.sm
  },
  row: { flexDirection: "row", justifyContent: "space-between", gap: spacing.md },
  rowLabel: { color: colors.textMuted },
  rowValue: { color: colors.text, flexShrink: 1 },
  body: { color: colors.text }
});