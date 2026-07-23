import { ConvexBetterAuthProvider } from "@convex-dev/better-auth/react";
import { useConvexAuth } from "convex/react";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import { authClient } from "#/lib/auth-client";
import { convex } from "#/lib/convex";
import { colors } from "#/theme";

export default function RootLayout() {
  return (
    <ConvexBetterAuthProvider client={convex} authClient={authClient}>
      <StatusBar style="light" />
      <RootNavigator />
    </ConvexBetterAuthProvider>
  );
}

// The root layout MUST always render a navigator (Stack/Slot) on the very first
// render, even while the auth state is still resolving. If the only navigator
// lives inside <Authenticated>, Expo Router has no mounted navigator during
// loading / signed-out states and throws "Attempted to navigate before mounting
// the Root Layout component", so no screen (including the account/sign-in
// screen) ever appears.
//
// Instead we always render <Stack> and gate routes with <Stack.Protected>:
//   - While auth is loading we keep the app group active (guard includes
//     isLoading) so an already-signed-in user's deep link (/settings,
//     /tasks/:id) is preserved, and we overlay a splash spinner. The Convex
//     client is created with `expectAuth: true`, so queries stay paused until
//     the first token and no unauthenticated data is fetched during this window.
//   - Once resolved, the guards flip: signed-in users see the app, signed-out
//     users (including those deep-linking into a protected route) are redirected
//     to the always-available sign-in screen.
function RootNavigator() {
  const { isLoading, isAuthenticated } = useConvexAuth();

  return (
    <View style={styles.root}>
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: colors.surface },
          headerTintColor: colors.text,
          contentStyle: { backgroundColor: colors.bg }
        }}
      >
        <Stack.Protected guard={isAuthenticated || isLoading}>
          <Stack.Screen name="index" options={{ title: "icarun" }} />
          <Stack.Screen name="tasks/[id]" options={{ title: "Task" }} />
          <Stack.Screen name="settings" options={{ title: "Settings" }} />
        </Stack.Protected>
        <Stack.Protected guard={!isAuthenticated && !isLoading}>
          <Stack.Screen name="sign-in" options={{ headerShown: false }} />
        </Stack.Protected>
      </Stack>

      {isLoading ? (
        <View style={styles.splash} pointerEvents="auto">
          <ActivityIndicator color={colors.primary} size="large" />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  splash: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.bg
  }
});
