/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as ai from "../ai.js";
import type * as aiInternal from "../aiInternal.js";
import type * as health from "../health.js";
import type * as lib_aiSchemas from "../lib/aiSchemas.js";
import type * as lib_openai from "../lib/openai.js";
import type * as lib_prompt from "../lib/prompt.js";
import type * as lib_serializers from "../lib/serializers.js";
import type * as tasks from "../tasks.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  ai: typeof ai;
  aiInternal: typeof aiInternal;
  health: typeof health;
  "lib/aiSchemas": typeof lib_aiSchemas;
  "lib/openai": typeof lib_openai;
  "lib/prompt": typeof lib_prompt;
  "lib/serializers": typeof lib_serializers;
  tasks: typeof tasks;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
