---
name: luna-maxing
description: Codex-only orchestration for complex work using GPT-5.6 Sol as coordinator and bounded GPT-5.6 Luna workers at max reasoning. In the Codex app, use user-visible tasks exclusively and fail closed when visible task creation is unavailable; never substitute subagents, background sessions, Codex exec, or Git worktrees. In Codex CLI, use enforceable Luna Max routing with auditable receipts. Use only in Codex when the user asks for Luna Maxing, Sol/Luna orchestration, parallel deep reasoning, or several independent research or implementation tasks.
license: MIT
---

# Luna Maxing

Use Sol to frame, route, verify, and synthesize. Use each Luna worker for one bounded packet. Preserve routing receipts and never turn parallel opinions into fake certainty.

This Skill is available only in Codex. If another host loads it from source, stop and state that Luna Maxing requires Codex; do not emulate it with another model, agent framework, or provider.

If the user says “Sora as aggregator,” correct the term once: this workflow uses **GPT-5.6 Sol**; Sora is a video model. Continue without dwelling on the correction.

## Execute first

Begin the requested work immediately. Do not explain Luna Maxing, introduce Sol and Luna, restate this workflow, or present the packet plan before acting unless the user explicitly asks for that explanation or plan.

Keep progress updates brief and outcome-oriented: report what is being executed, a material finding, a needed decision, or a blocker. Do not narrate routing mechanics, worker creation, waiting, or review loops when they are operating normally. Ask a question only when missing information or authorization prevents safe progress.

Return the requested artifact, implementation, or decision—not a lesson about the Skill. Mention orchestration details only when the user asks, routing is unverified or degraded, a packet fails, or the detail materially changes confidence in the result.

## Run the workflow

1. Define the final decision, artifact, and acceptance criteria.
2. Decide whether fan-out is worthwhile. Keep trivial, tightly sequential, or already-clear work in the coordinator.
3. Read [references/orchestration-protocol.md](references/orchestration-protocol.md). Choose `strict-max` when Luna Max is explicit; otherwise choose `adaptive` and calibrate effort.
4. Create two or three independent work packets by default and up to five only when each adds distinct value. Read [references/task-decomposition.md](references/task-decomposition.md) when boundaries, dependencies, or write ownership are non-trivial.
5. Identify whether Codex is running in the app or CLI, then select and verify its permitted route using the rules below. Keep visible-task transport separate from model-routing verification.
6. Launch bounded workers. In the Codex app, a direct request to use Luna Maxing—including `$luna-maxing`—authorizes visible tasks in the saved project's local environment and no other worker transport. Give each Luna Max task one explicit execution action: research, inspect, test, write, or another authorized operation. Concurrent writers require exact, non-overlapping path ownership. Never let a worker coordinate the project or spawn more agents.
7. Require each worker to return a structured handoff with actions performed, artifacts changed, verification evidence, blockers, and remaining uncertainty. Actively wait for and read that handoff; do not assume an automatic callback.
8. Sol inspects the actual result and challenges incomplete, incorrect, weakly evidenced, or out-of-scope work. Send precise corrections to the same visible task, wait for its revised handoff, and repeat until accepted, blocked, or the bounded retry limit is reached. Read [references/verification-and-cost-controls.md](references/verification-and-cost-controls.md) for consequential or expensive work.
9. Resolve conflicts using evidence quality, not majority vote.
10. Synthesize one answer owned by the coordinator. Use [assets/aggregation-report-template.md](assets/aggregation-report-template.md) for a formal report.

## Select a routing path

Read [references/codex-routing.md](references/codex-routing.md) when exact model routing matters.

### Codex app visible-task route — exclusive

When explicitly invoked in the Codex app, create two or three separate user-visible tasks by default and up to five when the decomposition justifies them. Treat `$luna-maxing` as an explicit request for those tasks. Set every worker to `gpt-5.6-luna` and `max`, explicitly select the saved project's local environment, retain each returned task identifier, wait for their results, and synthesize in the original coordinator task.

Never create, request, or switch to a Git worktree. Visible tasks share the saved checkout and may research, test, write, or perform another authorized action when Sol gives each task a specific objective, acceptance criteria, and ownership boundary. Serialize tasks with overlapping ownership, shared generated outputs, or dependencies. Workers preserve pre-existing edits and do not commit, push, or open pull requests while running concurrently. The original Sol coordinator owns decomposition, inspection, correction, integration, repository-wide validation, acceptance, and publishing.

After a task reports completion, Sol must inspect the real output rather than accepting the summary. When adjustment is needed, use the host's follow-up mechanism to send exact findings and required corrections to the same task, then wait for and inspect its revised result. Do not create a replacement task merely to avoid the correction loop.

Do not use subagents, child agents, background tasks, `codex exec`, CLI sessions, or any other hidden worker transport in the Codex app. If visible task creation or required monitoring is unavailable, stop the Luna Maxing run and report the missing capability. Do not degrade silently or ask the user to provide these exclusions.

If the Skill activated automatically without a direct request to use Luna Maxing or create tasks, do not fan out through any transport. Continue in the coordinator or ask one concise question requesting authorization for visible tasks.

### Codex CLI route

Probe the installed Codex CLI:

```sh
node scripts/capability-probe.mjs --pretty --require-luna
```

Treat the probe as a local Codex CLI operation that may consult authenticated or refreshed model state. Do not run it when the user forbids external-service access; report that verified routing could not be checked.

Copy [assets/work-plan-template.json](assets/work-plan-template.json) outside the Skill folder, replace its sample packets, and inspect the exact commands first:

```sh
node scripts/run-luna-workers.mjs --plan /path/to/work-plan.json --dry-run --pretty
```

Then execute:

```sh
node scripts/run-luna-workers.mjs --plan /path/to/work-plan.json --pretty
```

The runner explicitly requests `gpt-5.6-luna`, sets each packet's reasoning effort, disables recursive agents, rejects dangerous sandbox modes, limits fan-out, writes structured results, hashes the result and event artifacts, and produces `run-report.json`. This route is for Codex CLI only. Never use it from the Codex app. It defaults receipts to a temporary directory; pass `--output-dir` when they should persist.

For a CLI write packet, require `workspace-write` and declare exact `allowedPaths`. Concurrent writers must use the same plan workspace with pairwise non-overlapping ownership. The runner never creates worktrees and rejects overlapping writer paths. Sol must serialize dependent work even when paths differ.

## Enforce these rules

- Use Luna Maxing only in Codex. Never provide a portable, simulated, or alternate-provider version on another host.
- Sol or the strongest available coordinator owns ambiguity, trade-offs, integration, and the final answer.
- In the Codex app, visible user-owned tasks are the only worker transport. Fail closed when they are unavailable; never use a background substitute.
- Do not claim Luna Max routing without explicit native settings or CLI receipts showing the requested settings.
- Do not call an internal subagent, child process, or CLI session a visible task/thread.
- Do not create, request, use, or switch Git worktrees. Explicitly select the saved project's local environment for Codex tasks.
- Do not start concurrent writers until Sol assigns exact, pairwise non-overlapping paths and records the current working-tree state.
- Do not let concurrent workers commit, push, open pull requests, modify shared generated files, or edit outside their ownership. Sol owns integration and publishing.
- Serialize overlapping, dependency-ordered, migration, lockfile, manifest, and shared-code changes unless one worker owns the entire coupled set.
- Do not allow recursive delegation by workers.
- Do not fan out merely to create activity; every packet must add distinct evidence or output.
- Do not accept a worker's confidence as verification.
- Do not accept a worker's first handoff by default; inspect its actual artifacts and evidence, then accept, correct, or block it explicitly.
- Keep corrections in the same visible task and cap the loop at three Sol review rounds unless the user requests otherwise.
- Do not hide failed packets, contradictions, or degraded routing.
- Do not exceed five concurrent visible tasks, subagents, or CLI workers. The supplied runner may process up to twelve total packets sequentially; prefer fewer.

## Deliver the result

Lead with the requested decision, artifact, or completed implementation. Include only evidence, validation, unresolved risks, and next actions that help the user evaluate or use the result.

Do not include a routine account of the coordinator, worker packets, routing, review rounds, or synthesis process. Report those mechanics only when the user asks for them or when routing is unverified or degraded, a packet fails or remains blocked, workers materially conflict, or orchestration limitations affect the conclusion.

Keep raw transcripts and command details in receipts unless the user asks for them.
