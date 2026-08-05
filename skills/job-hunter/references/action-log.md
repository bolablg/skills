# Root action log and duplicate prevention

`jobhunter-actions.csv` in the project root is the append-only journal for every meaningful Job Hunter action. The detailed ledgers remain useful views, but this root log is the first duplicate check across sessions and agents.

## What to record

Record an event when the agent:

- discovers, verifies, scores, skips, or prepares a job;
- requests or receives approval;
- starts, blocks, hands off, or confirms an account or application action;
- discovers, qualifies, drafts for, contacts, follows up with, closes, or suppresses a recruiter;
- changes a canonical target key or reconciles a duplicate;
- starts and completes a session-level migration or other material system action.

Do not log individual cursor movements, page rendering, passwords, tokens, recovery data, full sensitive answers, or unnecessary personal information.

## Canonical target keys

Use stable, privacy-minimized keys:

- job: `job:<employer-domain>:<ats-or-job-id>`, falling back to a normalized canonical posting URL hash;
- recruiter initial contact: `recruiter:<public-route-hash>:initial`;
- recruiter follow-up: `recruiter:<public-route-hash>:follow-up:<number>`;
- account creation: `account:<exact-domain>:<normalized-login-email-hash>`;
- research/preparation: reuse the applicable job or recruiter key.

Do not put a raw email address in `target_key`. Prefer a deterministic SHA-256 hash of the normalized public route where an opaque key is needed. Keep the visible destination only when useful and non-sensitive.

## Required preflight

Before account creation, application submission, recruiter contact, or recruiter follow-up:

1. Read the root action log and relevant detailed ledger.
2. Check the exact action and canonical target key with `scripts/action_log.py check`.
3. If a prior guarded attempt exists, stop. Compare its status and receipt with the current destination.
4. Retry only when the user explicitly approves that exact retry in the current task. Record it with `--approved-retry`, the new batch ID, and a short reason.
5. Append `started` immediately before the external attempt, then append the outcome as a separate meaningful event such as `application-confirmed`, `blocked`, or `manual-handoff`.

Example:

```sh
python3 scripts/action_log.py check /private/project/jobhunter-actions.csv \
  --action application-submit-attempt \
  --target-key job:example.com:REQ-123

python3 scripts/action_log.py record /private/project/jobhunter-actions.csv \
  --workflow apply \
  --action application-submit-attempt \
  --target-key job:example.com:REQ-123 \
  --status started \
  --batch-id BATCH-2026-08-05-A \
  --destination https://example.com/careers/REQ-123
```

The check command returns `CLEAR` with exit status 0 or `FOUND` with exit status 2. The record command refuses duplicate guarded attempts by default. The log is private and included in the project `.gitignore`.
