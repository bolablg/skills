# Codex routing

Model catalogs and host schemas change. Probe the current environment instead of assuming these observations remain true.

## Route selection

Transport and model verification are separate decisions:

1. In Codex or ChatGPT, an explicit Luna Maxing invocation requests user-visible tasks/threads by default. Use the host's task-creation capability, not subagents.
2. Set each visible worker to `gpt-5.6-luna` with `max` reasoning when the task-creation schema supports those fields. Record its task/thread ID and host ID when available, then use the host's wait/read primitives.
3. If visible tasks are supported but exact model controls are not, keep the visible transport and label the routing unverified. Never call it verified Luna Max.
4. If visible creation is unavailable, disclose the degradation before using a background CLI session or subagent. Do not present a CLI `thread.started` ID as a visible app task.
5. Outside Codex or ChatGPT, prefer native subagents when the spawn schema explicitly accepts Luna and `max`.
6. When external native routing cannot enforce both settings, run `scripts/capability-probe.mjs`; if the Codex catalog exposes Luna and `max`, use `scripts/run-luna-workers.mjs` with explicit arguments.
7. Otherwise use portable work packets and disclose that Luna Max execution was unavailable.

In the Codex app, resolve the saved project with `list_projects`, create one worker per packet with `create_thread`, set `model: gpt-5.6-luna` and `thinking: max`, and follow the host's local/worktree rules. Track the returned `threadId` and `hostId`; use `wait_threads` for progress and `read_thread` only when additional detail is needed. The original Sol task remains the coordinator. Do not use `spawn_agent` for this visible-task route.

In ChatGPT, use the equivalent user-visible task/thread creation and waiting capabilities. If that surface does not expose model controls, report the tasks as visible portable workers rather than verified Luna Max workers.

The capability probe invokes the local Codex CLI and may consult authenticated or refreshed model state. If the user prohibits external-service access, do not probe or launch CLI workers; use portable planning and disclose that routing was not tested.

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
