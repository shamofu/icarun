import {
  Authenticated,
  AuthLoading,
  Unauthenticated
} from "convex/react";
import { ConvexBetterAuthProvider } from "@convex-dev/better-auth/react";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { ActivityIndicator, View } from "react-native";
import { authClient } from "#/lib/auth-client";
import { convex } from "#/lib/convex";
import { AuthScreen } from "#/features/auth/AuthScreen";
import { colors } from "#/theme";

export default function RootLayout() {
  return (
    <ConvexBetterAuthProvider client={convex} authClient={authClient}>
      <StatusBar style="light" />
      <AuthLoading>
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.bg }}>
          <ActivityIndicator color={colors.primary} />
        </View>
      </AuthLoading>
      <Unauthenticated>
        <AuthScreen />
      </Unauthenticated>
      <Authenticated>
        <Stack
          screenOptions={{
            headerStyle: { backgroundColor: colors.surface },
            headerTintColor: colors.text,
            contentStyle: { backgroundColor: colors.bg }
          }}
        >
          <Stack.Screen name="index" options={{ title: "icarun" }} />
          <Stack.Screen name="tasks/[id]" options={{ title: "Task" }} />
          <Stack.Screen name="settings" options={{ title: "Settings" }} />
        </Stack>
      </Authenticated>
    </ConvexBetterAuthProvider>
  );
}
