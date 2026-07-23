import { createAuthClient } from "better-auth/react";
import { expoClient } from "@better-auth/expo/client";
import {
  convexClient,
  crossDomainClient
} from "@convex-dev/better-auth/client/plugins";
import type { AuthClient } from "@convex-dev/better-auth/react";
import Constants from "expo-constants";
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

const convexSiteUrl = process.env.EXPO_PUBLIC_CONVEX_SITE_URL;

if (!convexSiteUrl) {
  console.warn(
    "EXPO_PUBLIC_CONVEX_SITE_URL is not set. Better Auth HTTP routes require " +
      "the Convex site/HTTP origin, e.g. http://127.0.0.1:3211 locally."
  );
}

const scheme = Constants.expoConfig?.scheme;
const appScheme = Array.isArray(scheme) ? scheme[0] : scheme ?? "icarun";

const plugins = [
  convexClient(),
  ...(Platform.OS === "web"
    ? [crossDomainClient()]
    : [
        expoClient({
          scheme: appScheme,
          storagePrefix: appScheme,
          storage: SecureStore
        })
      ])
] as any;

export const authClient = createAuthClient({
  baseURL: convexSiteUrl ?? "",
  plugins
}) as unknown as AuthClient & ReturnType<typeof createAuthClient>;
