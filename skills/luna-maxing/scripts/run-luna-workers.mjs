#!/usr/bin/env node

import { spawn } from "node:child_process";
import { createHash } from "node:crypto";
import { createWriteStream } from "node:fs";
import { access, mkdir, readFile, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import process from "node:process";
import { finished } from "node:stream/promises";
import { fileURLToPath, pathToFileURL } from "node:url";
import { probeCodex } from "./capability-probe.mjs";

const ALLOWED_EFFORTS = new Set(["low", "medium", "high", "xhigh", "max"]);
const ALLOWED_SANDBOXES = new Set(["read-only", "workspace-write"]);
const MAX_CONCURRENCY = 5;
const MAX_TASKS = 12;
const SCRIPT_DIRECTORY = path.dirname(fileURLToPath(import.meta.url));
const WORKER_SCHEMA = path.resolve(SCRIPT_DIRECTORY, "..", "assets", "worker-result-schema.json");

export class PlanError extends Error {
  constructor(message) {
    super(message);
    this.name = "PlanError";
  }
}

function stringArray(value, field, { required = false } = {}) {
  if (value === undefined && !required) {
    return [];
  }
  if (!Array.isArray(value) || (required && value.length === 0)) {
    throw new PlanError(`${field} must be ${required ? "a non-empty" : "an"} array of strings.`);
  }
  if (value.some((entry) => typeof entry !== "string" || !entry.trim())) {
    throw new PlanError(`${field} must contain only non-empty strings.`);
  }
  return value.map((entry) => entry.trim());
}

function normalizeAllowedPath(value, field) {
  if (typeof value !== "string" || !value.trim()) {
    throw new PlanError(`${field} must be a non-empty relative path.`);
  }

  const normalized = path.posix.normalize(value.trim().replaceAll("\\", "/"));
  if (
    normalized === "." ||
    normalized === ".." ||
    normalized.startsWith("../") ||
    path.posix.isAbsolute(normalized)
  ) {
    throw new PlanError(`${field} must stay inside its worker workspace.`);
  }
  return normalized;
}

function normalizeTask(task, index, root) {
  if (!task || typeof task !== "object" || Array.isArray(task)) {
    throw new PlanError(`tasks[${index}] must be an object.`);
  }
  if (typeof task.id !== "string" || !/^[a-z0-9][a-z0-9_-]{0,63}$/.test(task.id)) {
    throw new PlanError(`tasks[${index}].id must use lowercase letters, numbers, underscores, or hyphens.`);
  }
  if (typeof task.objective !== "string" || !task.objective.trim()) {
    throw new PlanError(`tasks[${index}].objective is required.`);
  }

  const sandbox = task.sandbox ?? "read-only";
  if (!ALLOWED_SANDBOXES.has(sandbox)) {
    throw new PlanError(`tasks[${index}].sandbox must be read-only or workspace-write.`);
  }

  const effort = task.effort ?? "max";
  if (!ALLOWED_EFFORTS.has(effort)) {
    throw new PlanError(`tasks[${index}].effort is not supported.`);
  }
  if (root.mode === "strict-max" && effort !== "max") {
    throw new PlanError(`tasks[${index}].effort must be max in strict-max mode.`);
  }

  const allowedPaths = stringArray(task.allowedPaths, `tasks[${index}].allowedPaths`, {
    required: sandbox === "workspace-write",
  }).map((entry, pathIndex) =>
    normalizeAllowedPath(entry, `tasks[${index}].allowedPaths[${pathIndex}]`),
  );

  const timeoutMinutes = task.timeoutMinutes ?? root.timeoutMinutes;
  if (!Number.isInteger(timeoutMinutes) || timeoutMinutes < 1 || timeoutMinutes > 60) {
    throw new PlanError(`tasks[${index}].timeoutMinutes must be an integer from 1 to 60.`);
  }

  return {
    allowedPaths,
    allowedHosts: stringArray(task.allowedHosts, `tasks[${index}].allowedHosts`),
    context: typeof task.context === "string" ? task.context.trim() : "",
    doneWhen: stringArray(task.doneWhen, `tasks[${index}].doneWhen`, { required: true }),
    effort,
    forbiddenActions: stringArray(task.forbiddenActions, `tasks[${index}].forbiddenActions`),
    id: task.id,
    objective: task.objective.trim(),
    sandbox,
    timeoutMinutes,
    verification: stringArray(task.verification, `tasks[${index}].verification`),
    workspace: path.resolve(root.workspace, task.workspace ?? "."),
  };
}

export function validatePlan(plan, { cwd = process.cwd() } = {}) {
  if (!plan || typeof plan !== "object" || Array.isArray(plan)) {
    throw new PlanError("The plan must be a JSON object.");
  }

  const mode = plan.mode ?? "adaptive";
  if (!new Set(["adaptive", "strict-max"]).has(mode)) {
    throw new PlanError("mode must be adaptive or strict-max.");
  }

  const concurrency = plan.concurrency ?? 3;
  if (!Number.isInteger(concurrency) || concurrency < 1 || concurrency > MAX_CONCURRENCY) {
    throw new PlanError(`concurrency must be an integer from 1 to ${MAX_CONCURRENCY}.`);
  }

  const timeoutMinutes = plan.timeoutMinutes ?? 20;
  if (!Number.isInteger(timeoutMinutes) || timeoutMinutes < 1 || timeoutMinutes > 60) {
    throw new PlanError("timeoutMinutes must be an integer from 1 to 60.");
  }

  if (!Array.isArray(plan.tasks) || plan.tasks.length === 0 || plan.tasks.length > MAX_TASKS) {
    throw new PlanError(`tasks must contain between 1 and ${MAX_TASKS} work packets.`);
  }

  const root = {
    concurrency,
    inheritUserConfig: plan.inheritUserConfig !== false,
    mode,
    persistSessions: plan.persistSessions !== false,
    timeoutMinutes,
    workspace: path.resolve(cwd, plan.workspace ?? "."),
  };
  const tasks = plan.tasks.map((task, index) => normalizeTask(task, index, root));

  const ids = new Set();
  for (const task of tasks) {
    if (ids.has(task.id)) {
      throw new PlanError(`Duplicate task id: ${task.id}`);
    }
    ids.add(task.id);
  }

  const writersByWorkspace = new Map();
  for (const task of tasks.filter((entry) => entry.sandbox === "workspace-write")) {
    const existing = writersByWorkspace.get(task.workspace);
    if (existing) {
      throw new PlanError(
        `Write tasks ${existing} and ${task.id} share a workspace. Use separate worktrees or run them sequentially.`,
      );
    }
    writersByWorkspace.set(task.workspace, task.id);
  }

  return { ...root, tasks };
}

function section(title, entries) {
  return entries.length ? `\n${title}:\n${entries.map((entry) => `- ${entry}`).join("\n")}` : "";
}

export function buildWorkerPrompt(task) {
  const editRule =
    task.sandbox === "workspace-write"
      ? `Edit only these paths: ${task.allowedPaths.join(", ")}.`
      : "Do not modify files or external state.";

  const pathRule = task.allowedPaths.length
    ? `Inspect only these local paths unless a required dependency is explicitly named: ${task.allowedPaths.join(", ")}.`
    : "No additional local inspection boundary was declared.";
  const hostRule = task.allowedHosts.length
    ? `Access only these network hosts: ${task.allowedHosts.join(", ")}.`
    : "Do not access network services.";

  return [
    "Act as one bounded execution worker. Do not coordinate the overall project and do not spawn other agents.",
    `Task ID: ${task.id}`,
    `Objective: ${task.objective}`,
    task.context ? `Context: ${task.context}` : "",
    editRule,
    pathRule,
    hostRule,
    section("Forbidden actions", task.forbiddenActions),
    section("Done when", task.doneWhen),
    section("Verification", task.verification),
    "Inspect the real artifacts, perform the requested verification, and distinguish evidence from inference.",
    "Return only the structured JSON requested by the output schema. Report blockers instead of expanding scope.",
  ]
    .filter(Boolean)
    .join("\n");
}

function sha256(text) {
  return text ? createHash("sha256").update(text).digest("hex") : null;
}

export function buildCodexArgs(task, plan, paths) {
  const args = [
    "exec",
    "--json",
    "--model",
    "gpt-5.6-luna",
    "--config",
    `model_reasoning_effort=${JSON.stringify(task.effort)}`,
    "--config",
    "agents.enabled=false",
    "--sandbox",
    task.sandbox,
    "--cd",
    task.workspace,
    "--output-schema",
    WORKER_SCHEMA,
    "--output-last-message",
    paths.final,
  ];

  if (!plan.inheritUserConfig) {
    args.push("--ignore-user-config");
  }
  if (!plan.persistSessions) {
    args.push("--ephemeral");
  }

  args.push(buildWorkerPrompt(task));
  return args;
}

function parseEvents(text) {
  let threadId = null;
  let usage = null;
  for (const line of text.split(/\r?\n/)) {
    if (!line.trim()) continue;
    try {
      const event = JSON.parse(line);
      if (event.type === "thread.started") threadId = event.thread_id ?? threadId;
      if (event.type === "turn.completed") usage = event.usage ?? usage;
    } catch {
      // The raw event file is retained for inspection if a client emits non-JSON diagnostics.
    }
  }
  return { threadId, usage };
}

export function classifyWorkerResult({ code, result, taskId, timedOut }) {
  if (timedOut) return { error: "Worker exceeded its timeout.", status: "timed-out" };
  if (code !== 0) return { error: `Codex exited with status ${code ?? "unknown"}.`, status: "failed" };
  if (!result) return { error: "Worker did not produce valid structured JSON.", status: "failed" };
  if (result.task_id !== taskId) {
    return {
      error: `Worker returned task_id ${JSON.stringify(result.task_id)} instead of ${JSON.stringify(taskId)}.`,
      status: "failed",
    };
  }
  return { error: null, status: result.status };
}

const activeChildren = new Set();

async function runWorker(task, plan, { codexBin, outputDirectory }) {
  const paths = {
    events: path.join(outputDirectory, `${task.id}.events.jsonl`),
    final: path.join(outputDirectory, `${task.id}.result.json`),
    stderr: path.join(outputDirectory, `${task.id}.stderr.log`),
  };
  const args = buildCodexArgs(task, plan, paths);
  const eventsStream = createWriteStream(paths.events, { encoding: "utf8" });
  const stderrStream = createWriteStream(paths.stderr, { encoding: "utf8" });

  const outcome = await new Promise((resolve) => {
    const child = spawn(codexBin, args, {
      cwd: task.workspace,
      env: process.env,
      shell: false,
      stdio: ["ignore", "pipe", "pipe"],
    });
    activeChildren.add(child);
    child.stdout.pipe(eventsStream);
    child.stderr.pipe(stderrStream);

    let timedOut = false;
    const timeout = setTimeout(() => {
      timedOut = true;
      child.kill("SIGTERM");
    }, task.timeoutMinutes * 60_000);

    let settled = false;
    const finish = (value) => {
      if (settled) return;
      settled = true;
      clearTimeout(timeout);
      activeChildren.delete(child);
      resolve(value);
    };
    child.on("error", (error) => finish({ code: null, error, timedOut }));
    child.on("close", (code) => finish({ code, error: null, timedOut }));
  });

  await Promise.allSettled([finished(eventsStream), finished(stderrStream)]);

  const events = await readFile(paths.events, "utf8").catch(() => "");
  const finalText = await readFile(paths.final, "utf8").catch(() => "");
  let result = null;
  try {
    result = finalText ? JSON.parse(finalText) : null;
  } catch {
    result = null;
  }
  const { threadId, usage } = parseEvents(events);
  const classification = classifyWorkerResult({
    code: outcome.code,
    result,
    taskId: task.id,
    timedOut: outcome.timedOut,
  });

  return {
    error: outcome.error?.message ?? classification.error,
    exitCode: outcome.code,
    id: task.id,
    paths,
    requestedRouting: {
      effort: task.effort,
      enforcement: "explicit-cli-arguments",
      model: "gpt-5.6-luna",
    },
    receipt: {
      eventsSha256: sha256(events),
      resultSha256: sha256(finalText),
    },
    result,
    status: classification.status,
    threadId,
    usage,
  };
}

async function mapConcurrent(items, limit, worker) {
  const results = new Array(items.length);
  let cursor = 0;

  async function consume() {
    while (cursor < items.length) {
      const index = cursor;
      cursor += 1;
      results[index] = await worker(items[index], index);
    }
  }

  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, consume));
  return results;
}

function defaultOutputDirectory() {
  const stamp = new Date().toISOString().replace(/[^0-9]/g, "");
  return path.join(os.tmpdir(), "luna-maxing", stamp);
}

export async function executePlan(planInput, options = {}) {
  const plan = validatePlan(planInput, { cwd: options.cwd });
  const codexBin = options.codexBin ?? "codex";
  const outputDirectory = path.resolve(options.outputDirectory ?? defaultOutputDirectory());

  if (options.dryRun) {
    return {
      dryRun: true,
      outputDirectory,
      route: "codex-exec",
      tasks: plan.tasks.map((task) => {
        const paths = {
          events: path.join(outputDirectory, `${task.id}.events.jsonl`),
          final: path.join(outputDirectory, `${task.id}.result.json`),
          stderr: path.join(outputDirectory, `${task.id}.stderr.log`),
        };
        return { args: buildCodexArgs(task, plan, paths), command: codexBin, id: task.id };
      }),
    };
  }

  await Promise.all([access(plan.workspace), access(WORKER_SCHEMA)]);
  await Promise.all(plan.tasks.map((task) => access(task.workspace)));
  const capability = await probeCodex({ codexBin, cwd: plan.workspace });
  if (!capability.codexAvailable || !capability.models?.luna?.reasoningEfforts?.includes("max")) {
    throw new PlanError(capability.error || "Codex does not expose GPT-5.6 Luna with max reasoning.");
  }

  await mkdir(outputDirectory, { recursive: true });
  const startedAt = new Date().toISOString();
  const tasks = await mapConcurrent(plan.tasks, plan.concurrency, (task) =>
    runWorker(task, plan, { codexBin, outputDirectory }),
  );
  const report = {
    capability,
    completed: tasks.every((task) => task.status === "completed"),
    finishedAt: new Date().toISOString(),
    mode: plan.mode,
    outputDirectory,
    route: "codex-exec",
    startedAt,
    tasks,
  };
  await writeFile(path.join(outputDirectory, "run-report.json"), `${JSON.stringify(report, null, 2)}\n`);
  return report;
}

function parseArgs(argv) {
  const options = { codexBin: "codex", dryRun: false, pretty: false };
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === "--plan") {
      options.planPath = argv[index + 1];
      index += 1;
    } else if (argument === "--output-dir") {
      options.outputDirectory = argv[index + 1];
      index += 1;
    } else if (argument === "--codex-bin") {
      options.codexBin = argv[index + 1];
      index += 1;
    } else if (argument === "--dry-run") {
      options.dryRun = true;
    } else if (argument === "--pretty") {
      options.pretty = true;
    } else if (argument === "--help" || argument === "-h") {
      options.help = true;
    } else {
      throw new PlanError(`Unknown argument: ${argument}`);
    }
  }
  return options;
}

function usage() {
  return [
    "Usage: node run-luna-workers.mjs --plan FILE [options]",
    "",
    "Options:",
    "  --output-dir PATH  Keep worker receipts in this directory",
    "  --codex-bin PATH   Codex executable to use (default: codex)",
    "  --dry-run          Validate and print commands without launching workers",
    "  --pretty           Pretty-print the JSON report",
  ].join("\n");
}

async function main() {
  try {
    const options = parseArgs(process.argv.slice(2));
    if (options.help) {
      process.stdout.write(`${usage()}\n`);
      return;
    }
    if (!options.planPath) {
      throw new PlanError("--plan is required.");
    }

    const planPath = path.resolve(options.planPath);
    const plan = JSON.parse(await readFile(planPath, "utf8"));
    const report = await executePlan(plan, {
      ...options,
      cwd: path.dirname(planPath),
    });
    process.stdout.write(`${JSON.stringify(report, null, options.pretty ? 2 : 0)}\n`);
    if (!options.dryRun && !report.completed) process.exitCode = 2;
  } catch (error) {
    process.stderr.write(`${error.message}\n`);
    process.exitCode = 1;
  }
}

process.on("SIGINT", () => {
  for (const child of activeChildren) child.kill("SIGTERM");
  process.exitCode = 130;
});

const invokedPath = process.argv[1] ? pathToFileURL(path.resolve(process.argv[1])).href : "";
if (invokedPath === import.meta.url) {
  await main();
}
