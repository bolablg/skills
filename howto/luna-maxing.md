# How to use Luna Maxing

Luna Maxing turns one difficult task into a small set of independent work packets, assigns those packets to GPT-5.6 Luna at maximum reasoning, and has GPT-5.6 Sol verify and combine the results. It is most useful for deep research, competing technical investigations, audits, or a few clearly separated implementation areas.

It is not a reason to parallelize every task. Each worker starts with its own context, so two or three strong packets usually outperform a large swarm of overlapping ones. Luna Maxing may create up to five concurrent tasks when five genuinely independent work packets are justified.

## Start in your AI agent

Install the Skill, open the project you want to work on, and ask:

> Use Luna Maxing in strict-max mode. First show me the independent work packets and routing you can actually enforce. Then run them, verify the evidence, and give me one Sol-owned recommendation.

In the Codex app or ChatGPT, asking to use Luna Maxing creates separate user-visible tasks/threads exclusively. The Skill itself prohibits subagents, background tasks, `codex exec`, CLI sessions, and Git worktrees on those hosts; users do not need to repeat those exclusions. In Codex, each task requests Luna with `max` reasoning and explicitly uses the saved project's local environment. Concurrent tasks may research, test, or implement whatever Sol assigns, but concurrent writers must own non-overlapping paths. ChatGPT keeps visible tasks as the transport, but the report must disclose when exact model routing cannot be verified.

Each Luna Max task receives one concrete action and reports what it did. Sol actively waits for that handoff, inspects the real artifacts and evidence, and either accepts it or sends precise corrections back to the same task. The Luna task then adjusts its work and reports again. This review loop repeats for up to three rounds by default; unresolved work is reported as blocked.

Outside the Codex app and ChatGPT, native subagents are the default when Luna Max routing is enforceable. If it is not, the Skill can check for a local Codex CLI and launch isolated background sessions with explicit settings. These mechanisms are never used as an in-app fallback. If no exact route is available, the Skill uses portable mode rather than claiming Luna execution.

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

> Use Luna Maxing to implement this feature without Git worktrees. Have Sol split the work into independent packets with exact, non-overlapping file ownership, let Luna Max tasks edit their assigned paths concurrently, then have Sol inspect the combined diff and run integration tests.

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

Read-only packets are the default. For authorized concurrent write packets:

- set `sandbox` to `workspace-write`;
- list every permitted relative path in `allowedPaths`;
- give every writer exact, pairwise non-overlapping `allowedPaths`;
- never create or request a Git worktree;
- forbid commits, pushes, pull requests, and edits outside ownership while writers run concurrently;
- keep integration and whole-project testing with the coordinator.

The supplied runner rejects dangerous sandbox values and overlapping writer ownership. It never invokes Git worktree commands. These checks reduce risk; they do not detect every logical dependency, so Sol must serialize coupled work even when paths differ.

## Read the final report

A trustworthy result includes the route actually used, requested worker model and effort, worker receipts, convergent evidence, unresolved conflicts, validation, failures, and remaining uncertainty. “Luna Max” should never appear as an unverified label.

The explicit CLI arguments and artifact hashes prove what the workflow requested and preserve what it returned. They are not an independent audit of provider-side execution, so the report should phrase them as routing receipts rather than absolute guarantees.

If external-service access is forbidden, do not run the Codex capability probe or worker launcher. Ask the agent to prepare portable work packets only and state that exact routing was not tested.

## Troubleshooting

**The probe says `codex-exec`.** This is expected when Luna exists in the model catalog but the host cannot natively spawn it. The CLI runner is the verified fallback.

**No visible tasks appeared in the Codex app or ChatGPT.** The run must stop and report the missing task capability. Subagents and `codex exec` are forbidden substitutes on these hosts.

**The probe says `unavailable`.** Update or authenticate Codex, then probe again. Until Luna and max reasoning are exposed, use portable mode and disclose the limitation.

**A worker timed out or returned no structured result.** Keep the failure in the report. Narrow that packet or rerun it; do not let the coordinator invent the missing evidence.

**The task is costing too much.** Use `adaptive`, reduce the worker count, shorten packet context, and stop fan-out when new packets would repeat existing evidence.

**Several workers need the same file or generated output.** Give the coupled area to one worker or run those tasks serially. Do not weaken the ownership boundary.
