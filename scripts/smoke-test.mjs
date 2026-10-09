import { spawn } from "node:child_process";

const port = Number(process.env.SMOKE_PORT || 3210);
const baseUrl = process.env.SMOKE_BASE_URL || `http://127.0.0.1:${port}`;
const external = Boolean(process.env.SMOKE_BASE_URL);
let server;

async function waitForServer(url, timeoutMs = 30000) {
  const end = Date.now() + timeoutMs;
  let lastError;
  while (Date.now() < end) {
    try {
      const response = await fetch(url, { redirect: "manual" });
      if (response.status < 500) return response;
      lastError = new Error(`HTTP ${response.status}`);
    } catch (error) {
      lastError = error;
    }
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  throw new Error(`Server did not become ready: ${lastError?.message || "timeout"}`);
}

async function check(path, predicate, label) {
  const response = await fetch(new URL(path, baseUrl), { redirect: "manual" });
  const ok = predicate(response);
  console.log(`${ok ? "PASS" : "FAIL"} ${label}: HTTP ${response.status}`);
  if (!ok) throw new Error(`${label} failed with HTTP ${response.status}`);
  return response;
}

async function main() {
  if (!external) {
    server = spawn(process.execPath, ["node_modules/next/dist/bin/next", "start", "-p", String(port)], {
      stdio: "inherit",
      env: { ...process.env, PORT: String(port) }
    });
    server.on("exit", code => {
      if (code && code !== 0) console.error(`next start exited with code ${code}`);
    });
  }

  try {
    await waitForServer(baseUrl);
    await check("/", r => r.status === 200, "Landing page");
    await check("/create", r => r.status === 200, "Create page");
    await check("/editor", r => r.status === 200, "Editor page");
    await check("/login", r => r.status === 200, "Login page");
    await check("/dashboard", r => r.status === 200, "Dashboard route");
    await check("/api/projects", r => external ? [200, 401, 503].includes(r.status) : r.status === 503,
      "Projects API responds with a documented status");
    await check("/api/assets", r => external ? [200, 401, 503].includes(r.status) : r.status === 503,
      "Assets API responds with a documented status");
    console.log("Smoke tests passed.");
  } finally {
    if (server && server.exitCode === null) server.kill("SIGTERM");
  }
}

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
