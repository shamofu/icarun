import { ConvexProvider } from "convex/react";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { convex } from "#/lib/convex";
import { colors } from "#/theme";

// Root layout wraps the whole app in ConvexProvider so every screen can use
// useQuery / useMutation / useAction against the Convex backend.
export default function RootLayout() {
  return (
    <ConvexProvider client={convex}>
      <StatusBar style="light" />
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
    </ConvexProvider>
  );
}