# How to use Luna Maxing

Luna Maxing turns one difficult task into a small set of independent work packets, assigns those packets to GPT-5.6 Luna at maximum reasoning, and has GPT-5.6 Sol verify and combine the results. It is most useful for deep research, competing technical investigations, audits, or a few clearly separated implementation areas.

It is not a reason to parallelize every task. Each worker starts with its own context, so two or three strong packets usually outperform a large swarm of overlapping ones. Luna Maxing may create up to five concurrent tasks when five genuinely independent work packets are justified.

## Start in your AI agent

Install the Skill, open the project you want to work on, and ask:

> Use Luna Maxing in strict-max mode. First show me the independent work packets and routing you can actually enforce. Then run them, verify the evidence, and give me one Sol-owned recommendation.

In Codex or ChatGPT, explicitly invoking Luna Maxing creates separate user-visible tasks/threads by default. In Codex, each task should request Luna with `max` reasoning when the task-creation capability supports it. ChatGPT keeps visible tasks as the transport, but the report must disclose when exact model routing cannot be verified.

Outside Codex or ChatGPT, native subagents are the default when Luna Max routing is enforceable. If it is not, the Skill can check for a local Codex CLI and launch isolated background sessions with explicit settings. A CLI session ID is not presented as a visible app task. If no exact route is available, the Skill uses portable mode rather than claiming Luna execution.

## Choose a mode

| Mode | Best for | Behavior |
| --- | --- | --- |
| `strict-max` | You explicitly want Luna Maxing or comparable deep work packets. | Every worker must request Luna with `max` reasoning. |
| `adaptive` | Mixed workloads where some packets are routine. | The coordinator can lower effort to control cost and latency; use `work-plan-adaptive-template.json`. |

## Good requests

Product research:

> Use Luna Maxing to investigate this payment product. Separate customer evidence, existing competitors, regulatory constraints, and technical feasibility. Use primary sources, resolve contradictions, and recommend whether we should test the idea.

Code investigation:

> Use Luna Maxing to diagnose this intermittent failure. Give separate read-only packets to reproduce the behavior, inspect the concurrency design, and evaluate the tests. Do not edit anything until Sol has reconciled the evidence.

Implementation:

> Use Luna Maxing to plan this feature, but only delegate work that has disjoint file ownership. Put concurrent writers in separate worktrees, validate each result, then have Sol integrate and test the whole change.

Decision challenge:

> Use Luna Maxing with competing hypotheses. Assign one packet to support each plausible explanation and one packet to look for disconfirming evidence. Sol should decide from evidence quality, not a vote.

## Preview local Codex routing

The agent normally handles this for you. To inspect it yourself from a repository checkout:

```sh
node skills/luna-maxing/scripts/capability-probe.mjs --pretty --require-luna
```

Make a working copy of `skills/luna-maxing/assets/work-plan-template.json`, replace its sample objectives, then preview the worker commands without launching them:

```sh
node skills/luna-maxing/scripts/run-luna-workers.mjs \
  --plan /absolute/path/to/work-plan.json \
  --dry-run \
  --pretty
```

Remove `--dry-run` to execute. Add `--output-dir /absolute/path/to/receipts` if you want to retain the structured results, event logs, and aggregate run report in a known location.

## Write work safely

Read-only packets are the default. For an authorized write packet:

- set `sandbox` to `workspace-write`;
- list every permitted relative path in `allowedPaths`;
- give simultaneous writers separate worktrees;
- keep integration and whole-project testing with the coordinator.

The supplied runner rejects dangerous sandbox values and simultaneous write workers that share a workspace. These checks reduce risk; they do not replace reviewing the work packet before execution.

## Read the final report

A trustworthy result includes the route actually used, requested worker model and effort, worker receipts, convergent evidence, unresolved conflicts, validation, failures, and remaining uncertainty. “Luna Max” should never appear as an unverified label.

The explicit CLI arguments and artifact hashes prove what the workflow requested and preserve what it returned. They are not an independent audit of provider-side execution, so the report should phrase them as routing receipts rather than absolute guarantees.

If external-service access is forbidden, do not run the Codex capability probe or worker launcher. Ask the agent to prepare portable work packets only and state that exact routing was not tested.

## Troubleshooting

**The probe says `codex-exec`.** This is expected when Luna exists in the model catalog but the host cannot natively spawn it. The CLI runner is the verified fallback.

**No visible tasks appeared in Codex or ChatGPT.** The workflow used the wrong transport or visible creation was unavailable. Check the routing receipt: subagents and `codex exec` sessions are background workers and must not be described as visible tasks.

**The probe says `unavailable`.** Update or authenticate Codex, then probe again. Until Luna and max reasoning are exposed, use portable mode and disclose the limitation.

**A worker timed out or returned no structured result.** Keep the failure in the report. Narrow that packet or rerun it; do not let the coordinator invent the missing evidence.

**The task is costing too much.** Use `adaptive`, reduce the worker count, shorten packet context, and stop fan-out when new packets would repeat existing evidence.

**Several workers need to edit the same files.** Run them sequentially or redesign ownership. Do not bypass the shared-workspace protection.
