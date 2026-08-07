# Codex routing

Model catalogs and host schemas change. Probe the current environment instead of assuming these observations remain true.

## Route selection

Transport and model verification are separate decisions:

1. In the Codex app or ChatGPT, an explicit Luna Maxing invocation requests user-visible tasks/threads exclusively. Use the host's task-creation capability, not subagents.
2. Set each visible worker to `gpt-5.6-luna` with `max` reasoning when the task-creation schema supports those fields. Record its task/thread ID and host ID when available, then use the host's wait/read primitives.
3. If visible tasks are supported but exact model controls are not, keep the visible transport and label the routing unverified. Never call it verified Luna Max.
4. In the Codex app or ChatGPT, if visible creation or monitoring is unavailable, stop and report the missing capability. Never use a subagent, background task, CLI session, or `codex exec` fallback there. A CLI `thread.started` ID is not a visible app task and cannot satisfy this route.
5. Outside the Codex app and ChatGPT, prefer native subagents when the spawn schema explicitly accepts Luna and `max`.
6. When external native routing cannot enforce both settings, run `scripts/capability-probe.mjs`; if the Codex catalog exposes Luna and `max`, use `scripts/run-luna-workers.mjs` with explicit arguments.
7. Otherwise use portable work packets and disclose that Luna Max execution was unavailable.

In the Codex app, resolve the saved project with `list_projects`, then create one worker per packet with `create_thread`. Set `model: gpt-5.6-luna`, `thinking: max`, and the target environment explicitly to local:

```yaml
target:
  type: project
  projectId: <selected-project-id>
  environment:
    type: local
```

Never omit the environment for a Git project: Codex may otherwise default a new task to an isolated worktree. Do not choose `environment.type: worktree`, pass a worktree starting state, run `git worktree`, or ask a worker to do so.

A direct request such as “use Luna Maxing” or `$luna-maxing` is the Skill-level authorization for these visible tasks. The user does not need to list prohibited fallback mechanisms. If activation was automatic rather than directly requested, do not create visible or hidden workers; continue in the coordinator or ask for visible-task authorization.

Local visible tasks share the saved checkout. Sol gives every task one explicit action, acceptance criteria, and ownership boundary; the action may be research, inspection, testing, writing, or another authorized operation. Before launching writers, Sol records the current status and gives each task exact, pairwise non-overlapping file or directory ownership. Each prompt forbids edits outside that ownership and forbids commits, pushes, pull requests, worktree operations, and destructive Git actions while tasks run concurrently. Workers preserve pre-existing changes, report every action and changed path, provide verification evidence, and stop if an unowned change is required. Run overlapping or dependent work serially.

Track each returned `threadId` and `hostId`. Use `wait_threads` to monitor completion and `read_thread` to inspect the structured handoff. Sol then inspects the actual artifacts, diff, tests, or research evidence. If the result is incomplete or incorrect, call `send_message_to_thread` with exact findings and required adjustments, then wait for and read the same task again. Repeat for at most three Sol review rounds unless the user requests another limit. Accept or block each packet explicitly; never create a fresh task simply to bypass corrections. The original Sol task remains the coordinator and owns inspection, correction, integration, repository-wide verification, acceptance, and publishing. Do not use `spawn_agent` for this visible-task route.

In ChatGPT, use the equivalent user-visible task/thread creation and waiting capabilities. Select the existing project/local environment when the surface exposes that choice and never request a worktree. Apply the same exact-ownership rule to concurrent writers. If that surface does not expose model controls, report the tasks as visible portable workers rather than verified Luna Max workers.

The capability probe is for hosts outside the Codex app and ChatGPT. It invokes the local Codex CLI and may consult authenticated or refreshed model state. Never use it as an in-app fallback. If the user prohibits external-service access, do not probe or launch CLI workers; use portable planning and disclose that routing was not tested.

The catalog probe can call a route `native-candidate`; this means only that the model catalog is compatible. The host's live spawn schema remains the authority.

## Observed state on 2026-08-05

- Codex CLI 0.145.0 exposed `gpt-5.6-sol` and `gpt-5.6-luna`.
- Luna advertised `low`, `medium`, `high`, `xhigh`, and `max` reasoning.
- Sol and Luna reported different multi-agent backend versions.
- The active native spawn schema exposed Sol and Terra, not Luna.
- The Codex app's user-visible task-creation schema exposed Luna with `max`, so visible tasks were the correct Codex-native route.
- An isolated `codex exec` session accepted Luna with `model_reasoning_effort="max"`.

These facts explain the supplied CLI fallback; they are not permanent product guarantees.

## Primary sources

- GPT-5.6 announcement and model roles: https://openai.com/index/gpt-5-6/
- Latest-model guidance: https://developers.openai.com/api/docs/guides/latest-model
- Codex subagents: https://learn.chatgpt.com/docs/agent-configuration/subagents
- Codex non-interactive mode: https://learn.chatgpt.com/docs/non-interactive-mode
- Sora overview: https://openai.com/sora/

Community reports can reveal implementation gaps, but do not treat them as product contracts. Examples include OpenAI Codex issues 35097, 34301, and 32587.

Community origin and comparison:

- Luna Maxing discussion: https://x.com/daniel_mac8/status/2083218469680549930
- Sol Advisor orchestration discussion: https://x.com/daniel_mac8/status/2083607027813662810
- Sol Advisor reference implementation: https://github.com/DannyMac180/sol-advisor

The reference implementation intentionally defaults Git-project app tasks to isolated worktrees. This Skill intentionally does not: it uses the saved local checkout and permits Sol-directed concurrent writers only with disjoint ownership.
