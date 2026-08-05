# Codex routing

Model catalogs and host schemas change. Probe the current environment instead of assuming these observations remain true.

## Route selection

1. Use native subagents only when the active spawn tool explicitly accepts `gpt-5.6-luna` and reasoning effort `max`.
2. If native routing cannot enforce both settings, run `scripts/capability-probe.mjs`.
3. If the Codex catalog exposes Luna and `max`, use `scripts/run-luna-workers.mjs` so every worker command contains explicit model and effort arguments.
4. Otherwise use portable work packets and disclose that Luna Max execution was unavailable. Never label an unverified worker “Luna Max.”

The capability probe invokes the local Codex CLI and may consult authenticated or refreshed model state. If the user prohibits external-service access, do not probe or launch CLI workers; use portable planning and disclose that routing was not tested.

The catalog probe can call a route `native-candidate`; this means only that the model catalog is compatible. The host's live spawn schema remains the authority.

## Observed state on 2026-08-05

- Codex CLI 0.145.0 exposed `gpt-5.6-sol` and `gpt-5.6-luna`.
- Luna advertised `low`, `medium`, `high`, `xhigh`, and `max` reasoning.
- Sol and Luna reported different multi-agent backend versions.
- The active native spawn schema exposed Sol and Terra, not Luna.
- An isolated `codex exec` session accepted Luna with `model_reasoning_effort="max"`.

These facts explain the supplied CLI fallback; they are not permanent product guarantees.

## Primary sources

- GPT-5.6 announcement and model roles: https://openai.com/index/gpt-5-6/
- Latest-model guidance: https://developers.openai.com/api/docs/guides/latest-model
- Codex subagents: https://learn.chatgpt.com/docs/agent-configuration/subagents
- Codex non-interactive mode: https://learn.chatgpt.com/docs/non-interactive-mode
- Sora overview: https://openai.com/sora/

Community reports can reveal implementation gaps, but do not treat them as product contracts. Examples include OpenAI Codex issues 35097, 34301, and 32587.
