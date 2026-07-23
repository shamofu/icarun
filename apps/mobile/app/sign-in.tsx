import { AuthScreen } from "#/features/auth/AuthScreen";

// Always-available account screen. The root layout gates this route with
// <Stack.Protected guard={!isAuthenticated && !isLoading}>, so signed-out users
// (including deep links into protected routes) land here, and signed-in users
// are redirected away automatically once the session resolves.
export default function SignInScreen() {
  return <AuthScreen />;
}
