import { useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { authClient } from "#/lib/auth-client";
import { colors, spacing } from "#/theme";

export default function SettingsScreen() {
  const health = useQuery(api.health.check);
  const currentUser = useQuery(api.auth.getCurrentUser);
  const convexUrl = process.env.EXPO_PUBLIC_CONVEX_URL ?? "(not set)";
  const convexSiteUrl = process.env.EXPO_PUBLIC_CONVEX_SITE_URL ?? "(not set)";
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const status =
    health === undefined ? "connecting..." : health.ok ? "connected" : "error";

  async function onSignOut() {
    setBusy(true);
    setError(null);
    try {
      const result = await authClient.signOut();
      if (result.error) {
        setError(result.error.message ?? "ログアウトに失敗しました。");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "ログアウトに失敗しました。");
    } finally {
      setBusy(false);
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Account</Text>
      <View style={styles.card}>
        <Row label="Name" value={currentUser?.name ?? "(loading...)"} />
        <Row label="Email" value={currentUser?.email ?? "(loading...)"} />
        {error ? <Text style={styles.error}>{error}</Text> : null}
        <Pressable
          style={[styles.signOutButton, busy && styles.disabled]}
          onPress={onSignOut}
          disabled={busy}
        >
          <Text style={styles.signOutText}>ログアウト</Text>
        </Pressable>
        {busy ? <ActivityIndicator color={colors.primary} /> : null}
      </View>

      <Text style={styles.heading}>Server Status</Text>
      <View style={styles.card}>
        <Row label="Convex" value={status} />
        <Row label="API URL" value={convexUrl} />
        <Row label="Auth/Site URL" value={convexSiteUrl} />
      </View>

      <Text style={styles.heading}>About</Text>
      <View style={styles.card}>
        <Text style={styles.body}>
          icarun は Expo / React Native Web と Convex で構築されたタスク管理アプリです。
        </Text>
        <Text style={styles.body}>
          データベース・API・認証・AI処理はすべて Convex バックエンド上で実行されます。
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
  body: { color: colors.text },
  signOutButton: {
    backgroundColor: colors.danger,
    borderRadius: 8,
    paddingVertical: spacing.md,
    alignItems: "center"
  },
  signOutText: { color: "#fff", fontWeight: "700" },
  disabled: { opacity: 0.5 },
  error: { color: colors.danger }
});
