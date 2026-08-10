import { spawn } from "node:child_process";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import path from "node:path";

const require = createRequire(import.meta.url);
const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const distDirectory = path.resolve(scriptDirectory, "..", "dist");
const servePackageDirectory = path.dirname(require.resolve("serve/package.json"));
const serveCliPath = path.join(servePackageDirectory, "build", "main.js");
const childEnvironment = { ...process.env };

const exactDeployOnlyNames = new Set([
  "CONVEX_SELF_HOSTED_URL",
  "CONVEX_SELF_HOSTED_ADMIN_KEY",
  "CONVEX_DEPLOYMENT",
  "CONVEX_DEPLOY_KEY",
  "CONVEX_DEPLOYMENT_TOKEN",
  "SITE_URL",
  "BETTER_AUTH_SECRET",
  "OPENAI_API_KEY",
  "OPENAI_BASE_URL",
  "OPENAI_MODEL",
  "INSTANCE_SECRET",
  "POSTGRES_URL",
  "POSTGRES_PASSWORD"
]);

let removedCount = 0;
for (const name of Object.keys(childEnvironment)) {
  if (exactDeployOnlyNames.has(name) || name.startsWith("CONVEX_ENV_")) {
    delete childEnvironment[name];
    delete process.env[name];
    removedCount += 1;
  }
}

if (removedCount > 0) {
  console.log(
    `[frontend] Removed ${removedCount} deploy-only environment variable(s) before starting the static server`
  );
}

const child = spawn(
  process.execPath,
  [serveCliPath, distDirectory, "--single"],
  {
    env: childEnvironment,
    stdio: "inherit",
    windowsHide: true
  }
);

let shutdownSignal;
const forwardSignal = (signal) => {
  shutdownSignal = signal;
  if (child.exitCode === null && child.signalCode === null) {
    child.kill(signal);
  }
};

for (const signal of ["SIGINT", "SIGTERM"]) {
  process.once(signal, () => forwardSignal(signal));
}

child.once("error", (error) => {
  console.error(`[frontend] Failed to start static server: ${error.message}`);
  process.exitCode = 1;
});

child.once("exit", (code, signal) => {
  if (shutdownSignal) {
    console.log(`[frontend] Static server stopped after ${shutdownSignal}`);
    process.exitCode = 0;
  } else if (signal) {
    console.error(`[frontend] Static server exited after signal ${signal}`);
    process.exitCode = 1;
  } else {
    process.exitCode = code ?? 1;
  }
});
