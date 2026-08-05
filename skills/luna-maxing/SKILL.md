---
name: luna-maxing
description: Coordinate a complex task with GPT-5.6 Sol as the aggregator and bounded GPT-5.6 Luna workers at max reasoning. In Codex or ChatGPT, create user-visible tasks/threads by default; on other hosts, use enforceable native subagents or isolated Codex CLI sessions with auditable requested settings. Use when the user asks for Luna Maxing, Sol/Luna orchestration, parallel deep reasoning, several independent research or implementation threads, or lower-cost high-volume delegation with a senior coordinator. Also use to create portable work packets when exact routing is unavailable.
license: MIT
---

# Luna Maxing

Use Sol to frame, route, verify, and synthesize. Use each Luna worker for one bounded packet. Preserve routing receipts and never turn parallel opinions into fake certainty.

If the user says “Sora as aggregator,” correct the term once: this workflow uses **GPT-5.6 Sol**; Sora is a video model. Continue without dwelling on the correction.

## Run the workflow

1. Define the final decision, artifact, and acceptance criteria.
2. Decide whether fan-out is worthwhile. Keep trivial, tightly sequential, or already-clear work in the coordinator.
3. Read [references/orchestration-protocol.md](references/orchestration-protocol.md). Choose `strict-max` when Luna Max is explicit; otherwise choose `adaptive` and calibrate effort.
4. Create two or three independent work packets by default and up to five only when each adds distinct value. Read [references/task-decomposition.md](references/task-decomposition.md) when boundaries, dependencies, or write ownership are non-trivial.
5. Select and verify a route using the routing rules below. Keep visible-thread transport separate from model-routing verification.
6. Launch bounded workers. In Codex or ChatGPT, the explicit `$luna-maxing` invocation requests visible tasks by default. Never let a worker coordinate the project or spawn more agents.
7. Wait for all useful packets using the host's thread-wait mechanism, then validate their claims and artifacts. Read [references/verification-and-cost-controls.md](references/verification-and-cost-controls.md) for consequential or expensive work.
8. Resolve conflicts using evidence quality, not majority vote.
9. Synthesize one answer owned by the coordinator. Use [assets/aggregation-report-template.md](assets/aggregation-report-template.md) for a formal report.

## Select a routing path

Read [references/codex-routing.md](references/codex-routing.md) when exact model routing matters.

### Codex or ChatGPT visible-thread route — default

When explicitly invoked in Codex or ChatGPT, create two or three separate user-visible tasks/threads by default and up to five when the decomposition justifies them. Treat `$luna-maxing` as an explicit request for those tasks. Set every worker to `gpt-5.6-luna` and `max` when the creation schema supports both, retain each returned task/thread identifier, wait for their results, and synthesize in the original coordinator task.

Do not substitute hidden subagents or CLI sessions merely because they are easier. If visible task creation is unavailable, disclose that before using a background fallback. A CLI event named `thread.started` is an execution-session receipt, not proof that a user-visible Codex or ChatGPT task was created.

If ChatGPT can create visible tasks but cannot expose or enforce the worker model and effort, keep visible tasks as the transport but label routing unverified. In `strict-max`, do not count those tasks as verified Luna Max execution.

### Outside Codex or ChatGPT — native subagent route

On other agent hosts, use native subagents when their current schema explicitly permits both `gpt-5.6-luna` and reasoning effort `max`. Set those values on every worker and capture returned identifiers and reported usage.

Catalog availability alone is insufficient. If the tool silently chooses workers or exposes only other models, use the CLI route or portable route.

### Codex CLI route

Probe the installed Codex CLI:

```sh
node scripts/capability-probe.mjs --pretty --require-luna
```

Treat the probe as a local CLI operation that may consult authenticated or refreshed model state. Do not run it when the user forbids external-service access; select portable mode instead.

Copy [assets/work-plan-template.json](assets/work-plan-template.json) outside the Skill folder, replace its sample packets, and inspect the exact commands first:

```sh
node scripts/run-luna-workers.mjs --plan /path/to/work-plan.json --dry-run --pretty
```

Then execute:

```sh
node scripts/run-luna-workers.mjs --plan /path/to/work-plan.json --pretty
```

The runner explicitly requests `gpt-5.6-luna`, sets each packet's reasoning effort, disables recursive agents, rejects dangerous sandbox modes, limits fan-out, writes structured results, hashes the result and event artifacts, and produces `run-report.json`. This is a background CLI route, not the Codex/ChatGPT visible-thread default. It defaults receipts to a temporary directory; pass `--output-dir` when they should persist.

For write packets, require `workspace-write`, declare `allowedPaths`, and give concurrent writers separate worktrees. The runner rejects concurrent writers sharing one workspace.

### Portable route

When exact Luna routing is unavailable, still prepare the same work packets and execute them with the host's available worker mechanism. State clearly that this is a **Luna-style portable decomposition**, not verified Luna Max execution. Preserve the coordinator/worker separation and verification protocol.

## Enforce these rules

- Sol or the strongest available coordinator owns ambiguity, trade-offs, integration, and the final answer.
- In Codex or ChatGPT, visible user-owned tasks are the default; use background workers only when visible creation is unavailable or the user explicitly requests background execution.
- Do not claim Luna Max routing without explicit native settings or CLI receipts showing the requested settings.
- Do not call an internal subagent, child process, or CLI session a visible task/thread.
- Do not run multiple write workers in the same checkout.
- Do not allow recursive delegation by workers.
- Do not fan out merely to create activity; every packet must add distinct evidence or output.
- Do not accept a worker's confidence as verification.
- Do not hide failed packets, contradictions, or degraded routing.
- Do not exceed five concurrent visible tasks, subagents, or CLI workers. The supplied runner may process up to twelve total packets sequentially; prefer fewer.

## Deliver the result

Lead with the final decision or artifact. Then report:

- the coordinator identity reported by the host, how it was established, and worker routing actually used;
- convergent findings and their evidence;
- conflicts and how they were resolved;
- failed or blocked packets;
- validation performed;
- remaining uncertainty and next actions.

Keep raw transcripts and command details in receipts unless the user asks for them.
