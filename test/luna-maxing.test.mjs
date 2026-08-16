import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { analyzeCatalog } from "../.codex-plugin/plugins/luna-maxing/skills/luna-maxing/scripts/capability-probe.mjs";
import {
  PlanError,
  buildCodexArgs,
  buildWorkerPrompt,
  classifyWorkerResult,
  executePlan,
  validatePlan,
} from "../.codex-plugin/plugins/luna-maxing/skills/luna-maxing/scripts/run-luna-workers.mjs";

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

const lunaSkillRoot = path.resolve(
  ".codex-plugin",
  "plugins",
  "luna-maxing",
  "skills",
  "luna-maxing",
);

test("is Codex-only and uses visible tasks exclusively in the Codex app", async () => {
  const skill = await readFile(path.join(lunaSkillRoot, "SKILL.md"), "utf8");
  const routing = await readFile(path.join(lunaSkillRoot, "references", "codex-routing.md"), "utf8");

  assert.match(skill, /Codex app visible-task route — exclusive/);
  assert.match(skill, /This Skill is available only in Codex/);
  assert.match(skill, /Do not use subagents, child agents, background tasks, `codex exec`, CLI sessions/);
  assert.match(skill, /stop the Luna Maxing run and report the missing capability/);
  assert.match(skill, /do not fan out through any transport/);
  assert.match(routing, /create_thread/);
  assert.match(routing, /model: gpt-5\.6-luna/);
  assert.match(routing, /thinking: max/);
  assert.match(routing, /environment:\s*\n\s*type: local/);
  assert.match(skill, /Never create, request, or switch to a Git worktree/);
  assert.match(routing, /exact, pairwise non-overlapping file or directory ownership/);
  assert.match(routing, /wait_threads/);
  assert.match(routing, /read_thread/);
  assert.match(routing, /send_message_to_thread/);
  assert.match(skill, /research, inspect, test, write, or another authorized operation/);
  assert.match(skill, /same visible task/);
  assert.match(skill, /three Sol review rounds/);
  assert.match(routing, /On any non-Codex host, stop/);
  assert.match(skill, /Never provide a portable, simulated, or alternate-provider version/);
  assert.doesNotMatch(skill, /ChatGPT|native subagent route|Portable route/);
  assert.doesNotMatch(skill, /before using a background fallback/);
  assert.match(routing, /CLI `thread\.started` ID is not a visible app task/);
});

test("executes first and hides routine orchestration narration", async () => {
  const skill = await readFile(path.join(lunaSkillRoot, "SKILL.md"), "utf8");
  const agent = await readFile(path.join(lunaSkillRoot, "agents", "openai.yaml"), "utf8");

  assert.match(skill, /Begin the requested work immediately/);
  assert.match(skill, /Do not explain Luna Maxing/);
  assert.match(skill, /Do not narrate routing mechanics, worker creation, waiting, or review loops/);
  assert.match(skill, /Return the requested artifact, implementation, or decision/);
  assert.match(skill, /Do not include a routine account of the coordinator, worker packets, routing, review rounds/);
  assert.match(agent, /Execute first, verify the result/);
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

test("allows at most five concurrent Luna workers", () => {
  assert.equal(validatePlan(planInput({ concurrency: 5 })).concurrency, 5);
  assert.throws(() => validatePlan(planInput({ concurrency: 6 })), /integer from 1 to 5/);
});

test("concurrent writers require disjoint ownership and never rely on Git worktrees", () => {
  const first = {
    ...planInput().tasks[0],
    sandbox: "workspace-write",
    allowedPaths: ["src/features"],
  };
  const second = {
    ...first,
    id: "second_writer",
    allowedPaths: ["src/other"],
  };
  assert.equal(validatePlan(planInput({ concurrency: 2, tasks: [first, second] })).concurrency, 2);

  const overlapping = {
    ...second,
    allowedPaths: ["src/features/generated"],
  };
  assert.throws(
    () => validatePlan(planInput({ concurrency: 2, tasks: [first, overlapping] })),
    /Write ownership overlaps.*Run coupled tasks serially.*does not create Git worktrees/,
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
  assert.match(buildWorkerPrompt(task), /Do not create, add, move, remove, or use Git worktrees/);
  assert.match(buildWorkerPrompt(task), /Do not commit, push, open pull requests, or edit outside/);
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
