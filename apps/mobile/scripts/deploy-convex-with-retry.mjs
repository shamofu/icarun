import { spawn } from "node:child_process";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import path from "node:path";

const require = createRequire(import.meta.url);

const DEFAULT_OVERALL_TIMEOUT_SECONDS = 1200;
const DEFAULT_WAIT_TIMEOUT_SECONDS = 600;
const DEFAULT_POLL_INTERVAL_SECONDS = 5;
const DEFAULT_REQUEST_TIMEOUT_SECONDS = 10;
const DEFAULT_CLI_TIMEOUT_SECONDS = 300;
const DEFAULT_MAX_ATTEMPTS = 3;
const DEFAULT_RETRY_INTERVAL_SECONDS = 10;
const TERMINATION_GRACE_SECONDS = 5;

class DeadlineError extends Error {}

function positiveIntegerFromEnv(name, fallback) {
  const rawValue = process.env[name];
  if (rawValue === undefined || rawValue === "") {
    return fallback;
  }

  const parsedValue = Number(rawValue);
  if (
    !/^\d+$/.test(rawValue) ||
    !Number.isSafeInteger(parsedValue) ||
    parsedValue < 1
  ) {
    throw new Error(`${name} must be a positive integer`);
  }

  return parsedValue;
}

function remainingMilliseconds(deadline) {
  return Math.max(0, deadline - Date.now());
}

function assertTimeRemaining(deadline, operation) {
  const remaining = remainingMilliseconds(deadline);
  if (remaining === 0) {
    throw new DeadlineError(
      `Overall pre-deploy deadline expired before ${operation}`
    );
  }
  return remaining;
}

function sleepWithinDeadline(milliseconds, deadline) {
  const remaining = assertTimeRemaining(deadline, "retry delay");
  return new Promise((resolve) =>
    setTimeout(resolve, Math.min(milliseconds, remaining))
  );
}

function requiredEnv(name) {
  const value = process.env[name];
  if (value === undefined || value === "") {
    throw new Error(`${name} is required`);
  }
  return value;
}

function validateHttpUrl(name, value) {
  let parsedUrl;
  try {
    parsedUrl = new URL(value);
  } catch {
    throw new Error(`${name} must be a valid URL`);
  }

  if (!["http:", "https:"].includes(parsedUrl.protocol)) {
    throw new Error(`${name} must use HTTP or HTTPS`);
  }
  if (parsedUrl.username || parsedUrl.password) {
    throw new Error(`${name} must not include credentials`);
  }
  return parsedUrl;
}

function buildFunctionEnvironment() {
  const betterAuthSecret = requiredEnv("CONVEX_ENV_BETTER_AUTH_SECRET");
  if (betterAuthSecret.length < 32) {
    throw new Error(
      "CONVEX_ENV_BETTER_AUTH_SECRET must be at least 32 characters"
    );
  }

  const siteUrl = requiredEnv("CONVEX_ENV_SITE_URL");
  validateHttpUrl("CONVEX_ENV_SITE_URL", siteUrl);

  const appScheme = process.env.CONVEX_ENV_EXPO_APP_SCHEME ?? "icarun";
  if (!/^[a-z][a-z0-9+.-]*$/i.test(appScheme)) {
    throw new Error("CONVEX_ENV_EXPO_APP_SCHEME must be a valid URL scheme");
  }

  const environment = {
    BETTER_AUTH_SECRET: betterAuthSecret,
    SITE_URL: siteUrl,
    EXPO_APP_SCHEME: appScheme
  };

  const openAiApiKey = process.env.CONVEX_ENV_OPENAI_API_KEY;
  if (openAiApiKey) {
    environment.OPENAI_API_KEY = openAiApiKey;
  }

  const openAiBaseUrl = process.env.CONVEX_ENV_OPENAI_BASE_URL;
  if (openAiBaseUrl !== undefined && openAiBaseUrl !== "") {
    validateHttpUrl("CONVEX_ENV_OPENAI_BASE_URL", openAiBaseUrl);
    environment.OPENAI_BASE_URL = openAiBaseUrl;
  }

  const openAiModel = process.env.CONVEX_ENV_OPENAI_MODEL;
  if (openAiModel !== undefined && openAiModel !== "") {
    if (openAiModel.trim() === "") {
      throw new Error("CONVEX_ENV_OPENAI_MODEL must not be whitespace-only");
    }
    environment.OPENAI_MODEL = openAiModel;
  }

  return environment;
}

function encodeDotenv(environment) {
  return (
    Object.entries(environment)
      .map(([name, value]) => `${name}=${JSON.stringify(value)}`)
      .join("\n") + "\n"
  );
}

function createConvexCliEnvironment() {
  const childEnvironment = { ...process.env };

  // The deployment helper is self-hosted-only. Prevent a local .env.local or a
  // CI token from selecting an unrelated cloud/dev deployment.
  childEnvironment.CONVEX_DEPLOYMENT = "";
  childEnvironment.CONVEX_DEPLOY_KEY = "";
  childEnvironment.CONVEX_DEPLOYMENT_TOKEN = "";

  // Sync-source secrets are provided to `convex env set` over stdin instead of
  // remaining in the CLI process environment.
  const directServerSecretNames = new Set([
    "BETTER_AUTH_SECRET",
    "OPENAI_API_KEY",
    "OPENAI_BASE_URL",
    "OPENAI_MODEL",
    "INSTANCE_SECRET",
    "POSTGRES_URL",
    "POSTGRES_PASSWORD"
  ]);
  for (const name of Object.keys(childEnvironment)) {
    if (
      name.startsWith("CONVEX_ENV_") ||
      directServerSecretNames.has(name)
    ) {
      delete childEnvironment[name];
    }
  }

  return childEnvironment;
}

async function waitForConvex(
  healthUrl,
  overallDeadline,
  waitTimeoutSeconds,
  pollIntervalSeconds,
  requestTimeoutSeconds
) {
  const waitDeadline = Math.min(
    overallDeadline,
    Date.now() + waitTimeoutSeconds * 1000
  );
  let attempt = 0;
  let lastError = "not attempted";

  console.log(
    `[convex-deploy] Waiting up to ${Math.ceil(
      remainingMilliseconds(waitDeadline) / 1000
    )}s for ${healthUrl.href}`
  );

  while (remainingMilliseconds(waitDeadline) > 0) {
    attempt += 1;
    const remaining = remainingMilliseconds(waitDeadline);

    try {
      const response = await fetch(healthUrl, {
        redirect: "manual",
        signal: AbortSignal.timeout(
          Math.max(1, Math.min(requestTimeoutSeconds * 1000, remaining))
        )
      });
      const responseStatus = response.status;
      await response.body?.cancel();

      if (responseStatus === 200) {
        console.log(
          `[convex-deploy] Convex is ready after ${attempt} readiness attempt(s)`
        );
        return;
      }

      lastError = `HTTP ${responseStatus}`;
    } catch (error) {
      lastError = error instanceof Error ? error.message : String(error);
    }

    if (attempt === 1 || attempt % 6 === 0) {
      console.log(
        `[convex-deploy] Convex is not ready (attempt ${attempt}): ${lastError}`
      );
    }

    const sleepMilliseconds = Math.min(
      pollIntervalSeconds * 1000,
      remainingMilliseconds(waitDeadline)
    );
    if (sleepMilliseconds > 0) {
      await new Promise((resolve) => setTimeout(resolve, sleepMilliseconds));
    }
  }

  throw new DeadlineError(
    `Convex did not return HTTP 200 from ${healthUrl.href} before the readiness deadline (last error: ${lastError})`
  );
}

function signalChildTree(child, signal) {
  if (!child.pid || child.exitCode !== null || child.signalCode !== null) {
    return;
  }

  try {
    if (process.platform === "win32") {
      if (signal === "SIGKILL") {
        const taskkill = spawn(
          "taskkill.exe",
          ["/pid", String(child.pid), "/t", "/f"],
          { stdio: "ignore", windowsHide: true }
        );
        taskkill.unref();
      } else {
        child.kill(signal);
      }
    } else {
      process.kill(-child.pid, signal);
    }
  } catch {
    try {
      child.kill(signal);
    } catch {
      // The process may have exited between the state check and the signal.
    }
  }
}

function runConvexCli({
  args,
  input,
  label,
  mobileDirectory,
  childEnvironment,
  overallDeadline,
  cliTimeoutSeconds
}) {
  const convexPackageDirectory = path.dirname(
    require.resolve("convex/package.json")
  );
  const convexCliPath = path.join(convexPackageDirectory, "bin", "main.js");
  const commandTimeoutMilliseconds = Math.max(
    1,
    Math.min(
      cliTimeoutSeconds * 1000,
      assertTimeRemaining(overallDeadline, label)
    )
  );
  const terminationGraceMilliseconds = Math.min(
    TERMINATION_GRACE_SECONDS * 1000,
    Math.max(0, commandTimeoutMilliseconds - 1)
  );
  const gracefulTimeoutMilliseconds = Math.max(
    1,
    commandTimeoutMilliseconds - terminationGraceMilliseconds
  );

  return new Promise((resolve, reject) => {
    let timedOut = false;
    let settled = false;
    let forceKillTimer;

    const child = spawn(process.execPath, [convexCliPath, ...args], {
      cwd: mobileDirectory,
      detached: process.platform !== "win32",
      env: childEnvironment,
      stdio: [input === undefined ? "ignore" : "pipe", "inherit", "inherit"],
      windowsHide: true
    });

    const timeoutTimer = setTimeout(() => {
      timedOut = true;
      console.error(
        `[convex-deploy] ${label} reached its deadline; terminating it`
      );
      signalChildTree(child, "SIGTERM");
      forceKillTimer = setTimeout(() => {
        signalChildTree(child, "SIGKILL");
        child.unref();
        finish(
          new DeadlineError(
            `${label} timed out after ${Math.ceil(
              commandTimeoutMilliseconds / 1000
            )}s`
          )
        );
      }, terminationGraceMilliseconds);
    }, gracefulTimeoutMilliseconds);

    const finish = (error, exitCode) => {
      if (settled) return;
      settled = true;
      clearTimeout(timeoutTimer);
      if (forceKillTimer) clearTimeout(forceKillTimer);
      if (error) reject(error);
      else resolve(exitCode);
    };

    child.once("error", (error) => finish(error));
    child.once("exit", (code, signal) => {
      if (timedOut) {
        finish(
          new DeadlineError(
            `${label} timed out after ${Math.ceil(
              commandTimeoutMilliseconds / 1000
            )}s`
          )
        );
        return;
      }
      if (signal) {
        finish(new Error(`${label} was terminated by signal ${signal}`));
        return;
      }
      finish(undefined, code ?? 1);
    });

    if (input !== undefined && child.stdin) {
      child.stdin.on("error", (error) => {
        if (error.code !== "EPIPE") finish(error);
      });
      child.stdin.end(input);
    }
  });
}

async function runOperationWithRetry({
  args,
  input,
  label,
  healthUrl,
  mobileDirectory,
  childEnvironment,
  overallDeadline,
  waitTimeoutSeconds,
  pollIntervalSeconds,
  requestTimeoutSeconds,
  cliTimeoutSeconds,
  maxAttempts,
  retryIntervalSeconds
}) {
  let lastError;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    await waitForConvex(
      healthUrl,
      overallDeadline,
      waitTimeoutSeconds,
      pollIntervalSeconds,
      requestTimeoutSeconds
    );

    console.log(
      `[convex-deploy] Running ${label} (attempt ${attempt}/${maxAttempts})`
    );

    try {
      const exitCode = await runConvexCli({
        args,
        input,
        label,
        mobileDirectory,
        childEnvironment,
        overallDeadline,
        cliTimeoutSeconds
      });
      if (exitCode === 0) {
        return;
      }
      lastError = new Error(`${label} exited with code ${exitCode}`);
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      if (
        error instanceof DeadlineError &&
        remainingMilliseconds(overallDeadline) === 0
      ) {
        throw error;
      }
    }

    if (attempt < maxAttempts) {
      console.warn(
        `[convex-deploy] ${lastError.message}; retrying in ${retryIntervalSeconds}s`
      );
      await sleepWithinDeadline(
        retryIntervalSeconds * 1000,
        overallDeadline
      );
    }
  }

  throw new Error(
    `${label} failed after ${maxAttempts} attempt(s): ${lastError?.message ?? "unknown error"}`
  );
}

async function main() {
  const selfHostedUrl = requiredEnv("CONVEX_SELF_HOSTED_URL");
  requiredEnv("CONVEX_SELF_HOSTED_ADMIN_KEY");
  const targetUrl = validateHttpUrl("CONVEX_SELF_HOSTED_URL", selfHostedUrl);
  const functionEnvironment = buildFunctionEnvironment();

  const overallTimeoutSeconds = positiveIntegerFromEnv(
    "CONVEX_DEPLOY_OVERALL_TIMEOUT_SECONDS",
    DEFAULT_OVERALL_TIMEOUT_SECONDS
  );
  const waitTimeoutSeconds = positiveIntegerFromEnv(
    "CONVEX_DEPLOY_WAIT_TIMEOUT_SECONDS",
    DEFAULT_WAIT_TIMEOUT_SECONDS
  );
  const pollIntervalSeconds = positiveIntegerFromEnv(
    "CONVEX_DEPLOY_POLL_INTERVAL_SECONDS",
    DEFAULT_POLL_INTERVAL_SECONDS
  );
  const requestTimeoutSeconds = positiveIntegerFromEnv(
    "CONVEX_DEPLOY_REQUEST_TIMEOUT_SECONDS",
    DEFAULT_REQUEST_TIMEOUT_SECONDS
  );
  const cliTimeoutSeconds = positiveIntegerFromEnv(
    "CONVEX_DEPLOY_CLI_TIMEOUT_SECONDS",
    DEFAULT_CLI_TIMEOUT_SECONDS
  );
  const maxAttempts = positiveIntegerFromEnv(
    "CONVEX_DEPLOY_MAX_ATTEMPTS",
    DEFAULT_MAX_ATTEMPTS
  );
  const retryIntervalSeconds = positiveIntegerFromEnv(
    "CONVEX_DEPLOY_RETRY_INTERVAL_SECONDS",
    DEFAULT_RETRY_INTERVAL_SECONDS
  );

  const overallDeadline = Date.now() + overallTimeoutSeconds * 1000;
  const healthUrl = new URL("/version", targetUrl);
  const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
  const mobileDirectory = path.resolve(scriptDirectory, "..");
  const childEnvironment = createConvexCliEnvironment();

  console.log(
    `[convex-deploy] Pre-deploy deadline is ${overallTimeoutSeconds}s`
  );

  await runOperationWithRetry({
    args: ["env", "set", "--force"],
    input: encodeDotenv(functionEnvironment),
    label: "Convex environment sync",
    healthUrl,
    mobileDirectory,
    childEnvironment,
    overallDeadline,
    waitTimeoutSeconds,
    pollIntervalSeconds,
    requestTimeoutSeconds,
    cliTimeoutSeconds,
    maxAttempts,
    retryIntervalSeconds
  });
  console.log(
    `[convex-deploy] Synced ${Object.keys(functionEnvironment).length} Convex environment variables`
  );

  await runOperationWithRetry({
    args: ["deploy"],
    label: "Convex function deploy",
    healthUrl,
    mobileDirectory,
    childEnvironment,
    overallDeadline,
    waitTimeoutSeconds,
    pollIntervalSeconds,
    requestTimeoutSeconds,
    cliTimeoutSeconds,
    maxAttempts,
    retryIntervalSeconds
  });
  console.log("[convex-deploy] Convex functions deployed successfully");
}

main().catch((error) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`[convex-deploy] ${message}`);
  process.exitCode = 1;
});
