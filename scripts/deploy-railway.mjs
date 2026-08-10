import { spawn } from "node:child_process";
import { setTimeout as delay } from "node:timers/promises";

const railwayCommand = process.platform === "win32" ? "railway.cmd" : "railway";

const requiredEnvironment = [
  "RAILWAY_TOKEN",
  "RAILWAY_PROJECT_ID",
  "RAILWAY_ENVIRONMENT_ID",
  "RAILWAY_DATABASE_SERVICE_ID",
  "RAILWAY_BACKEND_SERVICE_ID",
  "RAILWAY_DASHBOARD_SERVICE_ID",
  "RAILWAY_FRONTEND_SERVICE_ID",
  "CONVEX_API_HEALTH_URL",
  "CONVEX_SITE_HEALTH_URL",
  "DASHBOARD_HEALTH_URL",
  "FRONTEND_HEALTH_URL",
];

const missingEnvironment = requiredEnvironment.filter(
  (name) => !process.env[name]?.trim()
);
if (missingEnvironment.length > 0) {
  throw new Error(
    `Missing required GitHub Environment values: ${missingEnvironment.join(", ")}`
  );
}

const projectArguments = [
  "--project",
  process.env.RAILWAY_PROJECT_ID,
  "--environment",
  process.env.RAILWAY_ENVIRONMENT_ID,
];

const services = {
  database: process.env.RAILWAY_DATABASE_SERVICE_ID,
  backend: process.env.RAILWAY_BACKEND_SERVICE_ID,
  dashboard: process.env.RAILWAY_DASHBOARD_SERVICE_ID,
  frontend: process.env.RAILWAY_FRONTEND_SERVICE_ID,
};

function run(command, args, { capture = false, allowFailure = false } = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      env: process.env,
      shell: false,
      stdio: capture ? ["ignore", "pipe", "pipe"] : "inherit",
      windowsHide: true,
    });

    let stdout = "";
    let stderr = "";
    if (capture) {
      child.stdout.setEncoding("utf8");
      child.stderr.setEncoding("utf8");
      child.stdout.on("data", (chunk) => {
        stdout += chunk;
      });
      child.stderr.on("data", (chunk) => {
        stderr += chunk;
      });
    }

    child.once("error", reject);
    child.once("exit", (code, signal) => {
      if (code === 0 || allowFailure) {
        resolve({ code: code ?? 1, signal, stdout, stderr });
        return;
      }

      const detail = capture && stderr.trim() ? `\n${stderr.trim()}` : "";
      reject(
        new Error(
          `${command} ${args.join(" ")} exited with ${code ?? signal}${detail}`
        )
      );
    });
  });
}

async function railway(args, options) {
  return run(railwayCommand, args, options);
}

function parseJson(output, label) {
  try {
    return JSON.parse(output);
  } catch (error) {
    throw new Error(
      `${label} did not return valid JSON: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

async function validateTarget() {
  await railway(["status", ...projectArguments, "--json"], { capture: true });

  for (const [label, service] of Object.entries(services)) {
    await railway(
      [
        "deployment",
        "list",
        ...projectArguments,
        "--service",
        service,
        "--limit",
        "1",
        "--json",
      ],
      { capture: true }
    );
    console.log(`[railway] Target validated: ${label}`);
  }
}

async function deploymentStatus(service, deploymentId) {
  const { stdout } = await railway(
    [
      "deployment",
      "list",
      ...projectArguments,
      "--service",
      service,
      "--limit",
      "50",
      "--json",
    ],
    { capture: true }
  );
  const deployments = parseJson(stdout, "railway deployment list");
  if (!Array.isArray(deployments)) {
    throw new Error("railway deployment list returned a non-array response");
  }

  return deployments.find((deployment) => deployment.id === deploymentId)?.status;
}

async function printFailureLogs(service, deploymentId) {
  for (const logType of ["--build", "--deployment"]) {
    console.log(`::group::Railway ${logType.slice(2)} logs`);
    await railway(
      [
        "logs",
        deploymentId,
        ...projectArguments,
        "--service",
        service,
        logType,
        "--lines",
        "200",
      ],
      { allowFailure: true }
    );
    console.log("::endgroup::");
  }
}

async function deployAndWait(label, service, timeoutSeconds) {
  console.log(`[railway] Starting ${label}`);
  const message = `GitHub Actions ${process.env.GITHUB_RUN_ID ?? "local"}.${process.env.GITHUB_RUN_ATTEMPT ?? "1"} ${process.env.GITHUB_SHA ?? "unknown"}`;
  const { stdout } = await railway(
    [
      "up",
      ".",
      ...projectArguments,
      "--service",
      service,
      "--detach",
      "--yes",
      "--json",
      "--message",
      message,
    ],
    { capture: true }
  );
  const result = parseJson(stdout, "railway up");
  const deploymentId = result.deploymentId;
  if (typeof deploymentId !== "string" || deploymentId.length === 0) {
    throw new Error("railway up did not return a deploymentId");
  }

  console.log(`[railway] ${label} deployment: ${deploymentId}`);
  const deadline = Date.now() + timeoutSeconds * 1000;
  let lastStatus = "not-yet-visible";

  while (Date.now() < deadline) {
    const status = await deploymentStatus(service, deploymentId);
    if (status && status !== lastStatus) {
      lastStatus = status;
      console.log(`[railway] ${label} status: ${status}`);
    }

    switch (status?.toUpperCase()) {
      case "SUCCESS":
        return;
      case "FAILED":
      case "CRASHED":
      case "REMOVED":
      case "CANCELED":
      case "CANCELLED":
      case "SKIPPED":
        await printFailureLogs(service, deploymentId);
        throw new Error(`${label} deployment ended with ${status}`);
      default:
        await delay(10_000);
    }
  }

  await printFailureLogs(service, deploymentId);
  throw new Error(
    `${label} deployment did not become successful within ${timeoutSeconds}s (last status: ${lastStatus})`
  );
}

async function waitForHttp(label, rawUrl, mode, timeoutSeconds) {
  let url;
  try {
    url = new URL(rawUrl);
  } catch {
    throw new Error(`${label} health URL must be an absolute URL`);
  }
  if (url.protocol !== "https:" && url.protocol !== "http:") {
    throw new Error(`${label} health URL must use HTTP or HTTPS`);
  }

  const deadline = Date.now() + timeoutSeconds * 1000;
  let lastStatus = "no response";

  while (Date.now() < deadline) {
    try {
      const response = await fetch(url, {
        redirect: "follow",
        signal: AbortSignal.timeout(10_000),
      });
      lastStatus = `HTTP ${response.status}`;
      const ready =
        mode === "2xx"
          ? response.status >= 200 && response.status < 300
          : response.status >= 200 && response.status < 500;
      await response.body?.cancel();
      if (ready) {
        console.log(`[railway] ${label} ready: ${lastStatus}`);
        return;
      }
    } catch (error) {
      lastStatus = error instanceof Error ? error.message : String(error);
    }

    console.log(`[railway] ${label} not ready: ${lastStatus}`);
    await delay(10_000);
  }

  throw new Error(
    `${label} did not become ready within ${timeoutSeconds}s (last result: ${lastStatus})`
  );
}

async function main() {
  await validateTarget();

  await deployAndWait("database", services.database, 1_200);

  await deployAndWait("convex-backend", services.backend, 1_800);
  await waitForHttp(
    "Convex API",
    process.env.CONVEX_API_HEALTH_URL,
    "2xx",
    600
  );
  await waitForHttp(
    "Convex HTTP actions",
    process.env.CONVEX_SITE_HEALTH_URL,
    "non-5xx",
    600
  );

  await deployAndWait("convex-dashboard", services.dashboard, 1_200);
  await waitForHttp(
    "Convex dashboard",
    process.env.DASHBOARD_HEALTH_URL,
    "2xx",
    600
  );

  await deployAndWait("frontend", services.frontend, 2_400);
  await waitForHttp(
    "Frontend",
    process.env.FRONTEND_HEALTH_URL,
    "2xx",
    600
  );
  await waitForHttp(
    "Convex API final check",
    process.env.CONVEX_API_HEALTH_URL,
    "2xx",
    300
  );

  console.log("[railway] All services deployed successfully");
}

main().catch((error) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`[railway] ${message}`);
  process.exitCode = 1;
});
