import assert from "node:assert/strict";
import path from "node:path";
import test from "node:test";
import { analyzeCatalog } from "../skills/luna-maxing/scripts/capability-probe.mjs";
import {
  PlanError,
  buildCodexArgs,
  buildWorkerPrompt,
  classifyWorkerResult,
  executePlan,
  validatePlan,
} from "../skills/luna-maxing/scripts/run-luna-workers.mjs";

const catalog = ({ sharedBackend = false, includeMax = true } = {}) => ({
  models: [
    {
      slug: "gpt-5.6-sol",
      multi_agent_version: "v2",
      supported_reasoning_levels: [{ effort: "high" }],
    },
    {
      slug: "gpt-5.6-luna",
      multi_agent_version: sharedBackend ? "v2" : "v1",
      supported_reasoning_levels: [
        { effort: "low" },
        ...(includeMax ? [{ effort: "max" }] : []),
      ],
    },
  ],
});

const planInput = (overrides = {}) => ({
  mode: "strict-max",
  concurrency: 2,
  workspace: ".",
  tasks: [
    {
      id: "inspect_metadata",
      objective: "Inspect the package metadata.",
      allowedPaths: ["package.json"],
      allowedHosts: [],
      doneWhen: ["Report the package name and version."],
      verification: ["Read package.json directly."],
      sandbox: "read-only",
      effort: "max",
    },
  ],
  ...overrides,
});

test("routes to Codex exec when Luna Max exists on a different backend", () => {
  const result = analyzeCatalog(catalog());
  assert.equal(result.recommendedRoute, "codex-exec");
  assert.equal(result.models.luna.available, true);
  assert.equal(result.models.luna.reasoningEfforts.includes("max"), true);
});

test("treats a shared backend as only a native candidate", () => {
  const result = analyzeCatalog(catalog({ sharedBackend: true }));
  assert.equal(result.recommendedRoute, "native-candidate");
  assert.match(result.note, /tool schema must still expose Luna and max/i);
});

test("reports Luna without max as unavailable", () => {
  assert.equal(analyzeCatalog(catalog({ includeMax: false })).recommendedRoute, "unavailable");
});

test("strict-max plans reject lower effort", () => {
  const input = planInput();
  input.tasks[0].effort = "high";
  assert.throws(() => validatePlan(input), PlanError);
});

test("plans reject dangerous sandboxes and duplicate task IDs", () => {
  const dangerous = planInput();
  dangerous.tasks[0].sandbox = "danger-full-access";
  assert.throws(() => validatePlan(dangerous), /read-only or workspace-write/);

  const duplicate = planInput({ tasks: [planInput().tasks[0], planInput().tasks[0]] });
  assert.throws(() => validatePlan(duplicate), /Duplicate task id/);
});

test("plans reject concurrent writers sharing a workspace", () => {
  const first = {
    ...planInput().tasks[0],
    sandbox: "workspace-write",
    allowedPaths: ["src/first.js"],
  };
  const second = {
    ...first,
    id: "second_writer",
    allowedPaths: ["src/second.js"],
  };
  assert.throws(
    () => validatePlan(planInput({ tasks: [first, second] })),
    /Use separate worktrees or run them sequentially/,
  );
});

test("worker command explicitly enforces Luna, effort, sandbox, and no recursion", () => {
  const plan = validatePlan(planInput(), { cwd: "/example/repository" });
  const task = plan.tasks[0];
  const args = buildCodexArgs(task, plan, {
    events: "/tmp/events.jsonl",
    final: "/tmp/result.json",
    stderr: "/tmp/stderr.log",
  });
  const joined = args.join(" ");

  assert.match(joined, /--model gpt-5\.6-luna/);
  assert.match(joined, /model_reasoning_effort="max"/);
  assert.match(joined, /agents\.enabled=false/);
  assert.match(joined, /--sandbox read-only/);
  assert.doesNotMatch(joined, /danger-full-access|dangerously-bypass/);
  assert.match(buildWorkerPrompt(task), /do not spawn other agents/i);
  assert.match(buildWorkerPrompt(task), /Inspect only these local paths.*package\.json/i);
  assert.match(buildWorkerPrompt(task), /Do not access network services/i);
});

test("blocked, malformed, and mismatched worker results never count as completed", () => {
  assert.equal(
    classifyWorkerResult({
      code: 0,
      result: { status: "blocked", task_id: "packet" },
      taskId: "packet",
      timedOut: false,
    }).status,
    "blocked",
  );
  assert.equal(
    classifyWorkerResult({ code: 0, result: null, taskId: "packet", timedOut: false }).status,
    "failed",
  );
  assert.equal(
    classifyWorkerResult({
      code: 0,
      result: { status: "completed", task_id: "wrong" },
      taskId: "packet",
      timedOut: false,
    }).status,
    "failed",
  );
  assert.equal(
    classifyWorkerResult({
      code: 0,
      result: { status: "completed", task_id: "packet" },
      taskId: "packet",
      timedOut: true,
    }).status,
    "timed-out",
  );
});

test("dry-run validates and returns receipts without launching Codex", async () => {
  const report = await executePlan(planInput(), {
    cwd: "/example/repository",
    codexBin: "codex-that-must-not-run",
    dryRun: true,
    outputDirectory: "/tmp/luna-maxing-test-output",
  });

  assert.equal(report.dryRun, true);
  assert.equal(report.route, "codex-exec");
  assert.equal(report.tasks.length, 1);
  assert.equal(report.tasks[0].command, "codex-that-must-not-run");
  const schemaIndex = report.tasks[0].args.indexOf("--output-schema");
  assert.equal(path.basename(report.tasks[0].args[schemaIndex + 1]), "worker-result-schema.json");
});
