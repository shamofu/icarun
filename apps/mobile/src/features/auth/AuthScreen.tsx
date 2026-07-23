import { useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View
} from "react-native";
import { authClient } from "#/lib/auth-client";
import { colors, spacing } from "#/theme";

type Mode = "signIn" | "signUp";

export function AuthScreen() {
  const [mode, setMode] = useState<Mode>("signIn");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit() {
    const cleanEmail = email.trim();
    const cleanPassword = password;
    const cleanName = name.trim();

    if (cleanEmail === "" || cleanPassword === "") {
      setError("メールアドレスとパスワードを入力してください。");
      return;
    }
    if (mode === "signUp" && cleanName === "") {
      setError("アカウント名を入力してください。");
      return;
    }

    setBusy(true);
    setError(null);
    try {
      const result =
        mode === "signIn"
          ? await authClient.signIn.email({
              email: cleanEmail,
              password: cleanPassword,
              rememberMe: true
            })
          : await authClient.signUp.email({
              name: cleanName,
              email: cleanEmail,
              password: cleanPassword
            });

      if (result.error) {
        setError(result.error.message ?? "認証に失敗しました。");
      }
    } catch (err) {
      setError(readableError(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>icarun</Text>
        <Text style={styles.subtitle}>
          {mode === "signIn"
            ? "アカウントにログインしてください。"
            : "新しいアカウントを作成してください。"}
        </Text>

        {mode === "signUp" ? (
          <TextInput
            style={styles.input}
            placeholder="名前"
            placeholderTextColor={colors.textMuted}
            value={name}
            onChangeText={setName}
            editable={!busy}
          />
        ) : null}

        <TextInput
          style={styles.input}
          placeholder="メールアドレス"
          placeholderTextColor={colors.textMuted}
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          autoCorrect={false}
          inputMode="email"
          keyboardType="email-address"
          editable={!busy}
        />
        <TextInput
          style={styles.input}
          placeholder="パスワード（8文字以上）"
          placeholderTextColor={colors.textMuted}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          editable={!busy}
          onSubmitEditing={onSubmit}
        />

        {error ? <Text style={styles.error}>{error}</Text> : null}
        {busy ? <ActivityIndicator color={colors.primary} /> : null}

        <Pressable
          style={[styles.button, busy && styles.disabled]}
          onPress={onSubmit}
          disabled={busy}
        >
          <Text style={styles.buttonText}>
            {mode === "signIn" ? "ログイン" : "登録"}
          </Text>
        </Pressable>

        <Pressable
          style={styles.switchButton}
          onPress={() => {
            setMode(mode === "signIn" ? "signUp" : "signIn");
            setError(null);
          }}
          disabled={busy}
        >
          <Text style={styles.switchText}>
            {mode === "signIn"
              ? "アカウントを作成する"
              : "既存アカウントでログインする"}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

function readableError(err: unknown): string {
  if (err instanceof Error) return err.message;
  return "認証に失敗しました。";
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.lg
  },
  card: {
    width: "100%",
    maxWidth: 420,
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    gap: spacing.md
  },
  title: { color: colors.text, fontSize: 28, fontWeight: "800", textAlign: "center" },
  subtitle: { color: colors.textMuted, textAlign: "center" },
  input: {
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
    paddingVertical: spacing.md,
    alignItems: "center"
  },
  disabled: { opacity: 0.5 },
  buttonText: { color: "#fff", fontWeight: "700" },
  switchButton: { paddingVertical: spacing.sm, alignItems: "center" },
  switchText: { color: colors.primary, fontWeight: "600" },
  error: { color: colors.danger }
});
