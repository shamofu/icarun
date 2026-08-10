import net from "node:net";

const DEFAULT_WAIT_TIMEOUT_SECONDS = 600;
const DEFAULT_POLL_INTERVAL_SECONDS = 2;
const DEFAULT_CONNECT_TIMEOUT_SECONDS = 5;

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

function connectOnce(host, port, timeoutMilliseconds) {
  return new Promise((resolve, reject) => {
    const socket = net.createConnection({ host, port });
    let settled = false;

    const finish = (error) => {
      if (settled) {
        return;
      }
      settled = true;
      socket.destroy();
      if (error) {
        reject(error);
      } else {
        resolve();
      }
    };

    socket.setTimeout(timeoutMilliseconds);
    socket.once("connect", () => finish());
    socket.once("timeout", () => finish(new Error("connection timed out")));
    socket.once("error", finish);
  });
}

function sleep(milliseconds) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

async function main() {
  const connectionString = process.env.POSTGRES_URL;
  if (!connectionString) {
    throw new Error(
      "POSTGRES_URL is required; refusing to fall back to non-production storage"
    );
  }

  let databaseUrl;
  try {
    databaseUrl = new URL(connectionString);
  } catch {
    throw new Error("POSTGRES_URL must be a valid PostgreSQL URL");
  }

  if (!["postgres:", "postgresql:"].includes(databaseUrl.protocol)) {
    throw new Error("POSTGRES_URL must use the postgres or postgresql protocol");
  }

  const host = databaseUrl.hostname.replace(/^\[|\]$/g, "");
  const port = databaseUrl.port ? Number(databaseUrl.port) : 5432;
  if (!host || !Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error("POSTGRES_URL must include a valid host and port");
  }

  const waitTimeoutSeconds = positiveIntegerFromEnv(
    "DATABASE_WAIT_TIMEOUT_SECONDS",
    DEFAULT_WAIT_TIMEOUT_SECONDS
  );
  const pollIntervalSeconds = positiveIntegerFromEnv(
    "DATABASE_WAIT_INTERVAL_SECONDS",
    DEFAULT_POLL_INTERVAL_SECONDS
  );
  const connectTimeoutSeconds = positiveIntegerFromEnv(
    "DATABASE_CONNECT_TIMEOUT_SECONDS",
    DEFAULT_CONNECT_TIMEOUT_SECONDS
  );
  const deadline = Date.now() + waitTimeoutSeconds * 1000;
  let attempt = 0;
  let lastError = "not attempted";

  console.log(
    `[dependency-wait] Waiting up to ${waitTimeoutSeconds}s for PostgreSQL at ${host}:${port}`
  );

  while (Date.now() < deadline) {
    attempt += 1;
    const remainingMilliseconds = Math.max(1, deadline - Date.now());

    try {
      await connectOnce(
        host,
        port,
        Math.min(connectTimeoutSeconds * 1000, remainingMilliseconds)
      );
      console.log(
        `[dependency-wait] PostgreSQL is reachable at ${host}:${port} after ${attempt} attempt(s)`
      );
      return;
    } catch (error) {
      lastError = error instanceof Error ? error.message : String(error);
      if (attempt === 1 || attempt % 5 === 0) {
        console.log(
          `[dependency-wait] PostgreSQL is not ready (attempt ${attempt}): ${lastError}`
        );
      }
    }

    const sleepMilliseconds = Math.min(
      pollIntervalSeconds * 1000,
      Math.max(0, deadline - Date.now())
    );
    if (sleepMilliseconds > 0) {
      await sleep(sleepMilliseconds);
    }
  }

  throw new Error(
    `PostgreSQL at ${host}:${port} was not reachable within ${waitTimeoutSeconds}s (last error: ${lastError})`
  );
}

main().catch((error) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`[dependency-wait] ${message}`);
  process.exitCode = 1;
});
